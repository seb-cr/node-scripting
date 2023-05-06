import { globalRegex } from './regex';

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
}
