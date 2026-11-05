import {
  ColumnProfile,
  ColumnType,
  DatasetProfile,
  DatasetRow,
  FormatType,
  SemanticRole,
} from './types';
import { cleanNumericValue, parseDateValue } from './parser';

/**
 * Heuristics to detect semantic role based on column name, data type, and stats
 */
function inferSemanticRole(
  name: string,
  type: ColumnType,
  uniqueCount: number,
  totalCount: number,
  sampleValues: (string | number | boolean)[]
): SemanticRole {
  const lower = name.toLowerCase();

  // 1. Time
  if (
    type === 'date' ||
    /(date|time|timestamp|year|quarter|month|week|day|created_at|updated_at|period)/i.test(lower)
  ) {
    return 'time';
  }

  // 2. Boolean flag
  if (
    type === 'boolean' ||
    (uniqueCount <= 2 &&
      sampleValues.every((v) => {
        const s = String(v).toLowerCase().trim();
        return ['true', 'false', '0', '1', 'yes', 'no', 'y', 'n'].includes(s);
      }))
  ) {
    return 'boolean';
  }

  // 3. Geo
  if (
    /(country|state|province|city|region|territory|postal|zip|zipcode|latitude|longitude|lat|lng|address|continent)/i.test(
      lower
    )
  ) {
    return 'geo';
  }

  // 4. Identifier (unique IDs, UUIDs, keys, codes)
  if (
    /(id|uuid|_key|code|sku|vin|ssn|identifier|ticket|ref|receipt)/i.test(lower) &&
    (uniqueCount === totalCount || uniqueCount > totalCount * 0.7)
  ) {
    return 'identifier';
  }

  // 5. Measure (Numeric continuous or accumulative values)
  if (type === 'number') {
    // If it looks like an ID (e.g. employee_id, year), don't aggregate as sum
    if (/(id|identifier|code|zip|phone|year)/i.test(lower) && uniqueCount > 10) {
      return 'identifier';
    }
    return 'measure';
  }

  // 6. Free text vs Dimension
  if (type === 'string') {
    const avgLength =
      sampleValues.reduce((sum: number, v) => sum + String(v).length, 0) / (sampleValues.length || 1);
    if (avgLength > 80 || (uniqueCount > 100 && uniqueCount > totalCount * 0.8)) {
      return 'text';
    }
    return 'dimension';
  }

  return 'dimension';
}

/**
 * Infer format type from name and sample values
 */
function inferFormatType(
  name: string,
  role: SemanticRole,
  type: ColumnType,
  sampleValues: any[]
): FormatType {
  const lower = name.toLowerCase();

  if (role === 'time' || type === 'date') return 'date';

  if (type === 'number') {
    if (
      /(price|cost|revenue|sales|profit|margin_amount|amount|spend|budget|fee|fare|salary|discount_amount|balance)/i.test(
        lower
      )
    ) {
      return 'currency';
    }
    if (/(rate|pct|percentage|ratio|margin|roi|ctr|cpa|cpc|discount_pct|churn)/i.test(lower)) {
      return 'percent';
    }
    if (/(duration|seconds|minutes|hours|time_spent|latency)/i.test(lower)) {
      return 'duration';
    }

    const hasDecimals = sampleValues.some(
      (v) => typeof v === 'number' && !Number.isInteger(v) && !isNaN(v)
    );
    return hasDecimals ? 'decimal' : 'integer';
  }

  return 'string';
}

/**
 * Compute detailed profile for a single column
 */
