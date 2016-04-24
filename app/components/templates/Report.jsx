/* eslint one-var: 0 */
import React from 'react';
import BaseTemplate from './Base';

/**
 * Report template
 */
export default class Report extends BaseTemplate {

  getDefaultData() {
    return {
      company: {
        name: '[company/name]',
        logo_url: '[company/logo_url]'
      },
      project: '[project]',
      reporter: '[reporter]',
      date: '[date]',
      location: '[location]',
      reference: '[reference]',
      version: '[version]'
    };
  }

  render() {
    const data = this.getData();
    const
      reportStyle = {},
      companyStyle = {
        margin: '2cm 0 3cm',
        textAlign: 'center'
      },
      metaStyle = {
        margin: '1cm 0 3cm',
        fontFamily: 'consolas, monospace',
        textAlign: 'left'
      },
      contentStyle = {
        fontFamily: '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif !important'
      },
      signatureStyle = {
        marginTop: '2cm',
        paddingTop: '0.3cm',
        borderTop: '1px solid #ccc',
        fontSize: '10pt',
        textAlign: 'right'
      };

    return (
      <article style={reportStyle}>
        <header>
          <div style={companyStyle}>
            <img src={data.company.logo_url} alt={`${data.company.name} logo`}/>
          </div>
          <h1>Activity report</h1>
          <table style={metaStyle}>
            <tbody>
            <tr>
              <th>Project</th>
              <td>{data.project}</td>
            </tr>
            <tr>
              <th>Reporter</th>
              <td>{data.reporter}</td>
            </tr>
            <tr>
              <th>Date</th>
              <td>{data.date}</td>
            </tr>
            <tr>
              <th>Location</th>
              <td>{data.location}</td>
            </tr>
            <tr>
              <th>Reference</th>
              <td>{data.reference}</td>
            </tr>
            <tr>
              <th>Version</th>
              <td>{data.version}</td>
            </tr>
            </tbody>
          </table>
        </header>
        <section style={contentStyle}>
          {this.props.content}
        </section>
        <footer style={signatureStyle}>
          <div>
            Reported on {data.date} by {data.reporter}
          </div>
        </footer>
      </article>
    );
  }
}
