/* eslint-env node, es6 */

'use strict';

const
  DOC_ROOT = __dirname,
  PORT = 8080,

  MODULE_PACKAGES = [
    'jasmine-core',
    'test-page-loader',
    'anim-event',
    'plain-draggable'
  ],

  http = require('http'),
  staticAlias = require('node-static-alias'),
  logger = (() => {
    const log4js = require('log4js');
    log4js.configure({
      appenders: {
        out: {
          type: 'console',
          layout: {
            type: 'pattern',
            pattern: '%[[%r]%] %m' // Super simple format
          }
        }
      },
      categories: {default: {appenders: ['out'], level: 'info'}}
    });
    return log4js.getLogger('node-static-alias');
  })();

http.createServer((request, response) => {
  request.addListener('end', () => {
    (new staticAlias.Server(DOC_ROOT, {
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
    }))
      .serve(request, response, e => {
        if (e) {
          response.writeHead(e.status, e.headers);
          logger.error('(%s) %s', request.url, response.statusCode);
          if (e.status === 404) {
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
