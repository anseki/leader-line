/* eslint-env node, es6 */

'use strict';

const
  DOC_ROOT = './',
  PORT = 8080,

  http = require('http'),
  staticAlias = require('node-static-alias'),
  log4js = require('log4js');

var logger;

log4js.configure({
  appenders: [
    {
      type: 'console',
      layout: {
        type: 'pattern',
        pattern: '%[[%r]%] %m' // Super simple format
      }
    }
  ]
});
logger = log4js.getLogger('node-static-alias');
logger.setLevel(log4js.levels.INFO);

http.createServer((request, response) => {
  request.addListener('end', () => {
    (new staticAlias.Server(DOC_ROOT, {
      cache: false,
      alias: [
        {
          match: '/test-page-loader.js',
          serve: '../node_modules/test-page-loader/test-page-loader.js',
          allowOutside: true
        },
        {
          match: /^\/src/,
          serve: '..<% reqPath %>',
          allowOutside: true
        }
      ],
      logger: logger
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
