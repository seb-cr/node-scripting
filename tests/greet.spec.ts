import { expect } from 'chai';

import { greet } from '@/src';

describe('greet', () => {
  context('with a name specified', () => {
    it('should greet that name', () => {
      expect(greet('TypeScript')).to.equal('Hello TypeScript!');
    });
  });

  context('without a name specified', () => {
    it('should greet the world', () => {
      expect(greet()).to.equal('Hello world!');
    });
  });
});
