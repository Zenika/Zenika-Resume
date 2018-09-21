import Immutable from 'immutable';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  addLocaleData,
  IntlProvider,
  FormattedMessage,
} from 'react-intl';
import en from 'react-intl/locale-data/en';
import fr from 'react-intl/locale-data/fr';
import { Events } from '../Store';
import Document from '../Document';
import Translations from '../Translations';
import debounce from 'lodash.debounce';

import Editor from './Editor';
import ExportResume from './ExportResume';
import Footer from './Footer';
import MessageBoxes from './MessageBox';

const { object, string } = PropTypes;
addLocaleData([...en, ...fr]);

class App extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      document: new Document(),
      messages: new Immutable.List(),
      userPref: {
        locale: navigator.language === 'fr-FR' ? navigator.language : 'en-US'
      },
      loaded: false,
    };
    this.toggleLocale = this.toggleLocale.bind(this);
    this.changeTheme = this.changeTheme.bind(this);
    this.updateContent = debounce(this.updateContent, 150);
    this.updateMetadata = debounce(this.updateMetadata, 150);
  }

  getChildContext() {
    // Pass the controller to child components.
    return {
      controller: this.props.controller
    };
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
      };

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
          <a href={`/${state.document.uuid}`}>here</a>.
          </span>
        ),
        type: 'warning'
      };

      this.loadAndRedirect(
        state.fork.document,
        `/#/app/${state.fork.document.uuid}`,
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
        messages: this.state.messages.push(message)
      });
    });

    this.props.controller.on(Events.AUTHENTICATION_REQUIRED, (state) => {
      document.location.href = '/login/google?uuid=' + window.location.pathname.slice(1);
    });

    this.props.controller.on(`${Events.SYNCHRONIZE}, ${Events.CHANGE}`, (state) => {
      this.loadAndRedirect(
        state.document,
        `/#/app/${state.document.uuid}`
      );
    });

    this.props.controller.dispatch('action:init', {
      id: window.location.hash.slice(6),
      secret: ''
    });
  }

  loadAndRedirect(doc, uri, message) {
    if (message) {
      this.state.messages.push(message);
    }

    this.setState({
      loaded: true,
      document: doc,
      messages: this.state.messages
    });

    if (!window.history.state || !window.history.state.uuid ||
      (window.history.state && window.history.state.uuid &&
        doc.get('uuid') !== window.history.state.uuid)
    ) {
      if (uri.indexOf('undefined') == -1) {
        window.history.pushState({ uuid: doc.get('uuid') }, `Zenika Resume - ${doc.get('uuid')}`, uri);
      }
    }
  }

  updateContent(newContent) {
    const doc = this.state.document;
    if (doc.content !== newContent) {
      this.updateDocument(doc.metadata, newContent);
    }
  }

  updateMetadata(newMetadata) {
    const doc = this.state.document;
    if (JSON.stringify(doc.metadata) !== JSON.stringify(newMetadata)) {
      this.updateDocument(newMetadata, doc.content);
    }
  }

  updateDocument(metadata, content) {
    const doc = this.state.document;
    const newDoc = new Document({
      uuid: doc.get('uuid'),
      content,
      metadata,
      path: doc.get('path'),
      last_modified: doc.get('last_modified'),
      last_modified_locally: doc.get('last_modified_locally'),
    });
    this.props.controller.dispatch('action:update', newDoc);
  }

  removeMessage(index) {
    this.setState({
      messages: this.state.messages.delete(index)
    });
  }

  toggleLocale(e) {
    this.setState({
      userPref: Object.assign({}, this.state.userPref, { locale: e.target.value })
    });
  }

  changeTheme(theme) {
    this.updateMetadata(Object.assign({}, this.state.document.metadata, { theme: theme.name }))
  }

  render() {
    let viewMode = '';
    const locale = this.state.userPref.locale;
    const messages = Translations[locale];

    if (!this.state.document.uuid) {
      viewMode = 'viewMode';
    }

    let style = {
      display: 'none'
    };

    if (this.state.loaded) {
      style = {};
    }

    return (
      <IntlProvider
        locale={locale}
        messages={messages}
      >
        <div className={`layout ${viewMode}`} style={style}>
          <MessageBoxes
            messages={this.state.messages}
            closeMessageBox={this.removeMessage.bind(this)}
          />
          <Editor
            loaded={this.state.loaded}
            content={this.state.document.get('content')}
            metadata={this.state.document.get('metadata')}
            onContentUpdate={this.updateContent.bind(this)}
            onMetadataUpdate={this.updateMetadata.bind(this)}
          />
          <div>
          </div>
          <ExportResume />
          <Footer
            version={this.props.version}
            metadata={this.state.document.get('metadata')}
            path={this.state.document.get('path')}
            toggleLocale={this.toggleLocale}
            changeTheme={this.changeTheme}
            currentLocale={locale}
          />
        </div>
      </IntlProvider>
    );
  }
}

App.propTypes = {
  version: string.isRequired,
  controller: object.isRequired,
};

App.childContextTypes = {
  controller: object
};

export default App;

