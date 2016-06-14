/* exported anim */

var anim = (function() {
  'use strict';

  var anim;

  /**
   * @callback callback
   * @param {number} rate - Progress [0, 1].
   */

  // @EXPORT@
  anim = {
    tasks: [],
    request: window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame ||
      function(callback) { setTimeout(callback, 1000 / 60); },
    cancel: window.cancelAnimationFrame ||
      window.mozCancelAnimationFrame ||
      window.webkitCancelAnimationFrame ||
      window.msCancelAnimationFrame ||
      function(requestID) { clearTimeout(requestID); },

    add: function(callback, duration, count) {
      console.log('======== <add>'); // [DEBUG/]
      if (!anim.tasks.some(function(task) { return task.callback === callback; })) {
        console.log('add new'); // [DEBUG/]
        anim.tasks.push({
          callback: callback, duration: duration, count: count,
          start: Date.now()
        });
      }
      anim.start();
    },
    remove: function(callback) {
      console.log('======== <remove>'); // [DEBUG/]
      anim.tasks = anim.tasks.filter(function(task) { return task.callback !== callback; });
      if (!anim.tasks.length && anim.requestID) {
        console.log('task empty'); // [DEBUG/]
        anim.cancel.call(null, anim.requestID);
        anim.requestID = null;
      }
    },

    start: function() {
      if (!anim.requestID) {
        anim.requestID = anim.request.call(null, anim.step);
      }
    },
    step: function() {
      var now = Date.now();
      var i = -1; // [DEBUG/]
      console.log('======== <step>'); // [DEBUG/]
      anim.requestID = null;

      anim.tasks = anim.tasks.filter(function(task) {
        var timeLen = now - task.start;
        console.log('task[' + (++i) + '] timeLen: ' + timeLen); // [DEBUG/]
        if (task.count > 0) { --task.count; }

        if (timeLen >= task.duration && task.count === 0) {
          console.log('task[' + i + '] finish'); // [DEBUG/]
          task.callback(1);
          return false;
        }
        if (timeLen > task.duration) {
          task.start += task.duration * Math.floor(timeLen / task.duration);
          timeLen = now - task.start;
        }
        return task.callback(timeLen / task.duration) !== false;
      });

      console.log('anim.tasks.length: ' + anim.tasks.length); // [DEBUG/]
      if (anim.tasks.length) { anim.requestID = anim.request.call(null, anim.step); }
    }
  }
  // @/EXPORT@
  ;

  return anim;
})();
