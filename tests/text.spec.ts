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
});
