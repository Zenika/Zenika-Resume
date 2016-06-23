import React, {PropTypes, Component} from 'react';
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

    return !isEqual(this.props.chunk, nextProps.chunk) || this.props.key !== nextProps.key;
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

  generateHeader(chunks, i, contentDescr, contentExp, markdownItEnv, markdownIt, emojione) {
    let description = [];
    let chunk = chunks[++i];

    while (chunk && !this.hasRule(chunk, '--header-end')) {
      if (this.hasRule(chunk, '--center-start')) {
        chunk = chunks[++i];
        while (chunk && !this.hasRule(chunk, '--center-end')) {
          let preview = this.buildPreview(i, chunk, markdownItEnv);
          description.push(preview);
          chunk = chunks[++i];
        }
        contentDescr.push(
          (
            <div className="center">
              {description}
            </div>
          )
        );

      }
      chunk = chunks[++i];
      description = [];
      var classColonne = "premiereColonne";
      if (this.hasRule(chunk, '--table-start')) {
        chunk = chunks[++i];

        while (chunk && !this.hasRule(chunk, '--table-end')) {
          let columns = [];
          if (this.hasRule(chunk, '--column-start')) {
            chunk = chunks[++i];
            while (chunk && !this.hasRule(chunk, '--column-end')) {
              let preview = this.buildPreview(i, chunk, markdownItEnv);

              columns.push(preview);
              chunk = chunks[++i];
            }
          }

          description.push(
            (
              <div className={classColonne}>
                {columns}
              </div>
            )
          );
          classColonne = "colonne";
          chunk = chunks[++i];
        }

        contentDescr.push(
          (
            <div className="table">
              {description}
            </div>
          )
        );
      }
    }

    return i;
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

  generate(chunks, contentDescr, contentExp, markdownItEnv, markdownIt, emojione) {
    let experiences = undefined;
    let description = undefined;

    let isFirstPage = true;

    this.markdownItEnv = markdownItEnv;
    this.markdownIt = markdownIt;
    this.emojione = emojione;

    for (var i = 0; i < chunks.length; i++) {
      var chunk = chunks[i];

      if (this.hasRule(chunk, '--header-start')) {
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
      key={`ck-${i.toString()}`}
      markdownIt={this.markdownIt}
      emojione={this.emojione}
      chunk={chunk}
      markdownItEnv={this.markdownItEnv}
    />
  }
}