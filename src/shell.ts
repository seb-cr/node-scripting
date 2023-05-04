import { ExecOptions, exec as execWithCallback } from 'child_process';
import { promisify } from 'util';

/**
 * Promisified version of `child_process.exec`.
 *
 * Executes `command` within a shell and return an object containing stdout and
 * stderr, or throws an error if `command` completes with a non-zero exit code.
 *
 * See the official Node documentation here for more details:
 * https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback
 *
 * ```ts
 * import { exec } from '@sebalon/scripting';
 *
 * const output = await exec('echo hello');
 * // => { stdout: 'hello\n', stderr: '' }
 * ```
 */
export const exec = promisify(execWithCallback);

/**
 * Options for `sh`.
 */
export type ShOptions = ExecOptions & {
  /**
   * Trim leading and trailing whitespace from the output.
   *
   * Default: true
   */
  trim?: boolean;
};

/**
 * Executes `command` within a shell and returns its output (stdout), or throws
 * an error if `command` completes with a non-zero exit code.
 *
 * ```ts
 * import { sh } from '@sebalon/scripting';
 *
 * const output = await sh('echo hello');
 * // => 'hello'
 * ```
 *
 * @param command Command to run.
 * @param options Options to be passed to `exec`.
 */
export async function sh(command: string, options?: ShOptions): Promise<string> {
  const result = await exec(command, options);
  let output = result.stdout.toString();
  if (options?.trim ?? true) {
    output = output.trim();
  }
  return output;
}
