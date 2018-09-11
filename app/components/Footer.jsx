import React, { Component } from 'react';
import Sync from './Sync';
import { Config } from './../Config';
import PropTypes from 'prop-types';
import {
  FormattedMessage,
} from 'react-intl';
const buildPath = require('../../build-path');


const { string, func } = PropTypes;

export default class Footer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isThemesBarOpen: false,
    };
    this.themes = Config.THEMES;
    this.toggleIsThemesBarOpen = this.toggleIsThemesBarOpen.bind(this);
    this.isLocaleChecked = this.isLocaleChecked.bind(this);
  }

  isLocaleChecked(value) {
    return value === this.props.currentLocale;
  }

  showHelp() {
    let modal = document.getElementById('help-modal');
    if (!modal) {
      return;
    }

    if (modal.style.display == 'block') {
      history.back();
      modal.style.display = 'none';
    } else {
      history.pushState(null, 'zenika-resume aide', window.location.href + "?help");
      modal.style.display = 'block';
      window.onhashchange = function () {
        modal.style.display = 'none';
      }
    }
  }

  toggleIsThemesBarOpen() {
    console.log()
    this.setState({
      isThemesBarOpen: !this.state.isThemesBarOpen,
    });
  }

  getPath() {
    let path = '';
    if (this.props.path) {
      path = this.props.path;
    }
    else if (this.props.metadata) {
      if(this.props.metadata.firstname){
        path = buildPath(`${this.props.metadata.name} ${this.props.metadata.firstname}`);
      }else {
        path = buildPath(this.props.metadata.name);
      }
    }
    return path;
  }

  render() {
    return (
      <footer className="main">
        <div className="credits">
          Zenika Resume - Beta - Build by&nbsp;
          <a href="http://zenika.com/">Zenika</a>&nbsp;
          Powered by&nbsp;
          <a href="https://github.com/TailorDev/monod">Monod</a>
        </div>
        <a className="btn" onClick={this.showHelp}><i className="fa fa-question-circle-o" aria-hidden="true"></i><FormattedMessage id="help" /></a>
        <Sync />
        <span className="viewLink"><FormattedMessage id="read" /><a href={this.getPath()}>{this.getPath()}</a></span>
        <span className="viewLink"><a href="/list.html" target="_blank"><FormattedMessage id="list" /></a>&nbsp;&nbsp;</span>
        <span className="viewLink languageToggle">
          <span> Langues :</span>
          <input
            type="radio"
            id="locale-enUS"
            onChange={(item) => this.props.toggleLocale(item)}
            name="language"
            value="en-US"
            checked={this.isLocaleChecked('en-US')}
          />
          <label htmlFor="locale-enUS">EN</label>
          <input
            type="radio"
            id="locale-frFR"
            onChange={(item) => this.props.toggleLocale(item)}
            name="language"
            value="fr-FR"
            checked={this.isLocaleChecked('fr-FR')}
          />
          <label htmlFor="locale-frFR">FR</label>
        </span>
        <span className="viewLink">
          <button
            className="showThemesBtn"
            onClick={this.toggleIsThemesBarOpen}
          >Themes</button>
        </span>
        <div className={`themes ${this.state.isThemesBarOpen ? 'open' : ''}`} >
          <h3>Themes</h3>
          <ul>
            {this.themes.map((theme) => {
              return (
                <li key={theme.name} className="theme-item">
                  <button onClick={() => this.props.changeTheme(theme)}>
                    <img src={require(`../static/img/theme-${theme.name}.png`)} alt="default" />
                    <span>{theme.name} <i className="fa fa-info"></i></span>
                  </button>
                </li>
              )
            })}
          </ul>
          <button className="close" title="Close themes list" onClick={this.toggleIsThemesBarOpen}>
            <i className="fa fa-times"></i>
          </button>
        </div>
      </footer>
    );
  }
}

Footer.propTypes = {
  version: string.isRequired,
  currentLocale: string.isRequired,
  toggleLocale: func.isRequired,
};
