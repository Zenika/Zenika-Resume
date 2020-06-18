const { Promise } = global;

export default () => {
  return Promise.all([
      import('codemirror/mode/gfm/gfm'),
      import('codemirror/mode/dockerfile/dockerfile'),
      import('codemirror/mode/elm/elm'),
      import('codemirror/mode/gherkin/gherkin'),
      import('codemirror/mode/go/go'),
      import('codemirror/mode/javascript/javascript'),
      import('codemirror/mode/jinja2/jinja2'),
      import('codemirror/mode/jsx/jsx'),
      import('codemirror/mode/php/php'),
      import('codemirror/mode/properties/properties'),
      import('codemirror/mode/python/python'),
      import('codemirror/mode/ruby/ruby'),
      import('codemirror/mode/sass/sass'),
      import('codemirror/mode/shell/shell'),
      import('codemirror/mode/twig/twig'),
      import('codemirror/mode/xml/xml'),
      import('codemirror/mode/yaml/yaml'),
  ]);
};
