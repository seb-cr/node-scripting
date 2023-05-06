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
}
