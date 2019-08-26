import uuid from "uuid";
import sjcl from "sjcl";
import {
  Document,
  initDocument,
  isNew,
  hasNeverBeenSync,
  hasNoLocalChanges
} from "./document";
import { Config } from "../config";
import { authInfo } from "./auth";
import { EventEmitter } from "events";
import LocalForage from "localforage";

export type State = {
  document: Document;
  secret: string;
};

export type Store = {
  state: State;
  events: EventEmitter;
  endpoint: string;
  localforage: LocalForage;
};

export const Events = {
  NO_DOCUMENT_ID: "store:no-document-id",
  DOCUMENT_NOT_FOUND: "store:document-not-found",
  APP_IS_OFFLINE: "store:app-is-offline",
  APP_IS_ONLINE: "store:app-is-online",
  CHANGE: "store:change",
  SYNCHRONIZE: "store:synchronize",
  DECRYPTION_FAILED: "store:decryption_failed",
  CONFLICT: "store:conflict",
  UPDATE_WITHOUT_CONFLICT: "store:update-without-conflict",
  AUTHENTICATION_REQUIRED: "store:authentication-required"
};

// ?????????????????????????????????????????????????????????????????????????????????????????????????????????????,
const buildSecret = () => {
  //return sjcl.codec.base64.fromBits(sjcl.random.randomWords(8, 10), 0);
  return "";
};

const store: Store = {
  state: {
    // we automatically create a default document, but it might not be used
    document: initDocument(),
    // we automatically generate a secret, but it might not be used
    secret: buildSecret()
  },
  events: new EventEmitter(),
  endpoint: "",
  localforage: LocalForage
};

export const initStore = (
  name: string,
  events: EventEmitter,
  endpoint: string,
  localforage: LocalForage
) => {
  store.state = {
    // we automatically create a default document, but it might not be used
    document: initDocument(),
    // we automatically generate a secret, but it might not be used
    secret: buildSecret()
  };

  store.events = events;
  store.endpoint = endpoint;
  store.localforage = localforage;

  store.localforage.config({
    name: Config.APP_NAME,
    storeName: name
  });
  return store;
};

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
export const load = async (id: string, secret: string) => {
  if (!id) {
    store.events.emit(Events.NO_DOCUMENT_ID, store.state);
    return Promise.resolve(store.state);
  }

  const document = await store.localforage.getItem(id);
  if (!document) {
    try {
      const response = await fetch(`${store.endpoint}/documents/${id}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${authInfo.accessToken}`
        }
      });
      handleRequestSuccess();
      const res = await response.json();
      if (!res || !res.body) {
        throw new Error("Invalid server response");
      }
      const document: Document = {
        uuid: res.body.uuid,
        content: res.body.content,
        metadata: res.body.metadata,
        path: res.body.path,
        last_modified: res.body.last_modified,
        last_modified_locally: 0
      };
      const decryptedContent = decrypt(document.content, secret);
      let metadata = document.metadata;
      try {
        metadata = document.metadata;
      } catch (err) {}

      setState({
        document: {
          uuid: document.uuid,
          content: decryptedContent,
          metadata: metadata,
          path: document.path,
          last_modified: document.last_modified,
          last_modified_locally: document.last_modified_locally
        },
        secret: secret
      });
      return localPersist();
    } catch (err) {
      handleRequestError(err);
    }
  }
};

/**
 * This method is called when the document has been updated by the user
 */
export const update = (document: any) => {
  // we don't want to store default content
  if (document.isNew()) {
    return store.state;
  }

  setState({
    document: {
      uuid: document.uuid,
      content: document.content,
      metadata: document.metadata,
      path: document.path,
      last_modified: document.last_modified,
      last_modified_locally: Date.now()
    },
    secret: store.state.secret
  });

  return localPersist();
};

/**
 * Synchronize current document between local and server databases
 */
