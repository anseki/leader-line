/* eslint-env node, es6 */

'use strict';

const
  nodeStaticAlias = require('node-static-alias'),
  log4js = require('log4js'),
  http = require('http'),

  DOC_ROOT = __dirname,
  PORT = 8080,

  MODULE_PACKAGES = [
    'jasmine-core',
    'test-page-loader',
    'anim-event',
    'plain-draggable'
  ],

  logger = (() => {
    log4js.configure({ // Super simple format
      appenders: {out: {type: 'stdout', layout: {type: 'pattern', pattern: '%[[%r]%] %m'}}},
      categories: {default: {appenders: ['out'], level: 'info'}}
    });
    return log4js.getLogger('node-static-alias');
  })(),

  staticAlias = new nodeStaticAlias.Server(DOC_ROOT, {
    cache: false,
    headers: {'Cache-Control': 'no-cache, must-revalidate'},
    alias:
      MODULE_PACKAGES.map(packageName =>
        ({ // node_modules
          match: new RegExp(`^/${packageName}/.+`),
          serve: `${require.resolve(packageName).replace(
            // Include `packageName` for nested `node_modules`
            new RegExp(`^(.*[/\\\\]node_modules)[/\\\\]${packageName}[/\\\\].*$`), '$1')}<% reqPath %>`,
          allowOutside: true
        })
      ).concat([
        {
          match: /^\/src/,
          serve: '..<% reqPath %>',
          allowOutside: true
        }
      ]),
    logger
  });

http.createServer((request, response) => {
  request.addListener('end', () => {
    staticAlias.serve(request, response, error => {
      if (error) {
        response.writeHead(error.status, error.headers);
        logger.error('(%s) %s', request.url, response.statusCode);
        if (error.status === 404) {
          response.end('Not Found');
        }
      } else {
        logger.info('(%s) %s', request.url, response.statusCode);
      }
    });
  }).resume();
}).listen(PORT);

console.log(`START: http://localhost:${PORT}/\nROOT: ${DOC_ROOT}`);
console.log('(^C to stop)');
