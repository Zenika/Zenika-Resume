import React, {Component} from 'react';
import PropTypes from 'prop-types';
import isEqual from 'lodash.isequal';

const {array, func, number, object, string} = PropTypes;

class PreviewChunk extends Component {

  shouldComponentUpdate(nextProps) {
    // It looks like `attrs` is modified by hljs on `render()`, which
    // makes the chunk to be re-rendered all the time. The problem is
    // that it impacts performance negatively since hljs is costly.
    this.props.chunk.map((chunk) => {
      if ('fence' === chunk.type) {
        chunk.attrs = null;
      }
    });

    return !isEqual(this.props.chunk, nextProps.chunk) || this.props.id !== nextProps.id;
  }

  getHTML() {
    let html;

    html = this.props.markdownIt.renderer.render(
      this.props.chunk,
      this.props.markdownIt.options,
      this.props.markdownItEnv
    );
    html = this.props.emojione.toImage(html);

    return {
      __html: html
    };
  }

  render() {
    return (
      <div className='chunk'>
        <span dangerouslySetInnerHTML={this.getHTML()}/>
      </div>
    );
  }
}

PreviewChunk.propTypes = {
  key: string,
  markdownIt: object.isRequired,
  emojione: object.isRequired,
  chunk: array.isRequired,
  markdownItEnv: object.isRequired
};

export default class PreviewFlag {

  transformToIconIfRequired(data) {
    if (data.indexOf('--expertise-') == 0) {
      const className = 'expertise-icon ' + data.split('--expertise-')[1];
      return (
        <span className={className}></span>
      );
    }
    return data;
  }

  generateHeader(chunks, i, contentDescr, contentExp, markdownItEnv, markdownIt, emojione) {
    let description = [];
    let chunk = chunks[++i];

    while (chunk && !this.hasRule(chunk, '--expertise-end')) {
      if (this.hasRule(chunk, '--expertise-')) {
        description.push(this.transformToIconIfRequired(chunk.map((c)=>c.content).join('')));
      } else {
        description.push(this.buildPreview(i, chunk, markdownItEnv));
      }
      chunk = chunks[++i];
    }

    contentDescr.push(
      (
        <ul>
          {description.map((d)=>(<li>{d}</li>))}
        </ul>
      )
    );

    return i;
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  generateSection(chunks, i, isFirstPage, contentDescr, contentExp, markdownItEnv, markdownIt, emojione) {
    let experiences = [];
    let chunk = chunks[++i];

    while (chunk && !this.hasRule(chunk, '--section-end')) {
      let preview = this.buildPreview(i, chunk, markdownItEnv);
      experiences.push(preview);

      chunk = chunks[++i];
    }
    let className = "experience";
    if (isFirstPage) {
      className += " first-page";
    } else {
      let background = this.getRandomInt(1, 4);
      while (this.lastBackground == background) {
        background = this.getRandomInt(1, 4);
      }
      this.lastBackground = background;
      className += " background" + background;
    }
    contentExp.push(
      (
        <div className={className}>
          {experiences}
        </div>
      )
    );

    return i;
  }

  buildHTML(chunks) {
    return chunks.map((chunk, index) => this.buildPreview('metadata-' + index, chunk, this.markdownItEnv))
  }

  generate(chunks, contentDescr, contentExp, markdownItEnv, htmlData, markdownIt, emojione) {
    let experiences = undefined;
    let description = undefined;
    let isFirstPage = true;

    this.markdownItEnv = markdownItEnv;
    this.markdownIt = markdownIt;
    this.emojione = emojione;

    htmlData.description = this.buildHTML(htmlData.description);
    htmlData.column1 = this.buildHTML(htmlData.column1);
    htmlData.column2 = this.buildHTML(htmlData.column2);
    htmlData.column3 = this.buildHTML(htmlData.column3);

    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];

      if (this.hasRule(chunk, '--expertise-start')) {
        i = this.generateHeader(chunks, i, contentDescr, contentExp, markdownItEnv, markdownIt, emojione);
        continue;
      }

      if (this.hasRule(chunk, '--section-start')) {
        i = this.generateSection(chunks, i, isFirstPage, contentDescr, contentExp, markdownItEnv, markdownIt, emojione);
        continue;
      }

      if (this.hasRule(chunk, '--break-page')) {
        isFirstPage = false;
        contentExp.push(
          <div className='chunk-page-break'>&nbsp;</div>
        );
        continue;
      }

      let preview = this.buildPreview(i, chunk, markdownItEnv);
      contentExp.push(preview);
    }
  }

  hasRule(chunk, rule) {
    if (chunk && chunk.filter(token => token.content.indexOf(rule) != -1).length > 0) {
      return true;
    }
    return false;
  }

  buildPreview(i, chunk) {
    return <PreviewChunk
      id={`ck-${i.toString()}`}
      markdownIt={this.markdownIt}
      emojione={this.emojione}
      chunk={chunk}
      markdownItEnv={this.markdownItEnv}
    />
  }
}