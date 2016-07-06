import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
import MarkdownLoader from './loaders/Markdown';
import CodeMirror from './codemirror';
import {Events} from '../Store';
import ResumeFrom from './templates/ResumeForm';

import 'codemirror/lib/codemirror.css';

const {func, string, object} = PropTypes;

export default class Markdown extends Component {

  componentWillMount() {
    MarkdownLoader().then(() => {
      const defaultValue = this.props.raw || '';
      const textareaNode = this.refs.markdownTextarea;
      const options = {
        autofocus: true,
        lineNumbers: true,
        lineWrapping: true,
        mode: 'gfm',
        scrollbarStyle: null,
        theme: 'monod'
      };

      // CodeMirror main instance
      this.codeMirror = CodeMirror.fromTextArea(textareaNode, options);

      // Bind CodeMirror events
      this.codeMirror.on('change', this.handleOnChange.bind(this));
      this.codeMirror.on('scroll', this.handleScroll.bind(this));

      // Set default value
      this.codeMirror.setValue(defaultValue);

      ReactDOM.render(<ResumeFrom
        ref={(form) => this.form = form}
        metadata={this.props.metadata}
        onChange={this.props.onChangeMetadata}/>, document.getElementsByClassName('CodeMirror-form')[0]);
    });
  }

  componentWillReceiveProps(nextProps) {
    //console.log('componentWillReceiveProps', nextProps.metadata);
    if (JSON.stringify(nextProps.metadata) !== JSON.stringify(this.props.metadata)) {
      this.form.setState({metadata: nextProps.metadata});
    }
  }

  componentDidMount() {
    this.context.controller.on(Events.UPDATE_WITHOUT_CONFLICT, (state) => {
      // force content update
      this.getCodeMirror().setValue(state.document.content);
    });

    this.context.controller.on(Events.CONFLICT, (state) => {
      // force content update
      this.getCodeMirror().setValue(state.fork.document.content);
    });
  }

  /*
   shouldComponentUpdate() {
   return false;
   }*/

  getCodeMirror() {
    return this.codeMirror;
  }

  handleOnChange() {
    const newValue = this.getCodeMirror().getDoc().getValue();

    // Update the value -> rendering
    this.props.onChangeContent(newValue);

    // Update scrolling position (ensure rendering is visible)
    this.handleScroll();
  }

  handleScroll() {
    const {top, height, clientHeight} = this.getCodeMirror().getScrollInfo();
    this.props.doUpdatePosition(top / (height - clientHeight));
  }

  render() {
    return (
      <div className="markdown">
        <textarea
          ref="markdownTextarea"
          placeholder="Type your *markdown* content here"
          onChange={this.props.onChangeContent}
          value={this.props.raw}
          autoComplete="off"
        />
      </div>
    );
  }
}

Markdown.propTypes = {
  raw: string.isRequired,
  metadata: object.isRequired,
  onChangeContent: func.isRequired,
  onChangeMetadata: func.isRequired,
  doUpdatePosition: func.isRequired
};

Markdown.contextTypes = {
  controller: PropTypes.object.isRequired
};
