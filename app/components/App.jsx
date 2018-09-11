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
        `/${state.fork.document.uuid}`,
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
        `/${state.document.uuid}`
      );
    });

    this.props.controller.dispatch('action:init', {
      id: window.location.pathname.slice(1),
      secret: window.location.hash.slice(1)
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
        window.history.pushState({ uuid: doc.get('uuid') }, `Monod - ${doc.get('uuid')}`, uri);
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

  hideHelp() {
    let modal = document.getElementById('help-modal');

    if (modal.style.display == 'block') {
      history.back();
      modal.style.display = 'none';
    }
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
          <div className="reveal" id="help-modal" data-reveal>
            <h1><FormattedMessage id="phew" /></h1>

            <iframe
              width="640"
              height="360"
              src="https://www.youtube.com/embed/p_t7716ymoI"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>

            <p className="dummyTest">
            </p>
            <p className="lead"><FormattedMessage id="print" /></p>
            <p>
              <FormattedMessage id="the" /><br />
              <FormattedMessage id="between" /><br />
              <br />
              <FormattedMessage id="in" /><br />
              <FormattedMessage id="the2" /><br />
              <FormattedMessage id="then" /><br />
              <FormattedMessage id="for" />
            </p>
            <p className="lead"><FormattedMessage id="describe" /></p>
            <p>
              <FormattedMessage id="experience" /><br />
              <FormattedMessage id="styles" /><br />
              --section-start<br />
              --section-end<br />
              <br />
              <FormattedMessage id="between2" /><br />
              <FormattedMessage id="your" /><br />
              <br />
              <FormattedMessage id="the3" /><br />
              <FormattedMessage id="the4" /><br />
              <br />
              <FormattedMessage id="the5" /><br />
              <FormattedMessage id="the6" /><br />
              <br />
              <FormattedMessage id="to" /><br />
              <FormattedMessage id="two" /><br />
              <FormattedMessage id="the7" /><br />
              &nbsp; &nbsp; <FormattedMessage id="a" /><br />
              &nbsp; &nbsp; <FormattedMessage id="then2" /><br />
              <br />
            </p>

            <p className="lead"><FormattedMessage id="variable" /></p>
            <p>
              <FormattedMessage id="at" /><br />
              <FormattedMessage id="section" /><br />
              <FormattedMessage id="role" /><br />
              <FormattedMessage id="the8" /><br />
              <FormattedMessage id="for2" /><br />
              <FormattedMessage id="you" /><br /><br />
            </p>

            <p className="lead"><FormattedMessage id="using" /></p>
            <p>
              <FormattedMessage id="there" /><br />
              <FormattedMessage id="it" /><br />
              --expertise-archive.<br />
              <br />
              <FormattedMessage id="here" /><br />
              --expertise-archive<br />
              --expertise-cloud<br />
              --expertise-file<br />
              --expertise-flag<br />
              --expertise-leaf<br />
              --expertise-talk<br /><br />
            </p>

            <p className="lead"><FormattedMessage id="jump" /></p>
            <p>
              <FormattedMessage id="this" /><br />
              <FormattedMessage id="what" /><br />
              --break-page<br />
            </p>

            <p className="lead"><FormattedMessage id="tip" /></p>
            <p>
              <FormattedMessage id="in2" /> <br />
              <FormattedMessage id="example" /><br />
            </p>

            <button className="close-button" data-close aria-label="Close modal" type="button" onClick={this.hideHelp}>
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
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

