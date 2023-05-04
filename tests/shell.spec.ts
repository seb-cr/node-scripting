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
