/**
 * Returns a greeting.
 *
 * @param name Optional name to greet.
 */
export function greet(name?: string): string {
  return `Hello ${name || 'world'}!`;
}
