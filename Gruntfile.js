/* eslint-env node, es6 */

'use strict';

module.exports = grunt => {

  const
    fs = require('fs'),
    pathUtil = require('path'),
    htmlclean = require('htmlclean'),

    ROOT_PATH = __dirname,
    SRC_PATH = pathUtil.join(ROOT_PATH, 'src'),

    // from leader-line.js
    DEFAULT_LINE_SIZE = 4; // DEFAULT_OPTIONS.size

  var embeddedAssets = [], referredAssets = [], protectedText = [], packages,
    svgDefsCode, svgDefsConfCode;

  function productSrc(content) {
    return content
      .replace(/[^\n]*\[DEBUG\/\][^\n]*\n?/g, '')
      .replace(/[^\n]*\[DEBUG\][\s\S]*?\[\/DEBUG\][^\n]*\n?/g, '');
  }

  function minCss(content) {
    return (new CleanCSS({keepSpecialComments: 0})).minify(content).styles;
  }

  function addProtectedText(text) {
    if (typeof text !== 'string' || text === '') { return ''; }
    protectedText.push(text);
    return `\f${protectedText.length - 1}\x07`;
  }

  // Redo String#replace until target is not found
  function replaceComplete(text, re, fnc) {
    var doNext = true, reg = new RegExp(re); // safe (not literal)
    function fncWrap() {
      doNext = true;
      return fnc.apply(null, arguments);
    }
    // This is faster than using RegExp#exec() and RegExp#lastIndex,
    // because replace() isn't called more than twice in almost all cases.
    while (doNext) {
      doNext = false;
      text = text.replace(reg, fncWrap);
    }
    return text;
  }

  grunt.initConfig({
    taskHelper: {
      getSvgDefs: {
        options: {
          handlerByContent: content => {
            let cheerio = require('cheerio');
            var $ = cheerio.load(content), defsSrc = '', defsConf = {};

            function getCode(value) {
              return typeof value === 'object' ?
                  `{${Object.keys(value).map(prop => `${prop}:${getCode(value[prop])}`).join(',')}}` :
                typeof value === 'string' ? `'${value}'` : value;
            }

            $('svg').each((i, elm) => {
              var symbol = $('.symbol', elm), size = $('.size', elm),
                id, props, bBox, noOverhead;
              if (symbol.length && size.length && (id = symbol.attr('id'))) {
                props = (symbol.attr('class') + '').split(' ');

                defsSrc += $.xml(symbol.removeAttr('class'));
                defsConf[id] = props.reduce((conf, prop) => {
                  var matches = prop.match(/prop\-([^\s]+)/);
                  if (matches) { conf[matches[1]] = true; }
                  if (/ *no\-overhead */.test(prop)) { noOverhead = true; }
                  return conf;
                }, {});

                defsConf[id].bBox = bBox = {
                  left: parseFloat(size.attr('x')),
                  top: parseFloat(size.attr('y')),
                  width: parseFloat(size.attr('width')),
                  height: parseFloat(size.attr('height'))
                };
                defsConf[id].widthR = bBox.width / DEFAULT_LINE_SIZE;
                defsConf[id].heightR = bBox.height / DEFAULT_LINE_SIZE;
                defsConf[id].outlineR = Math.max(
                  -bBox.left, -bBox.top, bBox.left + bBox.width, bBox.top + bBox.height);
                defsConf[id].overhead = noOverhead ? 0 : bBox.left + bBox.width;
              }
            });

            svgDefsCode = '\'' +
              htmlclean(`<svg version="1.1" width="0" height="0"><defs>${defsSrc}</defs></svg>`)
                .replace(/\'/g, '\\\'') + '\'';
            svgDefsConfCode = getCode(defsConf);
            return `var DEFS_HTML=${svgDefsCode},SYMBOLS=${svgDefsConfCode};`;
          }
        },
        src: `${SRC_PATH}/symbol.html`,
        dest: `${SRC_PATH}/defs.js`
      }
    }
  });

  grunt.loadNpmTasks('grunt-task-helper');

  grunt.registerTask('defs', [
    'taskHelper:getSvgDefs'
  ]);

  grunt.registerTask('default', [
    'taskHelper:getSvgDefs',
    'package',
    'copy:addFiles',
    'archive'
  ]);
};
