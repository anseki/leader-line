/* exported anim */

var anim =
// @EXPORT@
(function() {
  'use strict';

  var
    FUNC_KEYS = {
      'ease': [0.25, 0.1, 0.25, 1],
      'linear': [0, 0, 1, 1],
      'ease-in': [0.42, 0, 1, 1],
      'ease-out': [0, 0, 0.58, 1],
      'ease-in-out': [0.42, 0, 0.58, 1]
    },
    MSPF = 1000 / 60, // ms/frame (FPS: 60)

    requestAnim = window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) { setTimeout(callback, MSPF); },

    cancelAnim = window.cancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.msCancelAnimationFrame ||
      function(requestID) { clearTimeout(requestID); },

    /**
     * @callback frameCallback
     * @param {number} rate - Progress [0, 1].
     * @param {boolean} finish
     */

    /**
     * @typedef {Object} task
     * @property {number} animId
     * @property {frameCallback} callback - Callback that is called each frame.
     * @property {number} duration
     * @property {number} count - `0` as infinite.
     * @property {boolean} isLinear
     * @property {number[]} rates
     * @property {(number|null)} framesStart - The time when first frame ran, or `null` if it is not running.
     * @property {number} curCount - A counter to current loop.
     */

    /** @type {task[]} */
    tasks = [],
    newAnimId = -1,
    requestID;

  function step() {
    var now = Date.now(), next = false;
    if (requestID) {
      cancelAnim.call(window, requestID);
      requestID = null;
    }

    tasks.forEach(function(task) {
      var timeLen, tRatio, loops;

      if (!task.framesStart) { return; }
      timeLen = now - task.framesStart;

      if (timeLen >= task.duration && task.curCount <= 1) {
        task.callback(1, true);
        return;
      }
      if (timeLen > task.duration) {
        loops = Math.floor(timeLen / task.duration);
        if (loops >= task.curCount) { // Must: task.curCount > 1
          task.callback(1, true);
          return;
        }
        task.curCount -= loops;
        task.framesStart += task.duration * loops;
        timeLen = now - task.framesStart;
      }
      tRatio = timeLen / task.duration;
      next = task.callback(
        task.isLinear ? tRatio : task.rates[Math.round(timeLen / MSPF)], false) !== false || next;
    });

    if (next) { requestID = requestAnim.call(window, step); }
  }

  function startTask(task) {
    task.framesStart = Date.now();
    task.curCount = task.count;
    step();
  }

  window.tasks = tasks; // [DEBUG/]

  return {
    /**
     * @param {frameCallback} callback - task property
     * @param {number} duration - task property
     * @param {number} count - task property
     * @param {number[]} timing - [x1, y1, x2, y2]
     * @returns {number} - animID to remove.
     */
    add: function(callback, duration, count, timing) {
      var animId = ++newAnimId, task,
        isLinear = timing[0] === 0 && timing[1] === 0 && timing[2] === 1 && timing[3] === 1,
        rates, stepX, stepT, nextX, t, point;

      function getPoint(t) {
        var t2 = t * t, t3 = t2 * t, t1 = 1 - t, t12 = t1 * t1,
          p1f = 3 * t12 * t, p2f = 3 * t1 * t2;
        return {
          x: p1f * timing[0] + p2f * timing[2] + t3,
          y: p1f * timing[1] + p2f * timing[3] + t3
        };
      }

      if (!isLinear) {
        // Generate list
        if (duration < MSPF) {
          rates = [0, 1];
        } else {
          stepX = MSPF / duration;
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

      task = {
        animId: animId,
        callback: callback, duration: duration, count: count, // task properties
        isLinear: isLinear,
        rates: rates
      };
      tasks.push(task);
      startTask(task);

      return animId;
    },

    remove: function(animId) {
      var iRemove;
      if (tasks.some(function(task, i) {
        if (task.animId === animId) {
          iRemove = i;
          task.framesStart = null; // for `tasks.forEach` that is running now.
          return true;
        }
        return false;
      })) {
        tasks.splice(iRemove, 1);
      }
    },

    start: function(animId) {
      tasks.some(function(task) {
        if (task.animId === animId) {
          startTask(task);
          return true;
        }
        return false;
      });
    },

    stop: function(animId) {
      tasks.some(function(task) {
        if (task.animId === animId) {
          task.framesStart = null;
          return true;
        }
        return false;
      });
    }
  };
})()
// @/EXPORT@
;
