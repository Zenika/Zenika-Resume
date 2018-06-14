import React, {PropTypes, Component} from 'react';
import { FormattedMessage } from 'react-intl';
import Sync from './Sync';
const buildPath = require('../../build-path');

const {string} = PropTypes;

export default class Footer extends Component {
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
          <FormattedMessage id="ln" />
        </span>
      </footer>
    );
  }
}

Footer.propTypes = {
  version: string.isRequired
};
