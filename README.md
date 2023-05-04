# Scripting tools

Useful tools for automating stuff with Node.

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
