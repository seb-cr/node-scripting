# TypeScript package template

A template for TypeScript packages.

This repo has two branches:

- [`main`](https://github.com/seb-cr/ts-package-template): a minimal package

- [`cli`](https://github.com/seb-cr/ts-package-template/tree/cli): starting point for a command-line app using [`commander`](https://github.com/tj/commander.js)

## Usage

Click the **Use this template** button, or copy the contents of this repo into your project as the initial commit.

Then install dependencies and run the setup script to configure the template for your project:

```sh
npm i
./scripts/setup.ts
```

## Development notes

### Linting

Check for consistent code style by running `npm run lint`.

Linting is done by [ESLint](https://eslint.org) using [`@comicrelief/eslint-config`](https://github.com/comicrelief/eslint-config).

### Testing

Run all tests using `npm test`, or `npm run coverage` to see test coverage.

Individual test specs can also be run using the `mocha` script: `npm run mocha -- tests/example.spec.ts`.

Inside your tests, you can import `src` modules using the `@/src` path map, which saves having to write `../../../../src` in deep test directories.

Tests are run using [`ts-node`](https://typestrong.org/ts-node/docs/) and [`mocha`](https://mochajs.org), and coverage is provided by [`nyc`](https://istanbul.js.org).

### tsconfig.json

There are three `tsconfig`s:

- `tsconfig-base.json` contains our desired compiler options
- `tsconfig-build.json` is used to build the package
- `tsconfig.json` is used for development (this is what `ts-node` and VS Code look at)

We need separate configs for building and development. VS Code needs the `tests` directory to be listed in `include` in order to resolve path-mapped imports. However, we don't want the tests bundled with the compiled package. The build also shouldn't use type libraries for dev dependencies, such as `@types/mocha`.

### Publish using Semantic Release

This template repo is not set up to publish. Follow the steps below to automate releases with [Semantic Release](https://semantic-release.gitbook.io).

1. In the setup script, say yes to `Set up Semantic Release?`

2. Add your npm token to your repo.

   Go to **Settings** > **Secrets** > **Actions**. Create a new secret called `NPM_TOKEN`.

3. Configure your repo to use the Squash and Merge strategy.

   > The setup script will attempt to this for you if your Git client is configured to use an auth token over HTTPS.

   Go to **Settings** > **General** > **Pull Requests** and untick *Allow merge commits* and *Allow rebase merging*, so that only *Allow squash merging* is enabled. Also enable *Default to PR title for squash merge commits*.

If you haven't already done so, make sure you've also protected your main branch. Any commits pushed to this branch will now trigger a release.
