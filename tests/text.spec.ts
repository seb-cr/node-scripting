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
});
