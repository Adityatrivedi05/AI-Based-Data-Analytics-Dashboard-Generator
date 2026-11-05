import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { DatasetRow } from './types';

/**
 * Clean a string value that might represent a number (e.g., "$1,234.50", "45.2%", "(120.00)")
 */
export function cleanNumericValue(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'boolean') return val ? 1 : 0;

  let str = String(val).trim();
  if (str === '' || str.toLowerCase() === 'na' || str.toLowerCase() === 'nan' || str.toLowerCase() === 'null') {
    return null;
  }

  // Handle accounting negatives: (123.45) -> -123.45
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.slice(1, -1).trim();
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.slice(1).trim();
  }

  // Check if percent
  const isPercent = str.endsWith('%');
  if (isPercent) {
    str = str.slice(0, -1).trim();
  }

  // Strip currency symbols and letters if mostly numbers
  str = str.replace(/[$€£¥₹]/g, '').trim();

  // Handle European number formats e.g. "1.234,56" or "890,20" vs "1,234.56"
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(str)) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+,\d{1,2}$/.test(str)) {
    // e.g. "890,20" -> "890.20"
    str = str.replace(',', '.');
  } else {
    str = str.replace(/,/g, '');
  }

  const num = parseFloat(str);
  if (isNaN(num)) return null;

  let res = isNegative ? -num : num;
  if (isPercent) {
    res = res / 100;
  }
  return res;
}

/**
 * Convert Excel serial date number to ISO date string (YYYY-MM-DD)
 */
export function excelSerialDateToISO(serial: number): string | null {
  if (serial <= 0 || serial > 100000) return null;
  // Excel epoch begins Dec 30 1899 due to 1900 leap year bug
  const excelEpoch = new Date(1899, 11, 30);
  const msPerDay = 86400000;
  const date = new Date(excelEpoch.getTime() + serial * msPerDay);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/**
 * Checks if a value looks like a date or date-time
 */
export function parseDateValue(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val.toISOString().slice(0, 10);
  }

  // Number that could be an Excel serial date (typically 25000 - 65000 for 1968 - 2077)
  if (typeof val === 'number') {
    if (val >= 25000 && val <= 65000) {
      return excelSerialDateToISO(val);
    }
    return null;
  }

  const str = String(val).trim();
  if (str.length < 4 || str.length > 35) return null;

  // Pure numbers are not dates
  if (/^-?\d+(\.\d+)?$/.test(str)) return null;

  // Common date formats check
  const timestamp = Date.parse(str);
  if (!isNaN(timestamp)) {
    const d = new Date(timestamp);
    const year = d.getFullYear();
    if (year >= 1970 && year <= 2100) {
      return d.toISOString().slice(0, 10);
    }
  }

  return null;
}

/**
 * Flatten nested objects into dot-notated keys: { user: { name: 'Alice' } } -> { 'user.name': 'Alice' }
 */
export function flattenObject(obj: Record<string, any>, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {};

  for (const key of Object.keys(obj)) {
    const val = obj[key];
    const prefixedKey = prefix ? `${prefix}.${key}` : key;

    if (val && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
      Object.assign(result, flattenObject(val, prefixedKey));
    } else {
      result[prefixedKey] = val;
    }
  }

  return result;
}

/**
 * Clean and deduplicate column headers
 */
export function normalizeHeaders(headers: string[]): string[] {
  const seen: Record<string, number> = {};
  return headers.map((h, i) => {
    let cleaned = (h || `Column_${i + 1}`).trim().replace(/[\r\n\t]/g, ' ');
    // Remove non-printable chars
    cleaned = cleaned.replace(/[^\x20-\x7E\p{L}\p{N}_ -]/gu, '');
    if (!cleaned) cleaned = `Column_${i + 1}`;

    if (seen[cleaned] !== undefined) {
      seen[cleaned] += 1;
      return `${cleaned}_${seen[cleaned]}`;
    } else {
      seen[cleaned] = 0;
      return cleaned;
    }
  });
}

/**
 * Parse CSV text into dataset rows
 */
