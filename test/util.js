
(function() {
  'use strict';

  /**
   * @param {Array} log - `traceLog`.
   * @param {...(string|string[])} keys - `'<setOptions>', '<position>'` or
   *    `['<updateLine>', 'lineColor']` to check the sequence.
   * @returns {boolean} - `true` if all `keys` are contained.
   */
  function toContainAll() {
    var keys = Array.prototype.slice.call(arguments),
      log = keys.shift();
    return keys.every(function(key) {
      var lastI = -1;
      return Array.isArray(key) ? key.every(function(keySeg) {
        var i = log.indexOf(keySeg),
          res = i === lastI + 1 || lastI === -1 && i > -1;
        lastI = i;
        return res;
      }) :
      log.indexOf(key) > -1;
    });
  }
  window.toContainAll = toContainAll;

  /**
   * @param {Array} log - `traceLog`.
   * @param {...string} keys - `'<setOptions>', '<position>'`.
   * @returns {boolean} - `true` if all `keys` are not contained.
   */
  function toNotContainAll() {
    var keys = Array.prototype.slice.call(arguments),
      log = keys.shift();
    return keys.every(function(key) {
      return log.indexOf(key) === -1;
    });
  }
  window.toNotContainAll = toNotContainAll;

})();
