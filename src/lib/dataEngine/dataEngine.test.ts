import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanNumericValue, parseDateValue, excelSerialDateToISO, parseJSON } from './parser';
import { profileDataset } from './profiler';
import { evaluateRowFormula, evaluateAggregateFormula, tokenizeFormula } from './formulaParser';
import { applyFilters, computeAggregation, computeWidgetData, formatValue } from './aggregator';
import { dropDuplicateRows, fillMissingValues } from './cleaner';
import { SAMPLE_DATASETS } from './sampleDatasets';

test('cleanNumericValue handles currencies, percents, and negatives', () => {
  assert.equal(cleanNumericValue('$1,234.50'), 1234.5);
  assert.equal(cleanNumericValue('(500)'), -500);
  assert.equal(cleanNumericValue('15.5%'), 0.155);
  assert.equal(cleanNumericValue('€ 890,20'), 890.2);
  assert.equal(cleanNumericValue(null), null);
  assert.equal(cleanNumericValue('N/A'), null);
});

test('parseDateValue and excelSerialDateToISO work accurately', () => {
  assert.equal(parseDateValue('2024-03-15'), '2024-03-15');
  assert.equal(excelSerialDateToISO(45366), '2024-03-15');
  assert.equal(parseDateValue(45366), '2024-03-15');
});

test('parseJSON flattens nested structures', () => {
  const jsonStr = JSON.stringify([
    { id: 1, user: { name: 'Alice', age: 30 } },
    { id: 2, user: { name: 'Bob', age: 25 } }
  ]);
  const parsed = parseJSON(jsonStr);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0]['user.name'], 'Alice');
  assert.equal(parsed.rows[1]['user.age'], 25);
});

test('profileDataset assigns semantic roles and computes quality score', () => {
  const sample = SAMPLE_DATASETS[0];
  const profile = profileDataset(sample.rows, sample.headers);

  assert.equal(profile.rowCount, sample.rows.length);
  assert.equal(profile.columns['Revenue'].role, 'measure');
  assert.equal(profile.columns['Region'].role, 'geo');
  assert.equal(profile.columns['Date'].role, 'time');
  assert.ok(profile.qualityScore >= 80);
});

test('formulaParser computes row-level arithmetic safely', () => {
  const row = { Revenue: 1000, Cost: 600, Discount: 0.1 };
  const profit = evaluateRowFormula('Revenue - Cost', row);
  assert.equal(profit, 400);

  const net = evaluateRowFormula('Revenue * (1 - Discount)', row);
  assert.equal(net, 900);
});

test('formulaParser computes group ratio as ratio-of-sums (sum(Clicks) / sum(Impressions))', () => {
  const rows = [
    { Clicks: 10, Impressions: 100 },  // 10%
    { Clicks: 50, Impressions: 1000 }, // 5%
  ];
  // Average of ratios would be (0.10 + 0.05) / 2 = 0.075 (7.5%)
  // Ratio of sums: 60 / 1100 = 0.054545... (5.45%)
  const ctr = evaluateAggregateFormula('sum(Clicks) / sum(Impressions)', rows);
  const expectedRatio = 60 / 1100;
  assert.ok(Math.abs(ctr - expectedRatio) < 0.0001);
});

test('applyFilters filters rows correctly', () => {
  const rows = [
    { Region: 'North', Sales: 100 },
    { Region: 'South', Sales: 200 },
    { Region: 'North', Sales: 300 },
  ];
  const filtered = applyFilters(rows, [
    { field: 'Region', op: 'eq', value: 'North' },
    { field: 'Sales', op: 'gte', value: 200 },
  ]);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].Sales, 300);
});

test('computeAggregation supports sum, avg, distinct, and median', () => {
  const rows = [
    { Cat: 'A', Val: 10 },
    { Cat: 'B', Val: 20 },
    { Cat: 'A', Val: 30 },
  ];
  assert.equal(computeAggregation(rows, 'Val', 'sum'), 60);
  assert.equal(computeAggregation(rows, 'Val', 'avg'), 20);
  assert.equal(computeAggregation(rows, 'Cat', 'distinct'), 2);
  assert.equal(computeAggregation(rows, 'Val', 'median'), 20);
});

test('formatValue handles currency, percent, and compact representations', () => {
  assert.equal(formatValue(1500000, 'currency'), '$1.5M');
  assert.equal(formatValue(0.125, 'percent'), '12.5%');
  assert.equal(formatValue(1250, 'compact'), '1.3K');
});

test('cleaner drops duplicates and fills missing values', () => {
  const dirtyRows = [
    { id: 1, val: 'apple' },
    { id: 1, val: 'apple' },
    { id: 2, val: null },
  ];
  const { cleanedRows: deduped } = dropDuplicateRows(dirtyRows, ['id', 'val']);
  assert.equal(deduped.length, 2);

  const { cleanedRows: filled } = fillMissingValues(deduped, 'val', 'constant', 'banana');
  assert.equal(filled[1].val, 'banana');
});
