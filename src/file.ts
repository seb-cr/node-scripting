import {
  access,
  readFile,
  writeFile,
} from 'fs/promises';
import { EOL } from 'os';

import YAML from 'yaml';

import { Text } from './text';

/**
 * Check whether the given file or directory exists.
 *
 * ```ts
 * if (await exists('somefile')) {
 *   // do something
 * }
 * ```
 *
 * @param path File or directory path.
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

/**
 * Work with a text file.
 *
 * Opens the file, passes the content to `callback`, then saves it back if any
 * changes were made.
 *
 * Line endings in the content are normalised to `\n`, and returned to the
 * OS-specific line ending on save (as defined by `os.EOL`).
 *
 * ```ts
 * await withFile('example.txt', (f) => {
 *   f.replaceAll('old', 'new');
 *   f.appendLine('footer');
 *   f.insertLine('fizz', { aboveEvery: 'buzz' });
 *   f.deleteLine('bye');
 * });
 * ```
 *
 * For all available methods see the [`Text`](./text.ts) class.
 *
 * @param path The file path.
 * @param callback A function that does something with the file content.
 */
export async function withFile(
  path: string,
  callback: (f: Text) => void | Promise<void>,
): Promise<void> {
  const rawContent = (await readFile(path)).toString();
  const originalContent = rawContent
    .replace(/\r\n/g, '\r')
    .replace(/\r/g, '\n');

  const f = new Text(originalContent);
  await callback(f);

  if (f.content !== originalContent) {
    await writeFile(path, f.content.replace(/\n/g, EOL));
  }
}

/**
 * Work with a JSON file.
 *
 * Opens the file, parses its content and passes to `callback`, then
 * reserialises back to the file.
 *
 * An attempt will be made to preserve indentation, based on the first indented line
 * found. This should be adequate for well-formatted documents.
 *
 * ```ts
 * await withJsonFile('example.json', (f) => {
 *   f.foo.bar.baz = 42;
 * });
 * ```
 *
 * @param path The file path.
 * @param callback A function that does something with the JSON document.
 */
export async function withJsonFile<T = any>(
  path: string,
  callback: (f: T) => void | Promise<void>,
): Promise<void> {
  const rawContent = (await readFile(path)).toString();
  const doc = JSON.parse(rawContent);

  await callback(doc);

  // set indentation based on the first indented line
  const indent = /^(\s+)/m.exec(rawContent)?.[1] || 0;
  const newContent = JSON.stringify(doc, null, indent);
  if (newContent !== rawContent) {
    await writeFile(path, newContent);
  }
}

/**
 * Work with a YAML file.
 *
 * Opens the file, parses its content and passes to `callback`, then
 * reserialises back to the file.
 *
 * The `callback` is passed a `Document` instance which allows precise editing
 * of YAML content, including comments and spaces. See
 * [the `yaml` package docs](https://eemeli.org/yaml/#documents) for
 * documentation.
 *
 * ```ts
 * await withYamlFile('example.yaml', (f) => {
 *   f.setIn(['foo', 'bar', 'baz'], 42);
 * });
 * ```
 *
 * @param path The file path.
 * @param callback A function that does something with the YAML document.
 */
export async function withYamlFile(
  path: string,
  callback: (f: YAML.Document) => void | Promise<void>,
): Promise<void> {
  const rawContent = (await readFile(path)).toString();
  const doc = YAML.parseDocument(rawContent);

  await callback(doc);

  const newContent = doc.toString();
  if (newContent !== rawContent) {
    await writeFile(path, newContent);
  }
}
