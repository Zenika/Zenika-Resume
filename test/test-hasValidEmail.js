/* eslint-env mocha */
const expect = require('chai').expect;
const server = require('../server');
const hasValidEmail = server.hasValidEmail;

describe('Test has valid email function', () => {

  it('Should Pass when both emails are valid', () => {
    const req = { user: { emails: [{ value: 'clement@zenika.com' },
     { value: 'plop@zenika.com' }] } };
    const result = hasValidEmail(req);
    expect(result).to.equal(true);
  });

  it('Should Pass when the first email is valid', () => {
    const req = { user: { emails: [{ value: 'clement@zenika.com' },
    { value: 'plop@ovh.com' }] } };
    const result = hasValidEmail(req);
    expect(result).to.equal(true);
  });

  it('Should Pass when the second email is valid', () => {
    const req = { user: { emails: [{ value: 'clement@ovh.com' },
     { value: 'zenika.resume@gmail.com' }] } };
    const result = hasValidEmail(req);
    expect(result).to.equal(true);
  });

  it('Should Pass when the second email is valid', () => {
    const req = { user: { emails: [{ value: 'clement-ext@zenika.com' },
     { value: 'zenika.resume@gmail.com' }] } };
    const result = hasValidEmail(req);
    expect(result).to.equal(true);
  });

  it('Should Fail when a email contain -ext@', () => {
    const req = { user: { emails: [{ value: 'plop-ext@zenika.com' }] } };
    const result = hasValidEmail(req);
    expect(result).to.equal(false);
  });

  it('Should Fail when both emails are invalid', () => {
    const req = { user: { emails: [{ value: 'clement@gmail.com' }, { value: 'plop@ovh.com' }] } };
    const result = hasValidEmail(req);
    expect(result).to.equal(false);
  });
});
