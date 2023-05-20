# Scripting tools

Useful tools for automating stuff with Node, like making small changes to config files or updating a dependency.

## Installation

Install via npm:

```sh
npm i @sebalon/scripting
```

## Shell

Functions for running shell commands.

### `exec(command: string, options?: ExecOptions): PromiseWithChild<{ stdout: string; stderr: string; }>`

Promisified version of `child_process.exec`.

Executes `command` within a shell and return an object containing stdout and stderr, or throws an error if `command` completes with a non-zero exit code.

See the official Node documentation [here](https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback) for more details.

```ts
const output = await exec('echo hello');
// => { stdout: 'hello\n', stderr: '' }
```

### `sh(command: string, options?: ShOptions): Promise<string>`

Executes `command` within a shell and returns its output (stdout), or throws an error if `command` completes with a non-zero exit code.

By default, leading and trailing whitespace is trimmed from the output. You can disable this by passing `trim: false` in the options.

```ts
const output = await sh('echo hello');
// => 'hello'
const untrimmed = await sh('echo hello', { trim: false });
// => 'hello\n'
```

## File

Functions for manipulating files.

The main use-case for these is to make small modifications to files that already exist. Other file operations (delete, copy, rename) are already easy enough using Node's `fs/promises` API. Documentation for these can be found [here](https://nodejs.org/api/fs.html#promises-api).

### `exists(path: string): boolean`

Check whether the given file or directory exists.

```ts
if (await exists('somefile')) {
  // do something
}
```

### `withFile(path: string, callback: (f: Text) => void | Promise<void>): Promise<void>`

Work with a text file.

Opens the file, passes the content to `callback`, then saves it back if any changes were made.

Line endings in the content are normalised to `\n`, and returned to the OS-specific line ending on save (as defined by `os.EOL`).

```ts
await withFile('example.txt', (f) => {
  f.replaceAll('old', 'new');
  f.appendLine('footer');
  f.insertLine('fizz', { aboveEvery: 'buzz' });
  f.deleteLine('bye');
});
```

For all available methods see the [`Text`](src/text.ts) class.

### `withJsonFile<T = any>(path: string, callback: (f: T) => void | Promise<void>): Promise<void>`

Work with a JSON file.

Opens the file, parses its content and passes to `callback`, then reserialises back to the file.

An attempt will be made to preserve indentation, based on the first indented line found. This should be adequate for well-formatted documents.

```ts
await withJsonFile('example.json', (f) => {
  f.foo.bar.baz = 42;
});
```

### `withYamlFile(path: string, callback: (f: Document) => void | Promise<void>): Promise<void>`

Work with a YAML file.

Opens the file, parses its content and passes to `callback`, then reserialises back to the file.

The `callback` is passed a `Document` instance which allows precise editing of YAML content, including comments and spaces. See [the `yaml` package docs](https://eemeli.org/yaml/#documents) for documentation.

```ts
await withYamlFile('example.yaml', (f) => {
  f.setIn(['foo', 'bar', 'baz'], 42);
});
```

## Test helpers

### `sh.mock()`

`sh` has a mock mode that allows you to control its output, which can be useful when testing scripts. Activate it using `sh.mock()`. This returns an object with methods to control `sh` behaviour. You can provide sequential mock results to return, either as default (ignoring the command being run) or matching to a specific command.

When you're done, use `sh.restore()` to stop mocking.

```ts
// activate mock mode
const mock = sh.mock();

// add some default mocks (you can chain these methods)
mock
  .returns({ stdout: 'first call' })
  .returns({ stdout: 'second call' });

// add some command-specific mocks
mock
  .command('cat file.txt').returns({ stdout: 'file contents' })
  .command(/echo/).returns({ stdout: 'mock echo' });

await sh('some arbitrary command');
// => 'first call'

await sh('some arbitrary command');
// => 'second call'

await sh('echo "hi there"');
// => 'mock echo'

await sh('cat file.txt');
// => 'file contents'

// assert that all expected `sh` calls were made
mock.assertDone();
sh.restore();
```
