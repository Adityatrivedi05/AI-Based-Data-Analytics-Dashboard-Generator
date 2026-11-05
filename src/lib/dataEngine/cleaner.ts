import { DatasetRow } from './types';
import { cleanNumericValue } from './parser';

export interface CleaningActionReport {
  action: string;
  affectedRows: number;
  description: string;
}

/**
 * Drop duplicate rows
 */
export function dropDuplicateRows(rows: DatasetRow[], headers: string[]): { cleanedRows: DatasetRow[]; report: CleaningActionReport } {
  const seen = new Set<string>();
  const cleanedRows: DatasetRow[] = [];
  let duplicates = 0;

  for (const r of rows) {
    const key = headers.map((h) => String(r[h] ?? '')).join('||');
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
      cleanedRows.push(r);
    }
  }

  return {
    cleanedRows,
    report: {
      action: 'drop_duplicates',
      affectedRows: duplicates,
      description: `Removed ${duplicates} exact duplicate rows.`,
    },
  };
}

/**
 * Fill missing values for a given column with mean, median, mode, or custom value
 */
export function fillMissingValues(
  rows: DatasetRow[],
  column: string,
  strategy: 'mean' | 'median' | 'mode' | 'constant',
  constantValue?: any
): { cleanedRows: DatasetRow[]; report: CleaningActionReport } {
  let fillVal: any = constantValue ?? 'Unknown';
  const nonNullValues: any[] = [];
  const numbers: number[] = [];
  const counts = new Map<any, number>();

  for (const r of rows) {
    const v = r[column];
    if (v !== null && v !== undefined && v !== '' && String(v).toLowerCase() !== 'null') {
      nonNullValues.push(v);
      counts.set(v, (counts.get(v) || 0) + 1);
      const num = cleanNumericValue(v);
      if (num !== null) numbers.push(num);
    }
  }

  if (strategy === 'mean' && numbers.length > 0) {
    const sum = numbers.reduce((a, b) => a + b, 0);
    fillVal = Math.round((sum / numbers.length) * 100) / 100;
  } else if (strategy === 'median' && numbers.length > 0) {
    numbers.sort((a, b) => a - b);
    const mid = Math.floor(numbers.length / 2);
    fillVal = numbers.length % 2 !== 0 ? numbers[mid] : (numbers[mid - 1] + numbers[mid]) / 2;
  } else if (strategy === 'mode' && counts.size > 0) {
    let bestCount = 0;
    for (const [v, c] of counts.entries()) {
      if (c > bestCount) {
        bestCount = c;
        fillVal = v;
      }
    }
  }

  let filledCount = 0;
  const cleanedRows = rows.map((r) => {
    const v = r[column];
    if (v === null || v === undefined || v === '' || String(v).toLowerCase() === 'null') {
      filledCount++;
      return { ...r, [column]: fillVal };
    }
    return r;
  });

  return {
    cleanedRows,
    report: {
      action: 'fill_missing',
      affectedRows: filledCount,
      description: `Filled ${filledCount} missing values in "${column}" with ${strategy} (${fillVal}).`,
    },
  };
}

/**
 * Trim whitespace on all string columns
 */
export function trimAllStrings(rows: DatasetRow[], headers: string[]): { cleanedRows: DatasetRow[]; report: CleaningActionReport } {
  let trimmedCount = 0;
  const cleanedRows = rows.map((r) => {
    const copy = { ...r };
    for (const h of headers) {
      if (typeof copy[h] === 'string') {
        const trimmed = copy[h].trim();
        if (trimmed !== copy[h]) {
          trimmedCount++;
          copy[h] = trimmed;
        }
      }
    }
    return copy;
  });

  return {
    cleanedRows,
    report: {
      action: 'trim_strings',
      affectedRows: trimmedCount,
      description: `Trimmed trailing whitespace across all columns (${trimmedCount} fields updated).`,
    },
  };
}
