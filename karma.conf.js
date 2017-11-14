const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

module.exports = function(config) {
  config.set({
    browsers: ['ChromeHeadless'],
    frameworks: ['qunit'],
    files: ['src/**/*.js', 'test/**/*.js', 'test/index.html'],
    crossOriginAttribute: false, // otherwise can't load remote scripts

    preprocessors: {
      'test/index.html': ['html2js'],
      'src/*.js': ['rollup'],
      'test/*.js': ['rollup', 'sourcemap']
    },

    rollupPreprocessor: {
      plugins: [resolve(), commonjs()],
      format: 'iife',
      name: 'StudioApp',
      sourcemap: 'inline'
    },

    html2JsPreprocessor: {
      processPath: function(filePath) {
        // Drop the file extension
        return filePath.replace(/\.html$/, '');
      }
    }
  });
};
