import { readFile, unlink, writeFile } from 'fs/promises';

import { expect } from 'chai';

import { withFile } from '@/src';

const TEST_FILE = 'test.tmp';

describe('withFile', () => {
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
