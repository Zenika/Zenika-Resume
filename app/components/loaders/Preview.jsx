const { Promise } = global;

export default async () => {
  const [hljs,markdownIt, ...markdownItPlugins] = await Promise.all([
    import("highlight.js"),
    // import('highlight.js/styles/zenburn.css'),
    import("markdown-it"),
    import('markdown-it-fontawesome'),
    import('markdown-it-modify-token'),
    import('markdown-it-sup'),
    import('markdown-it-mark'),
  ])
  return {
    hljs,
    markdownIt,
    markdownItPlugins
  }
};
