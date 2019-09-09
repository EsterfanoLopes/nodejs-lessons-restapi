const expect = require('chai').expect;
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

const authMiddleware = require('../middleware/is-auth');

describe('Authorization Middleware', () => {
  it('Should throw an error if no authorization header is present', () => {
    const req = {
      get: (headerName) => null
    }
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw('Not authenticated.');
  });
  
  it('Should throw an error if the authorization error is only one string', () => {
    const req = {
      get: (headerName) => 'xyz',
    }
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });

  it('Should throw an error if the token cannot be verified', () => {
    const req = {
      get: (headerName) => 'Bearer xyz',
    }
    expect(authMiddleware.bind(this, req, {}, () => {})).to.throw();
  });

  it('Should yield a userId after decoding the token', () => {
    const req = {
      get: (headerName) => 'Bearer xyz',
    }
    sinon.stub(jwt, 'verify');
    jwt.verify.returns({ userId: 'abc' });
    authMiddleware(req, {}, () => {});
    expect(req).to.have.property('userId');
    expect(req).to.have.property('userId', 'abc');
    expect(jwt.verify.called).to.be.true;
    jwt.verify.restore();
  });
});
