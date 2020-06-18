/* eslint no-param-reassign: 1, array-callback-return: 1 */
import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import PreviewLoader from './loaders/Preview';
import {Templates} from './TemplateForm';
import grayMatter from 'gray-matter';
import PreviewFlag from './PreviewFlag';

// import 'emojione/assets/sprites/emojione.sprites.css';

const {array, func, number, object, string} = PropTypes;

export default class Preview extends Component {
  constructor(props, context) {
    super(props, context);

    this.matter = {};
    this.requestAnimationId = false;
  }

  componentWillMount() {
    this.props.previewLoader().then((deps) => {
      this.markdownIt = deps.markdownIt('commonmark', {
        html: false,
        linkify: false,
        typographer: true,
        highlight: (str, lang) => {
          if (lang && deps.hljs.getLanguage(lang)) {
            try {
              return deps.hljs.highlightAuto(str).value;
            } catch (e) {
              // pass
            }
          }

          return ''; // use external default escaping
        },
        modifyToken: (token) => {
          switch (token.type) {
            case 'link_open':
              token.attrObj.rel = 'noreferrer noopener';
              break;

            default:
          }
        }
      })
        .enable('linkify');

      deps.markdownItPlugins.forEach((plugin) => {
        this.markdownIt.use(plugin);
      });

      // this.emojione = deps.emojione;
      // this.emojione.ascii = true;
      // this.emojione.sprites = true;

      this.forceUpdate();
    });
  }

  componentDidMount() {
    this.$rendered = ReactDOM.findDOMNode(this.refs.rendered);
  }

  componentWillReceiveProps(nextProps) {
    if (!this.$rendered) {
      return;
    }

    if (this.props.pos !== nextProps.pos || nextProps.pos === 1) {
      if (this.requestAnimationId) {
        window.cancelAnimationFrame(this.requestAnimationId);
        this.requestAnimationId = false;
      }

      this.requestAnimationId = window.requestAnimationFrame(() => {
        const previewHeight = this.$rendered.scrollHeight - this.$rendered.offsetHeight;
        const previewScroll = parseInt(previewHeight * this.props.pos, 10);

        this.$rendered.scrollTop = previewScroll;
      });
    }
  }

  shouldComponentUpdate(nextProps) {
    return this.props.raw !== nextProps.raw ||
      this.props.template !== nextProps.template ||
      this.props.metadata !== nextProps.metadata;
  }

  /**
   * A chunk is a logical group of tokens
   * We build chunks from token's level and nesting properties
   */
  getChunks(raw, env) {
    // Parse the whole markdown document and get tokens
    const tokens = this.markdownIt.parse(raw, env);
    const chunks = [];

    let start = 0;
    let stop = 0;

    for (let i = 0; i < tokens.length; i++) {
      if (
        // We are starting tokens walk or in a chunk
      i < start || !(
        // We are (NOT) closing a nested block
        (tokens[i].level === 0 && tokens[i].nesting === -1) ||
        // We are (NOT) in a root block
        (tokens[i].level === 0 && tokens[i].nesting === 0)
      )) {
        continue;
      }
      stop = i + 1;
      chunks.push(tokens.slice(start, stop));
      start = stop;
    }

    return chunks;
  }

  getThemeCssClass() {
    let cssClass = "preview";
    if(this.props.metadata.theme) {
      cssClass = `${cssClass} theme-${this.props.metadata.theme}` 
    }
    else {
      cssClass = `${cssClass} theme-default` 
    }

    return cssClass;
  }

  render() {
    let contentExp = [(
      <div className="preview-loader" key="preview-loader">
        <p>Loading all the rendering stuff...</p>
        <i className="fa fa-spinner fa-spin"></i>
      </div>
    )];
    let contentDescr = [];
    let data = {};
    let htmlData = {};

    if (this.markdownIt) {

      // Markdown document environment (links references, footnotes, etc.)
      const markdownItEnv = {};

      // Get front-matter vars
      this.matter = grayMatter(this.props.raw);
      data = this.matter.data;

      const buildChunck = (raw) =>
        this.getChunks(grayMatter(raw).content, markdownItEnv);

      htmlData.description = buildChunck(this.props.metadata.description);
      htmlData.column1 = buildChunck(this.props.metadata.column1);
      htmlData.column2 = buildChunck(this.props.metadata.column2);
      htmlData.column3 = buildChunck(this.props.metadata.column3);

      // Get chunks to render from tokens
      const chunks = this.getChunks(this.matter.content, markdownItEnv);

      contentExp = [];
      contentDescr = [];

      new PreviewFlag().generate(chunks, contentDescr, contentExp, markdownItEnv, htmlData, this.markdownIt);
    }
    let page = undefined;
    // Compile selected template with given data
    if (this.props.template && this.props.template.length) {
      // Get the template component
      const Template = Templates.find(
        (template) => {
          return template.id === this.props.template;
        }).component;

      page = (
        <Template contentExperience={contentExp}
                  contentDescription={contentDescr}
                  data={this.props.metadata}
                  htmlData={htmlData}/>
      );
    }

    return (
      <div className={this.getThemeCssClass()}>
        <div 
          ref={ref => this.rendered = ref}
          className="rendered">
          {page}
        </div>
      </div>
    );

  }
}

Preview.propTypes = {
  raw: string.isRequired,
  metadata: object.isRequired,
  template: string.isRequired,
  pos: number.isRequired,
  previewLoader: func.isRequired
};

Preview.defaultProps = {
  previewLoader: PreviewLoader
};