export const sync = async () => {
  console.log("start sync");
  if (isNew(store.state.document)) {
    return store.state;
  }

  if (hasNeverBeenSync(store.state.document)) {
    console.log("sync never been");
    return serverPersist();
  }

  console.log("sync ");

  let uri = `${store.endpoint}/documents/${store.state.document.uuid}`;

  if (uri.indexOf("undefined") != -1) {
    return;
  }
  try {
    const response = await fetch(uri, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${authInfo.accessToken}`
      }
    });
    handleRequestSuccess();
    const res = await response.json();
    const localDoc = store.state.document;
    const serverDoc: Document = {
      uuid: res.body.uuid,
      content: res.body.content,
      metadata: res.body.metadata,
      path: res.body.path,
      last_modified: res.body.last_modified,
      last_modified_locally: 0
    };

    console.log(
      serverDoc.last_modified,
      localDoc.last_modified,
      localDoc.last_modified_locally
    );
    const lastModified = serverDoc.last_modified;
    if (!lastModified) {
      return;
    }
    if (lastModified === localDoc.last_modified) {
      // here, document on the server has not been updated, so we can
      // probably push safely
      if (lastModified < localDoc.last_modified_locally) {
        return serverPersist();
      }

      return store.state;
    }

    // In theory, it should never happened, but... what happens if:
    // localDoc.get('last_modified') > serverDoc.get('last_modified') ?
    if (lastModified > localDoc.last_modified) {
      if (hasNoLocalChanges(localDoc)) {
        const secret = store.state.secret;
        try {
          const decryptedContent = decrypt(serverDoc.content, secret);
          const updatedDocument: Document = {
            uuid: serverDoc.uuid,
            content: decryptedContent,
            path: serverDoc.path,
            metadata: serverDoc.metadata,
            last_modified: lastModified,
            last_modified_locally: 0
          };

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
        } catch (err) {
          handleRequestError(err);
        }
      }
    }
    // someone modified my document!
    // ... but I also modified it so... let's fork \o/

    // generate a new secret for fork'ed document
    const forkSecret = buildSecret();

    // what we want is to create a fork
    const encryptedContent = encrypt(localDoc.content, forkSecret);
    const forkDocument: Document = {
      uuid: uuid.v4(),
      content: localDoc.content,
      metadata: localDoc.metadata,
      path: localDoc.path,
      last_modified: localDoc.last_modified,
      last_modified_locally: localDoc.last_modified_locally
    };

    // persist fork'ed document
    const fork = await store.localforage.setItem(forkDocument.uuid, {
      uuid: forkDocument.uuid,
      content: encryptedContent,
      metadata: forkDocument.metadata,
      path: forkDocument.path,
      last_modified: forkDocument.last_modified,
      last_modified_locally: forkDocument.last_modified_locally
    });
    // now, we can update the former doc with server content
    const former = {
      uuid: serverDoc.uuid,
      content: serverDoc.content,
      metadata: serverDoc.metadata,
      path: serverDoc.path,
      last_modified: serverDoc.last_modified,
      last_modified_locally: serverDoc.last_modified_locally
    };
    await store.localforage.setItem(former.uuid, former);
    const conflictState = {
      fork: {
        document: fork,
        secret: forkSecret
      } as State,
      document: former,
      secret: store.state.secret
    };

    // state is now sync'ed with fork
    setState(conflictState.fork, Events.CONFLICT, conflictState);

    return conflictState;
  } catch (err) {
    handleRequestError(err);
  }
};

// Pure / side-effect free method
const decrypt = (content: string, secret: string) => {
  try {
    return sjcl.decrypt(secret, content);
  } catch (e) {
    store.events.emit("Estore:decryption_failed", store.state);

    throw new Error("decryption failed");
  }
};

// Pure / side-effect free method
const encrypt = (content: string, secret: string) => {
  secret = "";
  return sjcl.encrypt(secret, content); //, { ks: 256 });
};

// Impure / side-effect free method
const localPersist = async () => {
  const doc = store.state.document;
  const secret = store.state.secret;

  const encryptedContent = encrypt(doc.content, secret);
  await store.localforage.setItem(doc.uuid, {
    uuid: doc.uuid,
    content: encryptedContent,
    metadata: doc.metadata,
    path: doc.path,
    last_modified: doc.last_modified,
    last_modified_locally: doc.last_modified_locally
  });
  return store.state;
};

// Impure / side-effect free method
const serverPersist = async () => {
  const doc = store.state.document;
  const secret = store.state.secret;

  const encryptedContent = await encrypt(doc.content, secret);
  try {
    const response = await fetch(`${store.endpoint}/documents/${doc.uuid}`, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${authInfo.accessToken}`
      },
      body: JSON.stringify({
        content: encryptedContent,
        metadata: doc.metadata,
        path: doc.path
      })
    });
    const res = await response.json();
    handleRequestSuccess();
    setState(
      {
        document: {
          uuid: doc.uuid,
          content: doc.content,
          metadata: doc.metadata,
          path: doc.path,
          last_modified: res.body.last_modified,
          last_modified_locally: 0
        },
        secret: secret
      },
      Events.SYNCHRONIZE
    );
    return localPersist();
  } catch (err) {
    handleRequestError(err);
  }
};

const handleRequestSuccess = () => {
  store.events.emit(Events.APP_IS_ONLINE);
};

const handleRequestError = (err: any) => {
  if (err.response && 401 === err.response.statusCode) {
    store.events.emit(Events.AUTHENTICATION_REQUIRED, store.state);

    return Promise.reject(new Error("document not found"));
  }

  if (err.response && 404 === err.response.statusCode) {
    store.events.emit(Events.DOCUMENT_NOT_FOUND, store.state);

    return Promise.reject(new Error("document not found"));
  }

  store.events.emit(Events.APP_IS_OFFLINE);

  return Promise.reject(new Error("request failed (network)"));
};

const setState = (newState: State, eventName?: string, eventState?: any) => {
  store.state = newState;

  store.events.emit(eventName || Events.CHANGE, eventState || store.state);
};
