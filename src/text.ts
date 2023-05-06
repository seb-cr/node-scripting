import { globalRegex, regex } from './regex';

/**
 * Options for specifying where to insert lines.
 */
export type InsertLineOptions = {
  /**
   * Insert at an exact position.
   *
   * 0 inserts as the first line. -1 inserts at the end, and other negative
   * values permit a position relative to the end.
   */
  at?: number;

  /**
   * Insert above the first line matching this string or regex.
   */
  above?: string | RegExp;

  /**
   * Insert above every line matching this string or regex.
   */
  aboveEvery?: string | RegExp;

  /**
   * Insert below the first line matching this string or regex.
   */
  below?: string | RegExp;

  /**
   * Insert below every line matching this string or regex.
   */
  belowEvery?: string | RegExp;
};

/**
 * Class for manipulating a block of text.
 */
export class Text {
  /**
   * The text content.
   */
  content: string;

  constructor(content: string) {
    this.content = content;
  }

  /**
   * Returns the text split into lines.
   */
  lines(): string[] {
    return this.content.split('\n');
  }

  /**
   * Replace every occurrance of `searchValue` with `replaceValue`.
   *
   * @param searchValue
   * @param replaceValue
   */
  replaceAll(searchValue: string | RegExp, replaceValue: string): void {
    const pattern = globalRegex(searchValue);
    this.content = this.content.replace(pattern, replaceValue);
  }

  /**
   * Inserts a line at the specified location.
   *
   * @param line The text to insert.
   * @param where Where to insert it.
   */
  insertLine(line: string, where: InsertLineOptions): void {
    const locatorKeys = [
      'at',
      'above',
      'aboveEvery',
      'below',
      'belowEvery',
    ];
    const usedKeys = Object.entries(where)
      .filter(([k, v]) => v && locatorKeys.includes(k))
      .map(([k]) => k);
    if (usedKeys.length > 1) {
      throw new Error(`Please specify only one of these keys: ${usedKeys.join(', ')}`);
    }

    const lines = this.lines();

    if (where.at !== undefined) {
      const pos = where.at >= 0
        ? where.at
        : where.at + lines.length + 1;
      lines.splice(pos, 0, line);
    } else if (where.above || where.below) {
      const offset = where.above ? 0 : 1;
      const pattern = regex(where.above || where.below!);
      const row = lines.findIndex((it) => it.match(pattern));
      if (row === -1) {
        throw new Error(`No line found matching ${pattern}`);
      }
      lines.splice(row + offset, 0, line);
    } else if (where.aboveEvery || where.belowEvery) {
      const offset = where.aboveEvery ? 0 : 1;
      const pattern = regex(where.aboveEvery || where.belowEvery!);
      const rows = (lines.map((it, index) => [it, index]) as [string, number][])
        .filter(([it]) => it.match(pattern))
        .map(([_, row]) => row);
      rows.forEach((row, index) => {
        lines.splice(row + offset + index, 0, line);
      });
    } else {
      throw new Error(`Please specify one of these keys: ${locatorKeys.join(', ')}`);
    }

    this.content = lines.join('\n');
  }

  /**
   * Inserts one or more lines at the specified location.
   *
   * @param lines Array of lines to insert.
   * @param where Where to insert them.
   */
  insertLines(lines: string[], where: InsertLineOptions) {
    if (lines.length > 0) {
      this.insertLine(lines.join('\n'), where);
    }
  }
}
