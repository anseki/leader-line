/* eslint-env node, es6 */

'use strict';

module.exports = grunt => {

  const
    fs = require('fs'),
    pathUtil = require('path'),
    htmlclean = require('htmlclean'),
    CleanCSS = require('clean-css'),
    uglify = require('uglify-js'),
    preProc = require('pre-proc'),

    ROOT_PATH = __dirname,
    SRC_DIR_PATH = pathUtil.join(ROOT_PATH, 'src'),
    CSS_PATH = pathUtil.join(SRC_DIR_PATH, 'leader-line.css'),
    DEST_DIR_PATH = pathUtil.join(ROOT_PATH, 'leader-line.min.js'),

    PACK_LIBS = [
      ['anim', 'anim.js'],
      ['pathDataPolyfill', 'path-data-polyfill/path-data-polyfill.js'],
      ['AnimEvent', '../node_modules/anim-event/anim-event.min.js', /^[^]*?var\s+AnimEvent\s*=\s*([^]*)\s*;\s*$/]
    ],

    // from leader-line.js
    APP_ID = 'leader-line',
    DEFS_ID = `${APP_ID}-defs`,
    DEFAULT_LINE_SIZE = 4, // DEFAULT_OPTIONS.lineSize
    DEFINED_VAR = {
      PLUG_BEHIND: 'behind'
    },

    PKG = require('./package');

  let code = {},
    definedVar = Object.keys(DEFINED_VAR).reduce((definedVar, varName) => {
      definedVar[varName] = `\f${varName}\x07`;
      return definedVar;
    }, {});

  function minCss(content) {
    return (new CleanCSS({level: {1: {specialComments: 0}}})).minify(content).styles;
  }

  function minJs(content) {
    return uglify.minify(content).code;
  }

  grunt.initConfig({
    taskHelper: {
      getSvgDefs: {
        options: {
          handlerByContent: content => {
            const cheerio = require('cheerio');
            let $ = cheerio.load(content), defsSrc = '',
              codeSrc = {
                SYMBOLS: {},
                PLUG_KEY_2_ID: {behind: definedVar.PLUG_BEHIND},
                PLUG_2_SYMBOL: {}
              }, cssSrc;

            function getCode(value) {
              let matches;
              return typeof value === 'object' ?
                  `{${Object.keys(value).map(prop => `${prop}:${getCode(value[prop])}`).join(',')}}` :
                typeof value === 'string' ? (
                  (matches = /^\f(.+)\x07$/.exec(value)) ? // eslint-disable-line no-control-regex
                    matches[1] : `'${value}'`
                ) : value;
            }

            $('svg').each((i, elm) => {
              let symbol = $('.symbol', elm), size = $('.size', elm),
                id, elmId, props, bBox, noOverhead, outlineBase, outlineMax;
              if (symbol.length && size.length && (id = symbol.attr('id'))) {

                elmId = `${APP_ID}-${id}`;
                props = (symbol.attr('class') + '').split(' ');
                defsSrc += $.xml(symbol.attr('id', elmId).removeAttr('class'));

                codeSrc.SYMBOLS[id] = {elmId: elmId};
                props.forEach(prop => {
                  let matches;
                  if ((matches = prop.match(/prop\-([^\s]+)/))) {
                    codeSrc.SYMBOLS[id][matches[1]] = true;
                  } else if ((matches = prop.match(/varId\-([^\s]+)/))) {
                    codeSrc[matches[1]] = id;
                  } else if (prop === 'no-overhead') {
                    noOverhead = true;
                  }
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
                codeSrc.SYMBOLS[id].sideLen = Math.max(-bBox.top, bBox.bottom);
                codeSrc.SYMBOLS[id].backLen = -bBox.left;
                codeSrc.SYMBOLS[id].overhead = noOverhead ? 0 : bBox.right;

                if ((outlineBase = $('.outline-base', elm)).length &&
                    (outlineMax = $('.outline-max', elm)).length) {
                  codeSrc.SYMBOLS[id].outlineBase = parseFloat(outlineBase.attr('stroke-width')) / 2;
                  codeSrc.SYMBOLS[id].outlineMax =
                    parseFloat(outlineMax.attr('stroke-width')) / 2 / codeSrc.SYMBOLS[id].outlineBase;
                }

                codeSrc.PLUG_KEY_2_ID[id] = id;
                codeSrc.PLUG_2_SYMBOL[id] = id;
              }
            });

            cssSrc = minCss(
              fs.readFileSync(CSS_PATH, {encoding: 'utf8'}).trim().replace(/^\s*@charset\s+[^;]+;/gm, ''));

            // some version of cheerio have problem: <tag></tag> -> <tag/>
            defsSrc = defsSrc.replace(/<([^>\s]+)([^>]*)><\/\1>/g, '<$1$2/>');
            code.DEFS_HTML = '\'' +
              htmlclean(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="${DEFS_ID}">` +
                  `<style><![CDATA[${cssSrc}]]></style><defs>${defsSrc}</defs></svg>`)
                .replace(/\'/g, '\\\'') + '\'';
            Object.keys(DEFINED_VAR).forEach(codeVar => { code[codeVar] = getCode(DEFINED_VAR[codeVar]); });
            Object.keys(codeSrc).forEach(codeVar => { code[codeVar] = getCode(codeSrc[codeVar]); });

            // for debug
            fs.writeFileSync(`${SRC_DIR_PATH}/symbols.json`, JSON.stringify(codeSrc.SYMBOLS));

            return `var ${Object.keys(code).map(codeVar => `${codeVar}=${code[codeVar]}`).join(',')};`;
          }
        },
        src: `${SRC_DIR_PATH}/symbols.html`,
        dest: `${SRC_DIR_PATH}/defs.js`
      },

      testFuncs: {
        options: {
          handlerByContent: content => {
            content.replace(/@EXPORT\[file:([^\n]+?)\]@\s*(?:\*\/\s*)?([\s\S]*?)\s*(?:\/\*\s*|\/\/\s*)?@\/EXPORT@/g,
              (s, file, content) => {
                const path = pathUtil.join(SRC_DIR_PATH, file);
                grunt.file.write(path, content);
                grunt.log.writeln(`File "${path}" created.`);
              });
            return false;
          }
        },
        src: `${SRC_DIR_PATH}/leader-line.js`,
        dest: `${SRC_DIR_PATH}/dummy`
      },

      packJs: {
        options: {
          handlerByContent: content => {
            const reEXPORT = /^[\s\S]*?@EXPORT@\s*(?:\*\/\s*)?([\s\S]*?)\s*(?:\/\*\s*|\/\/\s*)?@\/EXPORT@[\s\S]*$/;
            PACK_LIBS.forEach(keyPath => {
              code[keyPath[0]] = fs.readFileSync(pathUtil.join(SRC_DIR_PATH, keyPath[1]), {encoding: 'utf8'})
                .replace(keyPath[2] || reEXPORT, '$1');
            });

            const banner = `/*! ${PKG.title || PKG.name} v${PKG.version} (c) ${PKG.author.name} ${PKG.homepage} */\n`;
            return banner + minJs(preProc.removeTag('DEBUG',
              content.replace(/@INCLUDE\[code:([^\n]+?)\]@/g,
                (s, codeKey) => {
                  if (typeof code[codeKey] !== 'string') {
                    grunt.fail.fatal(`File doesn't exist code: ${codeKey}`);
                  }
                  return code[codeKey];
                }
              )
            ));
          }
        },
        src: `${SRC_DIR_PATH}/leader-line.js`,
        dest: DEST_DIR_PATH
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

  grunt.registerTask('build', [
    'defs',
    'taskHelper:packJs'
  ]);

  grunt.registerTask('default', ['build']);
};
