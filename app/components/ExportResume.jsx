import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types';
import Print from '@material-ui/icons/Print';
import LinkIco from '@material-ui/icons/Link';
import TextFormat from '@material-ui/icons/TextFormat';

const { string, func } = PropTypes;

export default class ExportResume extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  exportWord() {

    const wordStyle = `
      h1 {
        color: #B31835;
      }
    `

    var filename = window.location.hash.replace('#/app/', '');
    var preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML To Doc</title><style>${wordStyle}</style></head><body>`;
    var postHtml = `</body></html>`;
    var html = `${preHtml} ${document.getElementsByClassName('rendered')[0].innerHTML} ${postHtml}`;

    var blob = new Blob(['\ufeff', html], {
      type: 'application/msword'
    });

    // Specify link url
    var url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);

    // Specify file name
    filename = filename ? filename + '.doc' : 'document.doc';

    // Create download link element
    var downloadLink = document.createElement("a");

    document.body.appendChild(downloadLink);

    if (navigator.msSaveOrOpenBlob) {
      navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      // Create a link to the file
      downloadLink.href = url;

      // Setting the file name
      downloadLink.download = filename;

      //triggering the function
      downloadLink.click();
    }

    document.body.removeChild(downloadLink);
  }

  copyToClipboard() {
    const el = document.createElement('textarea');
    el.value = window.location;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }

  render() {
    return (
      <div className="exportResume">
        <a className="hexagon link" onClick={this.copyToClipboard} title="Copy link">
          <LinkIco />
        </a>
        <a className="hexagon print" href="javascript:window.print()" title="Print">
          <Print />
        </a>
        <a className="hexagon word" onClick={this.exportWord} title="Export to Word">
          <TextFormat />
        </a>
      </div>
    );
  }
}

ExportResume.propTypes = {
};
