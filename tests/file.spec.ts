import { readFile, unlink, writeFile } from 'fs/promises';

import { expect } from 'chai';

import {
  exists,
  withFile,
  withFiles,
  withJsonFile,
  withYamlFile,
} from '@/src';

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

describe('withJsonFile', () => {
  const TEST_FILE = 'test.json';
  const TEST_DATA = { foo: { bar: { baz: 'bing' } } };
  const EXPECTED_DATA = { foo: { bar: { baz: 'wiggle' } } };

  before('create test file', async () => {
    await writeFile(TEST_FILE, JSON.stringify(TEST_DATA));
  });

  after('delete test file', async () => {
    await unlink(TEST_FILE);
  });

  it('should pass file content to callback', async () => {
    let wasCalled = false;

    await withJsonFile(TEST_FILE, (f) => {
      expect(f).to.deep.equal(TEST_DATA);
      wasCalled = true;
    });

    expect(wasCalled, 'callback was not called').to.be.true;
  });

  it('should write back any changes made', async () => {
    await withJsonFile(TEST_FILE, (f) => {
      f.foo.bar.baz = 'wiggle';
    });

    const newContent = (await readFile(TEST_FILE)).toString();
    const doc = JSON.parse(newContent);
    expect(doc).to.deep.equal(EXPECTED_DATA);
  });

  [0, 2, 4, '\t'].forEach((indentation) => {
    it(`should preserve indentation (${JSON.stringify(indentation)})`, async () => {
      await writeFile(TEST_FILE, JSON.stringify(TEST_DATA, null, indentation));

      await withJsonFile(TEST_FILE, (f) => {
        f.foo.bar.baz = 'wiggle';
      });

      const newContent = (await readFile(TEST_FILE)).toString();
      expect(newContent).to.equal(JSON.stringify(EXPECTED_DATA, null, indentation));
    });
  });

  it('should preserve final line ending', async () => {
    await writeFile(TEST_FILE, '{}\n');

    await withJsonFile(TEST_FILE, (f) => {
      f.key = 'value';
    });

    const newContent = (await readFile(TEST_FILE)).toString();
    expect(newContent).to.equal('{"key":"value"}\n');
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

describe('withFiles', () => {
  const oldDir = process.cwd();

  before('move to test directory', () => {
    process.chdir('tests/fixtures/withFiles');
  });

  after('restore working directory', () => {
    process.chdir(oldDir);
  });

  describe('no options', () => {
    it('should process all files in the working directory', async () => {
      const files = new Set<string>();

      await withFiles({}, (f) => {
        files.add(f.content.trim());
      });

      expect(files).to.have.keys([
        'one',
        'two',
        'three',
        'four',
        'five',
        'six',
      ]);
    });
  });

  describe('search.include', () => {
    it('should restrict to files matching a glob', async () => {
      const files = new Set<string>();

      await withFiles({ include: 'a/*' }, (f) => {
        files.add(f.content.trim());
      });

      expect(files).to.have.keys([
        'three',
        'four',
      ]);
    });

    it('should accept an array of globs', async () => {
      const files = new Set<string>();

      await withFiles({ include: ['a/*', 'b/*'] }, (f) => {
        files.add(f.content.trim());
      });

      expect(files).to.have.keys([
        'three',
        'four',
        'five',
        'six',
      ]);
    });
  });

  describe('search.exclude', () => {
    it('should not process files matching a glob', async () => {
      const files = new Set<string>();

      await withFiles({ exclude: 'a/*' }, (f) => {
        files.add(f.content.trim());
      });

      expect(files).to.have.keys([
        'one',
        'two',
        'five',
        'six',
      ]);
    });

    it('should accept an array of globs', async () => {
      const files = new Set<string>();

      await withFiles({ exclude: ['a/*', 'b/*'] }, (f) => {
        files.add(f.content.trim());
      });

      expect(files).to.have.keys([
        'one',
        'two',
      ]);
    });

    it('should override included files', async () => {
      const files = new Set<string>();

      await withFiles({ include: 'a/*', exclude: '**/3' }, (f) => {
        files.add(f.content.trim());
      });

      expect(files).to.have.keys([
        'four',
      ]);
    });
  });

  describe('search.containing', () => {
    it('should restrict to files containing a string', async () => {
      const files = new Set<string>();

      await withFiles({ containing: 'e' }, (f) => {
        files.add(f.content.trim());
      });

      expect(files).to.have.keys([
        'one',
        'three',
        'five',
      ]);
    });

    it('should work with `include` and `exclude`', async () => {
      const files = new Set<string>();

      await withFiles({
        include: ['a/*', 'b/*'],
        exclude: '**/3',
        containing: 'e',
      }, (f) => {
        files.add(f.content.trim());
      });

      expect(files).to.have.keys([
        'five',
      ]);
    });
  });
});
