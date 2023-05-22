import { expect } from 'chai';

import { exec, sh } from '@/src';

describe('exec', () => {
  it('should run a command and return stdout and stderr', async () => {
    const output = await exec('echo "hello stdout"; echo "hello stderr" >&2');
    expect(output.stdout).to.equal('hello stdout\n');
    expect(output.stderr).to.equal('hello stderr\n');
  });

  it('should throw if the command fails', async () => {
    await expect(exec('false')).to.eventually.be.rejected;
  });
});

describe('sh', () => {
  it('should run a command and return its stdout, trimmed by default', async () => {
    const output = await sh('echo hello');
    expect(output).to.equal('hello');
  });

  it('should throw if the command fails', async () => {
    await expect(sh('false')).to.eventually.be.rejected;
  });

  describe('options.trim', () => {
    it('if true, should remove leading and trailing spaces', async () => {
      const output = await sh('echo " hello "', { trim: true });
      expect(output).to.equal('hello');
    });

    it('if false, should keep leading and trailing spaces', async () => {
      const output = await sh('echo " hello "', { trim: false });
      expect(output).to.equal(' hello \n');
    });
  });
});

describe('sh mock mode', () => {
  afterEach(() => sh.restore());

  describe('the example in the JSDoc', () => {
    it('should work as demonstrated', async () => {
      const mock = sh.mock();

      mock
        .returns({ stdout: 'first call' })
        .returns({ stdout: 'second call' });

      mock
        .command('cat file.txt').returns({ stdout: 'file contents' })
        .command(/echo/).returns({ stdout: 'mock echo' });

      let result = await sh('some arbitrary command');
      expect(result).to.equal('first call');

      result = await sh('some arbitrary command');
      expect(result).to.equal('second call');

      result = await sh('echo "hi there"');
      expect(result).to.equal('mock echo');

      result = await sh('cat file.txt');
      expect(result).to.equal('file contents');

      mock.assertDone();
      sh.restore();
    });
  });

  describe('sh.mock', () => {
    it('should throw if called twice', () => {
      sh.mock();
      expect(() => sh.mock()).to.throw('`sh` is already mocked');
    });
  });

  describe('default mocks', () => {
    it('should return the mock results in order', async () => {
      sh.mock()
        .returns({ stdout: 'first' })
        .returns({ stdout: 'second' });

      let result = await sh('blah');
      expect(result).to.equal('first');

      result = await sh('blah');
      expect(result).to.equal('second');
    });

    it('should throw if `sh` is called without a mock', async () => {
      sh.mock();

      await expect(sh('blah')).to.eventually.be.rejectedWith(
        'No mock found for command: blah',
      );
    });

    it('should give no output if mock is omitted', async () => {
      sh.mock().returns();

      const result = await sh('blah');
      expect(result).to.equal('');
    });

    it('should make `sh` error if mock exit code is nonzero', async () => {
      sh.mock()
        .returns({
          exitCode: 1,
          stdout: 'here is some output',
          stderr: 'something went wrong',
        });

      await expect(sh('fail')).to.eventually.be.rejectedWith(
        'Command failed: fail\nsomething went wrong',
      );
    });
  });

  describe('matching mocks', () => {
    it('should return the mock results for the matching command', async () => {
      sh.mock()
        .command('a')
        .returns({ stdout: 'first a' })
        .returns({ stdout: 'second a' })
        .command('b')
        .returns({ stdout: 'first b' })
        .returns({ stdout: 'second b' });

      let result = await sh('a');
      expect(result).to.equal('first a');

      result = await sh('b');
      expect(result).to.equal('first b');

      result = await sh('a');
      expect(result).to.equal('second a');

      result = await sh('b');
      expect(result).to.equal('second b');
    });

    it("should fall back to default mock if command doesn't match", async () => {
      sh.mock()
        .returns({ stdout: 'default' })
        .command('a').returns({ stdout: 'matched' });

      const result = await sh('blah');
      expect(result).to.equal('default');
    });

    it('should give no output if mock is omitted', async () => {
      sh.mock().command('a').returns();

      const result = await sh('a');
      expect(result).to.equal('');
    });

    it('should make `sh` error if mock exit code is nonzero', async () => {
      sh.mock()
        .command('fail')
        .returns({
          exitCode: 1,
          stdout: 'here is some output',
          stderr: 'something went wrong',
        });

      await expect(sh('fail')).to.eventually.be.rejectedWith(
        'Command failed: fail\nsomething went wrong',
      );
    });
  });

  describe('assertDone', () => {
    it('should do nothing if all mocks were used', async () => {
      const mock = sh.mock().returns({ stdout: 'test' });
      await sh('blah');
      mock.assertDone();
    });

    it('should throw if some mocks were not used', () => {
      const mock = sh.mock().returns({ stdout: 'test' });
      expect(() => mock.assertDone()).to.throw();
    });
  });

  describe('reset', () => {
    it('should clear out any existing mocks', async () => {
      const mock = sh.mock();
      mock.returns({ stdout: 'test' });
      mock.command('blah').returns({ stdout: 'test' });

      mock.reset();
      mock.returns({ stdout: 'new' });

      const result = await sh('blah');
      expect(result).to.equal('new');
    });
  });
});
