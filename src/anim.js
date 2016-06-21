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
     * @param {} value - A value that was made by `valueCallback`.
     * @param {boolean} finish
     * @param {number} timeRatio - Progress [0, 1].
     * @param {number} outputRatio - Progress [0, 1].
     */

    /**
     * @typedef {Object} task
     * @property {number} animId
     * @property {frameCallback} frameCallback - Callback that is called each frame.
     * @property {number} duration
     * @property {number} count - `0` as infinite.
     * @property {{value, timeRatio: number, outputRatio: number}[]} frames
     * @property {(number|null)} framesStart - The time when first frame ran, or `null` if it is not running.
     * @property {number} loopsLeft - A counter for loop.
     * @property {boolean} reverse
     */

    /** @type {task[]} */
    tasks = [],
    newAnimId = -1,
    requestID;

  window.addReqFrameAnim2 = function(cb) { requestAnim = cb; }; // [DEBUG/]
  window.delReqFrameAnim2 = function(cb) { cancelAnim = cb; }; // [DEBUG/]
  window.tasks = tasks; // [DEBUG/]

  var running; // [DEBUG/]

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
        frame = task.frames[task.reverse ? 0 : task.frames.length - 1];
        task.frameCallback(frame.value, true, frame.timeRatio, frame.outputRatio);
        task.framesStart = null;
        return;
      }
      if (timeLen > task.duration) {
        loops = Math.floor(timeLen / task.duration);
        if (task.count) {
          if (loops >= task.loopsLeft) { // Here `task.loopsLeft > 1`
            frame = task.frames[task.reverse ? 0 : task.frames.length - 1];
            task.frameCallback(frame.value, true, frame.timeRatio, frame.outputRatio);
            task.framesStart = null;
            return;
          }
          task.loopsLeft -= loops;
        }
        task.framesStart += task.duration * loops;
        timeLen = now - task.framesStart;
      }

      if (task.reverse) { timeLen = task.duration - timeLen; }
      frame = task.frames[Math.round(timeLen / MSPF)];
      if (task.frameCallback(frame.value, false, frame.timeRatio, frame.outputRatio
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
        document.body.style.backgroundColor = running ? '#f7f6cb' : '#fff'; // not `''` for IE bug
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

  return {
    /**
     * Callback that makes value that is required by each frame.
     * @callback valueCallback
     * @param {number} outputRatio - Progress [0, 1].
     * @returns {}
     */

    /**
     * @param {(valueCallback|null)} valueCallback - valueCallback
     * @param {frameCallback} frameCallback - task property
     * @param {number} duration - task property
     * @param {number} count - task property
     * @param {(string|number[])} timing - FUNC_KEYS or [x1, y1, x2, y2]
     * @param {boolean} [reverse] - running property
     * @returns {number} - animID to remove.
     */
    add: function(valueCallback, frameCallback, duration, count, timing, reverse) {
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

      function newFrame(timeRatio, outputRatio) {
        return {value: valueCallback(outputRatio),
          timeRatio: timeRatio, outputRatio: outputRatio};
      }

      if (typeof timing === 'string') { timing = FUNC_KEYS[timing]; }
      valueCallback = valueCallback || function() {};

      // Generate `frames` list
      if (duration < MSPF) {
        frames = [newFrame(0, 0), newFrame(1, 1)];
      } else {
        stepX = MSPF / duration;
        frames = [newFrame(0, 0)];

        if (timing[0] === 0 && timing[1] === 0 && timing[2] === 1 && timing[3] === 1) { // linear
          for (nextX = stepX; nextX <= 1; nextX += stepX) {
            frames.push(newFrame(nextX, nextX)); // x === y
          }

        } else {
          stepT = stepX / 10; // precision for `t`
          nextX = stepX;
          for (t = stepT; t <= 1; t += stepT) {
            point = getPoint(t);
            if (point.x >= nextX) {
              frames.push(newFrame(point.x, point.y));
              nextX += stepX;
            }
          }
        }

        frames.push(newFrame(1, 1)); // for tolerance
      }

      task = {
        animId: animId,
        frameCallback: frameCallback, duration: duration, count: count, // task properties
        frames: frames,
        reverse: !!reverse
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

    start: function(animId, reverse) {
      tasks.some(function(task) {
        if (task.animId === animId) {
          task.reverse = !!reverse;
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
