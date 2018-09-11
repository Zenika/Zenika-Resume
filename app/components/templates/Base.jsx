/* eslint no-throw-literal: 0 */
import {Component } from 'react';
import PropTypes from 'prop-types';
import merge from 'deepmerge';

const { array, object } = PropTypes;

/**
 * Base template
 */
export default class Base extends Component {

  getDefaultData() {
    // Required
    // Should return Object-serialized data
    throw 'Not implemented';
  }

  getData() {
    return merge(
      this.getDefaultData(),
      this.cleanData(this.props.data)
    );
  }

  cleanData(data) {
    const cleaned = Object.assign({}, data);
    // Clean input data to avoid undefined or null object properties
    // This avoids preview crash when trying to access null.<property>
    for (const p in data) {
      if (data.hasOwnProperty(p) && data[p] === null) {
        delete cleaned[p];
      }
    }

    return cleaned;
  }
}

Base.propTypes = {
  data: object.isRequired
};
