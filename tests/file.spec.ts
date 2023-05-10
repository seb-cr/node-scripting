import { readFile, unlink, writeFile } from 'fs/promises';

import { expect } from 'chai';

import { exists, withFile, withYamlFile } from '@/src';

describe('exists', () => {
  it('should return true if the path is a file', async () => {
    expect(await exists('README.md')).to.be.true;
  });

  it('should return true if the path is a directory', async () => {
    expect(await exists('tests')).to.be.true;
  });

  it('should return false if the path does not exist', async () => {
    expect(await exists('nonexistent')).to.be.false;
  });
});

describe('withFile', () => {
  const TEST_FILE = 'test.tmp';

  before('create test file', async () => {
    await writeFile(TEST_FILE, 'hello world');
  });

  after('delete test file', async () => {
    await unlink(TEST_FILE);
  });

  it('should pass file content to callback', async () => {
    let wasCalled = false;

    await withFile(TEST_FILE, (f) => {
      expect(f.content).to.equal('hello world');
      wasCalled = true;
    });

    expect(wasCalled, 'callback was not called').to.be.true;
  });

  it('should write back any changes made', async () => {
    await withFile(TEST_FILE, (f) => {
      f.content = 'goodbye';
    });

    const newContent = (await readFile(TEST_FILE)).toString();
    expect(newContent).to.equal('goodbye');
  });
});

describe('withYamlFile', () => {
  const TEST_FILE = 'test.yaml';

  before('create test file', async () => {
    await writeFile(TEST_FILE, `# test file
foo:
  bar:
    baz: bing

list:
  - one
  - two
`);
  });

  after('delete test file', async () => {
    await unlink(TEST_FILE);
  });

  it('should pass YAML to callback', async () => {
    let wasCalled = false;

    await withYamlFile(TEST_FILE, (f) => {
      expect(f.getIn(['foo', 'bar', 'baz'])).to.equal('bing');
      wasCalled = true;
    });

    expect(wasCalled, 'callback was not called').to.be.true;
  });

  it('should write back any changes made', async () => {
    await withYamlFile(TEST_FILE, (f) => {
      // @ts-ignore
      f.contents.items[0].key.commentBefore = ' edited!';
      f.setIn(['foo', 'bar', 'baz'], 'wiggle');
      f.deleteIn(['list', 0]);
    });

    const newContent = (await readFile(TEST_FILE)).toString();
    expect(newContent).to.equal(`# edited!
foo:
  bar:
    baz: wiggle

list:
  - two
`);
  });
});
