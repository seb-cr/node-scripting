import { ExecOptions, exec as execWithCallback } from 'child_process';
import { promisify } from 'util';

import { anchoredRegex } from './regex';

/**
 * Promisified version of `child_process.exec`.
 *
 * Executes `command` within a shell and return an object containing stdout and
 * stderr, or throws an error if `command` completes with a non-zero exit code.
 *
 * See the official Node documentation
 * [here](https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback)
 * for more details.
 *
 * ```ts
 * const output = await exec('echo hello');
 * // => { stdout: 'hello\n', stderr: '' }
 * ```
 *
 * @param command The command to run.
 * @param [options]
 */
export const exec = promisify(execWithCallback);

/**
 * `exec` function used by `sh`. This is mutable to allow faking.
 */
let shExec: (command: string, options?: ExecOptions) => Promise<{ stdout: string; stderr: string; }> = exec;

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
 * By default, leading and trailing whitespace is trimmed from the output. You
 * can disable this by passing `trim: false` in the options.
 *
 * ```ts
 * const output = await sh('echo hello');
 * // => 'hello'
 * const untrimmed = await sh('echo hello', { trim: false });
 * // => 'hello\n'
 * ```
 *
 * `sh` has a mock mode that allows you to control its output, which can be
 * useful when testing scripts. Activate it using `sh.mock()`.
 *
 * @param command The command to run.
 * @param options Options to be passed to `exec`.
 */
export async function sh(command: string, options?: ShOptions): Promise<string> {
  const result = await shExec(command, options);
  let output = result.stdout.toString();
  if (options?.trim ?? true) {
    output = output.trim();
  }
  return output;
}

export interface MockShCommandController {
  /**
   * Adds a new command-specific mock result.
   *
   * @param [mock] The mock result.
   * @param [mock.exitCode] The mock process exit code. Default: 0
   * @param [mock.stdout] The mock stdout output. Default: none
   * @param [mock.stderr] The mock stderr output. Default: none
   */
  returns(mock?: { exitCode?: number, stdout?: string, stderr?: string }): MockShCommandController;

  /**
   * Ends this chain and starts a new command matcher.
   *
   * @param command The command to match.
   */
  command(command: string | RegExp): MockShCommandController;
}

export interface MockShController {
  /**
   * Adds a new default mock result.
   *
   * @param [mock] The mock result.
   * @param [mock.exitCode] The mock process exit code. Default: 0
   * @param [mock.stdout] The mock stdout output. Default: none
   * @param [mock.stderr] The mock stderr output. Default: none
   */
  returns(mock?: { exitCode?: number, stdout?: string, stderr?: string }): MockShController;

  /**
   * Adds a command matcher.
   *
   * @param command The command to match.
   */
  command(command: string | RegExp): MockShCommandController;

  /**
   * Asserts that a corresponding `sh` call was made for each mock.
   *
   * Throws if there are mocks that haven't been used.
   */
  assertDone(): void;

  /**
   * Removes all mocks.
   *
   * `sh` remains in mock mode. To restore it, use `sh.restore()`.
   */
  reset(): void;
}

/**
 * Start mocking `sh`.
 *
 * Returns an object with methods to control `sh` behaviour. You can provide
 * sequential mock results to return, either as default (ignoring the command
 * being run) or matching to a specific command.
 *
 * When you're done, use `sh.restore()` to stop mocking.
 *
 * ```ts
 * // activate mock mode
 * const mock = sh.mock();
 *
 * // add some default mocks
 * mock.returns({ stdout: 'first call' });
 * mock.returns({ stdout: 'second call' });
 *
 * // add some command-specific mocks
 * mock.command('cat file.txt').returns({ stdout: 'file contents' });
 * mock.command(/echo/).returns({ stdout: 'mock echo' });
 *
 * await sh('some arbitrary command');
 * // => 'first call'
 *
 * await sh('some arbitrary command');
 * // => 'second call'
 *
 * await sh('echo "hi there"');
 * // => 'mock echo'
 *
 * await sh('cat file.txt');
 * // => 'file contents'
 *
 * // assert that all expected `sh` calls were made
 * mock.assertDone();
 * sh.restore();
 * ```
 */
sh.mock = () => {
  if (shExec !== exec) {
    throw new Error('`sh` is already mocked');
  }

  type Mock = { exitCode: number, stdout: string, stderr: string };
  const matchers: [RegExp, Mock[]][] = [];
  const defaults: Mock[] = [];

  shExec = async (command) => {
    const match = matchers.find(([r, m]) => m.length > 0 && r.exec(command));
    const mock = match ? match[1].shift() : defaults.shift();
    if (!mock) {
      throw new Error(`No mock found for command: ${command}`);
    }
    if (mock.exitCode !== 0) {
      throw new Error(`Command failed: ${command}\n${mock.stderr}`);
    }
    return { stdout: mock.stdout, stderr: mock.stderr };
  };

  const mockController: MockShController = {
    returns(mock?: { exitCode?: number, stdout?: string, stderr?: string }) {
      const {
        exitCode = 0,
        stdout = '',
        stderr = '',
      } = mock ?? {};
      defaults.push({ exitCode, stdout, stderr });
      return mockController;
    },

    command(command: string | RegExp) {
      const mocks: Mock[] = [];
      matchers.push([anchoredRegex(command), mocks]);

      const cmdController: MockShCommandController = {
        returns(mock?: { exitCode?: number, stdout?: string, stderr?: string }) {
          const {
            exitCode = 0,
            stdout = '',
            stderr = '',
          } = mock ?? {};
          mocks.push({ exitCode, stdout, stderr });
          return cmdController;
        },

        command(newCommand: string | RegExp) {
          return mockController.command(newCommand);
        },
      };

      return cmdController;
    },

    assertDone() {
      if (
        defaults.length > 0
        || matchers.some(([, unconsumed]) => unconsumed.length > 0)
      ) {
        throw new Error('Some `sh` mocks were not used');
      }
    },

    reset() {
      matchers.splice(0, matchers.length);
      defaults.splice(0, defaults.length);
    },
  };

  return mockController;
};

/**
 * Stop mocking `sh`.
 */
sh.restore = () => {
  shExec = exec;
};
