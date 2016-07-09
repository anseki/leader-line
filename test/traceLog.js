/* exported traceLog */

var traceLog = (function() {
  'use strict';

  function getMessage() {
    var args = Array.prototype.slice.call(arguments),
      message = args.shift() + '';
    if (!args.length) { return message; }
    message = message.replace(/%([odifs])/g, function(s, param) {
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
      }
      return arg + '';
    });
    if (message) { args.unshift(message); }
    return args.join(' ');
  }

  var traceLog = {
    log: [],
    enabled: false,

    add: function() {
      if (traceLog.enabled) {
        traceLog.log.push(getMessage.apply(null, arguments));
      }
    },

    clear: function() {
      traceLog.log = [];
    }
  };

  return traceLog;
})();
