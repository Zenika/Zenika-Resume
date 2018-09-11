import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Loader from 'react-loader';

import Markdown from './Markdown';
import Preview from './Preview';
import VerticalHandler from './VerticalHandler';

const { bool, func, string, object } = PropTypes;

export const EditorModes = {
  FOCUS: 'focus',
  PREVIEW: 'edit-preview',
  READING: 'reading'
};

export default class Editor extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      template: 'resume',
      pos: 0,
      mode: localStorage.getItem('LastEditorModesSet') || EditorModes.PREVIEW
    };
  }

  updatePosition(newPos) {
    this.setState((previousState) => {
      return {
        template: previousState.template,
        pos: newPos,
        loaded: previousState.loaded,
        mode: previousState.mode
      };
    });
  }

  updateMode(newMode) {
    this.setState((previousState) => {
      return {
        template: previousState.template,
        pos: previousState.pos,
        loaded: previousState.loaded,
        mode: newMode
      };
    });
  }

  updateTemplate(newTemplate) {
    this.setState((previousState) => {
      return {
        template: newTemplate,
        pos: previousState.pos,
        loaded: previousState.loaded,
        mode: previousState.mode
      };
    });
  }

  handleOnClick(e) {
    // class names 'fa fa-chevron-left' and 'left' should match
    const hasClickedLeft = /left/.test(e.target.className);
    let newMode = EditorModes.PREVIEW;

    if (hasClickedLeft && this.state.mode !== EditorModes.FOCUS) {
      newMode = EditorModes.READING;
    }

    if (!hasClickedLeft && this.state.mode !== EditorModes.READING) {
      newMode = EditorModes.FOCUS;
    }

    localStorage.setItem('LastEditorModesSet', newMode);

    this.updateMode(newMode);
  }

  render() {
    return (
      <Loader
        loaded={this.props.loaded}
        loadedClassName={`editor ${this.state.mode}`}
      >
        <Markdown
          raw={this.props.content}
          metadata={this.props.metadata}
          onChangeContent={this.props.onContentUpdate}
          onChangeMetadata={this.props.onMetadataUpdate}
          doUpdatePosition={this.updatePosition.bind(this)}
        />
        <VerticalHandler
          onClickLeft={this.handleOnClick.bind(this)}
          onClickRight={this.handleOnClick.bind(this)}
        />
        <Preview
          raw={this.props.content}
          metadata={this.props.metadata}
          pos={this.state.pos}
          template={this.state.template}
        />
      </Loader>
    );
  }
}

Editor.propTypes = {
  loaded: bool.isRequired,
  metadata: object.isRequired,
  content: string.isRequired,
  onContentUpdate: func.isRequired,
  onMetadataUpdate: func.isRequired
};

Editor.contextTypes = {
  controller: PropTypes.object.isRequired
};
