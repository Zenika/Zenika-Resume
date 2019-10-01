import Store, { Events } from '../Store';
import Document from '../Document';

import sinon from 'sinon';
import fauxJax from 'faux-jax';

// see: https://github.com/mochajs/mocha/issues/1847
const { Promise, beforeEach, afterEach, describe, it } = global;

// chai-as-promised
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;


describe('Store', () => {

  const STORE_NAME = 'mocha-test';

  let eventEmitterSpy, localForageMock, store;

  beforeEach(() => {
    eventEmitterSpy = sinon.spy();
    localForageMock = {
      items: {},
      nbGetItemCall: 0,
      nbSetItemCall: 0,
      config: function () {
        return this;
      },
      setItem: function (k, v) {
        localForageMock.nbSetItemCall++;
        localForageMock.items[k] = v;

        return Promise.resolve();
      },
      getItem: function (k) {
        localForageMock.nbGetItemCall++;

        return Promise.resolve(localForageMock.items[k] || null);
      }
    };

    store = new Store(STORE_NAME, { emit: eventEmitterSpy }, '', localForageMock);
  });

  describe('- load()', (done) => {
    // 0. No ID => Events.NO_DOCUMENT_ID
    it('emits an event when no id is supplied', () => {
      store
        .load()
        .catch(() => {
          expect(eventEmitterSpy.calledOnce).to.be.true;
          expect(eventEmitterSpy.calledWith(Events.NO_DOCUMENT_ID)).to.be.true;

          done();
        });
    });

    describe('with Internet connection', () => {
      beforeEach(() => {
        fauxJax.install();
      });

      it('starts by looking into local database', () => {
        fauxJax.on('request', (request) => {
          request.respond(
            404, { 'Content-Type': 'application/json' }
          );

          fauxJax.restore();
        });

        return store.load(123).catch(() => {
          expect(localForageMock.nbGetItemCall).to.equal(1);
        });
      });

      it('returns the item in the local database', () => {
        fauxJax.restore();

        return store
          .encrypt('foo', 'secret')
          .then((encrypted) => {
            localForageMock.items['123'] = new Document({
              content: encrypted
            });

            return store.load(123, 'secret').then((state) => {
              expect(eventEmitterSpy.calledOnce).to.be.true;
              expect(eventEmitterSpy.calledWith(Events.CHANGE)).to.be.true;

              expect(state).to.have.property('document');
              expect(state).to.have.property('secret');
            });
          });
      });

      it('deals with 404 error when document is not stored locally', () => {
        fauxJax.on('request', (request) => {
          request.respond(
            404, { 'Content-Type': 'application/json' }
          );

          fauxJax.restore();
        });

        return store.load(123, 'secret').catch(() => {
          expect(eventEmitterSpy.calledOnce).to.be.true;
          expect(eventEmitterSpy.calledWith(Events.DOCUMENT_NOT_FOUND)).to.be.true;
        });
      });

      it('requests the server if document is not stored locally', () => {
        return store
          .encrypt('foo', 'secret')
          .then((encrypted) => {
            fauxJax.on('request', (request) => {
              request.respond(
                200, { 'Content-Type': 'application/json' },
                JSON.stringify({
                  uuid: 123,
                  content: encrypted,
                  last_modified: Date.now()
                })
              );

              fauxJax.restore();
            });

            return store.load(123, 'secret').then((state) => {
              expect(eventEmitterSpy.calledTwice).to.be.true;
              expect(eventEmitterSpy.calledWith(Events.APP_IS_ONLINE)).to.be.true;
              expect(eventEmitterSpy.calledWith(Events.CHANGE)).to.be.true;

              expect(state).to.have.property('document');
              expect(state).to.have.property('secret');

              expect(localForageMock.items[123]).to.be.an('object');
            });
          });
      });
    });

    describe('with NO Internet connection', () => {
      it('emits an event because we are offline', () => {
        return store.load(123, 'secret').catch(() => {
          expect(eventEmitterSpy.calledOnce).to.be.true;
          expect(eventEmitterSpy.calledWith(Events.APP_IS_OFFLINE)).to.be.true;
        });
      });
    });
  });

  describe('encrypt', () => {
    it('returns a promise', () => {
      const promise = store.encrypt('foo', 'secret');

      expect(eventEmitterSpy.called).to.be.false;

      return expect(promise).to.be.fulfilled;
    });
  });

  describe('update', () => {
    it('should not modify the passed document that will be persisted', () => {
      const doc = new Document({ uuid: 'foo', content: 'bar' });

      store.update(doc);

      expect(doc).not.to.have.property('last_local_persist');

      expect(eventEmitterSpy.calledOnce).to.be.true;
      expect(eventEmitterSpy.calledWith(Events.CHANGE)).to.be.true;
    });

    it('should not persist a default document', () => {
      const initialState = store.state;
      const promise = store.update(new Document());

      return expect(promise).to.be.eventually.equal(initialState);
    });

    it('should not persist a default document except when it is not a new document', () => {
      const initialState = store.state;
      const promise = store.update(new Document({ last_modified: new Date() }));

      return promise.then((state) => {
        expect(state).not.to.be.equal(initialState);

        expect(eventEmitterSpy.calledOnce).to.be.true;
        expect(eventEmitterSpy.calledWith(Events.CHANGE)).to.be.true;
      });
    });

    describe('with NO Internet connection', () => {
      it('should not persist a default document except when it is not a new document', () => {
        const initialState = store.state;
        const promise = store.update(new Document({ last_modified_locally: new Date() }));

        return promise.then((state) => {
          expect(state).not.to.be.equal(initialState);

          expect(eventEmitterSpy.calledOnce).to.be.true;
          expect(eventEmitterSpy.calledWith(Events.CHANGE)).to.be.true;
        });
      });
    });
  });

  describe('sync', () => {
    it('should not sync if the document has default content', () => {
      const initialState = store.state;
      const promise      = store.sync();

      return expect(promise).to.be.eventually.equal(initialState);
    });

    describe('with Internet connection', () => {
      beforeEach(() => {
        fauxJax.install();
      });

      afterEach(() => {
        fauxJax.restore();
      });

      it('should directly push a new document', () => {
        fauxJax.on('request', (request) => {
          request.respond(
            201, { 'Content-Type': 'application/json' },
            JSON.stringify({
              last_modified: 'new date'
            })
          );
        });

        const doc = new Document({ uuid: 'foo', content: 'bar' });

        store.update(doc);
        eventEmitterSpy.reset();

        // test
        return store.sync().then((state) => {
          expect(eventEmitterSpy.calledTwice).to.be.true;
          expect(eventEmitterSpy.calledWith(Events.SYNCHRONIZE)).to.be.true;
          expect(eventEmitterSpy.calledWith(Events.APP_IS_ONLINE)).to.be.true;

          expect(state).to.have.property('document');
          expect(state).to.have.property('secret');
          expect(state.document.get('last_modified')).to.equal('new date');
        });
      });

      it('should not do anything when there are no (local or server) changes', () => {
        // it is important to set a date in the future to emulate the case
        // where the `last_modified` is "after" any local changes
        const date = Date.now() + 1000;

        fauxJax.on('request', (request) => {
          request.respond(
            200, { 'Content-Type': 'application/json' },
            JSON.stringify({
              last_modified: date
            })
          );
        });

        const doc = new Document({
          uuid: 'foo',
          content: 'bar',
          last_modified: date
        });

        store.update(doc);
        const storeStateBeforeSync = store.state;

        eventEmitterSpy.reset();

        // test
        return expect(store.sync()).to.eventually.equal(storeStateBeforeSync);
      });

      it([
        'should directly update the document when there are no server changes,',
        'but there are local changes'
      ].join(' '), () => {
        const responses = function* () {
          yield { status: 200, body: { last_modified: 1 } };
          yield { status: 200, body: { last_modified: 2 } };
        }();

        fauxJax.on('request', (request) => {
          const response = responses.next().value;

          request.respond(
            response.status,
            { 'Content-Type': 'application/json' },
            JSON.stringify(response.body)
          );
        });

        const doc = new Document({
          uuid: 'foo',
          content: 'bar',
          last_modified: 1
        });

        store.update(doc);
        eventEmitterSpy.reset();

        // test
        return store.sync().then((state) => {
          expect(eventEmitterSpy.calledThrice).to.be.true;
          expect(eventEmitterSpy.calledWith(Events.SYNCHRONIZE)).to.be.true;
          expect(eventEmitterSpy.calledWith(Events.APP_IS_ONLINE)).to.be.true; // 2 times

          expect(state).to.have.property('document');
          expect(state).to.have.property('secret');

          expect(state.document.get('last_modified')).to.equal(2);
        });
      });

      it('should get the latest version of the server when there is no local change', () => {
        const contentSentByServer = 'new content';

        return store
          // we need to encrypt the content that will be sent by the server
          .encrypt(contentSentByServer, 'secret')
          .then((encryptedContent) => {
            const responses = function* () {
              yield { status: 200, body: {
                uuid: 'foo',
                content: encryptedContent,
                last_modified: 2
              } };
              yield { status: 200, body: {
                uuid: 'foo',
                content: encryptedContent,
                last_modified: 2
              } };
            }();

            fauxJax.on('request', (request) => {
              const response = responses.next().value;

              request.respond(
                response.status,
                { 'Content-Type': 'application/json' },
                JSON.stringify(response.body)
              );
            });

            // force store state
            store.state = {
              document: new Document({
                uuid: 'foo',
                content: 'whatever, it is not used in this test',
                last_modified: 1
              }),
              secret: 'secret'
            };

            eventEmitterSpy.reset();

            // test
            return store.sync().then((state) => {
              expect(eventEmitterSpy.calledTwice).to.be.true;
              expect(eventEmitterSpy.calledWith(Events.APP_IS_ONLINE)).to.be.true;
              expect(eventEmitterSpy.calledWith(Events.UPDATE_WITHOUT_CONFLICT)).to.be.true;

              expect(state).to.have.property('document');
              expect(state).to.have.property('secret');

              expect(state.document.get('uuid')).to.equal('foo');
              expect(state.document.get('content')).to.equal(contentSentByServer);
              expect(state.document.get('last_modified')).to.equal(2);
              // should be resetted to avoid sync issues
              expect(state.document.get('last_modified_locally')).to.be.null;
            });
          });
      });

      it('should create a fork when there is a conflict', () => {
        const contentSentByServer = 'some content from the server';

        return store
          // we need to encrypt the content that will be sent by the server
          .encrypt(contentSentByServer, 'secret')
          .then((encryptedContent) => {
            const responses = function* () {
              yield { status: 200, body: {
                uuid: 'foo',
                content: encryptedContent,
                last_modified: 10
              } };
            }();

            fauxJax.on('request', (request) => {
              const response = responses.next().value;

              request.respond(
                response.status,
                { 'Content-Type': 'application/json' },
                JSON.stringify(response.body)
              );
            });

            // force store state
            store.state = {
              document: new Document({
                uuid: 'foo',
                content: 'Change ALL THE THINGS!',
                last_modified: 1,
                last_modified_locally: 16 // we made a lot of changes
              }),
              secret: 'secret'
            };

            expect(Object.keys(localForageMock.items)).to.have.length(0);

            // test
            return store.sync().then((state) => {
              expect(eventEmitterSpy.calledTwice).to.be.true;
              expect(eventEmitterSpy.calledWith(Events.APP_IS_ONLINE)).to.be.true;
              expect(eventEmitterSpy.calledWith(Events.CONFLICT)).to.be.true;

              const uuids = Object.keys(localForageMock.items);

              expect(uuids).to.have.length(2);
              expect(uuids).to.contain('foo'); // the current doc

              // fork
              const forkId = uuids[0];
              const fork = localForageMock.items[forkId];

              expect(fork.uuid).to.equal(forkId);
              expect(fork.last_modified).to.be.null;
              expect(fork.last_modified_locally).to.be.null;
              // cannot assert `content` since it is automatically encrypted
              // with a generated random secret, but we can look at the
              // CONFLICT event data (which is useful to ensure we pass
              // the clear content
              expect(state).to.have.property('fork');
              expect(state).to.have.property('document');
              expect(state).to.have.property('secret');

              // the fork
              expect(state.fork.document.get('uuid')).to.equal(forkId);
              expect(state.fork.document.get('content')).to.equal('Change ALL THE THINGS!');
              expect(state.fork.document.get('last_modified')).to.be.null;
              expect(state.fork.document.get('last_modified_locally')).to.be.null;

              // this is the up-to-date current document
              expect(state.document.get('uuid')).to.equal('foo');
              // below we return the encrypted content, but it should not be
              // encrypted. In the `Store` code, the `former` document has been
              // persisted and then directly returned, which is fine in this
              // case since we don't use the content anyway
              expect(state.document.get('content')).to.equal(encryptedContent);
              expect(state.document.get('last_modified')).to.equal(10); // from server
              // ensure we reset the local date
              expect(state.document.get('last_modified_locally')).to.be.null;

              // check internal Store state
              expect(store.state.document.get('uuid')).to.equal(fork.uuid);
              expect(store.state.document.get('last_modified')).to.be.null;
              expect(store.state.document.get('last_modified_locally')).to.be.null;
            });
          });
      });
    });

    describe('with NO Internet connection', () => {
      it('emits an event because we are offline', () => {
        const doc = new Document({
          uuid: 'foo',
          content: 'bar',
          last_modified: 1
        });

        store.update(doc);
        eventEmitterSpy.reset();

        // test
        return store.sync().catch(() => {
          expect(eventEmitterSpy.calledOnce).to.be.true;
          expect(eventEmitterSpy.calledWith(Events.APP_IS_OFFLINE)).to.be.true;
        });
      });
    });
  });
});
