import { DatasetRow } from './types';
import { cleanNumericValue } from './parser';

/**
 * Token types for safe formula parsing
 */
type TokenType = 'NUMBER' | 'IDENTIFIER' | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'COMMA';

interface Token {
  type: TokenType;
  value: string;
}

/**
 * Lexer for math expressions and column names
 */
export function tokenizeFormula(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = formula.length;

  while (i < n) {
    const ch = formula[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '+' || ch === '-' || ch === '*' || ch === '/' || ch === '^' || ch === '%') {
      tokens.push({ type: 'OPERATOR', value: ch });
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    // Number literal
    if (/\d/.test(ch) || (ch === '.' && i + 1 < n && /\d/.test(formula[i + 1]))) {
      let numStr = '';
      while (i < n && (/[\d.]/.test(formula[i]))) {
        numStr += formula[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: numStr });
      continue;
    }

    // Bracketed column name: [Column Name with spaces]
    if (ch === '[' || ch === '`') {
      const closing = ch === '[' ? ']' : '`';
      i++;
      let ident = '';
      while (i < n && formula[i] !== closing) {
        ident += formula[i];
        i++;
      }
      if (i < n && formula[i] === closing) i++;
      tokens.push({ type: 'IDENTIFIER', value: ident.trim() });
      continue;
    }

    // Identifier / Function name / Column name without spaces
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = '';
      while (i < n && /[a-zA-Z0-9_]/.test(formula[i])) {
        ident += formula[i];
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', value: ident });
      continue;
    }

    // Advance if unrecognized symbol to avoid infinite loop
    i++;
  }

  return tokens;
}

/**
 * Detect if formula is an aggregate-level expression (e.g. sum(X) / sum(Y))
 */
export function isAggregateFormula(formula: string): boolean {
  return /\b(sum|avg|count|countif|distinct|min|max)\s*\(/i.test(formula);
}

/**
 * Safe Recursive Descent Expression Evaluator (no eval, no Function)
 */
class SafeExpressionEvaluator {
  private tokens: Token[];
  private pos = 0;
  private row: DatasetRow;
  private groupRows?: DatasetRow[];

  constructor(tokens: Token[], row: DatasetRow, groupRows?: DatasetRow[]) {
    this.tokens = tokens;
    this.row = row;
    this.groupRows = groupRows;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(expectedType?: TokenType): Token {
    const token = this.tokens[this.pos++];
    if (expectedType && token?.type !== expectedType) {
      throw new Error(`Expected token ${expectedType} but got ${token?.type}`);
    }
    return token;
  }

  public parse(): number {
    const val = this.parseExpression();
    return isNaN(val) ? 0 : val;
  }

  // expr = term (( '+' | '-' ) term)*
  private parseExpression(): number {
    let left = this.parseTerm();

    while (this.peek()?.type === 'OPERATOR' && ['+', '-'].includes(this.peek()!.value)) {
      const op = this.consume().value;
      const right = this.parseTerm();
      if (op === '+') left += right;
      else left -= right;
    }

    return left;
  }

  // term = factor (( '*' | '/' | '%' ) factor)*
  private parseTerm(): number {
    let left = this.parseFactor();

    while (this.peek()?.type === 'OPERATOR' && ['*', '/', '%', '^'].includes(this.peek()!.value)) {
      const op = this.consume().value;
      const right = this.parseFactor();
      if (op === '*') left *= right;
      else if (op === '/') {
        left = right !== 0 ? left / right : 0;
      } else if (op === '%') {
        left = right !== 0 ? left % right : 0;
      } else if (op === '^') {
        left = Math.pow(left, right);
      }
    }

    return left;
  }

  // factor = unary | primary
  private parseFactor(): number {
    const token = this.peek();
    if (!token) return 0;

    // Unary plus/minus
    if (token.type === 'OPERATOR' && (token.value === '+' || token.value === '-')) {
      this.consume();
      const val = this.parseFactor();
      return token.value === '-' ? -val : val;
    }

    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const token = this.peek();
    if (!token) return 0;

    if (token.type === 'NUMBER') {
      this.consume();
      return parseFloat(token.value);
    }

    if (token.type === 'LPAREN') {
      this.consume('LPAREN');
      const val = this.parseExpression();
      if (this.peek()?.type === 'RPAREN') {
        this.consume('RPAREN');
      }
      return val;
    }

    if (token.type === 'IDENTIFIER') {
      const ident = this.consume('IDENTIFIER').value;

      // Check if function call e.g. sum(field)
      if (this.peek()?.type === 'LPAREN') {
        this.consume('LPAREN');
        const fnName = ident.toLowerCase();

        // Parse args inside paren
        const args: (string | number)[] = [];
        while (this.peek() && this.peek()?.type !== 'RPAREN') {
          if (this.peek()?.type === 'IDENTIFIER') {
            args.push(this.consume('IDENTIFIER').value);
          } else if (this.peek()?.type === 'NUMBER') {
            args.push(parseFloat(this.consume('NUMBER').value));
          } else if (this.peek()?.type === 'COMMA') {
            this.consume('COMMA');
          } else {
            this.consume();
          }
        }
        if (this.peek()?.type === 'RPAREN') {
          this.consume('RPAREN');
        }

        return this.evaluateFunction(fnName, args);
      }

      // Column identifier lookup
      const val = this.resolveColumnValue(ident, this.row);
      const num = cleanNumericValue(val);
      return num !== null ? num : 0;
    }

    this.consume();
    return 0;
  }

  private resolveColumnValue(colName: string, row: DatasetRow): any {
    if (row[colName] !== undefined) return row[colName];
    // Case-insensitive fallback
    const key = Object.keys(row).find((k) => k.toLowerCase() === colName.toLowerCase());
    return key ? row[key] : null;
  }

  private evaluateFunction(fn: string, args: (string | number)[]): number {
    const fieldName = String(args[0] || '');
    const rows = this.groupRows || [this.row];

    if (fn === 'sum') {
      let sum = 0;
      for (const r of rows) {
        const n = cleanNumericValue(this.resolveColumnValue(fieldName, r));
        if (n !== null) sum += n;
      }
      return sum;
    }

    if (fn === 'avg') {
      let sum = 0;
      let count = 0;
      for (const r of rows) {
        const n = cleanNumericValue(this.resolveColumnValue(fieldName, r));
        if (n !== null) {
          sum += n;
          count++;
        }
      }
      return count > 0 ? sum / count : 0;
    }

    if (fn === 'count') {
      if (!fieldName || fieldName === '*') return rows.length;
      return rows.filter((r) => {
        const v = this.resolveColumnValue(fieldName, r);
        return v !== null && v !== undefined && v !== '';
      }).length;
    }

    if (fn === 'distinct') {
      const set = new Set();
      for (const r of rows) {
        const v = this.resolveColumnValue(fieldName, r);
        if (v !== null && v !== undefined && v !== '') set.add(v);
      }
      return set.size;
    }

    if (fn === 'min') {
      let minVal: number | null = null;
      for (const r of rows) {
        const n = cleanNumericValue(this.resolveColumnValue(fieldName, r));
        if (n !== null) {
          if (minVal === null || n < minVal) minVal = n;
        }
      }
      return minVal !== null ? minVal : 0;
    }

    if (fn === 'max') {
      let maxVal: number | null = null;
      for (const r of rows) {
        const n = cleanNumericValue(this.resolveColumnValue(fieldName, r));
        if (n !== null) {
          if (maxVal === null || n > maxVal) maxVal = n;
        }
      }
      return maxVal !== null ? maxVal : 0;
    }

    if (fn === 'round') {
      const val = typeof args[0] === 'number' ? args[0] : 0;
      const decimals = typeof args[1] === 'number' ? args[1] : 0;
      const factor = Math.pow(10, decimals);
      return Math.round(val * factor) / factor;
    }

    return 0;
  }
}

/**
 * Evaluate a formula on a single row (for row-level calculated metrics)
 */
export function evaluateRowFormula(formula: string, row: DatasetRow): number {
  try {
    const tokens = tokenizeFormula(formula);
    const evaluator = new SafeExpressionEvaluator(tokens, row);
    return evaluator.parse();
  } catch {
    return 0;
  }
}

/**
 * Evaluate an aggregate formula (e.g. sum(Clicks) / sum(Impressions)) over a group of rows
 * Computes ratio of sums properly!
 */
export function evaluateAggregateFormula(formula: string, groupRows: DatasetRow[]): number {
  try {
    const tokens = tokenizeFormula(formula);
    const dummyRow = groupRows[0] || {};
    const evaluator = new SafeExpressionEvaluator(tokens, dummyRow, groupRows);
    return evaluator.parse();
  } catch {
    return 0;
  }
}
