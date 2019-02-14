/* eslint consistent-return: 1 */
import uuid from 'uuid';
import sjcl from 'sjcl';
import request from 'superagent';
import Document from './Document';
import { Config } from './Config';
import Immutable from 'immutable';
import DecryptUtils from './DecryptUtils';
import auth from './auth';

const { Promise } = global;

export const Events = {
  NO_DOCUMENT_ID: 'store:no-document-id',
  DOCUMENT_NOT_FOUND: 'store:document-not-found',
  APP_IS_OFFLINE: 'store:app-is-offline',
  APP_IS_ONLINE: 'store:app-is-online',
  CHANGE: 'store:change',
  SYNCHRONIZE: 'store:synchronize',
  DECRYPTION_FAILED: 'store:decryption_failed',
  CONFLICT: 'store:conflict',
  UPDATE_WITHOUT_CONFLICT: 'store:update-without-conflict',
  AUTHENTICATION_REQUIRED: 'store:authentication-required',
};

export default class Store {

  constructor(name, events, endpoint, localforage) {
    this.state = {
      // we automatically create a default document, but it might not be used
      document: new Document(),
      // we automatically generate a secret, but it might not be used
      secret: this.buildSecret(),
    };

    this.events = events;
    this.endpoint = endpoint;
    this.localforage = localforage;

    this.localforage.config({
      name: Config.APP_NAME,
      storeName: name,
    });
  }

  buildSecret() {
    //return sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 10), 0);
    return '';
  }

  /**
   * The aim of this method is to load a document by:
   *
   *   0. No ID => Events.NO_DOCUMENT_ID
   *   1. Looking into the local database first
   *     1.1. If it is not found => go to 2.
   *     1.2. If found, we attempt to decrypt it
   *       1.2.1 Decryption OK => document loaded + Events.CHANGE
   *       1.2.2 Decryption KO => Events.DECRYPTION_FAILED
   *   2. Fetch the document on the server
   *     2.1 Found => We attempt to decrypt it
   *       2.1.1 Decryption OK => document loaded + Events.CHANGE
   *       2.1.2 Decryption KO => Events.DECRYPTION_FAILED
   *     2.2 Not found => Events.DOCUMENT_NOT_FOUND
   *
   */
  load(id, secret) {
    if (!id) {
      this.events.emit(Events.NO_DOCUMENT_ID, this.state);
      return Promise.resolve(this.state);
    }

    return this
      .localforage
      .getItem(id)
      .then((document) => {
        if (null === document) {
          return Promise.reject(new Error('document not found'));
        }

        return Promise.resolve(Immutable.fromJS(document));
      })
      .catch(() => {
        return request
          .get(`${this.endpoint}/documents/${id}`)
          .set('Accept', 'application/json')
          .set('Content-Type', 'application/json')
          .set('Authorization', auth.accessToken)
          .then(this._handleRequestSuccess.bind(this))
          .catch(this._handleRequestError.bind(this))
          .then((res) => {
            return Promise.resolve(new Document({
              uuid: res.body.uuid,
              content: res.body.content,
              metadata: res.body.metadata,
              path: res.body.path,
              last_modified: res.body.last_modified
            }));
          });
      })
      .then((document) => {
        return this
          .decrypt(document.get('content'), secret)
          .then((decryptedContent) => {
            let metadata = document.get('metadata');
            try {
              metadata = document.get('metadata').toJS();
            } catch (err) {
            }

            this._setState({
              document: new Document({
                uuid: document.get('uuid'),
                content: decryptedContent,
                metadata: metadata,
                path: document.get('path'),
                last_modified: document.get('last_modified'),
                last_modified_locally: document.get('last_modified_locally')
              }),
              secret: secret
            });
          });
      })
      .then(() => {
        return this._localPersist();
      });
  }

  /**
   * This method is called when the document has been updated by the user
   */
  update(document) {
    // we don't want to store default content
    if (document.isNew()) {
      return Promise.resolve(this.state);
    }

    this._setState({
      document: new Document({
        uuid: document.get('uuid'),
        content: document.get('content'),
        metadata: document.get('metadata'),
        path: document.get('path'),
        last_modified: document.get('last_modified'),
        last_modified_locally: Date.now()
      }),
      secret: this.state.secret
    });

    return this._localPersist();
  }

