 /* eslint no-param-reassign: 1, array-callback-return: 1 */
 import React, { PropTypes, Component } from 'react';
 import ReactDOM from 'react-dom';
 import PreviewLoader from './loaders/Preview';
 import { Templates } from './TemplateForm';
 import grayMatter from 'gray-matter';
 import isEqual from 'lodash.isequal';


 const { array, func, number, object, string } = PropTypes;

 import 'emojione/assets/sprites/emojione.sprites.css';

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
         <span dangerouslySetInnerHTML={this.getHTML()} />
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
         linkify: true,
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

       this.emojione = deps.emojione;
       this.emojione.ascii = true;
       this.emojione.sprites = true;

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
     return this.props.raw !== nextProps.raw || this.props.template !== nextProps.template;
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
           i < start ||
           !(
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

   hasRule(chunk, rule){
     if(chunk.filter(token => token.content.indexOf(rule) != -1).length > 0){
       return true;
     }
     return false;
   }

   render(){
     let contentExp = [(
       <div className="preview-loader" key="preview-loader">
         <p>Loading all the rendering stuff...</p>
         <i className="fa fa-spinner fa-spin"></i>
       </div>
     )];
     let contentDescr = [];
     let data = {};
     if (this.markdownIt) {

       // Markdown document environment (links references, footnotes, etc.)
       const markdownItEnv = {};

       // Get front-matter vars
       this.matter = grayMatter(this.props.raw);
       data = this.matter.data;

       // Get chunks to render from tokens
       const chunks = this.getChunks(this.matter.content, markdownItEnv);

       let experiences = undefined;
       let description = undefined; 
       contentExp = [];
       contentDescr = [];
       let contentAll = [];

       for(var i = 0; i < chunks.length ; i++){
         var chunk = chunks[i];

          description = [];
          if(this.hasRule(chunk, '--header-start')){
            chunk = chunks[++i];
            while(!this.hasRule(chunk, '--header-end')){
             
              if(this.hasRule(chunk, '--center-start')){
                chunk = chunks[++i];
                while(!this.hasRule(chunk, '--center-end')){
                  let preview = (
                   <PreviewChunk
                    key={`ck-${i.toString()}`}
                    markdownIt={this.markdownIt}
                    emojione={this.emojione}
                    chunk={chunk}
                    markdownItEnv={markdownItEnv}
                   />
                 );
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
              if(this.hasRule(chunk, '--table-start')){
                chunk = chunks[++i];
                
                while(!this.hasRule(chunk, '--table-end')){
                   let columns = [];
                   if(this.hasRule(chunk, '--column-start')){
                      chunk = chunks[++i];
                      while(!this.hasRule(chunk, '--column-end')){
                        let preview = (
                         <PreviewChunk
                          key={`ck-${i.toString()}`}
                          markdownIt={this.markdownIt}
                          emojione={this.emojione}
                          chunk={chunk}
                          markdownItEnv={markdownItEnv}
                         />
                         );

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

          }

          experiences = [];
          if(this.hasRule(chunk, '--experience-start')){
            chunk = chunks[++i];
            while(!this.hasRule(chunk, '--experience-end')){
             let preview = (
              <PreviewChunk
               key={`ck-${i.toString()}`}
               markdownIt={this.markdownIt}
               emojione={this.emojione}
               chunk={chunk}
               markdownItEnv={markdownItEnv}
              />
              );
             experiences.push(preview);

             chunk = chunks[++i]; 
            } 
            contentExp.push(
             (
               <div className="experience">
                 {experiences}
               </div>
             )
           );
          } 

          if(this.hasRule(chunk, '--break-page')){
           contentExp.push (
             <div className='chunk-page-break'>&nbsp;</div>
           );
          }

         }
         
     }
     let page = undefined;
     // Compile selected template with given data
     if (this.props.template && this.props.template.length) {
       // Get the template component
       const Template = Templates.find(
         (template) => {
           return template.id === this.props.template;
         }).component;``

       page = (
         <Template contentExperience={contentExp} contentDescription={contentDescr} data={data} />
       );
     }

     return (
       <div className="preview">
         <div ref="rendered" className="rendered">
           {page}
         </div>
       </div>
     );

   }
 }

 Preview.propTypes = {
   raw: string.isRequired,
   template: string.isRequired,
   pos: number.isRequired,
   previewLoader: func.isRequired
 };

 Preview.defaultProps = {
   previewLoader: PreviewLoader
 };
