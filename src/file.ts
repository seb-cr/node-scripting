import {
  access,
  readFile,
  writeFile,
} from 'fs/promises';
import { EOL } from 'os';

import { Glob } from 'glob';
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

export type WithFilesOptions = {
  /**
   * One or more glob patterns of files to include.
   *
   * If omitted, all files in the current directory are included, unless
   * excluded by `exclude`.
   */
  include?: string | string[];

  /**
   * One or more glob patterns of files to exclude.
   *
   * Default: ['node_modules']
   */
  exclude?: string | string[];

  /**
   * Include only files that contain this.
   */
  containing?: string | RegExp;
};

/**
 * Work on text files that match the given search criteria.
 *
 * ```ts
 * // replace every occurrance of 'foo' with 'bar' in every JS file
 * withFiles({
 *   include: '**.js',
 *   containing: 'foo',
 * }, (f) => {
 *   f.replaceAll('foo', 'bar');
 * })
 * ```
 *
 * @param search Specifies which files to process.
 * @param callback A function that does something with each file's content.
 */
export async function withFiles(
  search: WithFilesOptions,
  callback: (f: Text) => void | Promise<void>,
): Promise<void> {
  const {
    include = '**',
    exclude,
    containing,
  } = search;

  for await (const path of new Glob(include, { ignore: exclude, nodir: true })) {
    const rawContent = (await readFile(path)).toString();
    const originalContent = rawContent
      .replace(/\r\n/g, '\r')
      .replace(/\r/g, '\n');

    const f = new Text(originalContent);
    if (containing && !f.contains(containing)) {
      continue;
    }

    await callback(f);

    if (f.content !== originalContent) {
      await writeFile(path, f.content.replace(/\n/g, EOL));
    }
  }
}
