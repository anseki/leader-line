/* eslint-env node, es6 */

'use strict';

module.exports = grunt => {

  const
    fs = require('fs'),
    pathUtil = require('path'),
    htmlclean = require('htmlclean'),
    CleanCSS = require('clean-css'),

    ROOT_PATH = __dirname,
    SRC_PATH = pathUtil.join(ROOT_PATH, 'src'),
    CSS_PATH = pathUtil.join(SRC_PATH, 'leader-line.css'),

    // from leader-line.js
    APP_ID = 'leader-line',
    DEFS_ID = `${APP_ID}-defs`,
    DEFAULT_LINE_SIZE = 4, // DEFAULT_OPTIONS.lineSize
    DEFINED_VAR = {
      PLUG_BEHIND: 'behind'
    };

  var embeddedAssets = [], referredAssets = [], protectedText = [], packages,
    code = {},
    definedVar = Object.keys(DEFINED_VAR).reduce((definedVar, varName) => {
      definedVar[varName] = `\f${varName}\x07`;
      return definedVar;
    }, {});

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
            var $ = cheerio.load(content), defsSrc = '',
              codeSrc = {
                SYMBOLS: {},
                PLUG_KEY_2_ID: {behind: definedVar.PLUG_BEHIND},
                PLUG_2_SYMBOL: {}
              }, cssSrc;

            function getCode(value) {
              var matches;
              return typeof value === 'object' ?
                  `{${Object.keys(value).map(prop => `${prop}:${getCode(value[prop])}`).join(',')}}` :
                typeof value === 'string' ? (
                  (matches = /^\f(.+)\x07$/.exec(value)) ? // eslint-disable-line no-control-regex
                    matches[1] : `'${value}'`
                ) : value;
            }

            $('svg').each((i, elm) => {
              var symbol = $('.symbol', elm), size = $('.size', elm),
                id, elmId, props, bBox, noOverhead;
              if (symbol.length && size.length && (id = symbol.attr('id'))) {

                elmId = `${APP_ID}-${id}`;
                props = (symbol.attr('class') + '').split(' ');
                defsSrc += $.xml(symbol.attr('id', elmId).removeAttr('class'));

                codeSrc.SYMBOLS[id] = {elmId: elmId};
                props.forEach(prop => {
                  var matches;
                  if ((matches = prop.match(/prop\-([^\s]+)/))) { codeSrc.SYMBOLS[id][matches[1]] = true; }
                  if ((matches = prop.match(/var\-([^\s]+)/))) { codeSrc[matches[1]] = id; }
                  if (/ *no\-overhead */.test(prop)) { noOverhead = true; }
                });

                codeSrc.SYMBOLS[id].bBox = bBox = {
                  left: parseFloat(size.attr('x')),
                  top: parseFloat(size.attr('y')),
                  width: parseFloat(size.attr('width')),
                  height: parseFloat(size.attr('height'))
                };
                bBox.right = bBox.left + bBox.width;
                bBox.bottom = bBox.top + bBox.height;
                codeSrc.SYMBOLS[id].widthR = bBox.width / DEFAULT_LINE_SIZE;
                codeSrc.SYMBOLS[id].heightR = bBox.height / DEFAULT_LINE_SIZE;
                codeSrc.SYMBOLS[id].bCircle = Math.max(-bBox.left, -bBox.top, bBox.right, bBox.bottom);
                codeSrc.SYMBOLS[id].overhead = noOverhead ? 0 : bBox.right;

                codeSrc.PLUG_KEY_2_ID[id] = id;
                codeSrc.PLUG_2_SYMBOL[id] = id;
              }
            });

            cssSrc = minCss(
              fs.readFileSync(CSS_PATH, {encoding: 'utf8'}).trim().replace(/^\s*@charset\s+[^;]+;/gm, ''));

            code.DEFS_HTML = '\'' +
              htmlclean(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="${DEFS_ID}">` +
                  `<style><![CDATA[${cssSrc}]]></style><defs>${defsSrc}</defs></svg>`)
                .replace(/\'/g, '\\\'') + '\'';
            Object.keys(DEFINED_VAR).forEach(codeVar => { code[codeVar] = getCode(DEFINED_VAR[codeVar]); });
            Object.keys(codeSrc).forEach(codeVar => { code[codeVar] = getCode(codeSrc[codeVar]); });
            return `var ${Object.keys(code).map(codeVar => `${codeVar}=${code[codeVar]}`).join(',')};`;
          }
        },
        src: `${SRC_PATH}/symbol.html`,
        dest: `${SRC_PATH}/defs.js`
      },

      testFuncs: {
        options: {
          handlerByContent: content => {
            content.replace(/@EXPORT\[file:([^\n]+?)\]@\s*(?:\*\/\s*)?([\s\S]*?)\s*(?:\/\*\s*|\/\/\s*)?@\/EXPORT@/g,
              (s, file, content) => {
                var path = pathUtil.join(SRC_PATH, file);
                grunt.file.write(path, content);
                grunt.log.writeln(`File "${path}" created.`);
              });
            return false;
          }
        },
        src: `${SRC_PATH}/leader-line.js`,
        dest: `${SRC_PATH}/dummy`
      }
    }
  });

  grunt.loadNpmTasks('grunt-task-helper');

  grunt.registerTask('defs', [
    'taskHelper:getSvgDefs'
  ]);
  grunt.registerTask('funcs', [
    'taskHelper:testFuncs'
  ]);

  grunt.registerTask('default', [
    'taskHelper:getSvgDefs',
    'package',
    'copy:addFiles',
    'archive'
  ]);
};
