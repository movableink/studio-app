/* eslint-env node */
'use strict';

const path = require('path');
const mergeTrees = require('broccoli-merge-trees');
const concat = require('broccoli-concat');
const babelProcessModulesOnly = require('ember-cli/lib/broccoli/babel-process-modules-only');

module.exports = {
  name: 'studio-utility',

  isDevelopingAddon() {
    return true;
  },

  postprocessTree(type, tree) {
    let srcTree = this.treeGenerator(path.join(__dirname, './src'));
    srcTree = babelProcessModulesOnly(srcTree, 'babel');

    const studioTree = concat(srcTree, {
      headerFiles: [require.resolve('loader.js')],
      footerFiles: [path.join(__dirname, './vendor/global.js')],
      inputFiles: ['**/*.js'],
      outputFile: '/assets/studio-utility.js'
    });

    return mergeTrees([tree, studioTree], {
      overwrite: true
    });
  }
};