export function profileColumn(
  name: string,
  rawValues: any[],
  totalRows: number
): ColumnProfile {
  let missingCount = 0;
  const nonNullValues: any[] = [];
  let numberCount = 0;
  let dateCount = 0;
  let boolCount = 0;
  const parsedNumbers: number[] = [];
  const valueCounts = new Map<any, number>();

  for (let i = 0; i < rawValues.length; i++) {
    const val = rawValues[i];
    if (
      val === null ||
      val === undefined ||
      val === '' ||
      String(val).toLowerCase() === 'null' ||
      String(val).toLowerCase() === 'na' ||
      String(val).toLowerCase() === 'nan'
    ) {
      missingCount++;
      continue;
    }

    nonNullValues.push(val);
    const count = (valueCounts.get(val) || 0) + 1;
    valueCounts.set(val, count);

    // Test boolean
    if (
      typeof val === 'boolean' ||
      ['true', 'false', 'yes', 'no'].includes(String(val).toLowerCase().trim())
    ) {
      boolCount++;
    }

    // Test number
    const num = cleanNumericValue(val);
    if (num !== null) {
      numberCount++;
      parsedNumbers.push(num);
    }

    // Test date
    const d = parseDateValue(val);
    if (d !== null) {
      dateCount++;
    }
  }

  const validCount = nonNullValues.length;
  const uniqueCount = valueCounts.size;
  const cardinalityRatio = totalRows > 0 ? uniqueCount / totalRows : 0;
  const missingRate = totalRows > 0 ? missingCount / totalRows : 0;

  // Decide type
  let type: ColumnType = 'string';
  if (validCount > 0) {
    if (dateCount / validCount >= 0.75 && !/^\d+$/.test(String(nonNullValues[0]))) {
      type = 'date';
    } else if (numberCount / validCount >= 0.85) {
      type = 'number';
    } else if (boolCount / validCount >= 0.9) {
      type = 'boolean';
    }
  }

  // Sample values
  const sampleValues = nonNullValues.slice(0, 20);

  // Top values
  const topValues = Array.from(valueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([value, count]) => ({ value: String(value), count }));

  // Infer role & format
  const role = inferSemanticRole(name, type, uniqueCount, totalRows, sampleValues);
  const format = inferFormatType(name, role, type, sampleValues);

  // Measure statistics & outliers
  let min: number | string | undefined = undefined;
  let max: number | string | undefined = undefined;
  let mean: number | undefined = undefined;
  let median: number | undefined = undefined;
  let stdDev: number | undefined = undefined;
  let outliersCount = 0;

  if (type === 'number' && parsedNumbers.length > 0) {
    parsedNumbers.sort((a, b) => a - b);
    const n = parsedNumbers.length;
    min = parsedNumbers[0];
    max = parsedNumbers[n - 1];

    const sum = parsedNumbers.reduce((acc, v) => acc + v, 0);
    mean = sum / n;

    // Median
    const mid = Math.floor(n / 2);
    median = n % 2 !== 0 ? parsedNumbers[mid] : (parsedNumbers[mid - 1] + parsedNumbers[mid]) / 2;

    // Standard deviation
    const variance =
      parsedNumbers.reduce((acc, v) => acc + Math.pow(v - (mean as number), 2), 0) / n;
    stdDev = Math.sqrt(variance);

    // IQR Outliers
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = parsedNumbers[q1Index];
    const q3 = parsedNumbers[q3Index];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    for (const v of parsedNumbers) {
      if (v < lowerBound || v > upperBound) {
        outliersCount++;
      }
    }
  } else if (type === 'date') {
    const dates = nonNullValues
      .map((v) => parseDateValue(v))
      .filter((d): d is string => d !== null)
      .sort();
    if (dates.length > 0) {
      min = dates[0];
      max = dates[dates.length - 1];
    }
  }

  return {
    name,
    type,
    role,
    format,
    totalCount: totalRows,
    missingCount,
    missingRate,
    uniqueCount,
    cardinalityRatio,
    min,
    max,
    mean: mean !== undefined ? Number(mean.toFixed(2)) : undefined,
    median: median !== undefined ? Number(median.toFixed(2)) : undefined,
    stdDev: stdDev !== undefined ? Number(stdDev.toFixed(2)) : undefined,
    sampleValues,
    topValues,
    outliersCount,
  };
}

/**
 * Profile the complete dataset
 */
export function profileDataset(rows: DatasetRow[], headers: string[]): DatasetProfile {
  const rowCount = rows.length;
  const colCount = headers.length;

  if (rowCount === 0 || colCount === 0) {
    return {
      rowCount: 0,
      colCount: 0,
      qualityScore: 100,
      duplicateRowsCount: 0,
      columns: {},
      columnNames: headers,
      detectedMeasures: [],
      detectedDimensions: [],
      detectedTimeCols: [],
      detectedGeoCols: [],
    };
  }

  // Check duplicate rows using a sample or hash of first 5000 rows
  const seenRowSignatures = new Set<string>();
  let duplicateRowsCount = 0;
  const checkLimit = Math.min(rowCount, 5000);

  for (let i = 0; i < checkLimit; i++) {
    const row = rows[i];
    const sig = headers.map((h) => String(row[h])).join('|');
    if (seenRowSignatures.has(sig)) {
      duplicateRowsCount++;
    } else {
      seenRowSignatures.add(sig);
    }
  }
  // Extrapolate if rowCount > 5000
  if (rowCount > 5000) {
    duplicateRowsCount = Math.round((duplicateRowsCount / 5000) * rowCount);
  }

  const columns: Record<string, ColumnProfile> = {};
  const detectedMeasures: string[] = [];
  const detectedDimensions: string[] = [];
  const detectedTimeCols: string[] = [];
  const detectedGeoCols: string[] = [];

  let totalMissingRate = 0;
  let totalOutlierRate = 0;

  for (const h of headers) {
    const rawValues = rows.map((r) => r[h]);
    const profile = profileColumn(h, rawValues, rowCount);
    columns[h] = profile;

    totalMissingRate += profile.missingRate;
    if (profile.type === 'number') {
      totalOutlierRate += profile.outliersCount / rowCount;
    }

    if (profile.role === 'measure') detectedMeasures.push(h);
    else if (profile.role === 'dimension') detectedDimensions.push(h);
    else if (profile.role === 'time') detectedTimeCols.push(h);
    else if (profile.role === 'geo') detectedGeoCols.push(h);
  }

  // Data Quality Score (0 to 100)
  const avgMissingRate = colCount > 0 ? totalMissingRate / colCount : 0;
  const dupRate = rowCount > 0 ? duplicateRowsCount / rowCount : 0;
  const avgOutlierRate = detectedMeasures.length > 0 ? totalOutlierRate / detectedMeasures.length : 0;

  let qualityScore = 100;
  qualityScore -= avgMissingRate * 40; // up to -40 for missing values
  qualityScore -= dupRate * 30; // up to -30 for duplicate rows
  qualityScore -= Math.min(avgOutlierRate * 20, 15); // up to -15 for severe outliers

  // Round and clamp between 10 and 100
  qualityScore = Math.max(10, Math.min(100, Math.round(qualityScore)));

  return {
    rowCount,
    colCount,
    qualityScore,
    duplicateRowsCount,
    columns,
    columnNames: headers,
    detectedMeasures,
    detectedDimensions,
    detectedTimeCols,
    detectedGeoCols,
  };
}
