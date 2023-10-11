import { expect } from 'chai';

import { Text } from '@/src';

describe('Text', () => {
  describe('content', () => {
    it('should get content', () => {
      const text = new Text('test');
      expect(text.content).to.equal('test');
    });

    it('should set content', () => {
      const text = new Text('foo');
      text.content = 'bar';
      expect(text.content).to.equal('bar');
    });
  });

  describe('lines', () => {
    it('should return an array of lines', () => {
      const text = new Text('one\ntwo\nthree');
      expect(text.lines()).to.deep.equal(['one', 'two', 'three']);
    });
  });

  describe('contains', () => {
    context('with a string', () => {
      it('should return true if text contains the string', () => {
        const text = new Text('one\ntwo\nthree');
        expect(text.contains('two')).to.be.true;
      });

      it('should return false if text contains the string', () => {
        const text = new Text('one\ntwo\nthree');
        expect(text.contains('blah')).to.be.false;
      });
    });

    context('with a regex', () => {
      it('should return true if text matches the regex', () => {
        const text = new Text('one\ntwo\nthree');
        expect(text.contains(/two/)).to.be.true;
      });

      it('should return false if text matches the regex', () => {
        const text = new Text('one\ntwo\nthree');
        expect(text.contains(/blah/)).to.be.false;
      });
    });
  });

  describe('replaceAll', () => {
    it('should work with a string', () => {
      const text = new Text('one. two. three');
      text.replaceAll('.', ',');
      expect(text.content).to.equal('one, two, three');
    });

    it('should work with a non-global regex', () => {
      const text = new Text('one. two. three');
      text.replaceAll(/./, 'z');
      expect(text.content).to.equal('zzzzzzzzzzzzzzz');
    });

    it('should work with a global regex', () => {
      const text = new Text('one. two. three');
      text.replaceAll(/\w/g, 'z');
      expect(text.content).to.equal('zzz. zzz. zzzzz');
    });

    it('should cover all lines', () => {
      const text = new Text('one.\ntwo.\nthree.');
      text.replaceAll('.', '!');
      expect(text.content).to.equal('one!\ntwo!\nthree!');
    });
  });

  describe('insertLine', () => {
    describe('where.at', () => {
      describe('non-negative values', () => {
        it('should insert at top, given 0', () => {
          const text = new Text('one\ntwo\nthree');
          text.insertLine('four', { at: 0 });
          expect(text.content).to.equal('four\none\ntwo\nthree');
        });

        it('should insert as second line, given 1', () => {
          const text = new Text('one\ntwo\nthree');
          text.insertLine('four', { at: 1 });
          expect(text.content).to.equal('one\nfour\ntwo\nthree');
        });

        it('should insert at end, given value greater than number of lines', () => {
          const text = new Text('one\ntwo\nthree');
          text.insertLine('four', { at: 10 });
          expect(text.content).to.equal('one\ntwo\nthree\nfour');
        });
      });

      describe('negative values', () => {
        it('should insert as last line, given -1', () => {
          const text = new Text('one\ntwo\nthree');
          text.insertLine('four', { at: -1 });
          expect(text.content).to.equal('one\ntwo\nthree\nfour');
        });

        it('should insert as penultimate line, given -2', () => {
          const text = new Text('one\ntwo\nthree');
          text.insertLine('four', { at: -2 });
          expect(text.content).to.equal('one\ntwo\nfour\nthree');
        });

        it('should insert at top, given value greater than number of lines', () => {
          const text = new Text('one\ntwo\nthree');
          text.insertLine('four', { at: -10 });
          expect(text.content).to.equal('four\none\ntwo\nthree');
        });
      });
    });

    describe('where.above', () => {
      it('should insert above first matching line', () => {
        const text = new Text('one\n\none');
        text.insertLine('zero', { above: 'one' });
        expect(text.content).to.equal('zero\none\n\none');
      });

      it('should throw if no line matches', () => {
        const text = new Text('one');
        expect(
          () => text.insertLine('two', { above: 'three' }),
        ).to.throw('No line found matching /three/');
      });
    });

    describe('where.below', () => {
      it('should insert below first matching line', () => {
        const text = new Text('one\n\none');
        text.insertLine('two', { below: 'one' });
        expect(text.content).to.equal('one\ntwo\n\none');
      });

      it('should throw if no line matches', () => {
        const text = new Text('one');
        expect(
          () => text.insertLine('three', { below: 'two' }),
        ).to.throw('No line found matching /two/');
      });
    });

    describe('where.aboveEvery', () => {
      it('should insert above all matching lines', () => {
        const text = new Text('one\n\none');
        text.insertLine('zero', { aboveEvery: 'one' });
        expect(text.content).to.equal('zero\none\n\nzero\none');
      });

      it('should do nothing if no line matches', () => {
        const text = new Text('one');
        text.insertLine('two', { aboveEvery: 'three' });
        expect(text.content).to.equal('one');
      });
    });

    describe('where.belowEvery', () => {
      it('should insert below all matching lines', () => {
        const text = new Text('one\n\none');
        text.insertLine('two', { belowEvery: 'one' });
        expect(text.content).to.equal('one\ntwo\n\none\ntwo');
      });

      it('should do nothing if no line matches', () => {
        const text = new Text('one');
        text.insertLine('three', { aboveEvery: 'two' });
        expect(text.content).to.equal('one');
      });
    });
  });

  describe('insertLines', () => {
    // not testing every option here as it uses `insertLine` internally

    it('should insert the group of lines (where.at)', () => {
      const text = new Text('one\ntwo\nthree');
      text.insertLines(['four', 'five'], { at: -1 });
      expect(text.content).to.equal('one\ntwo\nthree\nfour\nfive');
    });

    it('should insert the group of lines (where.belowEvery)', () => {
      const text = new Text('one\none');
      text.insertLines(['two', 'three'], { belowEvery: 'one' });
      expect(text.content).to.equal('one\ntwo\nthree\none\ntwo\nthree');
    });

    it('should no nothing if `lines` is empty', () => {
      const text = new Text('one\ntwo\nthree');
      text.insertLines([], { at: 0 });
      expect(text.content).to.equal('one\ntwo\nthree');
    });
  });

  describe('deleteLine', () => {
    it('should delete the first matching line', () => {
      const text = new Text('one\ntwo\nthree\ntwo\none');
      text.deleteLine('two');
      expect(text.content).to.equal('one\nthree\ntwo\none');
    });

    it('should match part of a line', () => {
      const text = new Text('the quick\nbrown fox');
      text.deleteLine('fox');
      expect(text.content).to.equal('the quick');
    });

    it('should throw if no line matches', () => {
      const text = new Text('one');
      expect(
        () => text.deleteLine('two'),
      ).to.throw('No line found matching /two/');
    });
  });

  describe('deleteEveryLine', () => {
    it('should delete all matching lines', () => {
      const text = new Text('one\ntwo\nthree\ntwo\none');
      text.deleteEveryLine('two');
      expect(text.content).to.equal('one\nthree\none');
    });

    it('should match part of a line', () => {
      const text = new Text('apple\norange\nbanana');
      text.deleteEveryLine('an');
      expect(text.content).to.equal('apple');
    });

    it('should do nothing if no line matches', () => {
      const text = new Text('one');
      text.deleteEveryLine('two');
      expect(text.content).to.equal('one');
    });
  });

  describe('deleteBlock', () => {
    it('should delete the first matching block (strings)', () => {
      const text = new Text('one\ntwo\n\none\nthree\n\none\ntwo');
      text.deleteBlock(['one', 'two']);
      expect(text.content).to.equal('\none\nthree\n\none\ntwo');
    });

    it('should delete the first matching block (regexps)', () => {
      const text = new Text('one\ntwo\n\none\nthree\n\none\ntwo');
      text.deleteBlock([/one/, /two/]);
      expect(text.content).to.equal('\none\nthree\n\none\ntwo');
    });

    it('should throw if no block matches', () => {
      const text = new Text('one');
      expect(
        () => text.deleteBlock(['one', 'two']),
      ).to.throw('No block found matching\n\n/one/\n/two/');
    });
  });

  describe('deleteEveryBlock', () => {
    it('should delete all matching blocks (strings)', () => {
      const text = new Text('one\ntwo\n\none\nthree\n\none\ntwo');
      text.deleteEveryBlock(['one', 'two']);
      expect(text.content).to.equal('\none\nthree\n');
    });

    it('should delete all matching blocks (regexps)', () => {
      const text = new Text('one\ntwo\n\none\nthree\n\none\ntwo');
      text.deleteEveryBlock([/one/, /two/]);
      expect(text.content).to.equal('\none\nthree\n');
    });

    it('should not consider lines overlapping in blocks that match', () => {
      const text = new Text('one\none\none\ntwo');
      text.deleteEveryBlock(['one', 'one']);
      expect(text.content).to.equal('one\ntwo');
    });

    it('should correctly handle repeated first line of block (issue #1)', () => {
      const text = new Text('one\ntwo\nthree\n');
      text.deleteEveryBlock(['', 'three']);
      expect(text.content).to.equal('one\n');
    });
  });

  describe('append', () => {
    it('should append the text', () => {
      const text = new Text('one\n');
      text.append('two');
      expect(text.content).to.equal('one\ntwo');
    });

    it('should not start a new line', () => {
      const text = new Text('one\ntwo');
      text.append('three');
      expect(text.content).to.equal('one\ntwothree');
    });
  });

  describe('appendLine', () => {
    it('should append the line with a line ending', () => {
      const text = new Text('one\n');
      text.appendLine('two');
      expect(text.content).to.equal('one\ntwo\n');
    });

    it('should add a line ending to the previous line if required', () => {
      const text = new Text('one');
      text.appendLine('two');
      expect(text.content).to.equal('one\ntwo\n');
    });

    it('should not prevent explicitly adding extra linebreaks', () => {
      const text = new Text('one\n');
      text.appendLine('\ntwo\n');
      expect(text.content).to.equal('one\n\ntwo\n\n');
    });
  });

  describe('appendLines', () => {
    it('should append the lines with line endings', () => {
      const text = new Text('one\n');
      text.appendLines(['two', 'three']);
      expect(text.content).to.equal('one\ntwo\nthree\n');
    });

    it('should add a line ending to the previous line if required', () => {
      const text = new Text('one');
      text.appendLines(['two', 'three']);
      expect(text.content).to.equal('one\ntwo\nthree\n');
    });
  });
});
