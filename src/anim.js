/* exported anim */
/* global getPointOnCubic:false, getIntersections:false */

var anim = (function() {
  'use strict';

  var anim;

  /**
   * @callback callback
   * @param {number} rate - Progress [0, 1].
   */

  /**
   * @typedef {Object} task
   * @property {callback} callback
   * @property {number} duration
   * @property {number} count
   * @property {number[]} timing - [x1, y1, x2, y2]
   * @property {number} start
   * @property {boolean} isLinear
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
    BASE_FPS: 60,

    tasks: [],
    request: window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) { setTimeout(callback, 1000 / anim.BASE_FPS); },
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
      if (!anim.tasks.some(function(task) { return task.callback === callback; })) {
        anim.tasks.push({
          callback: callback, duration: duration, count: count, timing: timing,
          start: Date.now(),
          isLinear: timing[0] === 0 && timing[1] === 0 && timing[2] === 1 && timing[3] === 1
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

      function getORatio(t, timing) {
        var p1 = {x: timing[0], y: timing[1]}, p2 = {x: timing[2], y: timing[3]},
          point = t === 0 ? {y: 0} : t >= 1 ? {y: 1} :
            getPointOnCubic({x: 0, y: 0}, p1, p2, {x: 1, y: 1},
              getIntersections({x: 0, y: 0}, p1, p2, {x: 1, y: 1},
                {x: t, y: 0}, {x: t, y: 1})[0]);
        return point.y;
      }

      var now = Date.now();
      anim.requestID = null;

      anim.tasks = anim.tasks.filter(function(task) {
        var timeLen = now - task.start, tRatio, loops;

        if (timeLen >= task.duration && task.count <= 1) {
          task.callback(1);
          return false;
        }
        if (timeLen > task.duration) {
          loops = Math.floor(timeLen / task.duration);
          if (loops >= task.count) { // Must: task.count > 1
            task.callback(1);
            return false;
          }
          task.count -= loops;
          task.start += task.duration * loops;
          timeLen = now - task.start;
        }
        tRatio = timeLen / task.duration;
        return task.callback(task.isLinear ? tRatio : getORatio(tRatio, task.timing)) !== false;
      });

      if (anim.tasks.length) { anim.requestID = anim.request.call(window, anim.step); }
    }
  }
  // @/EXPORT@
  ;

  return anim;
})();
