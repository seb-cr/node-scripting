import { readFileSync, writeFileSync } from 'fs';

import { Octokit } from '@octokit/rest';

import {
  Answers,
  sh,
  step,
  warn,
} from './setup';

const SEMANTIC_RELEASE_CONFIG = (branch: string) => `# Semantic Release config
# See https://semantic-release.gitbook.io/semantic-release/usage/configuration

branches:
  - '+([0-9])?(.{+([0-9]),x}).x'
  - ${branch}
  - next
  - next-major
  - { name: 'beta', prerelease: true }
  - { name: 'alpha', prerelease: true }
`;

const GITHUB_ACTIONS_RELEASE_JOB = `
  release:
    name: Release
    needs:
      - test
      - lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Configure npm cache
        run: npm config set cache "$(pwd)/.npm-cache"

      - uses: actions/cache@v3
        with:
          path: .npm-cache
          key: npm-cache-\${{ hashFiles('package-lock.json') }}
          restore-keys: npm-cache-

      - name: Install dependencies
        run: npm ci

      - name: Release
        run: npx semantic-release
        env:
          NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

const GITHUB_ACTIONS_PR_CHECK = `name: PR checks

on: pull_request

jobs:
  # https://github.com/amannn/action-semantic-pull-request#example-config
  semantic-pr:
    name: Semantic pull request
    runs-on: ubuntu-latest
    steps:
      # Please look up the latest version from
      # https://github.com/amannn/action-semantic-pull-request/releases
      - uses: amannn/action-semantic-pull-request@v4
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

export async function setUpSemanticRelease(answers: Answers): Promise<string[]> {
  const gitRemote = answers.packageRepository;
  const isGitHubRepo = gitRemote.includes('github.com')
    && !gitRemote.includes('seb-cr/ts-package-template');

  const branch = answers.semanticReleaseBranch;

  await step('Installing Semantic Release', async () => {
    await sh('npm i -D semantic-release');
  });

  // `semantic-release` looks for the `master` branch by default
  // https://semantic-release.gitbook.io/semantic-release/usage/configuration#branches
  if (branch !== 'master') {
    await step(`Configuring releases on branch '${branch}'`, async () => {
      writeFileSync('.releaserc.yml', SEMANTIC_RELEASE_CONFIG(branch));
      await sh('git add .releaserc.yml');
    });
  }

  await step('Adding release job to .github/workflows/main.yml', () => {
    let content = readFileSync('.github/workflows/main.yml').toString();
    content += GITHUB_ACTIONS_RELEASE_JOB;
    writeFileSync('.github/workflows/main.yml', content);
  });

  await step('Adding PR check workflow to .github/workflows/pr.yml', async () => {
    writeFileSync('.github/workflows/pr.yml', GITHUB_ACTIONS_PR_CHECK);
    await sh('git add .github/workflows/pr.yml');
  });

  const nextSteps = [
    'Add your npm token to your repo secrets',
    `Protect your ${branch} branch`,
  ];

  /* istanbul ignore if */
  if (isGitHubRepo) {
    let success = false;

    await step('Configuring your pull request settings on GitHub', async () => {
      const [owner, repo] = gitRemote
        .replace(/^.*github.com\//, '')
        .replace(/.git$/, '')
        .split('/');

      const creds = await sh('echo "protocol=https\nhost=github.com" | git credential fill');
      const authToken = creds.split('\n')
        .find((it) => it.startsWith('password='))
        ?.split('=')[1];

      if (!authToken) {
        warn('No GitHub auth token found! Maybe you use SSH.');
        return;
      }

      const octokit = new Octokit({ auth: authToken });
      try {
        await octokit.repos.update({
          owner,
          repo,
          allow_squash_merge: true,
          use_squash_pr_title_as_default: true,
          allow_merge_commit: false,
          allow_rebase_merge: false,
        });
        success = true;
      } catch (error) {
        warn((error as Error).message);
      }
    });

    if (!success) {
      nextSteps.push('Configure pull request merge strategy');
    }
  }

  return nextSteps;
}
