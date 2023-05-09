# Scripting tools

Useful tools for automating stuff with Node, like making small changes to config files or updating a dependency.

## Usage

Install via npm:

```sh
npm i @sebalon/scripting
```

Then import the functions you need into your scripts.

```ts
import { /* ... */ } from '@sebalon/scripting';
```

### Shell

Run shell commands using `sh`. It returns a `Promise` for the command's output.

```ts
const output = await sh('echo hello');
// => 'hello'
```

By default, leading and trailing whitespace is trimmed from the output. You can disable this by passing `trim: false` in the options.

```ts
const output = await sh('echo hello', { trim: false });
// => 'hello\n'
```

If you also need to inspect `stderr`, use `exec` which is the promisified version of [Node's `child_process.exec`](https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback).

```ts
const output = await exec('echo hello');
// => { stdout: 'hello\n', stderr: '' }
```

### File manipulation

Work with text files using the `withFile` function. It opens the file, passes the content to a callback for editing, then saves it back if any changes were made.

```ts
await withFile('example.txt', (f) => {
  f.replaceAll('old', 'new');
  f.appendLine('footer');
  f.insertLine('fizz', { aboveEvery: 'buzz' });
  f.deleteLine('bye');
});
```

For all available methods see the [`Text`](src/text.ts) class.
