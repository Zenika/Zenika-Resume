import React, { Component } from 'react';

export default class ResumeForm extends Component {

  constructor(props) {
    super(props);
    this.state = {
      metadata: props.metadata
    }
  }

  updateField(property) {
    return (event) => {
      const newState = JSON.parse(JSON.stringify(this.state));
      newState.metadata[property] = event.target.value;
      this.setState(newState);
      this.props.onChange(newState.metadata);
    }
  }

  render() {
    return (
      <div className="form">
        <div className="name-experience">
          <input type="text" placeholder="Nom"
            onChange={this.updateField('name')}
            value={this.state.metadata.name} />
          <input type="text" placeholder="Prénom"
            onChange={this.updateField('firstname')}
            value={this.state.metadata.firstname} />
          <input type="text" placeholder="Email"
            onChange={this.updateField('email')}
            value={this.state.metadata.email} />
          <input type="text" placeholder="Expérience"
            onChange={this.updateField('experience')}
            value={this.state.metadata.experience} />
        </div>
        <div className="description-area">
          <textarea placeholder="Description"
            onChange={this.updateField('description')}
            value={this.state.metadata.description} />
        </div>
        <div className="table">
          <textarea placeholder="1er colonne"
            onChange={this.updateField('column1')}
            value={this.state.metadata.column1} />
          <textarea placeholder="2eme colonne"
            onChange={this.updateField('column2')}
            value={this.state.metadata.column2} />
          <textarea placeholder="3eme colonne"
            onChange={this.updateField('column3')}
            value={this.state.metadata.column3} />
        </div>
      </div>
    );
  }
}