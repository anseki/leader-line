/* eslint-env node, es6 */

'use strict';

module.exports = grunt => {

  const
    fs = require('fs'),
    pathUtil = require('path'),
    htmlclean = require('htmlclean'),

    ROOT_PATH = __dirname,
    SRC_PATH = pathUtil.join(ROOT_PATH, 'src');

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
            $('svg').each((i, elm) => {
              var symbol = $('.symbol', elm), id, props, size;
              if (symbol.length && (id = symbol.attr('id'))) {
                props = (symbol.attr('class') + '').split(' ');
                size = $('.size', elm);

                defsSrc += $.xml(symbol.removeAttr('class'));
                defsConf[id] = props.reduce((conf, prop) => {
                  var matches = prop.match(/prop\-([^\s]+)/);
                  if (matches) { conf[matches[1]] = true; }
                  return conf;
                }, {});
                if (size.length) {
                  defsConf[id].overhead = parseFloat(size.attr('x')) + parseFloat(size.attr('width'));
                }
              }
            });
            svgDefsCode = '\'' +
              htmlclean(`<svg version="1.1" width="0" height="0"><defs>${defsSrc}</defs></svg>`)
                .replace(/\'/g, '\\\'') + '\'';
            svgDefsConfCode = `{${
              Object.keys(defsConf).map(id => `${id}:{${
                Object.keys(defsConf[id]).map(prop => `${prop}:${defsConf[id][prop]}`).join(',')
              }}`).join(',')}}`;
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
