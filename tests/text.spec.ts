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
});