  /**
   * Synchronize current document between local and server databases
   */
  sync() {
    console.log('start sync');
    if (this.state.document.isNew()) {
      return Promise.resolve(this.state);
    }

    if (this.state.document.hasNeverBeenSync()) {
      console.log('sync never been');
      return this._serverPersist();
    }

    console.log('sync ');

    let uri = `${this.endpoint}/documents/${this.state.document.get('uuid')}`;

    if (uri.indexOf('undefined') != -1) {
      return;
    }

    return request
      .get(uri)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${auth.accessToken}`)
      .then(this._handleRequestSuccess.bind(this))
      .catch(this._handleRequestError.bind(this))
      .then((res) => {
        const localDoc = this.state.document;
        const serverDoc = new Document({
          uuid: res.body.uuid,
          content: res.body.content,
          metadata: res.body.metadata,
          path: res.body.path,
          last_modified: res.body.last_modified,
        });

        console.log(serverDoc.get('last_modified'), localDoc.get('last_modified'), localDoc.get('last_modified_locally'));

        if (serverDoc.get('last_modified') === localDoc.get('last_modified')) {
          // here, document on the server has not been updated, so we can
          // probably push safely
          if (serverDoc.get('last_modified') < localDoc.get('last_modified_locally')) {
            return this._serverPersist();
          }

          return Promise.resolve(this.state);
        }

        // In theory, it should never happened, but... what happens if:
        // localDoc.get('last_modified') > serverDoc.get('last_modified') ?
        if (serverDoc.get('last_modified') > localDoc.get('last_modified')) {
          if (localDoc.hasNoLocalChanges()) {
            const secret = this.state.secret;

            return this
              .decrypt(serverDoc.content, secret)
              .then((decryptedContent) => {
                const updatedDocument = new Document({
                  uuid: serverDoc.get('uuid'),
                  content: decryptedContent,
                  path: serverDoc.get('path'),
                  metadata: serverDoc.get('metadata'),
                  last_modified: serverDoc.get('last_modified'),
                });

                this._setState(
                  {
                    document: updatedDocument,
                    secret: secret
                  },
                  Events.UPDATE_WITHOUT_CONFLICT,
                  {
                    document: updatedDocument
                  }
                );
              })
              .then(() => {
                return this._localPersist();
              });
          }

          // someone modified my document!
          // ... but I also modified it so... let's fork \o/

          // generate a new secret for fork'ed document
          const forkSecret = this.buildSecret();

          // what we want is to create a fork
          return this
            .encrypt(localDoc.content, forkSecret)
            .then((encryptedContent) => {
              const fork = new Document({
                uuid: uuid.v4(),
                content: localDoc.content,
                metadata: localDoc.metadata,
                path: localDoc.path
              });

              // persist fork'ed document
              return this.localforage.setItem(
                fork.get('uuid'),
                new Document({
                  uuid: fork.get('uuid'),
                  content: encryptedContent,
                  metadata: fork.metadata,
                  path: fork.path
                }).toJS()
              )
                .then(() => {
                  return Promise.resolve(fork);
                });
            })
            .then((fork) => {
              // now, we can update the former doc with server content
              const former = new Document({
                uuid: serverDoc.get('uuid'),
                content: serverDoc.get('content'),
                metadata: serverDoc.get('metadata'),
                path: serverDoc.get('path'),
                last_modified: serverDoc.get('last_modified')
              });

              return this
                .localforage
                .setItem(
                  former.get('uuid'),
                  former.toJS()
                )
                .then(() => {
                  const conflictState = {
                    fork: {
                      document: fork,
                      secret: forkSecret
                    },
                    document: former,
                    secret: this.state.secret
                  };

                  // state is now sync'ed with fork
                  this._setState(
                    conflictState.fork,
                    Events.CONFLICT,
                    conflictState
                  );

                  return Promise.resolve(conflictState);
                });
            });
        }
      });
  }

  // Pure / side-effect free method
  decrypt(content, secret) {
    return DecryptUtils.decrypt(content, secret, this.events, this.state);
  }

  // Pure / side-effect free method
  encrypt(content, secret) {
    secret = '';
    return Promise.resolve(sjcl.encrypt(secret, content, { ks: 256 }));
  }

  // Impure / side-effect free method
  _localPersist() {
    const doc = this.state.document;
    const secret = this.state.secret;

    return this
      .encrypt(doc.get('content'), secret)
      .then((encryptedContent) => {
        return this.localforage.setItem(
          doc.get('uuid'),
          new Document({
            uuid: doc.get('uuid'),
            content: encryptedContent,
            metadata: doc.get('metadata'),
            path: doc.get('path'),
            last_modified: doc.get('last_modified'),
            last_modified_locally: doc.get('last_modified_locally')
          }).toJS()
        );
      })
      .then(() => {
        return Promise.resolve(this.state);
      });
  }

  // Impure / side-effect free method
  _serverPersist() {
    const doc = this.state.document;
    const secret = this.state.secret;

    return this
      .encrypt(doc.get('content'), secret)
      .then((encryptedContent) => {
          return request
            .put(`${this.endpoint}/documents/${doc.get('uuid')}`)
            .set('Accept', 'application/json')
            .set('Content-Type', 'application/json')
            .set('Authorization', `Bearer ${auth.accessToken}`)
            .send({
              content: encryptedContent,
              metadata: doc.get('metadata'),
              path: doc.get('path')
            })
            .then(this._handleRequestSuccess.bind(this))
            .catch(this._handleRequestError.bind(this))
            .then((res) => {
              this._setState(
                {
                  document: new Document({
                    uuid: doc.get('uuid'),
                    content: doc.get('content'),
                    metadata: doc.get('metadata'),
                    path: doc.get('path'),
                    last_modified: res.body.last_modified,
                    last_modified_locally: null
                  }),
                  secret: secret
                },
                Events.SYNCHRONIZE
              );

              return this._localPersist();
            });
      }
      );
  }

  _handleRequestSuccess(res) {
    this.events.emit(Events.APP_IS_ONLINE);

    return Promise.resolve(res);
  }

  _handleRequestError(err) {
    if (err.response && 401 === err.response.statusCode) {
      this.events.emit(Events.AUTHENTICATION_REQUIRED, this.state);

      return Promise.reject(new Error('document not found'));
    }

    if (err.response && 404 === err.response.statusCode) {
      this.events.emit(Events.DOCUMENT_NOT_FOUND, this.state);

      return Promise.reject(new Error('document not found'));
    }

    this.events.emit(Events.APP_IS_OFFLINE);

    return Promise.reject(new Error('request failed (network)'));
  }

  _setState(newState, eventName, eventState) {
    this.state = newState;

    this.events.emit(eventName || Events.CHANGE, eventState || this.state);
  }
}
