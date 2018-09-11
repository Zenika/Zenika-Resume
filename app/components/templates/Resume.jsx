/* eslint one-var: 0 */
import React from 'react';
import BaseTemplate from './Base';

import './resume/style.scss';
import './resume/theme-light.scss';

/**
 * Invoice template
 */
export default class Resume extends BaseTemplate {

  getDefaultData() {
    return {};
  }

  transformToIconIfRequired(data) {
    if (data.indexOf('--expertise-') == 0) {
      const className = 'expertise-icon ' + data.split('--expertise-')[1];
      return (
        <span className={className}></span>
      );
    }
    return data;
  }

  pushDataIfDefined(array, data) {
    if (data && data.indexOf('[') == -1) {
      data = this.transformToIconIfRequired(data);
      array.push(data);
      return true;
    }
    return false;
  }

  extractArray(data, propertyName) {
    const array = [];

    let i = 1;
    while (1) {
      if (!this.pushDataIfDefined(array, data[propertyName][i])) {
        break;
      }
      i++;
    }
    return array;
  }

  createList(data, propertyName) {
    if (!data[propertyName]) {
      return undefined;
    }

    let list = this.extractArray(data, propertyName)
      .map(s => (<li>{s}</li>));

    if (list.length == 0) {
      return undefined;
    }

    return (<ul>{list}</ul>);
  }

  createTitledList(data, propertyName) {
    if (!data[propertyName] || !data[propertyName].title || data[propertyName].title.indexOf('[') != -1) {
      return undefined;
    }

    let list = this.createList(data, propertyName);
    let title = data[propertyName].title;

    return (
      <ul>
        <li>
          {title}
        </li>
        <li>
          {list}
        </li>
      </ul>
    );
  }

  buildDescription(data) {
    const description = [];

    var center = undefined;

    if (data.description != '') {
      center = (
        <div className="center">
          {data.description}
        </div>
      );
    }

    return (
      <div className="description">
        {center}
        {this.buildTable(data)}
      </div>
    );
  }

  buildTable(data) {
    var table = undefined;

    if (data.column1 != '' || data.column2 != '' || data.column3 != '') {
      table = (
        <div className="table">
          <div className="premiereColonne">
            {data.column1}
          </div>
          <div className="colonne">
            {data.column2}
          </div>
          <div className="colonne">
            {data.column3}
          </div>
        </div>
      );
    }

    return table;
  }

  render() {
    const data = this.getData();

    const expertises = this.createList(data, 'expertises');

    if (this.props.data.theme == "light") {
      return (
        <div>

          <div className="topbar"></div>

          <div className="header">
            <div className="logo"></div>
            <div className="presentation">
              <div className="firstname">{data.firstname}</div>
              <div className="lastname">{data.name}</div>
              <div className="description">{data.description}</div>
            </div>
            <div className="experience">{data.experience}</div>
          </div>

          <div className="email">{data.email}</div>

          <div className="bande">
            {this.buildTable(this.props.htmlData)}
          </div>

          <div className="content">
            {this.props.contentExperience}
          </div>
        </div>
      )
    }

    return (
      <div>
        <div className="logo"></div>
        <div className="header1"></div>
        <div className="presentation">
          <span className="name">{data.name} {data.firstname} </span>
          <span className="experience">{data.experience}</span>
        </div>
        <div className="header2"></div>
        {this.buildDescription(this.props.htmlData)}
        <div className="header3"></div>
        <div className="expertise">
          <span className="title">Expertise</span>
          {this.props.contentDescription}
        </div>
        <div className="content">
          {this.props.contentExperience}
        </div>
      </div>
    );
  }
}
