/* eslint consistent-return: 1 */
const sjcl = require('sjcl');

function decrypt(content, secret, events, state) {
  try {
    return Promise.resolve(sjcl.decrypt(secret, content));
  } catch (e) {
    events.emit('Estore:decryption_failed', state);

    return Promise.reject(new Error('decryption failed'));
  }
}

function buildSecret() {
  return '';
}

module.exports = {
  decrypt,
  buildSecret
};

