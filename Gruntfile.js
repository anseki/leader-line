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
    PLUG_BEHIND = 1, PLUG_DISC = 2, PLUG_SQUARE = 3,
    PLUG_ARROW1 = 4, PLUG_ARROW2 = 5, PLUG_ARROW3 = 6,
    PLUG_KEY_2_ID = {behind: PLUG_BEHIND, disc: PLUG_DISC, square: PLUG_SQUARE,
      arrow1: PLUG_ARROW1, arrow2: PLUG_ARROW2, arrow3: PLUG_ARROW3},
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
            $('svg').each((i, elm) => {
              var symbol = $('.symbol', elm), size = $('.size', elm),
                elmId, id, props, noOverhead;
              if (symbol.length && size.length &&
                  (elmId = symbol.attr('id')) &&
                  (id = PLUG_KEY_2_ID[elmId])) {
                props = (symbol.attr('class') + '').split(' ');

                defsSrc += $.xml(symbol.removeAttr('class'));
                defsConf[id] = props.reduce((conf, prop) => {
                  var matches = prop.match(/prop\-([^\s]+)/);
                  if (matches) { conf[matches[1]] = true; }
                  if (/ *no\-overhead */.test(prop)) { noOverhead = true; }
                  return conf;
                }, {});

                defsConf[id].elmId = elmId;
                defsConf[id].widthR = parseFloat(size.attr('width')) / DEFAULT_LINE_SIZE;
                defsConf[id].heightR = parseFloat(size.attr('height')) / DEFAULT_LINE_SIZE;
                if (!noOverhead) {
                  defsConf[id].overhead = parseFloat(size.attr('x')) + parseFloat(size.attr('width'));
                }
              }
            });
            svgDefsCode = '\'' +
              htmlclean(`<svg version="1.1" width="0" height="0"><defs>${defsSrc}</defs></svg>`)
                .replace(/\'/g, '\\\'') + '\'';
            svgDefsConfCode = `{${
              Object.keys(defsConf).map(id => `${id}:{${
                Object.keys(defsConf[id]).map(prop => `${prop}:${
                  typeof defsConf[id][prop] === 'string' ? `'${defsConf[id][prop]}'` : defsConf[id][prop]
                }`).join(',')
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
