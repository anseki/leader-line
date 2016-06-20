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
    MSPF = 1000 / 60 / 2, // precision ms/frame (FPS: 60)

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
     * @param {} value - 
     * @param {boolean} finish
     * @param {number} timeRatio - Progress [0, 1].
     * @param {number} outputRatio - Progress [0, 1].
     */

    /**
     * @typedef {Object} task
     * @property {number} animId
     * @property {frameCallback} callback - Callback that is called each frame.
     * @property {number} duration
     * @property {number} count - `0` as infinite.
     * @property {number[]} frames
     * @property {(number|null)} framesStart - The time when first frame ran, or `null` if it is not running.
     * @property {number} loopsLeft - A counter for loop.
     */

    /** @type {task[]} */
    tasks = [],
    newAnimId = -1,
    requestID;

  var running; // [DEBUG/]

  window.addReqFrameAnim2 = function(cb) { requestAnim = cb; }; // [DEBUG/]
  window.delReqFrameAnim2 = function(cb) { cancelAnim = cb; }; // [DEBUG/]

  function step() {
    running = true; // [DEBUG/]
    var now = Date.now(), next = false;
    if (requestID) {
      cancelAnim.call(window, requestID);
      requestID = null;
    }

    tasks.forEach(function(task) {
      var timeLen, loops, frame;

      if (!task.framesStart) { return; }
      timeLen = now - task.framesStart;

      if (timeLen >= task.duration && task.count && task.loopsLeft <= 1) {
        task.callback('', true, 1, 1);
        task.framesStart = null;
        return;
      }
      if (timeLen > task.duration) {
        loops = Math.floor(timeLen / task.duration);
        if (task.count && loops >= task.loopsLeft) { // Here `task.loopsLeft > 1`
          task.callback('', true, 1, 1);
          task.framesStart = null;
          return;
        }
        task.loopsLeft -= loops;
        task.framesStart += task.duration * loops;
        timeLen = now - task.framesStart;
      }

      frame = task.frames[Math.round(timeLen / MSPF)];
      if (task.callback('', false, timeLen / task.duration, frame.oRatio
          // [DEBUG]
          , timeLen
          // [/DEBUG]
          ) !== false) {
        next = true;
      } else {
        task.framesStart = null;
      }
    });

    if (next) { requestID = requestAnim.call(window, step); }
  }

  // [DEBUG]
  window.anim_lastRunning = false;
  window.anim_watchStart = function() {
    window.anim_watchTimer = setInterval(function() {
      if (running !== window.anim_lastRunning) {
        document.body.style.backgroundColor = running ? '#f7f6cb' : '';
        window.anim_lastRunning = running;
      }
      running = false;
    }, 200);
  };
  window.anim_watchStop = function() { clearInterval(window.anim_watchTimer); };
  // [/DEBUG]

  function startTask(task) {
    task.framesStart = Date.now();
    task.loopsLeft = task.count;
    step();
  }

  window.tasks = tasks; // [DEBUG/]

  return {
    /**
     * @param {frameCallback} callback - task property
     * @param {number} duration - task property
     * @param {number} count - task property
     * @param {(string|number[])} timing - FUNC_KEYS or [x1, y1, x2, y2]
     * @returns {number} - animID to remove.
     */
    add: function(callback, duration, count, timing) {
      var animId = ++newAnimId, task, frames,
        stepX, stepT, nextX, t, point;

      function getPoint(t) {
        var t2 = t * t, t3 = t2 * t, t1 = 1 - t, t12 = t1 * t1,
          p1f = 3 * t12 * t, p2f = 3 * t1 * t2;
        return {
          x: p1f * timing[0] + p2f * timing[2] + t3,
          y: p1f * timing[1] + p2f * timing[3] + t3
        };
      }

      if (typeof timing === 'string') { timing = FUNC_KEYS[timing]; }

      // Generate `frames` list
      if (duration < MSPF) {
        frames = [{oRatio: 0}, {oRatio: 1}];
      } else {
        stepX = MSPF / duration;
        frames = [{oRatio: 0}];

        if (timing[0] === 0 && timing[1] === 0 && timing[2] === 1 && timing[3] === 1) { // linear
          for (nextX = stepX; nextX <= 1; nextX += stepX) {
            frames.push({oRatio: nextX}); // x === y
          }

        } else {
          stepT = stepX / 10; // precision for `t`
          nextX = stepX;
          for (t = stepT; t <= 1; t += stepT) {
            point = getPoint(t);
            if (point.x >= nextX) {
              frames.push({oRatio: point.y});
              nextX += stepX;
            }
          }
        }

        frames.push({oRatio: 1}); // for tolerance
      }

      task = {
        animId: animId,
        callback: callback, duration: duration, count: count, // task properties
        frames: frames
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
    },

    validTiming: function(timing) {
      return typeof timing === 'string' ? FUNC_KEYS[timing] :
        Array.isArray(timing) && [0, 1, 2, 3].every(function(i) {
          return typeof timing[i] === 'number' && timing[i] >= 0 && timing[i] <= 1;
        }) ? [timing[0], timing[1], timing[2], timing[3]] :
        null;
    }
  };
})()
// @/EXPORT@
;
