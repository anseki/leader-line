/* exported anim */

var anim = (function() {
  'use strict';

  var anim;

  /**
   * @callback callback
   * @param {number} rate - Progress [0, 1].
   * @param {boolean|null} finish
   */

  /**
   * @typedef {Object} task
   * @property {callback} callback
   * @property {number} duration
   * @property {number} count
   * @property {boolean} isLinear
   * @property {number[]} rates
   * @property {number} start
   */

  // @EXPORT@
  anim = {
    FUNC_KEYS: {
      'ease': [0.25, 0.1, 0.25, 1],
      'linear': [0, 0, 1, 1],
      'ease-in': [0.42, 0, 1, 1],
      'ease-out': [0, 0, 0.58, 1],
      'ease-in-out': [0.42, 0, 0.58, 1]
    },
    MSPF: 1000 / 60, // ms/frame (FPS: 60)

    tasks: [],
    request: window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) { setTimeout(callback, anim.MSPF); },
    cancel: window.cancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.msCancelAnimationFrame ||
      function(requestID) { clearTimeout(requestID); },

    /**
     * @param {callback} callback - Callback that is called each frame.
     * @param {number} duration - ms
     * @param {number} count - Must be >0 or -1 as infinite.
     * @param {number[]} timing - [x1, y1, x2, y2]
     * @returns {number} - animID to remove.
     */
    add: function(callback, duration, count, timing) {
      var isLinear = timing[0] === 0 && timing[1] === 0 && timing[2] === 1 && timing[3] === 1,
        rates, stepX, stepT, nextX, t, point;

      function getPoint(t) {
        var t2 = t * t, t3 = t2 * t, t1 = 1 - t, t12 = t1 * t1,
          p1f = 3 * t12 * t, p2f = 3 * t1 * t2;
        return {
          x: p1f * timing[0] + p2f * timing[2] + t3,
          y: p1f * timing[1] + p2f * timing[3] + t3
        };
      }

      if (!anim.tasks.some(function(task) { return task.callback === callback; })) {

        if (!isLinear) {
          // Generate list
          if (duration < anim.MSPF) {
            rates = [0, 1];
          } else {
            stepX = anim.MSPF / duration;
            stepT = stepX / 10; // precision
            nextX = stepX;
            rates = [0];
            for (t = stepT; t <= 1; t += stepT) {
              point = getPoint(t);
              if (point.x >= nextX) {
                rates.push(point.y);
                nextX += stepX;
              }
            }
            rates.push(1); // for tolerance
          }
        }

        anim.tasks.push({
          callback: callback, duration: duration, count: count,
          isLinear: isLinear,
          rates: rates,
          start: Date.now()
        });
      }
      anim.start();
    },
    remove: function(callback) {
      anim.tasks = anim.tasks.filter(function(task) { return task.callback !== callback; });
      if (!anim.tasks.length && anim.requestID) {
        anim.cancel.call(window, anim.requestID);
        anim.requestID = null;
      }
    },

    start: function() {
      if (!anim.requestID) {
        anim.requestID = anim.request.call(window, anim.step);
      }
    },
    step: function() {

      function getORatio(rates, timeLen) {
        return rates[Math.round(timeLen / anim.MSPF)];
      }

      var now = Date.now();
      anim.requestID = null;

      anim.tasks = anim.tasks.filter(function(task) {
        var timeLen = now - task.start, tRatio, loops;

        if (timeLen >= task.duration && task.count <= 1) {
          task.callback(1, true);
          return false;
        }
        if (timeLen > task.duration) {
          loops = Math.floor(timeLen / task.duration);
          if (loops >= task.count) { // Must: task.count > 1
            task.callback(1, true);
            return false;
          }
          task.count -= loops;
          task.start += task.duration * loops;
          timeLen = now - task.start;
        }
        tRatio = timeLen / task.duration;
        // return task.callback(task.isLinear ? tRatio : getORatio(tRatio, task.timing)) !== false;

        // debug
        window.testTimeS();
        var oRatio = getORatio(task.rates, timeLen);
        window.testTimeE();
        return task.callback(oRatio, false, tRatio) !== false;
        // /debug
      });

      if (anim.tasks.length) { anim.requestID = anim.request.call(window, anim.step); }
    }
  }
  // @/EXPORT@
  ;

  return anim;
})();
