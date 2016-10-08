/* exported traceLog */

var traceLog = (function() {
  'use strict';

  function getMessage() {
    var args = Array.prototype.slice.call(arguments),
      message = args.shift() + '';
    if (!args.length) { return message; }
    message = message.replace(/%([odifs_])/g, function(s, param) {
      var arg;
      if (!args.length) { return ''; }
      arg = args.shift();
      if (param === 'o') {
        return arg + '';
      } else if (param === 'd' || param === 'i') {
        arg = typeof arg === 'boolean' ? (arg ? 1 : 0) : parseInt(arg, 10);
        return isNaN(arg) ? '0' : arg + '';
      } else if (param === 'f') {
        arg = typeof arg === 'boolean' ? (arg ? 1 : 0) : parseFloat(arg);
        return isNaN(arg) ? '0.000000' : arg.toFixed(6) + '';
      } else if (param === '_') { // drop arg
        return '';
      }
      return arg + '';
    });
    if (message) { args.unshift(message); }
    return args.join(' ');
  }

  var
    tags = {}, tagStack = [], reTag = /^<(\/)?(.+?)>$/,

    traceLog = {
      log: [],
      enabled: false,
      getOpenCloseTags: false, // Contain tags for TaggedLog

      add: function() {
        var message, i, matches, tagName, iStack;
        if (traceLog.enabled) {

          traceLog.log.push((message = getMessage.apply(null, arguments)));
          i = traceLog.log.length - 1;

          if ((matches = reTag.exec(message))) {
            tagName = matches[2];
            if (matches[1]) { // end tag
              if (tagStack.length && tagStack[tagStack.length - 1] === tagName) {
                tagStack.pop();
              } else if ((iStack = tagStack.lastIndexOf(tagName)) > -1) {
                console.warn('Droped from stack: ' + tagStack.splice(iStack));
              } else {
                throw new Error('Not found tag: ' + tagName);
              }
            } else { // start tag
              tagStack.push(tagName);
              tags[tagName] = tags[tagName] || [];
            }
            if (traceLog.getOpenCloseTags) { tags[tagName].push(i); }
          } else if (tagStack.length) {
            tags[tagStack[tagStack.length - 1]].push(i);
          }
        }
      },

      getTaggedLog: function(tagName) {
        return tags[tagName] ?
          tags[tagName].map(function(i) { return traceLog.log[i]; }) :
          null;
      },

      clear: function() {
        traceLog.log = [];
        tags = {};
        tagStack = [];
      }
    };

  return traceLog;
})();
