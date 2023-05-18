/*
  Helpers for working with RegExp objects.
*/

/**
 * Escapes characters in `string` so that it can be used to build a RegExp.
 *
 * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
 *
 * @param string
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Turns a `string | RegExp` into a RegExp.
 *
 * If `value` is a string, the returned RegExp will match `value` anywhere in
 * the target string.
 *
 * @param value
 */
export function regex(value: string | RegExp): RegExp {
  return typeof value === 'string'
    ? new RegExp(escapeRegex(value))
    : value;
}

/**
 * Turns a `string | RegExp` into a RegExp.
 *
 * If `value` is a string, the returned RegExp is anchored so that it will only
 * match if the target string exactly equals `value`.
 *
 * @param value
 */
export function anchoredRegex(value: string | RegExp): RegExp {
  return typeof value === 'string'
    ? new RegExp(`^${escapeRegex(value)}$`)
    : value;
}

/**
 * Turns a search value (string or RegExp) into a global RegExp.
 *
 * @param input
 */
export function globalRegex(input: string | RegExp): RegExp {
  if (typeof input === 'string') {
    return new RegExp(escapeRegex(input), 'g');
  }
  if (input.global) {
    return input;
  }
  return new RegExp(input, `${input.flags}g`);
}
