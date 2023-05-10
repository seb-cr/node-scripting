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

Check whether a file exists using `exists`.

```ts
if (await exists('somefile')) {
  // do something
}
```

Most other file operations (delete, copy, rename) are already easy enough using Node's `fs/promises` API. Documentation for these can be found [here](https://nodejs.org/api/fs.html#promises-api).

```ts
import { rm, copyFile, rename } from 'fs/promises';
```

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

Work with JSON files using the `withJsonFile` function. Like `withText`, it passes the file's content to a callback for editing. In this case the text content is parsed as JSON, and the resulting plain object (or primitive, if that's what the JSON represents) is passed to the callback.

```ts
await withJsonFile('example.json', (f) => {
  f.foo.bar.baz = 42;
});
```

Work with YAML files using the `withYamlFile` function. The file is parsed into a YAML `Document` using the [`yaml`](https://www.npmjs.com/package/yaml) package.

```ts
await withYamlFile('example.yaml', (f) => {
  f.setIn(['foo', 'bar', 'baz'], 42);
});
```

See [the YAML package docs](https://eemeli.org/yaml/#documents) for documentation of `Document`.

Both `withJsonFile` and `withYamlFile` will make some effort to preserve the original indentation of the file (and comments in YAML).
