
(function() {
  'use strict';

  /**
   * @param {Array} log - `traceLog.log`.
   * @param {(string|string[])[]} keys - Each key is `'<setOptions>', '<position>'` or
   *    `['<updateLine>', 'lineColor']` to check the sequence.
   * @returns {boolean} `true` if all `keys` are contained.
   */
  function toContainAll(log, keys) {
    var logSeq;

    function containsSequence(keys) {
      var ERR_MSG = '\\f that is used as marker is included.', keysSeq;
      if (logSeq == null) {
        if (log.join('').indexOf('\f') > -1) { throw new Error(ERR_MSG); }
        logSeq = '\f' + log.join('\f') + '\f';
      }
      if (keys.join('').indexOf('\f') > -1) { throw new Error(ERR_MSG); }
      keysSeq = '\f' + keys.join('\f') + '\f';
      return logSeq.indexOf(keysSeq) > -1;
    }

    return Array.isArray(log) && Array.isArray(keys) &&
      keys.every(function(key) {
        return Array.isArray(key) ? containsSequence(key) : log.indexOf(key) > -1;
      });
  }
  window.toContainAll = toContainAll;

  /**
   * @param {Array} log - `traceLog.log`.
   * @param {string[]} keys - Each key is `'<setOptions>', '<position>'`.
   * @returns {boolean} `true` if all `keys` are not contained.
   */
  function toNotContainAny(log, keys) {
    return Array.isArray(log) && Array.isArray(keys) &&
      keys.every(function(key) {
        return log.indexOf(key) === -1;
      });
  }
  window.toNotContainAny = toNotContainAny;

  var customMatchers = {
    toContainAll: function() {
      return {compare: function(actual, expected) {
        return {pass: toContainAll(actual, expected)};
      }};
    },

    toNotContainAny: function() {
      return {compare: function(actual, expected) {
        return {pass: toNotContainAny(actual, expected)};
      }};
    }
  };
  window.customMatchers = customMatchers;

})();
