import './scss/main.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import { addLocaleData, IntlProvider } from 'react-intl';
import en from 'react-intl/locale-data/en';
import fr from 'react-intl/locale-data/fr';
import App from './components/App.jsx';

import { EventEmitter } from 'events';
import localforage from 'localforage';
import Store from './Store';
import Controller from './Controller';

import Translations from './Translations';

const appElement = document.getElementById('app');
const appVersion = appElement.getAttribute('data-app-version');
const apiEndpoint = appElement.getAttribute('data-api-endpoint');

const events = new EventEmitter();
const store = new Store('documents', events, apiEndpoint, localforage);
const controller = new Controller({ store }, events);

addLocaleData([...en, ...fr]);

let locale = 
  (navigator.languages && navigator.languages[0])
  || navigator.language
  || navigator.userLanguage
  || 'en';

require('offline-plugin/runtime').install();

if((window.location.href + '').indexOf('?help') != -1){
  history.replaceState(null, 'zenika-resume', (window.location.href + '').split('?help')[0]);
}

ReactDOM.render(
  <IntlProvider locale={locale} messages={Translations[locale] || Translations.en}>
    <App version={appVersion} controller={controller} />
  </IntlProvider>,
  appElement
);