export function parseCSV(csvText: string): Promise<{ rows: DatasetRow[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, any>>(csvText, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false, // We do our own robust semantic typing
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.errors && results.errors.length > 0 && results.data.length === 0) {
          reject(new Error(results.errors[0].message));
          return;
        }

        const rawHeaders = results.meta.fields || [];
        const headers = normalizeHeaders(rawHeaders);
        const headerMap = rawHeaders.reduce<Record<string, string>>((acc, orig, idx) => {
          acc[orig] = headers[idx];
          return acc;
        }, {});

        const rows: DatasetRow[] = results.data
          .filter((row) => row && Object.values(row).some((v) => v !== null && v !== ''))
          .map((row) => {
            const cleanRow: DatasetRow = {};
            for (const origKey of rawHeaders) {
              const cleanKey = headerMap[origKey];
              cleanRow[cleanKey] = row[origKey];
            }
            return cleanRow;
          });

        resolve({ rows, headers });
      },
      error: (err: any) => reject(err),
    });
  });
}

/**
 * Inspect an XLSX file and return sheet names
 */
export function getExcelSheets(arrayBuffer: ArrayBuffer): string[] {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  return workbook.SheetNames;
}

/**
 * Parse a specific sheet from XLSX
 */
export function parseExcelSheet(
  arrayBuffer: ArrayBuffer,
  sheetName?: string
): { rows: DatasetRow[]; headers: string[]; sheets: string[] } {
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const sheets = workbook.SheetNames;
  const targetSheetName = sheetName && sheets.includes(sheetName) ? sheetName : sheets[0];
  const worksheet = workbook.Sheets[targetSheetName];

  if (!worksheet) {
    throw new Error(`Sheet "${targetSheetName}" not found.`);
  }

  const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    header: 1,
    defval: null,
    blankrows: false,
  }) as any[][];

  if (!rawJson || rawJson.length === 0) {
    return { rows: [], headers: [], sheets };
  }

  // Find header row (first row with at least 1 non-empty cell)
  let headerIndex = 0;
  for (let i = 0; i < rawJson.length; i++) {
    if (rawJson[i] && rawJson[i].some((c) => c !== null && c !== '')) {
      headerIndex = i;
      break;
    }
  }

  const rawHeaders = rawJson[headerIndex].map((h, i) => (h ? String(h) : `Column_${i + 1}`));
  const headers = normalizeHeaders(rawHeaders);

  const rows: DatasetRow[] = [];
  for (let i = headerIndex + 1; i < rawJson.length; i++) {
    const rowData = rawJson[i];
    if (!rowData || !rowData.some((c) => c !== null && c !== '')) continue;

    const row: DatasetRow = {};
    headers.forEach((h, colIdx) => {
      let cell = rowData[colIdx];
      if (cell instanceof Date) {
        cell = cell.toISOString().slice(0, 10);
      }
      row[h] = cell !== undefined ? cell : null;
    });
    rows.push(row);
  }

  return { rows, headers, sheets };
}

/**
 * Parse JSON text (either an array of objects or an object containing a data array)
 */
export function parseJSON(jsonText: string): { rows: DatasetRow[]; headers: string[] } {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err: any) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }

  let arrayData: any[] = [];
  if (Array.isArray(parsed)) {
    arrayData = parsed;
  } else if (parsed && typeof parsed === 'object') {
    // Check if there is an array property (e.g. data, items, rows, results)
    const arrayKey = Object.keys(parsed).find((k) => Array.isArray(parsed[k]));
    if (arrayKey) {
      arrayData = parsed[arrayKey];
    } else {
      // Single object wrap
      arrayData = [parsed];
    }
  }

  if (arrayData.length === 0) {
    return { rows: [], headers: [] };
  }

  // Flatten every item
  const flattenedRows = arrayData.map((item) => (typeof item === 'object' && item ? flattenObject(item) : { value: item }));

  // Collect all unique keys
  const keySet = new Set<string>();
  flattenedRows.forEach((r) => {
    Object.keys(r).forEach((k) => keySet.add(k));
  });

  const headers = normalizeHeaders(Array.from(keySet));
  const rows: DatasetRow[] = flattenedRows.map((r) => {
    const row: DatasetRow = {};
    headers.forEach((h) => {
      row[h] = r[h] !== undefined ? r[h] : null;
    });
    return row;
  });

  return { rows, headers };
}
