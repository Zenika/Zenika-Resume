import uuid from 'uuid';
import sjcl from 'sjcl';
import Document from './document';
import { Config } from '../config';
import DecryptUtils from './decrypt-utils';
import {authInfo} from './auth';
import { EventEmitter } from 'events';
import LocalForage from "localforage"

type Store = {
    state: {[key: string]: any};
    events: EventEmitter;
    endpoint: string;
    localforage: LocalForage;
}

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

const store: Store = {
    state: {},
    events: new EventEmitter(),
    endpoint: "",
    localforage: LocalForage
}

export const initStore = (name: string, events: EventEmitter, endpoint: string, localforage: LocalForage) => {
    store.state = {
      // we automatically create a default document, but it might not be used
      document: new Document(),
      // we automatically generate a secret, but it might not be used
      secret: buildSecret(),
    };

    store.events = events;
    store.endpoint = endpoint;
    store.localforage = localforage;

    store.localforage.config({
      name: Config.APP_NAME,
      storeName: name,
    });
  }
// ?????????????????????????????????????????????????????????????????????????????????????????????????????????????,
const buildSecret = () => {
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
const load = async (id: string, secret: string) => {
    if (!id) {
      store.events.emit(Events.NO_DOCUMENT_ID, store.state);
      return Promise.resolve(store.state);
    }

    const document = await store
      .localforage
      .getItem(id);
        if (!document) {
          
          try{
            const response = await  fetch(`${store.endpoint}/documents/${id}`, {
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authInfo.accessToken}`
                }
            })
            handleRequestSuccess()
            const res = await response.json();
            if(!res || !res.body) {
                throw new Error("Invalid server response")
            }
            const document = new Document({
                uuid: res.body.uuid,
                content: res.body.content,
                metadata: res.body.metadata,
                path: res.body.path,
                last_modified: res.body.last_modified
              });
            const decryptedContent = decrypt(document.get('content'), secret)
            let metadata = document.get('metadata');
            try {
              metadata = document.get('metadata').toJS();
            } catch (err) {
            }

            setState({
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
            return localPersist();
          }catch(err) {
              handleRequestError(err)
            }
        }
        
  }

  /**
   * This method is called when the document has been updated by the user
   */
  const update = (document: any) => {
    // we don't want to store default content
    if (document.isNew()) {
      return store.state;
    }

    setState({
      document: new Document({
        uuid: document.get('uuid'),
        content: document.get('content'),
        metadata: document.get('metadata'),
        path: document.get('path'),
        last_modified: document.get('last_modified'),
        last_modified_locally: Date.now()
      }),
      secret: store.state.secret
    });

    return localPersist();
  }

  /**
   * Synchronize current document between local and server databases
   */
  const sync = async ()  => {
    console.log('start sync');
    if (store.state.document.isNew()) {
      return store.state;
    }

    if (store.state.document.hasNeverBeenSync()) {
      console.log('sync never been');
      return serverPersist();
    }

    console.log('sync ');

    let uri = `${store.endpoint}/documents/${store.state.document.get('uuid')}`;

    if (uri.indexOf('undefined') != -1) {
      return;
    }
    try{
    const response = await fetch(uri, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authInfo.accessToken}`
        }
    })
    handleRequestSuccess();
    const res = await response.json();
    const localDoc = store.state.document;
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
            return serverPersist();
          }

          return store.state;
        }

        // In theory, it should never happened, but... what happens if:
        // localDoc.get('last_modified') > serverDoc.get('last_modified') ?
        if (serverDoc.get('last_modified') > localDoc.get('last_modified')) {
          if (localDoc.hasNoLocalChanges()) {
            const secret = store.state.secret;

            const decryptedContent = decrypt(serverDoc.content, secret)
                const updatedDocument = new Document({
                  uuid: serverDoc.get('uuid'),
                  content: decryptedContent,
                  path: serverDoc.get('path'),
                  metadata: serverDoc.get('metadata'),
                  last_modified: serverDoc.get('last_modified'),
                });

                setState(
                  {
                    document: updatedDocument,
                    secret: secret
                  },
                  Events.UPDATE_WITHOUT_CONFLICT,
                  {
                    document: updatedDocument
                  }
                );
                return localPersist();
            }
        }
         // someone modified my document!
          // ... but I also modified it so... let's fork \o/

          // generate a new secret for fork'ed document
          const forkSecret = buildSecret();

          // what we want is to create a fork
          const encryptedContent = encrypt(localDoc.content, forkSecret)
              const forkDocument = new Document({
                uuid: uuid.v4(),
                content: localDoc.content,
                metadata: localDoc.metadata,
                path: localDoc.path
              });

              // persist fork'ed document
              const fork = await store.localforage.setItem(
                forkDocument.get('uuid'),
                new Document({
                  uuid: forkDocument.get('uuid'),
                  content: encryptedContent,
                  metadata: forkDocument.metadata,
                  path: forkDocument.path
                }).toJS()
              )
              // now, we can update the former doc with server content
              const former = new Document({
                uuid: serverDoc.get('uuid'),
                content: serverDoc.get('content'),
                metadata: serverDoc.get('metadata'),
                path: serverDoc.get('path'),
                last_modified: serverDoc.get('last_modified')
              });
                await store.localforage
                .setItem(
                  former.get('uuid'),
                  former.toJS()
                )
                  const conflictState = {
                    fork: {
                      document: fork,
                      secret: forkSecret
                    },
                    document: former,
                    secret: store.state.secret
                  };

                  // state is now sync'ed with fork
                  setState(
                    conflictState.fork,
                    Events.CONFLICT,
                    conflictState
                  );

                  return conflictState;
                
    }catch(err){handleRequestError(err)}
         
  }

  // Pure / side-effect free method
  const decrypt = (content: string, secret: string) => {
    return DecryptUtils.decrypt(content, secret, store.events, store.state);
  }

  // Pure / side-effect free method
  const encrypt = (content: string, secret: string) => {
    secret = "";
    return Promise.resolve(sjcl.encrypt(secret, content, { ks: 256 }));
  }

  // Impure / side-effect free method
  const localPersist = () => {
    const doc = store.state.document;
    const secret = store.state.secret;

    return encrypt(doc.get('content'), secret)
      .then((encryptedContent) => {
        return store.localforage.setItem(
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
        return Promise.resolve(store.state);
      });
  }

  // Impure / side-effect free method
  const serverPersist = async () => {
    const doc = store.state.document;
    const secret = store.state.secret;

    const encryptedContent = await  encrypt(doc.get('content'), secret)
    try{
          const response = await fetch(`${store.endpoint}/documents/${doc.get('uuid')}`, {
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authInfo.accessToken}`
              },
              body: JSON.stringify({
                content: encryptedContent,
                metadata: doc.get('metadata'),
                path: doc.get('path')
              })
          })
          const res = await response.json();
           handleRequestSuccess()
           setState(
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
          return localPersist();
        }catch(err) {handleRequestError(err)}
  }

  const handleRequestSuccess = () => {
    store.events.emit(Events.APP_IS_ONLINE);
  }

  const handleRequestError = (err: any) => {
    if (err.response && 401 === err.response.statusCode) {
      store.events.emit(Events.AUTHENTICATION_REQUIRED, store.state);

      return Promise.reject(new Error('document not found'));
    }

    if (err.response && 404 === err.response.statusCode) {
        store.events.emit(Events.DOCUMENT_NOT_FOUND, store.state);

      return Promise.reject(new Error('document not found'));
    }

    store.events.emit(Events.APP_IS_OFFLINE);

    return Promise.reject(new Error('request failed (network)'));
  }

  const setState = (newState: {[key: string]: any}, eventName?: string, eventState?: any) => {
    store.state = newState;

    store.events.emit(eventName || Events.CHANGE, eventState || store.state);
  }