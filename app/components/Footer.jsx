import React, {PropTypes, Component} from 'react';

const {string} = PropTypes;

export default class Footer extends Component {
  showHelp(){
    let modal = document.getElementById('help-modal');
    if(!modal){
      return;
    }

    if(modal.style.display == 'block'){
      modal.style.display = 'none';
    }else{
      modal.style.display = 'block';
    }
  }

  render() {
    return (
      <footer className="main">
        <div className="credits">
          Zenika Resume - Beta - Build by&nbsp;
          <a href="http://zenika.com/">Zenika</a>&nbsp;
          Powered by&nbsp;
          <a href="https://github.com/TailorDev/monod">Monod</a>&nbsp;
          from the good folks at <a href="https://tailordev.fr" title="Read more about us" target="_blank">TailorDev</a>,
          2016.
        </div>
        <a className="btn" onClick={this.showHelp}><i className="fa fa-question-circle-o" aria-hidden="true"></i> de l'aide</a>
      </footer>
    );
  }
}

Footer.propTypes = {
  version: string.isRequired
};
