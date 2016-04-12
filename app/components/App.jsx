import React, { Component, PropTypes } from 'react';
import { Events } from '../Store';
import Document from '../Document';
import debounce from 'lodash.debounce';

import Header from './Header';
import Editor from './Editor';
import Footer from './Footer';
import MessageBoxes from './MessageBox';

const { string } = PropTypes;


export default class App extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      document: new Document(),
      messages: [],
      loaded: false
    };

    this.updateContent = debounce(this.updateContent, 150);
  }

  getChildContext() {
    // Pass the controller to child components.
    return {
      controller: this.props.controller
    };
  }

  loadAndRedirect(document, uri, message) {
    this.setState({
      loaded: true,
      document: document,
      messages: this.state.messages.concat(message) || []
    });

    if (!window.history.state || !window.history.state.uuid ||
      (window.history.state && window.history.state.uuid &&
       document.get('uuid') !== window.history.state.uuid)) {
      window.history.pushState({ uuid: document.get('uuid') }, `Monod - ${document.get('uuid')}`, uri);
    }
  }

  componentDidMount() {
    this.props.controller.on(Events.NO_DOCUMENT_ID, (state) => {
      this.setState({
        loaded: true,
        document: state.document
      });
    });

    this.props.controller.on(Events.DECRYPTION_FAILED, (state) => {
      const message = {
        content: [
          'We were unable to decrypt the document. Either the secret has not',
          'been supplied or it is invalid.',
          'We have redirected you to a new document.'
        ].join(' '),
        type: 'error'
      }

      this.loadAndRedirect(state.document, '/', message);
    });

    this.props.controller.on(Events.DOCUMENT_NOT_FOUND, (state) => {
      const message = {
        content: [
          'We could not find the document you were trying to load, so we have',
          'redirected you to a new document.'
        ].join(' '),
        type: 'error'
      };

      this.loadAndRedirect(state.document, '/', message);
    });

    this.props.controller.on(Events.CONFLICT, (state) => {
      const message = {
        content: (
          <span>
            <i>Snap!</i>&nbsp;
            The document you were working on has been updated by a third,
            and you are now working on a fork. You can still find the original
            (and updated) document:&nbsp;
            <a href={'/' + state.document.uuid + '#' + state.secret}>here</a>.
          </span>
        ),
        type: 'warning'
      };

      this.loadAndRedirect(
        state.fork.document,
        `/${state.fork.document.uuid}#${state.fork.secret}`,
        message
      );
    });

    this.props.controller.on(Events.UPDATE_WITHOUT_CONFLICT, (state) => {
      const message = {
        content: [
          'We have updated the document you are viewing to its latest revision.',
          'Happy reading/working!'
        ].join(' '),
        type: 'info'
      };

      this.setState({
        document: state.document,
        messages: this.state.messages.concat(message)
      });
    });

    this.props.controller.on(`${Events.SYNCHRONIZE}, ${Events.CHANGE}`, (state) => {
      this.loadAndRedirect(
        state.document,
        `/${state.document.uuid}#${state.secret}`
      );
    });

    this.props.controller.dispatch('action:init', {
      id: window.location.pathname.slice(1),
      secret: window.location.hash.slice(1)
    });
  }

  updateContent(newContent) {
    const doc = this.state.document;

    if (doc.content !== newContent) {
      this.props.controller.dispatch('action:update', new Document({
        uuid: doc.get('uuid'),
        content: newContent,
        last_modified: doc.get('last_modified')
      }));
    }
  }

  render() {
    return (
      <div className="layout">
        <Header />
        <MessageBoxes messages={this.state.messages || []} />
        <Editor
          loaded={this.state.loaded}
          content={this.state.document.get('content')}
          onContentUpdate={this.updateContent.bind(this)}
        />
        <Footer version={this.props.version} />
      </div>
    );
  }
}

App.propTypes = {
  version: string.isRequired
};

App.childContextTypes = {
  controller: PropTypes.object
};
