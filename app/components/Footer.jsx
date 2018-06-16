import React, { PropTypes, Component } from 'react';
import Sync from './Sync';
const buildPath = require('../../build-path');

const { string, func } = PropTypes;

export default class Footer extends Component {
  constructor(props) {
    super(props);
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

  render() {
    let path = '';

    if (this.props.metadata) {
      path = buildPath(this.props.metadata.name);
    }

    return (
      <footer className="main">
        <div className="credits">
          Zenika Resume - Beta - Build by&nbsp;
          <a href="http://zenika.com/">Zenika</a>&nbsp;
          Powered by&nbsp;
          <a href="https://github.com/TailorDev/monod">Monod</a>
        </div>
        <a className="btn" onClick={this.showHelp}><i className="fa fa-question-circle-o" aria-hidden="true"></i> de
          l'aide</a>
        <Sync />
        <span className="viewLink">Lien en lecture : <a href={path}>{path}</a></span>
        <span className="viewLink"><a href="/list.html" target="_blank">Liste de tous les CV</a>&nbsp;&nbsp;</span>
        <span className="viewLink languageToggle">
          <input
            type="radio"
            onClick={(item) => this.props.toggleLocale(item)} 
            name="language"
            value="en-US"
            checked={this.isLocaleChecked('en-US')} /> EN
          <input
            type="radio"
            onClick={(item) => this.props.toggleLocale(item)}
            name="language"
            value="fr-FR"
            checked={this.isLocaleChecked('fr-FR')} /> FR
        </span>
      </footer>
    );
  }
}

Footer.propTypes = {
  version: string.isRequired,
  currentLocale: string.isRequired,
  toggleLocale: func.isRequired,
};
