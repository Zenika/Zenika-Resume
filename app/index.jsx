import './scss/main.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Redirect, HashRouter } from 'react-router-dom';
import { EventEmitter } from 'events';
import localforage from 'localforage';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';

import Store from './Store';
import Controller from './Controller';

import Header from './components/Header';
import App from './components/App.jsx';
import Home from './components/Home.jsx';
import List from './components/List.jsx';
import Bye from './components/Bye.jsx';
import Help from './components/Help.jsx';
import Page404 from './components/404.jsx';
import auth from './auth';

const appElement = document.getElementById('app');
const appVersion = appElement.getAttribute('data-app-version');
const apiEndpoint = appElement.getAttribute('data-api-endpoint');

const events = new EventEmitter();
const store = new Store('documents', events, apiEndpoint, localforage);
const controller = new Controller({ store }, events);

require('offline-plugin/runtime').install();

if ((window.location.href + '').indexOf('?help') != -1) {
  history.replaceState(null, 'zenika-resume', (window.location.href + '').split('?help')[0]);
}

const theme = createMuiTheme({
  palette: {
    primary: { main: '#383D43' },
    secondary: { main: '#B31835' },
  },
});

auth.handleAuthentication().then(authResult => {
  if (authResult) {
    window.location.hash = '';
    ReactDOM.render(
      <HashRouter>
        <MuiThemeProvider theme={theme}>
          <Header />
          <Route path="/app" component={() => <App key={Date.now()} version={appVersion} controller={controller} />} />
          <Route path="/list" component={List} />
          <Route path="/help" component={Help} />
          <Route exact path="/" component={Home} />
          <Route exact path="/404" component={Page404} />
          <Route exact path="/bye" component={Bye} />
        </MuiThemeProvider>
      </HashRouter>,
      appElement
    );
  } else {
    auth.login();
  }
}).catch(err => {
  // eslint-disable-next-line no-console
  console.error(err);
  // eslint-disable-next-line no-alert
  alert([
    'An authentication error occured. Click OK to retry.',
    'If this keeps happening, contact dreamlab@zenika.com.',
    'Give them the following message:',
    JSON.stringify(err)
  ].join(' '));
  auth.login();
});
