import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Letter from './templates/Letter';
import Invoice from './templates/Invoice';
import Report from './templates/Report';
import Resume from './templates/Resume';

const { func } = PropTypes;


export const Templates = [
  { id: 'resume', name: 'Resume', component: Resume },
  { id: '', name: 'No template', component: {} }
];

export default class TemplateForm extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      template: 'resume'
    };
  }

  handleTemplateChange(event) {
    const newTemplate = event.target.value;
    this.setState({ template: newTemplate });
    this.props.doUpdateTemplate(newTemplate);
  }

  render() {
    const optionNodes = Templates.map((component, key) => {
      return (
        <option value={component.id} key={key}>{component.name}</option>
      );
    });

    return (
      <form id="templateForm">
        <select name="template" onChange={this.handleTemplateChange.bind(this)}>
          {optionNodes}
        </select>
      </form>
    );
  }
}

TemplateForm.propTypes = {
  doUpdateTemplate: func.isRequired
};
