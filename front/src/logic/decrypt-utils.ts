import sjcl from 'sjcl';
import { EventEmitter } from 'events';

export const decryptUtil = (content: string, secret: string, events: EventEmitter, state: {
    [key: string]: any;
}) => {
  try {
    return sjcl.decrypt(secret, content);
  } catch (e) {
    events.emit('Estore:decryption_failed', state);

    return new Error('decryption failed');
  }
}

export const buildSecretUtil = () => {
  return '';
}


