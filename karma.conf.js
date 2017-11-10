module.exports = function(config) {
  config.set({
    browsers: ['ChromeHeadless'],
    frameworks: ['qunit'],
    files: [
      'src/**/*.js',
      'test/**/*.js',
      'index.html'
    ],
    crossOriginAttribute: false, // otherwise can't load remote scripts

    preprocessors: {
      'index.html': ['html2js'],
      'src/*.js': ['webpack'],
      'test/*.js': ['webpack', 'sourcemap']
    },

    webpack: {
      devtool: 'inline-source-map',
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['env']
              }
            }
          }
        ]
      }
    },

    webpackMiddleware: {
      noInfo: true
    },

    html2JsPreprocessor: {
      processPath: function(filePath) {
        // Drop the file extension
        return filePath.replace(/\.html$/, '');
      }
    }
  });
};
