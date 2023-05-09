import {
  access,
  readFile,
  writeFile,
} from 'fs/promises';
import { EOL } from 'os';

import { Text } from './text';

/**
 * Check whether the given file or directory exists.
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
 * @param path File path.
 * @param callback Function that does something with the file content.
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
