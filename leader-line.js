/*! LeaderLine v1.0.5 (c) anseki https://anseki.github.io/leader-line/ */
/*
 * LeaderLine
 * https://anseki.github.io/leader-line/
 *
 * Copyright (c) 2018 anseki
 * Licensed under the MIT license.
 */

/* exported LeaderLine */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */
/* global traceLog:false */

;var LeaderLine = (function() { // eslint-disable-line no-extra-semi
  'use strict';

  /**
   * An object that simulates `DOMRect` to indicate a bounding-box.
   * @typedef {Object} BBox
   * @property {(number|null)} left - ScreenCTM
   * @property {(number|null)} top - ScreenCTM
   * @property {(number|null)} right - ScreenCTM
   * @property {(number|null)} bottom - ScreenCTM
   * @property {(number|null)} x - Substitutes for left
   * @property {(number|null)} y - Substitutes for top
   * @property {(number|null)} width
   * @property {(number|null)} height
   */

  /**
   * An object that has coordinates of ScreenCTM.
   * @typedef {Object} Point
   * @property {number} x
   * @property {number} y
   */

  /**
   * @typedef {Object} AnimOptions
   * @property {number} duration
   * @property {(string|number[])} timing - FUNC_KEYS or [x1, y1, x2, y2]
   */

  var
    APP_ID = 'leader-line',
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    SOCKET_KEY_2_ID = {top: SOCKET_TOP, right: SOCKET_RIGHT, bottom: SOCKET_BOTTOM, left: SOCKET_LEFT},

    PATH_STRAIGHT = 1, PATH_ARC = 2, PATH_FLUID = 3, PATH_MAGNET = 4, PATH_GRID = 5,
    PATH_KEY_2_ID = {
      straight: PATH_STRAIGHT, arc: PATH_ARC, fluid: PATH_FLUID, magnet: PATH_MAGNET, grid: PATH_GRID},

    /**
     * @typedef {Object} SymbolConf
     * @property {string} elmId
     * @property {BBox} bBox
     * @property {number} widthR
     * @property {number} heightR
     * @property {number} bCircle
     * @property {number} sideLen
     * @property {number} backLen
     * @property {number} overhead
     * @property {(boolean|null)} noRotate
     * @property {(number|null)} outlineBase
     * @property {(number|null)} outlineMax
     */

    /** @typedef {{symbolId: string, SymbolConf}} SYMBOLS */

    PLUG_BEHIND = 'behind',
    DEFS_ID = APP_ID + '-defs',
    DEFS_HTML = '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="leader-line-defs"><style><![CDATA[.leader-line{position:absolute;overflow:visible!important;pointer-events:none!important;font-size:16px}#leader-line-defs{width:0;height:0;position:absolute;left:0;top:0}.leader-line-line-path{fill:none}.leader-line-mask-bg-rect{fill:white}.leader-line-caps-mask-anchor,.leader-line-caps-mask-marker-shape{fill:black}.leader-line-caps-mask-anchor{stroke:black}.leader-line-caps-mask-line,.leader-line-plugs-face{stroke:rgba(0,0,0,0)}.leader-line-line-mask-shape{stroke:white}.leader-line-line-outline-mask-shape{stroke:black}.leader-line-plug-mask-shape{fill:white;stroke:black}.leader-line-plug-outline-mask-shape{fill:black;stroke:white}.leader-line-areaAnchor{position:absolute;overflow:visible!important}]]></style><defs><circle id="leader-line-disc" cx="0" cy="0" r="5"/><rect id="leader-line-square" x="-5" y="-5" width="10" height="10"/><polygon id="leader-line-arrow1" points="-8,-8 8,0 -8,8 -5,0"/><polygon id="leader-line-arrow2" points="-4,-8 4,0 -4,8 -7,5 -2,0 -7,-5"/><polygon id="leader-line-arrow3" points="-4,-5 8,0 -4,5"/><g id="leader-line-hand"><path style="fill: #fcfcfc" d="M9.19 11.14h4.75c1.38 0 2.49-1.11 2.49-2.49 0-.51-.15-.98-.41-1.37h1.3c1.38 0 2.49-1.11 2.49-2.49s-1.11-2.53-2.49-2.53h1.02c1.38 0 2.49-1.11 2.49-2.49s-1.11-2.49-2.49-2.49h14.96c1.37 0 2.49-1.11 2.49-2.49s-1.11-2.49-2.49-2.49H16.58C16-9.86 14.28-11.14 9.7-11.14c-4.79 0-6.55 3.42-7.87 4.73H-2.14v13.23h3.68C3.29 9.97 5.47 11.14 9.19 11.14L9.19 11.14Z"/><path style="fill: black" d="M13.95 12c1.85 0 3.35-1.5 3.35-3.35 0-.17-.02-.34-.04-.51h.07c1.85 0 3.35-1.5 3.35-3.35 0-.79-.27-1.51-.72-2.08 1.03-.57 1.74-1.67 1.74-2.93 0-.59-.16-1.15-.43-1.63h12.04c1.85 0 3.35-1.5 3.35-3.35 0-1.85-1.5-3.35-3.35-3.35H17.2C16.26-10.93 13.91-12 9.7-12 5.36-12 3.22-9.4 1.94-7.84c0 0-.29.33-.5.57-.63 0-3.58 0-3.58 0C-2.61-7.27-3-6.88-3-6.41v13.23c0 .47.39.86.86.86 0 0 2.48 0 3.2 0C2.9 10.73 5.29 12 9.19 12L13.95 12ZM9.19 10.28c-3.46 0-5.33-1.05-6.9-3.87-.15-.27-.44-.44-.75-.44 0 0-1.81 0-2.82 0V-5.55c1.06 0 3.11 0 3.11 0 .25 0 .44-.06.61-.25l.83-.95c1.23-1.49 2.91-3.53 6.43-3.53 3.45 0 4.9.74 5.57 1.72h-4.3c-.48 0-.86.38-.86.86s.39.86.86.86h22.34c.9 0 1.63.73 1.63 1.63 0 .9-.73 1.63-1.63 1.63H15.83c-.48 0-.86.38-.86.86 0 .47.39.86.86.86h2.52c.9 0 1.63.73 1.63 1.63s-.73 1.63-1.63 1.63h-3.12c-.48 0-.86.38-.86.86 0 .47.39.86.86.86h2.11c.88 0 1.63.76 1.63 1.67 0 .9-.73 1.63-1.63 1.63h-3.2c-.48 0-.86.39-.86.86 0 .47.39.86.86.86h1.36c.05.16.09.34.09.51 0 .9-.73 1.63-1.63 1.63C13.95 10.28 9.19 10.28 9.19 10.28Z"/></g><g id="leader-line-crosshair"><path d="M0-78.97c-43.54 0-78.97 35.43-78.97 78.97 0 43.54 35.43 78.97 78.97 78.97s78.97-35.43 78.97-78.97C78.97-43.54 43.55-78.97 0-78.97ZM76.51-1.21h-9.91v-9.11h-2.43v9.11h-11.45c-.64-28.12-23.38-50.86-51.5-51.5V-64.17h9.11V-66.6h-9.11v-9.91C42.46-75.86 75.86-42.45 76.51-1.21ZM-1.21-30.76h-9.11v2.43h9.11V-4.2c-1.44.42-2.57 1.54-2.98 2.98H-28.33v-9.11h-2.43v9.11H-50.29C-49.65-28-27.99-49.65-1.21-50.29V-30.76ZM-30.76 1.21v9.11h2.43v-9.11H-4.2c.42 1.44 1.54 2.57 2.98 2.98v24.13h-9.11v2.43h9.11v19.53C-27.99 49.65-49.65 28-50.29 1.21H-30.76ZM1.22 30.75h9.11v-2.43h-9.11V4.2c1.44-.42 2.56-1.54 2.98-2.98h24.13v9.11h2.43v-9.11h19.53C49.65 28 28 49.65 1.22 50.29V30.75ZM30.76-1.21v-9.11h-2.43v9.11H4.2c-.42-1.44-1.54-2.56-2.98-2.98V-28.33h9.11v-2.43h-9.11V-50.29C28-49.65 49.65-28 50.29-1.21H30.76ZM-1.21-76.51v9.91h-9.11v2.43h9.11v11.45c-28.12.64-50.86 23.38-51.5 51.5H-64.17v-9.11H-66.6v9.11h-9.91C-75.86-42.45-42.45-75.86-1.21-76.51ZM-76.51 1.21h9.91v9.11h2.43v-9.11h11.45c.64 28.12 23.38 50.86 51.5 51.5v11.45h-9.11v2.43h9.11v9.91C-42.45 75.86-75.86 42.45-76.51 1.21ZM1.22 76.51v-9.91h9.11v-2.43h-9.11v-11.45c28.12-.64 50.86-23.38 51.5-51.5h11.45v9.11h2.43v-9.11h9.91C75.86 42.45 42.45 75.86 1.22 76.51Z"/><path d="M0 83.58-7.1 96 7.1 96Z"/><path d="M0-83.58 7.1-96-7.1-96"/><path d="M83.58 0 96 7.1 96-7.1Z"/><path d="M-83.58 0-96-7.1-96 7.1Z"/></g></defs></svg>',
    SYMBOLS = {disc:{elmId:'leader-line-disc',noRotate:true,bBox:{left:-5,top:-5,width:10,height:10,right:5,bottom:5},widthR:2.5,heightR:2.5,bCircle:5,sideLen:5,backLen:5,overhead:0,outlineBase:1,outlineMax:4},square:{elmId:'leader-line-square',noRotate:true,bBox:{left:-5,top:-5,width:10,height:10,right:5,bottom:5},widthR:2.5,heightR:2.5,bCircle:5,sideLen:5,backLen:5,overhead:0,outlineBase:1,outlineMax:4},arrow1:{elmId:'leader-line-arrow1',bBox:{left:-8,top:-8,width:16,height:16,right:8,bottom:8},widthR:4,heightR:4,bCircle:8,sideLen:8,backLen:8,overhead:8,outlineBase:2,outlineMax:1.5},arrow2:{elmId:'leader-line-arrow2',bBox:{left:-7,top:-8,width:11,height:16,right:4,bottom:8},widthR:2.75,heightR:4,bCircle:8,sideLen:8,backLen:7,overhead:4,outlineBase:1,outlineMax:1.75},arrow3:{elmId:'leader-line-arrow3',bBox:{left:-4,top:-5,width:12,height:10,right:8,bottom:5},widthR:3,heightR:2.5,bCircle:8,sideLen:5,backLen:4,overhead:8,outlineBase:1,outlineMax:2.5},hand:{elmId:'leader-line-hand',bBox:{left:-3,top:-12,width:40,height:24,right:37,bottom:12},widthR:10,heightR:6,bCircle:37,sideLen:12,backLen:3,overhead:37},crosshair:{elmId:'leader-line-crosshair',noRotate:true,bBox:{left:-96,top:-96,width:192,height:192,right:96,bottom:96},widthR:48,heightR:48,bCircle:96,sideLen:96,backLen:96,overhead:0}},
    PLUG_KEY_2_ID = {behind:PLUG_BEHIND,disc:'disc',square:'square',arrow1:'arrow1',arrow2:'arrow2',arrow3:'arrow3',hand:'hand',crosshair:'crosshair'},
    PLUG_2_SYMBOL = {disc:'disc',square:'square',arrow1:'arrow1',arrow2:'arrow2',arrow3:'arrow3',hand:'hand',crosshair:'crosshair'},
    DEFAULT_END_PLUG = 'arrow1',

    SOCKET_IDS = [SOCKET_TOP, SOCKET_RIGHT, SOCKET_BOTTOM, SOCKET_LEFT],
    KEYWORD_AUTO = 'auto',
    BBOX_PROP = {x: 'left', y: 'top', width: 'width', height: 'height'},

    MIN_GRAVITY = 80, MIN_GRAVITY_SIZE = 4, MIN_GRAVITY_R = 5,
    MIN_OH_GRAVITY = 120, MIN_OH_GRAVITY_OH = 8, MIN_OH_GRAVITY_R = 3.75,
    MIN_ADJUST_LEN = 10, MIN_GRID_LEN = 30,

    CIRCLE_CP = 0.5522847, CIRCLE_8_RAD = 1 / 4 * Math.PI,
    RE_PERCENT = /^\s*(\-?[\d\.]+)\s*(\%)?\s*$/,
    SVG_NS = 'http://www.w3.org/2000/svg',

    IS_EDGE = '-ms-scroll-limit' in document.documentElement.style &&
      '-ms-ime-align' in document.documentElement.style && !window.navigator.msPointerEnabled,
    IS_TRIDENT = !IS_EDGE && !!document.uniqueID, // Future Edge might support `document.uniqueID`.
    IS_GECKO = 'MozAppearance' in document.documentElement.style,
    IS_BLINK = !IS_EDGE && !IS_GECKO && // Edge has `window.chrome`, and future Gecko might have that.
      !!window.chrome && !!window.CSS,
    IS_WEBKIT = !IS_EDGE && !IS_TRIDENT &&
      !IS_GECKO && !IS_BLINK && // Some engines support `webkit-*` properties.
      !window.chrome && 'WebkitAppearance' in document.documentElement.style,

    SHAPE_GAP = IS_TRIDENT || IS_EDGE ? 0.2 : 0.1,

    DEFAULT_OPTIONS = {
      path: PATH_FLUID,
      lineColor: 'coral',
      lineSize: 4,
      plugSE: [PLUG_BEHIND, DEFAULT_END_PLUG],
      plugSizeSE: [1, 1],
      lineOutlineEnabled: false,
      lineOutlineColor: 'indianred',
      lineOutlineSize: 0.25,
      plugOutlineEnabledSE: [false, false],
      plugOutlineSizeSE: [1, 1]
    },

    isObject = (function() {
      var toString = {}.toString, fnToString = {}.hasOwnProperty.toString,
        objFnString = fnToString.call(Object);
      return function(obj) {
        var proto, constructor;
        return obj && toString.call(obj) === '[object Object]' &&
          (!(proto = Object.getPrototypeOf(obj)) ||
            (constructor = proto.hasOwnProperty('constructor') && proto.constructor) &&
            typeof constructor === 'function' && fnToString.call(constructor) === objFnString);
      };
    })(),
    isFinite = Number.isFinite || function(value) { return typeof value === 'number' && window.isFinite(value); },

    anim = (function() {
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

    isFinite = Number.isFinite || function(value) { return typeof value === 'number' && window.isFinite(value); },

    /**
     * @callback frameCallback
     * @param {} value - A value that was made by `valueCallback`.
     * @param {boolean} finish
     * @param {number} timeRatio - Progress [0, 1].
     * @param {number} outputRatio - Progress [0, 1].
     * @returns {} `false` to stop.
     */

    /**
     * @typedef {Object} task
     * @property {number} animId
     * @property {frameCallback} frameCallback - Callback that is called each frame.
     * @property {number} duration
     * @property {number} count - `0` as infinite.
     * @property {{value, timeRatio: number, outputRatio: number}[]} frames
     * @property {(number|null)} framesStart - The time when first frame ran, or `null` if it is not playing.
     * @property {number} loopsLeft - A counter for loop.
     * @property {number} lastFrame - index of last frame that ran.
     * @property {boolean} reverse - Play backwards.
     */

    /** @type {task[]} */
    tasks = [],
    newAnimId = 0,
    requestID;



  function step() {
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
        frame = task.frames[(task.lastFrame = task.reverse ? 0 : task.frames.length - 1)];
        task.frameCallback(frame.value, true, frame.timeRatio, frame.outputRatio);
        task.framesStart = null;
        return;
      }
      if (timeLen > task.duration) {
        loops = Math.floor(timeLen / task.duration);
        if (task.count) {
          if (loops >= task.loopsLeft) { // Here `task.loopsLeft > 1`
            frame = task.frames[(task.lastFrame = task.reverse ? 0 : task.frames.length - 1)];
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
      frame = task.frames[(task.lastFrame = Math.round(timeLen / MSPF))];
      if (task.frameCallback(frame.value, false, frame.timeRatio, frame.outputRatio
) !== false) {
        next = true;
      } else {
        task.framesStart = null;
      }
    });

    if (next) { requestID = requestAnim.call(window, step); }
  }


  function startTask(task, timeRatio) {
    task.framesStart = Date.now();
    if (timeRatio != null) {
      task.framesStart -= task.duration * (task.reverse ? 1 - timeRatio : timeRatio);
    }
    task.loopsLeft = task.count;
    task.lastFrame = null;
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
     * @param {(boolean|null)} reverse - playing property
     * @param {number|boolean} [timeRatio] - Play from the midst. [0, 1], or `false` that prevents it starting.
     * @returns {number} animId to control the task.
     */
    add: function(valueCallback, frameCallback, duration, count, timing, reverse, timeRatio) {
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
      if (timeRatio !== false) { startTask(task, timeRatio); }

      return animId;
    },

    remove: function(animId) {
      var iRemove;
      if (tasks.some(function(task, i) {
        if (task.animId === animId) {
          iRemove = i;
          task.framesStart = null; // for `tasks.forEach` that is playing now.
          return true;
        }
        return false;
      })) {
        tasks.splice(iRemove, 1);
      }
    },

    /**
     * @param {number} animId - Target task.
     * @param {boolean} reverse - Play backwards.
     * @param {number} [timeRatio] - Play from the midst. [0, 1]
     * @returns {void}
     */
    start: function(animId, reverse, timeRatio) {
      tasks.some(function(task) {
        if (task.animId === animId) {
          task.reverse = !!reverse;
          startTask(task, timeRatio);
          return true;
        }
        return false;
      });
    },

    /**
     * @param {number} animId - Target task.
     * @param {boolean} [getTimeRatioByFrame] - Return timeRatio of last frame that ran. [0, 1]
     * @returns {(number|undefined)} timeRatio [0, 1]
     */
    stop: function(animId, getTimeRatioByFrame) {
      var timeRatio;
      tasks.some(function(task) {
        if (task.animId === animId) {
          if (!getTimeRatioByFrame) {
            timeRatio = (Date.now() - task.framesStart) / task.duration;
            if (task.reverse) { timeRatio = 1 - timeRatio; }
            if (timeRatio < 0) {
              timeRatio = 0;
            } else if (timeRatio > 1) {
              timeRatio = 1;
            }
          } else if (task.lastFrame != null) {
            timeRatio = task.frames[task.lastFrame].timeRatio;
          }
          task.framesStart = null;
          return true;
        }
        return false;
      });
      return timeRatio;
    },

    validTiming: function(timing) {
      return typeof timing === 'string' ? FUNC_KEYS[timing] :
        Array.isArray(timing) && [0, 1, 2, 3].every(function(i) {
          return isFinite(timing[i]) && timing[i] >= 0 && timing[i] <= 1;
        }) ? [timing[0], timing[1], timing[2], timing[3]] :
        null;
    }
  };
})(),
    pathDataPolyfill = /*
  Customized path-data-polyfill.js
    https://github.com/jarek-foksa/path-data-polyfill.js 2016.06.22

  - Wrap code with function
  - With specified window
*/

/* exported pathDataPolyfill */

function pathDataPolyfill(window) {
  'use strict';

// @info
//   Polyfill for SVG getPathData() and setPathData() methods. Based on:
//   - SVGPathSeg polyfill by Philip Rogers (MIT License)
//     https://github.com/progers/pathseg
//   - SVGPathNormalizer by Tadahisa Motooka (MIT License)
//     https://github.com/motooka/SVGPathNormalizer/tree/master/src
//   - arcToCubicCurves() by Dmitry Baranovskiy (MIT License)
//     https://github.com/DmitryBaranovskiy/raphael/blob/v2.1.1/raphael.core.js#L1837
// @author
//   Jarosław Foksa
// @license
//   MIT License
if (!window.SVGPathElement.prototype.getPathData || !window.SVGPathElement.prototype.setPathData) {
  (function() {
    var commandsMap = {
      "Z":"Z", "M":"M", "L":"L", "C":"C", "Q":"Q", "A":"A", "H":"H", "V":"V", "S":"S", "T":"T",
      "z":"Z", "m":"m", "l":"l", "c":"c", "q":"q", "a":"a", "h":"h", "v":"v", "s":"s", "t":"t"
    };

    var Source = function(string) {
      this._string = string;
      this._currentIndex = 0;
      this._endIndex = this._string.length;
      this._prevCommand = null;
      this._skipOptionalSpaces();
    };

    var isIE = window.navigator.userAgent.indexOf("MSIE ") !== -1;

    Source.prototype = {
      parseSegment: function() {
        var char = this._string[this._currentIndex];
        var command = commandsMap[char] ? commandsMap[char] : null;

        if (command === null) {
          // Possibly an implicit command. Not allowed if this is the first command.
          if (this._prevCommand === null) {
            return null;
          }

          // Check for remaining coordinates in the current command.
          if (
            (char === "+" || char === "-" || char === "." || (char >= "0" && char <= "9")) && this._prevCommand !== "Z"
          ) {
            if (this._prevCommand === "M") {
              command = "L";
            }
            else if (this._prevCommand === "m") {
              command = "l";
            }
            else {
              command = this._prevCommand;
            }
          }
          else {
            command = null;
          }

          if (command === null) {
            return null;
          }
        }
        else {
          this._currentIndex += 1;
        }

        this._prevCommand = command;

        var values = null;
        var cmd = command.toUpperCase();

        if (cmd === "H" || cmd === "V") {
          values = [this._parseNumber()];
        }
        else if (cmd === "M" || cmd === "L" || cmd === "T") {
          values = [this._parseNumber(), this._parseNumber()];
        }
        else if (cmd === "S" || cmd === "Q") {
          values = [this._parseNumber(), this._parseNumber(), this._parseNumber(), this._parseNumber()];
        }
        else if (cmd === "C") {
          values = [
            this._parseNumber(),
            this._parseNumber(),
            this._parseNumber(),
            this._parseNumber(),
            this._parseNumber(),
            this._parseNumber()
          ];
        }
        else if (cmd === "A") {
          values = [
            this._parseNumber(),
            this._parseNumber(),
            this._parseNumber(),
            this._parseArcFlag(),
            this._parseArcFlag(),
            this._parseNumber(),
            this._parseNumber()
          ];
        }
        else if (cmd === "Z") {
          this._skipOptionalSpaces();
          values = [];
        }

        if (values === null || values.indexOf(null) >= 0) {
          // Unknown command or known command with invalid values
          return null;
        }
        else {
          return {type: command, values: values};
        }
      },

      hasMoreData: function() {
        return this._currentIndex < this._endIndex;
      },

      peekSegmentType: function() {
        var char = this._string[this._currentIndex];
        return commandsMap[char] ? commandsMap[char] : null;
      },

      initialCommandIsMoveTo: function() {
        // If the path is empty it is still valid, so return true.
        if (!this.hasMoreData()) {
          return true;
        }

        var command = this.peekSegmentType();
        // Path must start with moveTo.
        return command === "M" || command === "m";
      },

      _isCurrentSpace: function() {
        var char = this._string[this._currentIndex];
        return char <= " " && (char === " " || char === "\n" || char === "\t" || char === "\r" || char === "\f");
      },

      _skipOptionalSpaces: function() {
        while (this._currentIndex < this._endIndex && this._isCurrentSpace()) {
          this._currentIndex += 1;
        }

        return this._currentIndex < this._endIndex;
      },

      _skipOptionalSpacesOrDelimiter: function() {
        if (
          this._currentIndex < this._endIndex &&
          !this._isCurrentSpace() &&
          this._string[this._currentIndex] !== ","
        ) {
          return false;
        }

        if (this._skipOptionalSpaces()) {
          if (this._currentIndex < this._endIndex && this._string[this._currentIndex] === ",") {
            this._currentIndex += 1;
            this._skipOptionalSpaces();
          }
        }
        return this._currentIndex < this._endIndex;
      },

      // Parse a number from an SVG path. This very closely follows genericParseNumber(...) from
      // Source/core/svg/SVGParserUtilities.cpp.
      // Spec: http://www.w3.org/TR/SVG11/single-page.html#paths-PathDataBNF
      _parseNumber: function() {
        var exponent = 0;
        var integer = 0;
        var frac = 1;
        var decimal = 0;
        var sign = 1;
        var expsign = 1;
        var startIndex = this._currentIndex;

        this._skipOptionalSpaces();

        // Read the sign.
        if (this._currentIndex < this._endIndex && this._string[this._currentIndex] === "+") {
          this._currentIndex += 1;
        }
        else if (this._currentIndex < this._endIndex && this._string[this._currentIndex] === "-") {
          this._currentIndex += 1;
          sign = -1;
        }

        if (
          this._currentIndex === this._endIndex ||
          (
            (this._string[this._currentIndex] < "0" || this._string[this._currentIndex] > "9") &&
            this._string[this._currentIndex] !== "."
          )
        ) {
          // The first character of a number must be one of [0-9+-.].
          return null;
        }

        // Read the integer part, build right-to-left.
        var startIntPartIndex = this._currentIndex;

        while (
          this._currentIndex < this._endIndex &&
          this._string[this._currentIndex] >= "0" &&
          this._string[this._currentIndex] <= "9"
        ) {
          this._currentIndex += 1; // Advance to first non-digit.
        }

        if (this._currentIndex !== startIntPartIndex) {
          var scanIntPartIndex = this._currentIndex - 1;
          var multiplier = 1;

          while (scanIntPartIndex >= startIntPartIndex) {
            integer += multiplier * (this._string[scanIntPartIndex] - "0");
            scanIntPartIndex -= 1;
            multiplier *= 10;
          }
        }

        // Read the decimals.
        if (this._currentIndex < this._endIndex && this._string[this._currentIndex] === ".") {
          this._currentIndex += 1;

          // There must be a least one digit following the .
          if (
            this._currentIndex >= this._endIndex ||
            this._string[this._currentIndex] < "0" ||
            this._string[this._currentIndex] > "9"
          ) {
            return null;
          }

          while (
            this._currentIndex < this._endIndex &&
            this._string[this._currentIndex] >= "0" &&
            this._string[this._currentIndex] <= "9"
          ) {
            frac *= 10;
            decimal += (this._string.charAt(this._currentIndex) - "0") / frac;
            this._currentIndex += 1;
          }
        }

        // Read the exponent part.
        if (
          this._currentIndex !== startIndex &&
          this._currentIndex + 1 < this._endIndex &&
          (this._string[this._currentIndex] === "e" || this._string[this._currentIndex] === "E") &&
          (this._string[this._currentIndex + 1] !== "x" && this._string[this._currentIndex + 1] !== "m")
        ) {
          this._currentIndex += 1;

          // Read the sign of the exponent.
          if (this._string[this._currentIndex] === "+") {
            this._currentIndex += 1;
          }
          else if (this._string[this._currentIndex] === "-") {
            this._currentIndex += 1;
            expsign = -1;
          }

          // There must be an exponent.
          if (
            this._currentIndex >= this._endIndex ||
            this._string[this._currentIndex] < "0" ||
            this._string[this._currentIndex] > "9"
          ) {
            return null;
          }

          while (
            this._currentIndex < this._endIndex &&
            this._string[this._currentIndex] >= "0" &&
            this._string[this._currentIndex] <= "9"
          ) {
            exponent *= 10;
            exponent += (this._string[this._currentIndex] - "0");
            this._currentIndex += 1;
          }
        }

        var number = integer + decimal;
        number *= sign;

        if (exponent) {
          number *= Math.pow(10, expsign * exponent);
        }

        if (startIndex === this._currentIndex) {
          return null;
        }

        this._skipOptionalSpacesOrDelimiter();

        return number;
      },

      _parseArcFlag: function() {
        if (this._currentIndex >= this._endIndex) {
          return null;
        }

        var flag = null;
        var flagChar = this._string[this._currentIndex];

        this._currentIndex += 1;

        if (flagChar === "0") {
          flag = 0;
        }
        else if (flagChar === "1") {
          flag = 1;
        }
        else {
          return null;
        }

        this._skipOptionalSpacesOrDelimiter();
        return flag;
      }
    };

    var parsePathDataString = function(string) {
      if (!string || string.length === 0) return [];

      var source = new Source(string);
      var pathData = [];

      if (source.initialCommandIsMoveTo()) {
        while (source.hasMoreData()) {
          var pathSeg = source.parseSegment();

          if (pathSeg === null) {
            break;
          }
          else {
            pathData.push(pathSeg);
          }
        }
      }

      return pathData;
    };

    var setAttribute = window.SVGPathElement.prototype.setAttribute;
    var removeAttribute = window.SVGPathElement.prototype.removeAttribute;

    var $cachedPathData = window.Symbol ? window.Symbol() : "__cachedPathData";
    var $cachedNormalizedPathData = window.Symbol ? window.Symbol() : "__cachedNormalizedPathData";

    // @info
    //   Get an array of corresponding cubic bezier curve parameters for given arc curve paramters.
    var arcToCubicCurves = function(x1, y1, x2, y2, r1, r2, angle, largeArcFlag, sweepFlag, _recursive) {
      var degToRad = function(degrees) {
        return (Math.PI * degrees) / 180;
      };

      var rotate = function(x, y, angleRad) {
        var X = x * Math.cos(angleRad) - y * Math.sin(angleRad);
        var Y = x * Math.sin(angleRad) + y * Math.cos(angleRad);
        return {x: X, y: Y};
      };

      var angleRad = degToRad(angle);
      var params = [];
      var f1, f2, cx, cy;

      if (_recursive) {
        f1 = _recursive[0];
        f2 = _recursive[1];
        cx = _recursive[2];
        cy = _recursive[3];
      }
      else {
        var p1 = rotate(x1, y1, -angleRad);
        x1 = p1.x;
        y1 = p1.y;

        var p2 = rotate(x2, y2, -angleRad);
        x2 = p2.x;
        y2 = p2.y;

        var x = (x1 - x2) / 2;
        var y = (y1 - y2) / 2;
        var h = (x * x) / (r1 * r1) + (y * y) / (r2 * r2);

        if (h > 1) {
          h = Math.sqrt(h);
          r1 = h * r1;
          r2 = h * r2;
        }

        var sign;

        if (largeArcFlag === sweepFlag) {
          sign = -1;
        }
        else {
          sign = 1;
        }

        var r1Pow = r1 * r1;
        var r2Pow = r2 * r2;

        var left = r1Pow * r2Pow - r1Pow * y * y - r2Pow * x * x;
        var right = r1Pow * y * y + r2Pow * x * x;

        var k = sign * Math.sqrt(Math.abs(left/right));

        cx = k * r1 * y / r2 + (x1 + x2) / 2;
        cy = k * -r2 * x / r1 + (y1 + y2) / 2;

        f1 = Math.asin(parseFloat(((y1 - cy) / r2).toFixed(9)));
        f2 = Math.asin(parseFloat(((y2 - cy) / r2).toFixed(9)));

        if (x1 < cx) {
          f1 = Math.PI - f1;
        }
        if (x2 < cx) {
          f2 = Math.PI - f2;
        }

        if (f1 < 0) {
          f1 = Math.PI * 2 + f1;
        }
        if (f2 < 0) {
          f2 = Math.PI * 2 + f2;
        }

        if (sweepFlag && f1 > f2) {
          f1 = f1 - Math.PI * 2;
        }
        if (!sweepFlag && f2 > f1) {
          f2 = f2 - Math.PI * 2;
        }
      }

      var df = f2 - f1;

      if (Math.abs(df) > (Math.PI * 120 / 180)) {
        var f2old = f2;
        var x2old = x2;
        var y2old = y2;

        if (sweepFlag && f2 > f1) {
          f2 = f1 + (Math.PI * 120 / 180) * (1);
        }
        else {
          f2 = f1 + (Math.PI * 120 / 180) * (-1);
        }

        x2 = cx + r1 * Math.cos(f2);
        y2 = cy + r2 * Math.sin(f2);
        params = arcToCubicCurves(x2, y2, x2old, y2old, r1, r2, angle, 0, sweepFlag, [f2, f2old, cx, cy]);
      }

      df = f2 - f1;

      var c1 = Math.cos(f1);
      var s1 = Math.sin(f1);
      var c2 = Math.cos(f2);
      var s2 = Math.sin(f2);
      var t = Math.tan(df / 4);
      var hx = 4 / 3 * r1 * t;
      var hy = 4 / 3 * r2 * t;

      var m1 = [x1, y1];
      var m2 = [x1 + hx * s1, y1 - hy * c1];
      var m3 = [x2 + hx * s2, y2 - hy * c2];
      var m4 = [x2, y2];

      m2[0] = 2 * m1[0] - m2[0];
      m2[1] = 2 * m1[1] - m2[1];

      if (_recursive) {
        return [m2, m3, m4].concat(params);
      }
      else {
        params = [m2, m3, m4].concat(params).join().split(",");

        var curves = [];
        var curveParams = [];

        params.forEach( function(param, i) {
          if (i % 2) {
            curveParams.push(rotate(params[i - 1], params[i], angleRad).y);
          }
          else {
            curveParams.push(rotate(params[i], params[i + 1], angleRad).x);
          }

          if (curveParams.length === 6) {
            curves.push(curveParams);
            curveParams = [];
          }
        });

        return curves;
      }
    };

    var clonePathData = function(pathData) {
      return pathData.map( function(seg) {
        return {type: seg.type, values: Array.prototype.slice.call(seg.values)};
      });
    };

    // @info
    //   Takes any path data, returns path data that consists only from absolute commands.
    var absolutizePathData = function(pathData) {
      var absolutizedPathData = [];

      var currentX = null;
      var currentY = null;

      var subpathX = null;
      var subpathY = null;

      pathData.forEach( function(seg) {
        /* eslint-disable no-redeclare */
        var type = seg.type;

        if (type === "M") {
          var x = seg.values[0];
          var y = seg.values[1];

          absolutizedPathData.push({type: "M", values: [x, y]});

          subpathX = x;
          subpathY = y;

          currentX = x;
          currentY = y;
        }

        else if (type === "m") {
          var x = currentX + seg.values[0];
          var y = currentY + seg.values[1];

          absolutizedPathData.push({type: "M", values: [x, y]});

          subpathX = x;
          subpathY = y;

          currentX = x;
          currentY = y;
        }

        else if (type === "L") {
          var x = seg.values[0];
          var y = seg.values[1];

          absolutizedPathData.push({type: "L", values: [x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "l") {
          var x = currentX + seg.values[0];
          var y = currentY + seg.values[1];

          absolutizedPathData.push({type: "L", values: [x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "C") {
          var x1 = seg.values[0];
          var y1 = seg.values[1];
          var x2 = seg.values[2];
          var y2 = seg.values[3];
          var x = seg.values[4];
          var y = seg.values[5];

          absolutizedPathData.push({type: "C", values: [x1, y1, x2, y2, x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "c") {
          var x1 = currentX + seg.values[0];
          var y1 = currentY + seg.values[1];
          var x2 = currentX + seg.values[2];
          var y2 = currentY + seg.values[3];
          var x = currentX + seg.values[4];
          var y = currentY + seg.values[5];

          absolutizedPathData.push({type: "C", values: [x1, y1, x2, y2, x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "Q") {
          var x1 = seg.values[0];
          var y1 = seg.values[1];
          var x = seg.values[2];
          var y = seg.values[3];

          absolutizedPathData.push({type: "Q", values: [x1, y1, x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "q") {
          var x1 = currentX + seg.values[0];
          var y1 = currentY + seg.values[1];
          var x = currentX + seg.values[2];
          var y = currentY + seg.values[3];

          absolutizedPathData.push({type: "Q", values: [x1, y1, x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "A") {
          var x = seg.values[5];
          var y = seg.values[6];

          absolutizedPathData.push({
            type: "A",
            values: [seg.values[0], seg.values[1], seg.values[2], seg.values[3], seg.values[4], x, y]
          });

          currentX = x;
          currentY = y;
        }

        else if (type === "a") {
          var x = currentX + seg.values[5];
          var y = currentY + seg.values[6];

          absolutizedPathData.push({
            type: "A",
            values: [seg.values[0], seg.values[1], seg.values[2], seg.values[3], seg.values[4], x, y]
          });

          currentX = x;
          currentY = y;
        }

        else if (type === "H") {
          var x = seg.values[0];
          absolutizedPathData.push({type: "H", values: [x]});
          currentX = x;
        }

        else if (type === "h") {
          var x = currentX + seg.values[0];
          absolutizedPathData.push({type: "H", values: [x]});
          currentX = x;
        }

        else if (type === "V") {
          var y = seg.values[0];
          absolutizedPathData.push({type: "V", values: [y]});
          currentY = y;
        }

        else if (type === "v") {
          var y = currentY + seg.values[0];
          absolutizedPathData.push({type: "V", values: [y]});
          currentY = y;
        }

        else if (type === "S") {
          var x2 = seg.values[0];
          var y2 = seg.values[1];
          var x = seg.values[2];
          var y = seg.values[3];

          absolutizedPathData.push({type: "S", values: [x2, y2, x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "s") {
          var x2 = currentX + seg.values[0];
          var y2 = currentY + seg.values[1];
          var x = currentX + seg.values[2];
          var y = currentY + seg.values[3];

          absolutizedPathData.push({type: "S", values: [x2, y2, x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "T") {
          var x = seg.values[0];
          var y = seg.values[1];

          absolutizedPathData.push({type: "T", values: [x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "t") {
          var x = currentX + seg.values[0];
          var y = currentY + seg.values[1];

          absolutizedPathData.push({type: "T", values: [x, y]});

          currentX = x;
          currentY = y;
        }

        else if (type === "Z" || type === "z") {
          absolutizedPathData.push({type: "Z", values: []});

          currentX = subpathX;
          currentY = subpathY;
        }
        /* eslint-enable no-redeclare */
      });

      return absolutizedPathData;
    };

    // @info
    //   Takes path data that consists only from absolute commands, returns path data that consists only from
    //   "M", "L", "C" and "Z" commands.
    var reducePathData = function(pathData) {
      var reducedPathData = [];
      var lastType = null;

      var lastControlX = null;
      var lastControlY = null;

      var currentX = null;
      var currentY = null;

      var subpathX = null;
      var subpathY = null;

      pathData.forEach( function(seg) {
        /* eslint-disable no-redeclare */
        if (seg.type === "M") {
          var x = seg.values[0];
          var y = seg.values[1];

          reducedPathData.push({type: "M", values: [x, y]});

          subpathX = x;
          subpathY = y;

          currentX = x;
          currentY = y;
        }

        else if (seg.type === "C") {
          var x1 = seg.values[0];
          var y1 = seg.values[1];
          var x2 = seg.values[2];
          var y2 = seg.values[3];
          var x = seg.values[4];
          var y = seg.values[5];

          reducedPathData.push({type: "C", values: [x1, y1, x2, y2, x, y]});

          lastControlX = x2;
          lastControlY = y2;

          currentX = x;
          currentY = y;
        }

        else if (seg.type === "L") {
          var x = seg.values[0];
          var y = seg.values[1];

          reducedPathData.push({type: "L", values: [x, y]});

          currentX = x;
          currentY = y;
        }

        else if (seg.type === "H") {
          var x = seg.values[0];

          reducedPathData.push({type: "L", values: [x, currentY]});

          currentX = x;
        }

        else if (seg.type === "V") {
          var y = seg.values[0];

          reducedPathData.push({type: "L", values: [currentX, y]});

          currentY = y;
        }

        else if (seg.type === "S") {
          var x2 = seg.values[0];
          var y2 = seg.values[1];
          var x = seg.values[2];
          var y = seg.values[3];

          var cx1, cy1;

          if (lastType === "C" || lastType === "S") {
            cx1 = currentX + (currentX - lastControlX);
            cy1 = currentY + (currentY - lastControlY);
          }
          else {
            cx1 = currentX;
            cy1 = currentY;
          }

          reducedPathData.push({type: "C", values: [cx1, cy1, x2, y2, x, y]});

          lastControlX = x2;
          lastControlY = y2;

          currentX = x;
          currentY = y;
        }

        else if (seg.type === "T") {
          var x = seg.values[0];
          var y = seg.values[1];

          var x1, y1;

          if (lastType === "Q" || lastType === "T") {
            x1 = currentX + (currentX - lastControlX);
            y1 = currentY + (currentY - lastControlY);
          }
          else {
            x1 = currentX;
            y1 = currentY;
          }

          var cx1 = currentX + 2 * (x1 - currentX) / 3;
          var cy1 = currentY + 2 * (y1 - currentY) / 3;
          var cx2 = x + 2 * (x1 - x) / 3;
          var cy2 = y + 2 * (y1 - y) / 3;

          reducedPathData.push({type: "C", values: [cx1, cy1, cx2, cy2, x, y]});

          lastControlX = x1;
          lastControlY = y1;

          currentX = x;
          currentY = y;
        }

        else if (seg.type === "Q") {
          var x1 = seg.values[0];
          var y1 = seg.values[1];
          var x = seg.values[2];
          var y = seg.values[3];

          var cx1 = currentX + 2 * (x1 - currentX) / 3;
          var cy1 = currentY + 2 * (y1 - currentY) / 3;
          var cx2 = x + 2 * (x1 - x) / 3;
          var cy2 = y + 2 * (y1 - y) / 3;

          reducedPathData.push({type: "C", values: [cx1, cy1, cx2, cy2, x, y]});

          lastControlX = x1;
          lastControlY = y1;

          currentX = x;
          currentY = y;
        }

        else if (seg.type === "A") {
          var r1 = seg.values[0];
          var r2 = seg.values[1];
          var angle = seg.values[2];
          var largeArcFlag = seg.values[3];
          var sweepFlag = seg.values[4];
          var x = seg.values[5];
          var y = seg.values[6];

          if (r1 === 0 || r2 === 0) {
            reducedPathData.push({type: "C", values: [currentX, currentY, x, y, x, y]});

            currentX = x;
            currentY = y;
          }
          else {
            if (currentX !== x || currentY !== y) {
              var curves = arcToCubicCurves(currentX, currentY, x, y, r1, r2, angle, largeArcFlag, sweepFlag);

              curves.forEach( function(curve) {
                reducedPathData.push({type: "C", values: curve});

                currentX = x;
                currentY = y;
              });
            }
          }
        }

        else if (seg.type === "Z") {
          reducedPathData.push(seg);

          currentX = subpathX;
          currentY = subpathY;
        }

        lastType = seg.type;
        /* eslint-enable no-redeclare */
      });

      return reducedPathData;
    };

    window.SVGPathElement.prototype.setAttribute = function(name, value) {
      if (name === "d") {
        this[$cachedPathData] = null;
        this[$cachedNormalizedPathData] = null;
      }

      setAttribute.call(this, name, value);
    };

    window.SVGPathElement.prototype.removeAttribute = function(name, value) {
      if (name === "d") {
        this[$cachedPathData] = null;
        this[$cachedNormalizedPathData] = null;
      }

      removeAttribute.call(this, name);
    };

    window.SVGPathElement.prototype.getPathData = function(options) {
      /* eslint-disable no-redeclare */
      if (options && options.normalize) {
        if (this[$cachedNormalizedPathData]) {
          return clonePathData(this[$cachedNormalizedPathData]);
        }
        else {
          var pathData;

          if (this[$cachedPathData]) {
            pathData = clonePathData(this[$cachedPathData]);
          }
          else {
            pathData = parsePathDataString(this.getAttribute("d") || "");
            this[$cachedPathData] = clonePathData(pathData);
          }

          var normalizedPathData = reducePathData(absolutizePathData(pathData));
          this[$cachedNormalizedPathData] = clonePathData(normalizedPathData);
          return normalizedPathData;
        }
      }
      else {
        if (this[$cachedPathData]) {
          return clonePathData(this[$cachedPathData]);
        }
        else {
          var pathData = parsePathDataString(this.getAttribute("d") || "");
          this[$cachedPathData] = clonePathData(pathData);
          return pathData;
        }
      }
      /* eslint-enable no-redeclare */
    };

    window.SVGPathElement.prototype.setPathData = function(pathData) {
      if (pathData.length === 0) {
        if (isIE) {
          // @bugfix https://github.com/mbostock/d3/issues/1737
          this.setAttribute("d", "");
        }
        else {
          this.removeAttribute("d");
        }
      }
      else {
        var d = "";

        for (var i = 0, l = pathData.length; i < l; i += 1) {
          var seg = pathData[i];

          if (i > 0) {
            d += " ";
          }

          d += seg.type;

          if (seg.values && seg.values.length > 0) {
            d += " " + seg.values.join(" ");
          }
        }

        this.setAttribute("d", d);
      }
    };

    window.SVGRectElement.prototype.getPathData = function(options) {
      var x = this.x.baseVal.value;
      var y = this.y.baseVal.value;
      var width = this.width.baseVal.value;
      var height = this.height.baseVal.value;
      var rx = this.hasAttribute("rx") ? this.rx.baseVal.value : this.ry.baseVal.value;
      var ry = this.hasAttribute("ry") ? this.ry.baseVal.value : this.rx.baseVal.value;

      if (rx > width / 2) {
        rx = width / 2;
      }

      if (ry > height / 2) {
        ry = height / 2;
      }

      var pathData = [
        {type: "M", values: [x+rx, y]},
        {type: "H", values: [x+width-rx]},
        {type: "A", values: [rx, ry, 0, 0, 1, x+width, y+ry]},
        {type: "V", values: [y+height-ry]},
        {type: "A", values: [rx, ry, 0, 0, 1, x+width-rx, y+height]},
        {type: "H", values: [x+rx]},
        {type: "A", values: [rx, ry, 0, 0, 1, x, y+height-ry]},
        {type: "V", values: [y+ry]},
        {type: "A", values: [rx, ry, 0, 0, 1, x+rx, y]},
        {type: "Z", values: []}
      ];

      // Get rid of redundant "A" segs when either rx or ry is 0
      pathData = pathData.filter(function(s) {
        return s.type === "A" && (s.values[0] === 0 || s.values[1] === 0) ? false : true;
      });

      if (options && options.normalize === true) {
        pathData = reducePathData(pathData);
      }

      return pathData;
    };

    window.SVGCircleElement.prototype.getPathData = function(options) {
      var cx = this.cx.baseVal.value;
      var cy = this.cy.baseVal.value;
      var r = this.r.baseVal.value;

      var pathData = [
        { type: "M",  values: [cx + r, cy] },
        { type: "A",  values: [r, r, 0, 0, 1, cx, cy+r] },
        { type: "A",  values: [r, r, 0, 0, 1, cx-r, cy] },
        { type: "A",  values: [r, r, 0, 0, 1, cx, cy-r] },
        { type: "A",  values: [r, r, 0, 0, 1, cx+r, cy] },
        { type: "Z",  values: [] }
      ];

      if (options && options.normalize === true) {
        pathData = reducePathData(pathData);
      }

      return pathData;
    };

    window.SVGEllipseElement.prototype.getPathData = function(options) {
      var cx = this.cx.baseVal.value;
      var cy = this.cy.baseVal.value;
      var rx = this.rx.baseVal.value;
      var ry = this.ry.baseVal.value;

      var pathData = [
        { type: "M",  values: [cx + rx, cy] },
        { type: "A",  values: [rx, ry, 0, 0, 1, cx, cy+ry] },
        { type: "A",  values: [rx, ry, 0, 0, 1, cx-rx, cy] },
        { type: "A",  values: [rx, ry, 0, 0, 1, cx, cy-ry] },
        { type: "A",  values: [rx, ry, 0, 0, 1, cx+rx, cy] },
        { type: "Z",  values: [] }
      ];

      if (options && options.normalize === true) {
        pathData = reducePathData(pathData);
      }

      return pathData;
    };

    window.SVGLineElement.prototype.getPathData = function() {
      return [
        { type: "M", values: [this.x1.baseVal.value, this.y1.baseVal.value] },
        { type: "L", values: [this.x2.baseVal.value, this.y2.baseVal.value] }
      ];
    };

    window.SVGPolylineElement.prototype.getPathData = function() {
      var pathData = [];

      for (var i = 0; i < this.points.numberOfItems; i += 1) {
        var point = this.points.getItem(i);

        pathData.push({
          type: (i === 0 ? "M" : "L"),
          values: [point.x, point.y]
        });
      }

      return pathData;
    };

    window.SVGPolygonElement.prototype.getPathData = function() {
      var pathData = [];

      for (var i = 0; i < this.points.numberOfItems; i += 1) {
        var point = this.points.getItem(i);

        pathData.push({
          type: (i === 0 ? "M" : "L"),
          values: [point.x, point.y]
        });
      }

      pathData.push({
        type: "Z",
        values: []
      });

      return pathData;
    };
  })();
}

}
,
    AnimEvent = function(n){var e={};function t(r){if(e[r])return e[r].exports;var o=e[r]={i:r,l:!1,exports:{}};return n[r].call(o.exports,o,o.exports,t),o.l=!0,o.exports}return t.m=n,t.c=e,t.d=function(n,e,r){t.o(n,e)||Object.defineProperty(n,e,{enumerable:!0,get:r})},t.r=function(n){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(n,"__esModule",{value:!0})},t.t=function(n,e){if(1&e&&(n=t(n)),8&e)return n;if(4&e&&"object"==typeof n&&n&&n.__esModule)return n;var r=Object.create(null);if(t.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:n}),2&e&&"string"!=typeof n)for(var o in n)t.d(r,o,function(e){return n[e]}.bind(null,o));return r},t.n=function(n){var e=n&&n.__esModule?function(){return n.default}:function(){return n};return t.d(e,"a",e),e},t.o=function(n,e){return Object.prototype.hasOwnProperty.call(n,e)},t.p="",t(t.s=0)}([function(n,e,t){"use strict";t.r(e);var r=500,o=[],i=window.requestAnimationFrame||window.mozRequestAnimationFrame||window.webkitRequestAnimationFrame||window.msRequestAnimationFrame||function(n){return setTimeout(n,1e3/60)},u=window.cancelAnimationFrame||window.mozCancelAnimationFrame||window.webkitCancelAnimationFrame||window.msCancelAnimationFrame||function(n){return clearTimeout(n)},a=Date.now(),l=void 0;function c(){var n=void 0,e=void 0;l&&(u.call(window,l),l=null),o.forEach(function(e){var t;(t=e.event)&&(e.event=null,e.listener(t),n=!0)}),n?(a=Date.now(),e=!0):Date.now()-a<r&&(e=!0),e&&(l=i.call(window,c))}function f(n){var e=-1;return o.some(function(t,r){return t.listener===n&&(e=r,!0)}),e}var d={add:function(n){var e=void 0;return-1===f(n)?(o.push(e={listener:n}),function(n){e.event=n,l||c()}):null},remove:function(n){var e;(e=f(n))>-1&&(o.splice(e,1),!o.length&&l&&(u.call(window,l),l=null))}};e.default=d}]).default,

    /** @typedef {{hasSE, hasProps, iniValue}} StatConf */
    /** @type {{statId: string, StatConf}} */
    STATS = {
      line_altColor: {iniValue: false}, line_color: {}, line_colorTra: {iniValue: false}, line_strokeWidth: {},
      plug_enabled: {iniValue: false}, plug_enabledSE: {hasSE: true, iniValue: false},
      plug_plugSE: {hasSE: true, iniValue: PLUG_BEHIND},
      plug_colorSE: {hasSE: true}, plug_colorTraSE: {hasSE: true, iniValue: false},
      plug_markerWidthSE: {hasSE: true}, plug_markerHeightSE: {hasSE: true},
      lineOutline_enabled: {iniValue: false},
      lineOutline_color: {}, lineOutline_colorTra: {iniValue: false},
      lineOutline_strokeWidth: {}, lineOutline_inStrokeWidth: {},
      plugOutline_enabledSE: {hasSE: true, iniValue: false},
      plugOutline_plugSE: {hasSE: true, iniValue: PLUG_BEHIND},
      plugOutline_colorSE: {hasSE: true}, plugOutline_colorTraSE: {hasSE: true, iniValue: false},
      plugOutline_strokeWidthSE: {hasSE: true}, plugOutline_inStrokeWidthSE: {hasSE: true},
      position_socketXYSE: {hasSE: true, hasProps: true}, position_plugOverheadSE: {hasSE: true},
      position_path: {}, position_lineStrokeWidth: {}, position_socketGravitySE: {hasSE: true},
      path_pathData: {}, path_edge: {hasProps: true},
      viewBox_bBox: {hasProps: true}, viewBox_plugBCircleSE: {hasSE: true},
      lineMask_enabled: {iniValue: false},
      lineMask_outlineMode: {iniValue: false},
      lineMask_x: {}, lineMask_y: {},
      lineOutlineMask_x: {}, lineOutlineMask_y: {},
      maskBGRect_x: {}, maskBGRect_y: {},
      capsMaskAnchor_enabledSE: {hasSE: true, iniValue: false},
      capsMaskAnchor_pathDataSE: {hasSE: true},
      capsMaskAnchor_strokeWidthSE: {hasSE: true},
      capsMaskMarker_enabled: {iniValue: false}, capsMaskMarker_enabledSE: {hasSE: true, iniValue: false},
      capsMaskMarker_plugSE: {hasSE: true, iniValue: PLUG_BEHIND},
      capsMaskMarker_markerWidthSE: {hasSE: true}, capsMaskMarker_markerHeightSE: {hasSE: true},
      caps_enabled: {iniValue: false},
      attach_plugSideLenSE: {hasSE: true}, attach_plugBackLenSE: {hasSE: true}
    },
    SHOW_STATS = {
      show_on: {}, show_effect: {}, show_animOptions: {}, show_animId: {}, show_inAnim: {}
    },

    EFFECTS, SHOW_EFFECTS, ATTACHMENTS, LeaderLineAttachment,
    DEFAULT_SHOW_EFFECT = 'fade',
    isAttachment, removeAttachment,
    delayedProcs = [], timerDelayedProc,

    /** @type {Object.<_id: number, props>} */
    insProps = {}, insId = 0,
    /** @type {Object.<_id: number, props>} */
    insAttachProps = {}, insAttachId = 0,
    svg2SupportedReverse, svg2SupportedPaintOrder, svg2SupportedDropShadow; // Supported SVG 2 features


  function hasChanged(a, b) {
    var typeA, keysA;
    return typeof a !== typeof b ||
      (typeA = isObject(a) ? 'obj' : Array.isArray(a) ? 'array' : '') !==
        (isObject(b) ? 'obj' : Array.isArray(b) ? 'array' : '') ||
      (
        typeA === 'obj' ?
          hasChanged((keysA = Object.keys(a).sort()), Object.keys(b).sort()) ||
            keysA.some(function(prop) { return hasChanged(a[prop], b[prop]); }) :
        typeA === 'array' ?
          a.length !== b.length || a.some(function(aVal, i) { return hasChanged(aVal, b[i]); }) :
        a !== b
      );
  }

  function copyTree(obj) {
    return !obj ? obj :
      isObject(obj) ? Object.keys(obj).reduce(function(copyObj, key) {
        copyObj[key] = copyTree(obj[key]);
        return copyObj;
      }, {}) :
      Array.isArray(obj) ? obj.map(copyTree) : obj;
  }

  /**
   * Parse and get an alpha channel in color notation.
   * @param {string} color - A color notation such as `'rgba(10, 20, 30, 0.6)'`.
   * @returns {Array} Alpha channel ([0, 1]) such as `0.6`, and base color. e.g. [0.6, 'rgb(10, 20, 30)']
   */
  function getAlpha(color) {
    var matches, func, args, alpha = 1, baseColor = (color = (color + '').trim());

    function parseAlpha(value) {
      var alpha = 1, matches = RE_PERCENT.exec(value);
      if (matches) {
        alpha = parseFloat(matches[1]);
        if (matches[2]) {
          alpha = alpha >= 0 && alpha <= 100 ? alpha / 100 : 1;
        } else if (alpha < 0 || alpha > 1) {
          alpha = 1;
        }
      }
      return alpha;
    }

    // Unsupported: `currentcolor`, `color()`, `deprecated-system-color`
    if ((matches = /^(rgba|hsla|hwb|gray|device\-cmyk)\s*\(([\s\S]+)\)$/i.exec(color))) {
      func = matches[1].toLowerCase();
      args = matches[2].trim().split(/\s*,\s*/);
      if (func === 'rgba' && args.length === 4) {
        alpha = parseAlpha(args[3]);
        baseColor = 'rgb(' + args.slice(0, 3).join(', ') + ')';
      } else if (func === 'hsla' && args.length === 4) {
        alpha = parseAlpha(args[3]);
        baseColor = 'hsl(' + args.slice(0, 3).join(', ') + ')';
      } else if (func === 'hwb' && args.length === 4) {
        alpha = parseAlpha(args[3]);
        baseColor = 'hwb(' + args.slice(0, 3).join(', ') + ')';
      } else if (func === 'gray' && args.length === 2) {
        alpha = parseAlpha(args[1]);
        baseColor = 'gray(' + args[0] + ')';
      } else if (func === 'device-cmyk' && args.length >= 5) {
        alpha = parseAlpha(args[4]);
        baseColor = 'device-cmyk(' + args.slice(0, 4).join(', ') + ')'; // omit <F>
      }
    } else if ((matches = /^\#(?:([\da-f]{6})([\da-f]{2})|([\da-f]{3})([\da-f]))$/i.exec(color))) {
      if (matches[1]) {
        alpha = parseInt(matches[2], 16) / 255;
        baseColor = '#' + matches[1];
      } else {
        alpha = parseInt(matches[4] + matches[4], 16) / 255;
        baseColor = '#' + matches[3];
      }
    } else if (color.toLocaleLowerCase() === 'transparent') {
      alpha = 0;
    }
    return [alpha, baseColor];
  }

  /**
   * Add `mouseenter` and `mouseleave` event listeners to the element.
   * @param {Element} element - Target element.
   * @param {Function} enter - Event listener.
   * @param {Function} leave - Event listener.
   * @returns {Function} Function that removes the added listeners.
   */
  function mouseEnterLeave(element, enter, leave) {
    var over, out;
    if ('onmouseenter' in element && 'onmouseleave' in element) { // Supported
      element.addEventListener('mouseenter', enter, false);
      element.addEventListener('mouseleave', leave, false);
      return function() {
        element.removeEventListener('mouseenter', enter, false);
        element.removeEventListener('mouseleave', leave, false);
      };

    } else { // Unsupported
      console.warn('mouseenter and mouseleave events polyfill is enabled.');
      over = function(event) {
        /* eslint-disable no-invalid-this */
        if (!event.relatedTarget ||
            event.relatedTarget !== this &&
            !(this.compareDocumentPosition(event.relatedTarget) & Node.DOCUMENT_POSITION_CONTAINED_BY)) {
          enter.apply(this, arguments);
        }
        /* eslint-enable no-invalid-this */
      };
      element.addEventListener('mouseover', over);
      out = function(event) {
        /* eslint-disable no-invalid-this */
        if (!event.relatedTarget ||
            event.relatedTarget !== this &&
            !(this.compareDocumentPosition(event.relatedTarget) & Node.DOCUMENT_POSITION_CONTAINED_BY)) {
          leave.apply(this, arguments);
        }
        /* eslint-enable no-invalid-this */
      };
      element.addEventListener('mouseout', out);
      return function() {
        element.removeEventListener('mouseover', over, false);
        element.removeEventListener('mouseout', out, false);
      };
    }
  }

  function isElement(element) {
    // The checking the interface may not be required.
    // var win, doc;
    // return !!(element && (doc = element.ownerDocument) && (win = doc.defaultView) && win.HTMLElement &&
    //   element instanceof win.HTMLElement);
    return !!(element && element.nodeType === Node.ELEMENT_NODE &&
      typeof element.getBoundingClientRect === 'function');
  }

  /**
   * Get an element's bounding-box that contains coordinates relative to the element's document or window.
   * @param {Element} element - Target element.
   * @param {boolean} [relWindow] - Whether it's relative to the element's window, or document (i.e. `<html>`).
   * @returns {(BBox|null)} A bounding-box or null when failed.
   */
  function getBBox(element, relWindow) {
    var bBox = {}, rect, prop, doc, win;
    if (!(doc = element.getRootNode())) {
      console.error('Cannot get document that contains the element.');
      return null;
    }
    if (element.compareDocumentPosition(doc) & Node.DOCUMENT_POSITION_DISCONNECTED) {
      console.error('A disconnected element was passed.');
      return null;
    }

    rect = element.getBoundingClientRect();
    for (prop in rect) { bBox[prop] = rect[prop]; } // eslint-disable-line guard-for-in

    if (!relWindow) {
      if (!(win = doc.defaultView || window)) {
        console.error('Cannot get window that contains the element.');
        return null;
      }
      bBox.left += win.pageXOffset;
      bBox.right += win.pageXOffset;
      bBox.top += win.pageYOffset;
      bBox.bottom += win.pageYOffset;
    }

    return bBox;
  }

  /**
   * Get distance between an element's bounding-box and its content (`<iframe>` element and its document).
   * @param {Element} element - Target element.
   * @returns {{left: number, top: number}} An object has `left` and `top`.
   */
  function getContentOffset(element) {
    var styles = element.ownerDocument.defaultView.getComputedStyle(element, '');
    return {
      left: element.clientLeft + parseFloat(styles.paddingLeft),
      top: element.clientTop + parseFloat(styles.paddingTop)
    };
  }

  /**
   * Get `<iframe>` elements in path to an element.
   * @param {Element} element - Target element.
   * @param {Window} [baseWindow] - Start searching at this window. This is excluded from result.
   * @returns {(Element[]|null)} An array of `<iframe>` elements or null when `baseWindow` was not found in the path.
   */
  function getFrames(element, baseWindow) {
    var frames = [], curElement = element, doc, win;
    baseWindow = baseWindow || window;
    while (true) {
      if (!(doc = curElement.ownerDocument)) {
        console.error('Cannot get document that contains the element.');
        return null;
      }
      if (!(win = doc.defaultView)) {
        console.error('Cannot get window that contains the element.');
        return null;
      }
      if (win === baseWindow) { break; }
      if (!(curElement = win.frameElement)) {
        console.error('`baseWindow` was not found.'); // top-level window
        return null;
      }
      frames.unshift(curElement);
    }
    return frames;
  }

  /**
   * Get an element's bounding-box that contains coordinates relative to document of specified window.
   * @param {Element} element - Target element.
   * @param {Window} [baseWindow] - Window that is base of coordinates.
   * @returns {(BBox|null)} A bounding-box or null when failed.
   */
  function getBBoxNest(element, baseWindow) {
    var left = 0, top = 0, bBox, frames;
    baseWindow = baseWindow || window;
    if (!(frames = getFrames(element, baseWindow))) { return null; }
    if (!frames.length) { // no frame
      return getBBox(element);
    }
    frames.forEach(function(frame, i) {
      var coordinates = getBBox(frame, i > 0); // relative to document when 1st one.
      left += coordinates.left;
      top += coordinates.top;
      coordinates = getContentOffset(frame);
      left += coordinates.left;
      top += coordinates.top;
    });
    bBox = getBBox(element, true);
    bBox.left += left;
    bBox.right += left;
    bBox.top += top;
    bBox.bottom += top;
    return bBox;
  }

  /**
   * Get a common ancestor window.
   * @param {Element} elm1 - A contained element.
   * @param {Element} elm2 - A contained element.
   * @returns {Window} A common ancestor window.
   */
  function getCommonWindow(elm1, elm2) {
    var frames1, frames2, commonWindow;
    if (!(frames1 = getFrames(elm1)) || !(frames2 = getFrames(elm2))) {
      throw new Error('Cannot get frames.');
    }
    if (frames1.length && frames2.length) {
      frames1.reverse();
      frames2.reverse();
      frames1.some(function(frame1) {
        return frames2.some(function(frame2) {
          if (frame2 === frame1) {
            commonWindow = frame2.contentWindow;
            return true;
          }
          return false;
        });
      });
    }
    return commonWindow || window;
  }

  function getPointsLength(p0, p1) {
    var lx = p0.x - p1.x, ly = p0.y - p1.y;
    return Math.sqrt(lx * lx + ly * ly);
  }

  function getPointOnLine(p0, p1, r) {
    var xA = p1.x - p0.x, yA = p1.y - p0.y;
    return {
      x: p0.x + xA * r,
      y: p0.y + yA * r,
      angle: Math.atan2(yA, xA) / (Math.PI / 180)
    };
  }

  function getIntersection(line1P0, line1P1, line2P0, line2P1) {
    var sx1 = line1P1.x - line1P0.x, sy1 = line1P1.y - line1P0.y,
      sx2 = line2P1.x - line2P0.x, sy2 = line2P1.y - line2P0.y,
      s = (-sy1 * (line1P0.x - line2P0.x) + sx1 * (line1P0.y - line2P0.y)) / (-sx2 * sy1 + sx1 * sy2),
      t = (sx2 * (line1P0.y - line2P0.y) - sy2 * (line1P0.x - line2P0.x)) / (-sx2 * sy1 + sx1 * sy2);

    return s >= 0 && s <= 1 && t >= 0 && t <= 1 ?
      {x: line1P0.x + (t * sx1), y: line1P0.y + (t * sy1)} : null;
  }

  function extendLine(p0, p1, len) {
    var angle = Math.atan2(p0.y - p1.y, p1.x - p0.x);
    return {x: p1.x + Math.cos(angle) * len, y: p1.y + Math.sin(angle) * len * -1};
  }

  function getPointOnCubic(p0, p1, p2, p3, t) {
    var
      t2 = t * t,
      t3 = t2 * t,
      t1 = 1 - t,
      t12 = t1 * t1,
      t13 = t12 * t1,
      x = t13 * p0.x + 3 * t12 * t * p1.x + 3 * t1 * t2 * p2.x + t3 * p3.x,
      y = t13 * p0.y + 3 * t12 * t * p1.y + 3 * t1 * t2 * p2.y + t3 * p3.y,
      mx = p0.x + 2 * t * (p1.x - p0.x) + t2 * (p2.x - 2 * p1.x + p0.x),
      my = p0.y + 2 * t * (p1.y - p0.y) + t2 * (p2.y - 2 * p1.y + p0.y),
      nx = p1.x + 2 * t * (p2.x - p1.x) + t2 * (p3.x - 2 * p2.x + p1.x),
      ny = p1.y + 2 * t * (p2.y - p1.y) + t2 * (p3.y - 2 * p2.y + p1.y),
      ax = t1 * p0.x + t * p1.x,
      ay = t1 * p0.y + t * p1.y,
      cx = t1 * p2.x + t * p3.x,
      cy = t1 * p2.y + t * p3.y,
      angle = (90 - Math.atan2(mx - nx, my - ny) * 180 / Math.PI);

    angle += angle > 180 ? -180 : 180;
    // from:  new path of side to p0
    // to:    new path of side to p3
    /* eslint-disable key-spacing */
    return {x: x, y: y,
      fromP2: {x: mx, y: my},
      toP1:   {x: nx, y: ny},
      fromP1: {x: ax, y: ay},
      toP2:   {x: cx, y: cy},
      angle:  angle
    };
    /* eslint-enable key-spacing */
  }

  function getCubicLength(p0, p1, p2, p3, t) {
    function base3(t, p0v, p1v, p2v, p3v) {
      return t * (t * (-3 * p0v + 9 * p1v - 9 * p2v + 3 * p3v) +
        6 * p0v - 12 * p1v + 6 * p2v) - 3 * p0v + 3 * p1v;
    }

    var
      TVALUES = [-0.1252, 0.1252, -0.3678, 0.3678, -0.5873, 0.5873,
        -0.7699, 0.7699, -0.9041, 0.9041, -0.9816, 0.9816],
      CVALUES = [0.2491, 0.2491, 0.2335, 0.2335, 0.2032, 0.2032,
        0.1601, 0.1601, 0.1069, 0.1069, 0.0472, 0.0472],
      sum = 0, z2, ct, xbase, ybase, comb;

    t = t == null || t > 1 ? 1 : t < 0 ? 0 : t;
    z2 = t / 2;
    TVALUES.forEach(function(tValue, i) {
      ct = z2 * tValue + z2;
      xbase = base3(ct, p0.x, p1.x, p2.x, p3.x);
      ybase = base3(ct, p0.y, p1.y, p2.y, p3.y);
      comb = xbase * xbase + ybase * ybase;
      sum += CVALUES[i] * Math.sqrt(comb);
    });
    return z2 * sum;
  }

  function getCubicT(p0, p1, p2, p3, len) {
    var E = 0.01,
      step = 1 / 2, t2 = 1 - step, l;
    while (true) {
      l = getCubicLength(p0, p1, p2, p3, t2);
      if (Math.abs(l - len) <= E) { break; }
      step /= 2;
      t2 += (l < len ? 1 : -1) * step;
    }
    return t2;
  }

  function getOffsetLine(p0, p1, offsetLen) {
    var angle = Math.atan2(p0.y - p1.y, p1.x - p0.x) + Math.PI * 0.5;
    return [
      {x: p0.x + Math.cos(angle) * offsetLen, y: p0.y + Math.sin(angle) * offsetLen * -1},
      {x: p1.x + Math.cos(angle) * offsetLen, y: p1.y + Math.sin(angle) * offsetLen * -1}
    ];
  }

  function getOffsetCubic(p0, p1, p2, p3, offsetLen, stepLen) {
    var parts = getCubicLength(p0, p1, p2, p3) / stepLen,
      tStep = 1 / (offsetLen > stepLen ? parts * (offsetLen / stepLen) : parts),
      points = [], pointOnPath, angle, t = 0;

    while (true) {
      pointOnPath = getPointOnCubic(p0, p1, p2, p3, t);
      angle = (-pointOnPath.angle + 90) * (Math.PI / 180);
      points.push({
        x: pointOnPath.x + Math.cos(angle) * offsetLen,
        y: pointOnPath.y + Math.sin(angle) * offsetLen * -1
      });
      if (t >= 1) { break; }
      t += tStep;
      if (t > 1) { t = 1; }
    }
    return points;
  }

  function pathList2PathData(pathList, cbPoint) {
    var pathData;
    pathList.forEach(function(pointsOrg) {
      var points = cbPoint ? pointsOrg.map(function(pointOrg) {
        var point = {x: pointOrg.x, y: pointOrg.y};
        cbPoint(point);
        return point;
      }) : pointsOrg;
      // error is thrown if `points` has no data
      if (!pathData) { pathData = [{type: 'M', values: [points[0].x, points[0].y]}]; }
      pathData.push(
        !points.length ? {type: 'Z', values: []} :
        points.length === 2 ? {type: 'L', values: [points[1].x, points[1].y]} :
          {type: 'C', values: [points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y]});
    });
    return pathData;
  }

  function getAllPathListLen(pathList) {
    var pathSegsLen = [], pathLenAll = 0;
    pathList.forEach(function(points) {
      var pathLen = (points.length === 2 ? getPointsLength : getCubicLength).apply(null, points);
      pathSegsLen.push(pathLen);
      pathLenAll += pathLen;
    });
    return {segsLen: pathSegsLen, lenAll: pathLenAll};
  }

  function getAllPathDataLen(pathData) {
    var curPoint;
    return pathData.reduce(function(pathLenAll, pathSeg) {
      var values = pathSeg.values, endPoint;
      switch (pathSeg.type) {
        case 'M':
          curPoint = {x: values[0], y: values[1]};
          break;
        case 'L':
          endPoint = {x: values[0], y: values[1]};
          if (curPoint) {
            pathLenAll += getPointsLength(curPoint, endPoint);
          }
          curPoint = endPoint;
          break;
        case 'C':
          endPoint = {x: values[4], y: values[5]};
          if (curPoint) {
            pathLenAll += getCubicLength(curPoint,
              {x: values[0], y: values[1]}, {x: values[2], y: values[3]}, endPoint);
          }
          curPoint = endPoint;
          break;
        // no default
      }
      return pathLenAll;
    }, 0);
  }

  function pathDataHasChanged(a, b) {
    return a == null || b == null ||
      a.length !== b.length || a.some(function(aSeg, i) {
        var bSeg = b[i];
        return aSeg.type !== bSeg.type ||
          aSeg.values.some(function(aSegValue, i) { return aSegValue !== bSeg.values[i]; });
      });
  }

  function bBox2PathData(bBox) {
    var right = bBox.right != null ? bBox.right : bBox.left + bBox.width,
      bottom = bBox.bottom != null ? bBox.bottom : bBox.top + bBox.height;
    return [
      {type: 'M', values: [bBox.left, bBox.top]},
      {type: 'L', values: [right, bBox.top]},
      {type: 'L', values: [right, bottom]},
      {type: 'L', values: [bBox.left, bottom]},
      {type: 'Z', values: []}
    ];
  }

  function addEventHandler(props, type, handler) {
    if (!props.events[type]) {
      props.events[type] = [handler];
    } else if (props.events[type].indexOf(handler) < 0) {
      props.events[type].push(handler);
    }
  }

  function removeEventHandler(props, type, handler) {
    var i;
    if (props.events[type] && (i = props.events[type].indexOf(handler)) > -1) {
      props.events[type].splice(i, 1);
    }
  }

  function addDelayedProc(proc) {
    function execDelayedProcs() {
      delayedProcs.forEach(function(proc) { proc(); });
      delayedProcs = [];
    }
    if (timerDelayedProc) { clearTimeout(timerDelayedProc); }
    delayedProcs.push(proc);
    timerDelayedProc = setTimeout(execDelayedProcs, 0);
  }

  function forceReflow(target) {
    // for TRIDENT and BLINK bug (reflow like `offsetWidth` can't update)
    setTimeout(function() {
      var parent = target.parentNode, next = target.nextSibling;
      // It has to be removed first for BLINK.
      parent.insertBefore(parent.removeChild(target), next);
    }, 0);
  }

  function forceReflowAdd(props, target) {
    if (props.reflowTargets.indexOf(target) < 0) { props.reflowTargets.push(target); }
  }

  function forceReflowApply(props) {
    props.reflowTargets.forEach(function(target) { forceReflow(target); });
    props.reflowTargets = [];
  }

  /**
   * Apply `orient` (and `viewBox`) to `marker`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {SVGMarkerElement} marker - Target `<marker>` element.
   * @param {string} orient - `'auto'`, `'auto-start-reverse'` or angle.
   * @param {BBox} bBox - `BBox` as `viewBox` of the marker.
   * @param {SVGSVGElement} svg - Parent `<svg>` element.
   * @param {SVGElement} shape - An element that is shown as marker.
   * @param {SVGElement} marked - Target element that has `marker-start/end` such as `<path>`.
   * @returns {void}
   */
  function setMarkerOrient(props, marker, orient, bBox, svg, shape, marked) {
    var transform, viewBox, reverseView;
    // `setOrientToAuto()`, `setOrientToAngle()`, `orientType` and `orientAngle` of
    // `SVGMarkerElement` don't work in browsers other than Chrome.
    if (orient === 'auto-start-reverse') {
      if (typeof svg2SupportedReverse !== 'boolean') {
        marker.setAttribute('orient', 'auto-start-reverse');
        svg2SupportedReverse = marker.orientType.baseVal === SVGMarkerElement.SVG_MARKER_ORIENT_UNKNOWN;
      }
      if (svg2SupportedReverse) {
        marker.setAttribute('orient', orient);
      } else {
        transform = svg.createSVGTransform();
        transform.setRotate(180, 0, 0);
        shape.transform.baseVal.appendItem(transform);
        marker.setAttribute('orient', 'auto');
        reverseView = true;
      }
    } else {
      marker.setAttribute('orient', orient);
      if (svg2SupportedReverse === false) { shape.transform.baseVal.clear(); }
    }

    viewBox = marker.viewBox.baseVal;
    if (reverseView) {
      viewBox.x = -bBox.right;
      viewBox.y = -bBox.bottom;
    } else {
      viewBox.x = bBox.left;
      viewBox.y = bBox.top;
    }
    viewBox.width = bBox.width;
    viewBox.height = bBox.height;

    // [TRIDENT] markerOrient is not updated when plugSE is changed
    if (IS_TRIDENT) { forceReflowAdd(props, marked); }
  }

  function getMarkerProps(i, symbolConf) {
    return {
      prop: i ? 'markerEnd' : 'markerStart',
      orient: !symbolConf ? null : symbolConf.noRotate ? '0' : i ? 'auto' : 'auto-start-reverse'
    };
  }

  /**
   * @param {Document} document - document
   * @param {string} id - id
   * @returns {Object} {elmFilter, elmOffset, elmBlur, styleFlood, elmsAppend}
   */
  function newDropShadow(document, id) {
    var dropShadow = {}, filter, element;

    if (typeof svg2SupportedDropShadow !== 'boolean') {
      // [WEBKIT] stdDeviation has bug
      svg2SupportedDropShadow = !!window.SVGFEDropShadowElement && !IS_WEBKIT;
    }

    dropShadow.elmsAppend = [(dropShadow.elmFilter = filter = document.createElementNS(SVG_NS, 'filter'))];
    // sizing for GECKO and TRIDENT
    filter.filterUnits.baseVal = SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE;
    filter.x.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0);
    filter.y.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0);
    filter.width.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100);
    filter.height.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100);
    filter.id = id;

    if (svg2SupportedDropShadow) {
      dropShadow.elmOffset = dropShadow.elmBlur =
        (element = filter.appendChild(document.createElementNS(SVG_NS, 'feDropShadow')));
      dropShadow.styleFlood = element.style;

    } else {
      dropShadow.elmBlur = filter.appendChild(document.createElementNS(SVG_NS, 'feGaussianBlur'));
      dropShadow.elmOffset = element = filter.appendChild(document.createElementNS(SVG_NS, 'feOffset'));
      element.result.baseVal = 'offsetblur';
      element = filter.appendChild(document.createElementNS(SVG_NS, 'feFlood'));
      dropShadow.styleFlood = element.style;
      element = filter.appendChild(document.createElementNS(SVG_NS, 'feComposite'));
      element.in2.baseVal = 'offsetblur';
      element.operator.baseVal = SVGFECompositeElement.SVG_FECOMPOSITE_OPERATOR_IN;
      element = filter.appendChild(document.createElementNS(SVG_NS, 'feMerge'));
      element.appendChild(document.createElementNS(SVG_NS, 'feMergeNode'));
      element.appendChild(document.createElementNS(SVG_NS, 'feMergeNode')).in1.baseVal = 'SourceGraphic';
    }
    return dropShadow;
  }

  function initStats(container, statsConf) {
    Object.keys(statsConf).forEach(function(statName) {
      var statConf = statsConf[statName];
      container[statName] =
        statConf.iniValue != null ? (
          statConf.hasSE ? [statConf.iniValue, statConf.iniValue] : statConf.iniValue
        ) :
        statConf.hasSE ? (statConf.hasProps ? [{}, {}] : []) : statConf.hasProps ? {} : null;
    });
  }

  function setStat(props, container, key, value, eventHandlers) {
    if (value !== container[key]) {
      container[key] = value;
      if (eventHandlers) {
        eventHandlers.forEach(function(handler) { handler(props, value, key); });
      }
      return true;
    }
    return false;
  }

  /**
   * Get distance between `window` and its `<body>`.
   * @param {Window} window - Target `window`.
   * @returns {{x: number, y: number}} Length.
   */
  function getBodyOffset(window) {
    function sumProps(value, addValue) { return (value += parseFloat(addValue)); }

    var baseDocument = window.document,
      stylesHtml = window.getComputedStyle(baseDocument.documentElement, ''),
      stylesBody = window.getComputedStyle(baseDocument.body, ''),
      bodyOffset = {x: 0, y: 0};

    if (stylesBody.position !== 'static') {
      // When `<body>` has `position:(non-static)`,
      // `element{position:absolute}` is positioned relative to border-box of `<body>`.
      bodyOffset.x -=
        [stylesHtml.marginLeft, stylesHtml.borderLeftWidth, stylesHtml.paddingLeft,
          stylesBody.marginLeft, stylesBody.borderLeftWidth].reduce(sumProps, 0);
      bodyOffset.y -=
        [stylesHtml.marginTop, stylesHtml.borderTopWidth, stylesHtml.paddingTop,
          stylesBody.marginTop, stylesBody.borderTopWidth].reduce(sumProps, 0);
    } else if (stylesHtml.position !== 'static') {
      // When `<body>` has `position:static` and `<html>` has `position:(non-static)`
      // `element{position:absolute}` is positioned relative to border-box of `<html>`.
      bodyOffset.x -=
        [stylesHtml.marginLeft, stylesHtml.borderLeftWidth].reduce(sumProps, 0);
      bodyOffset.y -=
        [stylesHtml.marginTop, stylesHtml.borderTopWidth].reduce(sumProps, 0);
    }
    return bodyOffset;
  }

  function setupWindow(window) {
    var baseDocument = window.document, defsSvg;
    if (!baseDocument.getElementById(DEFS_ID)) { // Add svg defs
      defsSvg = (new window.DOMParser()).parseFromString(DEFS_HTML, 'image/svg+xml');
      baseDocument.body.appendChild(defsSvg.documentElement);
      pathDataPolyfill(window);
    }
  }

  /**
   * Setup `baseWindow`, stats (`cur*` and `apl*`), SVG elements, etc.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Window} newWindow - A common ancestor `window`.
   * @returns {void}
   */
  function bindWindow(props, newWindow) {
    var aplStats = props.aplStats, baseDocument = newWindow.document,
      svg, defs, maskCaps, element, prefix = APP_ID + '-' + props._id,
      linePathId, lineShapeId, capsId, maskBGRectId, lineOutlineMaskId, plugOutlineMaskIdSE;

    function setupMask(id) {
      var element = defs.appendChild(baseDocument.createElementNS(SVG_NS, 'mask'));
      element.id = id;
      element.maskUnits.baseVal = SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE;
      [element.x, element.y, element.width, element.height].forEach(function(len) {
        len.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0);
      });
      return element;
    }

    function setupMarker(id) {
      var element = defs.appendChild(baseDocument.createElementNS(SVG_NS, 'marker'));
      element.id = id;
      element.markerUnits.baseVal = SVGMarkerElement.SVG_MARKERUNITS_STROKEWIDTH;
      if (!element.viewBox.baseVal) {
        element.setAttribute('viewBox', '0 0 0 0'); // for Firefox bug
      }
      return element;
    }

    function setWH100(element) {
      [element.width, element.height].forEach(function(len) {
        len.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100);
      });
      return element;
    }

    props.pathList = {};
    // Init stats
    initStats(aplStats, STATS);
    // effect (before props.svg is changed)
    Object.keys(EFFECTS).forEach(function(effectName) {
      var keyEnabled = effectName + '_enabled';
      if (aplStats[keyEnabled]) {
        EFFECTS[effectName].remove(props);
        aplStats[keyEnabled] = false; // it might not have been disabled by remove().
      }
    });

    if (props.baseWindow && props.svg) {
      props.baseWindow.document.body.removeChild(props.svg);
    }
    props.baseWindow = newWindow;
    setupWindow(newWindow);
    props.bodyOffset = getBodyOffset(newWindow); // Get `bodyOffset`

    // Main SVG
    props.svg = svg = baseDocument.createElementNS(SVG_NS, 'svg');
    svg.className.baseVal = APP_ID;
    if (!svg.viewBox.baseVal) { svg.setAttribute('viewBox', '0 0 0 0'); } // for Firefox bug
    props.defs = defs = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'defs'));

    props.linePath = element = defs.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
    element.id = (linePathId = prefix + '-line-path');
    element.className.baseVal = APP_ID + '-line-path';
    if (IS_WEBKIT) {
      // [WEBKIT] style in `use` is not updated
      element.style.fill = 'none';
    }

    props.lineShape = element = defs.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.id = (lineShapeId = prefix + '-line-shape');
    element.href.baseVal = '#' + linePathId;

    maskCaps = defs.appendChild(baseDocument.createElementNS(SVG_NS, 'g'));
    maskCaps.id = (capsId = prefix + '-caps');

    props.capsMaskAnchorSE = [0, 1].map(function() {
      var element = maskCaps.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
      element.className.baseVal = APP_ID + '-caps-mask-anchor';
      return element;
    });

    props.lineMaskMarkerIdSE = [prefix + '-caps-mask-marker-0', prefix + '-caps-mask-marker-1'];
    props.capsMaskMarkerSE = [0, 1].map(function(i) { return setupMarker(props.lineMaskMarkerIdSE[i]); });
    props.capsMaskMarkerShapeSE = [0, 1].map(function(i) {
      var element = props.capsMaskMarkerSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
      element.className.baseVal = APP_ID + '-caps-mask-marker-shape';
      return element;
    });

    props.capsMaskLine = element = maskCaps.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.className.baseVal = APP_ID + '-caps-mask-line';
    element.href.baseVal = '#' + lineShapeId;

    props.maskBGRect = element = setWH100(defs.appendChild(baseDocument.createElementNS(SVG_NS, 'rect')));
    element.id = (maskBGRectId = prefix + '-mask-bg-rect');
    element.className.baseVal = APP_ID + '-mask-bg-rect';
    if (IS_WEBKIT) {
      // [WEBKIT] style in `use` is not updated
      element.style.fill = 'white';
    }

    // lineMask
    props.lineMask = setWH100(setupMask((props.lineMaskId = prefix + '-line-mask')));
    props.lineMaskBG = element = props.lineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + maskBGRectId;
    props.lineMaskShape = element = props.lineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.className.baseVal = APP_ID + '-line-mask-shape';
    element.href.baseVal = '#' + linePathId;
    element.style.display = 'none';
    props.lineMaskCaps = element = props.lineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + capsId;

    // lineOutlineMask
    props.lineOutlineMask = setWH100(setupMask((lineOutlineMaskId = prefix + '-line-outline-mask')));
    element = props.lineOutlineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + maskBGRectId;
    props.lineOutlineMaskShape = element =
      props.lineOutlineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.className.baseVal = APP_ID + '-line-outline-mask-shape';
    element.href.baseVal = '#' + linePathId;
    props.lineOutlineMaskCaps = element =
      props.lineOutlineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + capsId;

    /* reserve for future version
    props.lineFGId = prefix + '-line-fg';
    props.lineFG = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'g'));
    props.lineFG.id = props.lineFGId;
    props.lineFGRect = setWH100(props.lineFG.appendChild(baseDocument.createElementNS(SVG_NS, 'rect')));
    */

    props.face = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'g'));
    props.lineFace = element = props.face.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + lineShapeId;

    props.lineOutlineFace = element = props.face.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + lineShapeId;
    element.style.mask = 'url(#' + lineOutlineMaskId + ')';
    element.style.display = 'none';

    // plugMaskSE
    props.plugMaskIdSE = [prefix + '-plug-mask-0', prefix + '-plug-mask-1'];
    props.plugMaskSE = [0, 1].map(function(i) { return setupMask(props.plugMaskIdSE[i]); });
    props.plugMaskShapeSE = [0, 1].map(function(i) {
      var element = props.plugMaskSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
      element.className.baseVal = APP_ID + '-plug-mask-shape';
      return element;
    });

    // plugOutlineMaskSE
    plugOutlineMaskIdSE = [];
    props.plugOutlineMaskSE = [0, 1].map(
      function(i) { return setupMask((plugOutlineMaskIdSE[i] = prefix + '-plug-outline-mask-' + i)); });
    props.plugOutlineMaskShapeSE = [0, 1].map(function(i) {
      var element = props.plugOutlineMaskSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
      element.className.baseVal = APP_ID + '-plug-outline-mask-shape';
      return element;
    });

    props.plugMarkerIdSE = [prefix + '-plug-marker-0', prefix + '-plug-marker-1'];
    props.plugMarkerSE = [0, 1].map(function(i) {
      var element = setupMarker(props.plugMarkerIdSE[i]);
      if (IS_WEBKIT) {
        // [WEBKIT] mask in marker is resized with rasterise
        element.markerUnits.baseVal = SVGMarkerElement.SVG_MARKERUNITS_USERSPACEONUSE;
      }
      return element;
    });
    props.plugMarkerShapeSE = [0, 1].map(function(i) {
      return props.plugMarkerSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'g'));
    });

    props.plugFaceSE = [0, 1].map(function(i) {
      return props.plugMarkerShapeSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    });
    props.plugOutlineFaceSE = [0, 1].map(function(i) {
      var element = props.plugMarkerShapeSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
      element.style.mask = 'url(#' + plugOutlineMaskIdSE[i] + ')';
      element.style.display = 'none';
      return element;
    });

    props.plugsFace = element = props.face.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.className.baseVal = APP_ID + '-plugs-face';
    element.href.baseVal = '#' + lineShapeId;
    element.style.display = 'none';

    // show effect (after SVG setup)
    if (props.curStats.show_inAnim) {
      props.isShown = 1;
      SHOW_EFFECTS[aplStats.show_effect].stop(props, true); // svgShow() is called
    } else if (!props.isShown) {
      svg.style.visibility = 'hidden';
    }

    baseDocument.body.appendChild(svg);

    // label (after appendChild(svg), bBox is used)
    [0, 1, 2].forEach(function(i) {
      var label = props.options.labelSEM[i], attachProps;
      if (label && isAttachment(label, 'label')) {
        attachProps = insAttachProps[label._id];
        if (attachProps.conf.initSvg) { attachProps.conf.initSvg(attachProps, props); }
      }
    });

  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} `true` if it was changed.
   */
  function updateLine(props) {
    var options = props.options, curStats = props.curStats, events = props.events,
      updated = false;

    updated = setStat(props, curStats, 'line_color', options.lineColor, events.cur_line_color) || updated;
    updated = setStat(props, curStats, 'line_colorTra', getAlpha(curStats.line_color)[0] < 1) || updated;
    updated = setStat(props, curStats, 'line_strokeWidth', options.lineSize,
      events.cur_line_strokeWidth) || updated;

    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} `true` if it was changed.
   */
  function updatePlug(props) {
    var options = props.options, curStats = props.curStats, events = props.events,
      updated = false;

    [0, 1].forEach(function(i) {
      var plugId = options.plugSE[i], symbolConf,
        width, height, plugMarkerWidth, plugMarkerHeight, plugSideLen, plugBackLen, value;

      updated = setStat(props, curStats.plug_enabledSE, i, plugId !== PLUG_BEHIND
) || updated;
      updated = setStat(props, curStats.plug_plugSE, i, plugId
) || updated;
      updated = setStat(props, curStats.plug_colorSE, i, (value = options.plugColorSE[i] || curStats.line_color),
        events.cur_plug_colorSE) || updated;
      updated = setStat(props, curStats.plug_colorTraSE, i, getAlpha(value)[0] < 1
) || updated;

      if (plugId !== PLUG_BEHIND) { // Not depend on `curStats.plug_enabledSE`
        symbolConf = SYMBOLS[PLUG_2_SYMBOL[plugId]];
        plugMarkerWidth = width = symbolConf.widthR * options.plugSizeSE[i];
        plugMarkerHeight = height = symbolConf.heightR * options.plugSizeSE[i];
        if (IS_WEBKIT) {
          // [WEBKIT] mask in marker is resized with rasterise
          plugMarkerWidth *= curStats.line_strokeWidth;
          plugMarkerHeight *= curStats.line_strokeWidth;
        }

        updated = setStat(props, curStats.plug_markerWidthSE, i, plugMarkerWidth
) || updated;
        updated = setStat(props, curStats.plug_markerHeightSE, i, plugMarkerHeight
) || updated;

        curStats.capsMaskMarker_markerWidthSE[i] = width;
        curStats.capsMaskMarker_markerHeightSE[i] = height;
      }

      curStats.plugOutline_plugSE[i] = curStats.capsMaskMarker_plugSE[i] = plugId;
      if (curStats.plug_enabledSE[i]) {
        value = curStats.line_strokeWidth / DEFAULT_OPTIONS.lineSize * options.plugSizeSE[i];
        curStats.position_plugOverheadSE[i] = symbolConf.overhead * value;
        curStats.viewBox_plugBCircleSE[i] = symbolConf.bCircle * value;
        plugSideLen = symbolConf.sideLen * value;
        plugBackLen = symbolConf.backLen * value;
      } else {
        curStats.position_plugOverheadSE[i] = -(curStats.line_strokeWidth / 2);
        curStats.viewBox_plugBCircleSE[i] = plugSideLen = plugBackLen = 0;
      }
      // Check events for attachment
      setStat(props, curStats.attach_plugSideLenSE, i, plugSideLen, events.cur_attach_plugSideLenSE
);
      setStat(props, curStats.attach_plugBackLenSE, i, plugBackLen, events.cur_attach_plugBackLenSE
);
      curStats.capsMaskAnchor_enabledSE[i] = !curStats.plug_enabledSE[i];
    });

    // It might be independent of `curStats.plug_enabledSE` in future version.
    updated = setStat(props, curStats, 'plug_enabled',
      curStats.plug_enabledSE[0] || curStats.plug_enabledSE[1]) || updated;

    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} `true` if it was changed.
   */
  function updateLineOutline(props) {
    var options = props.options, curStats = props.curStats,
      outlineWidth,
      updated = false;

    updated = setStat(props, curStats, 'lineOutline_enabled', options.lineOutlineEnabled) || updated;
    updated = setStat(props, curStats, 'lineOutline_color', options.lineOutlineColor) || updated;
    updated = setStat(props, curStats, 'lineOutline_colorTra',
      getAlpha(curStats.lineOutline_color)[0] < 1) || updated;

    outlineWidth = curStats.line_strokeWidth * options.lineOutlineSize;

    updated = setStat(props, curStats, 'lineOutline_strokeWidth', curStats.line_strokeWidth - outlineWidth * 2
) || updated;
    updated = setStat(props, curStats, 'lineOutline_inStrokeWidth',
      curStats.lineOutline_colorTra ?
        curStats.lineOutline_strokeWidth + SHAPE_GAP * 2 :
        curStats.line_strokeWidth - outlineWidth /* half */
) || updated;

    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} `true` if it was changed.
   */
  function updatePlugOutline(props) {
    var options = props.options, curStats = props.curStats,
      updated = false;

    [0, 1].forEach(function(i) {
      var plugId = curStats.plugOutline_plugSE[i],
        symbolConf = plugId !== PLUG_BEHIND ? SYMBOLS[PLUG_2_SYMBOL[plugId]] : null,
        value;

      updated = setStat(props, curStats.plugOutline_enabledSE, i,
        options.plugOutlineEnabledSE[i] &&
          // `curStats.plug_enabled` might be independent of `curStats.plug_enabledSE` in future version.
          curStats.plug_enabled && curStats.plug_enabledSE[i] &&
          !!symbolConf && !!symbolConf.outlineBase /* Not depend on `curStats.plug_enabledSE` */
) || updated;
      updated = setStat(props, curStats.plugOutline_colorSE, i,
        (value = options.plugOutlineColorSE[i] || curStats.lineOutline_color)
) || updated;
      updated = setStat(props, curStats.plugOutline_colorTraSE, i, getAlpha(value)[0] < 1
) || updated;

      if (symbolConf && symbolConf.outlineBase) { // Not depend on `curStats.plugOutline_enabledSE`

        value = options.plugOutlineSizeSE[i];
        if (value > symbolConf.outlineMax) { value = symbolConf.outlineMax; }
        value *= symbolConf.outlineBase * 2;
        updated = setStat(props, curStats.plugOutline_strokeWidthSE, i, value
) || updated;
        updated = setStat(props, curStats.plugOutline_inStrokeWidthSE, i,
          curStats.plugOutline_colorTraSE[i] ?
            value - SHAPE_GAP / (curStats.line_strokeWidth / DEFAULT_OPTIONS.lineSize) /
              options.plugSizeSE[i] * 2 :
            value / 2 /* half */
) || updated;
      }
    });

    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} `true` if it was changed.
   */
  function updateFaces(props) {
    var curStats = props.curStats, aplStats = props.aplStats, events = props.events,
      value, updated = false;

    if (!curStats.line_altColor &&
        setStat(props, aplStats, 'line_color', (value = curStats.line_color),
          events.apl_line_color)) {
      props.lineFace.style.stroke = value;
      updated = true;
    }

    if (setStat(props, aplStats, 'line_strokeWidth', (value = curStats.line_strokeWidth),
        events.apl_line_strokeWidth)) {
      props.lineShape.style.strokeWidth = value + 'px';
      updated = true;
      if (IS_GECKO || IS_TRIDENT) {
        // [TRIDENT] plugsFace is not updated when lineSize is changed
        // [GECKO] plugsFace is ignored
        forceReflowAdd(props, props.lineShape);
        if (IS_TRIDENT) {
          // [TRIDENT] lineColor is ignored
          forceReflowAdd(props, props.lineFace);
          // [TRIDENT] lineMaskCaps is ignored when lineSize is changed
          forceReflowAdd(props, props.lineMaskCaps);
        }
      }
    }

    if (setStat(props, aplStats, 'lineOutline_enabled', (value = curStats.lineOutline_enabled),
        events.apl_lineOutline_enabled)) {
      props.lineOutlineFace.style.display = value ? 'inline' : 'none';
      updated = true;
    }

    if (curStats.lineOutline_enabled) {

      if (setStat(props, aplStats, 'lineOutline_color', (value = curStats.lineOutline_color),
          events.apl_lineOutline_color)) {
        props.lineOutlineFace.style.stroke = value;
        updated = true;
      }

      if (setStat(props, aplStats, 'lineOutline_strokeWidth', (value = curStats.lineOutline_strokeWidth),
          events.apl_lineOutline_strokeWidth)) {
        props.lineOutlineMaskShape.style.strokeWidth = value + 'px';
        updated = true;
        if (IS_TRIDENT) {
          // [TRIDENT] lineOutlineMaskCaps is ignored when lineSize is changed
          forceReflowAdd(props, props.lineOutlineMaskCaps);
          // [TRIDENT] lineOutlineColor is ignored
          forceReflowAdd(props, props.lineOutlineFace);
        }
      }

      if (setStat(props, aplStats, 'lineOutline_inStrokeWidth', (value = curStats.lineOutline_inStrokeWidth),
          events.apl_lineOutline_inStrokeWidth)) {
        props.lineMaskShape.style.strokeWidth = value + 'px';
        updated = true;
        if (IS_TRIDENT) {
          // [TRIDENT] lineOutlineMaskCaps is ignored when lineSize is changed
          forceReflowAdd(props, props.lineOutlineMaskCaps);
          // [TRIDENT] lineOutlineColor is ignored
          forceReflowAdd(props, props.lineOutlineFace);
        }
      }
    }

    if (setStat(props, aplStats, 'plug_enabled', (value = curStats.plug_enabled),
        events.apl_plug_enabled)) {
      props.plugsFace.style.display = value ? 'inline' : 'none';
      updated = true;
    }

    if (curStats.plug_enabled) {

      [0, 1].forEach(function(i) {
        var plugId = curStats.plug_plugSE[i],
          symbolConf = plugId !== PLUG_BEHIND ? SYMBOLS[PLUG_2_SYMBOL[plugId]] : null,
          marker = getMarkerProps(i, symbolConf);

        if (setStat(props, aplStats.plug_enabledSE, i, (value = curStats.plug_enabledSE[i]),
            events.apl_plug_enabledSE)) {
          props.plugsFace.style[marker.prop] = value ? 'url(#' + props.plugMarkerIdSE[i] + ')' : 'none';
          updated = true;
        }

        if (curStats.plug_enabledSE[i]) {

          if (setStat(props, aplStats.plug_plugSE, i, plugId,
              events.apl_plug_plugSE)) {
            props.plugFaceSE[i].href.baseVal = '#' + symbolConf.elmId;
            setMarkerOrient(props, props.plugMarkerSE[i], marker.orient,
              symbolConf.bBox, props.svg, props.plugMarkerShapeSE[i], props.plugsFace);
            updated = true;
            if (IS_GECKO) {
              // [GECKO] plugsFace is not updated when plugSE is changed
              forceReflowAdd(props, props.plugsFace);
            }
          }

          if (setStat(props, aplStats.plug_colorSE, i, (value = curStats.plug_colorSE[i]),
              events.apl_plug_colorSE)) {
            props.plugFaceSE[i].style.fill = value;
            updated = true;
            if ((IS_BLINK || IS_WEBKIT || IS_TRIDENT) && !curStats.line_colorTra) {
              // [BLINK], [WEBKIT], [TRIDENT] capsMaskMarkerShapeSE is not updated when line has no alpha
              forceReflowAdd(props, IS_TRIDENT ? props.lineMaskCaps : props.capsMaskLine);
            }
          }

          // plug_markerWidthSE, plug_markerHeightSE
          ['markerWidth', 'markerHeight'].forEach(function(markerKey) {
            var statKey = 'plug_' + markerKey + 'SE';
            if (setStat(props, aplStats[statKey], i, (value = curStats[statKey][i]),
                events['apl_' + statKey])) {
              props.plugMarkerSE[i][markerKey].baseVal.value = value;
              updated = true;
            }
          });

          if (setStat(props, aplStats.plugOutline_enabledSE, i, (value = curStats.plugOutline_enabledSE[i]),
              events.apl_plugOutline_enabledSE
)) {
            if (value) {
              props.plugFaceSE[i].style.mask = 'url(#' + props.plugMaskIdSE[i] + ')';
              props.plugOutlineFaceSE[i].style.display = 'inline';
            } else {
              props.plugFaceSE[i].style.mask = 'none';
              props.plugOutlineFaceSE[i].style.display = 'none';
            }
            updated = true;
          }

          if (curStats.plugOutline_enabledSE[i]) {

            if (setStat(props, aplStats.plugOutline_plugSE, i, plugId,
                events.apl_plugOutline_plugSE
)) {
              props.plugOutlineFaceSE[i].href.baseVal =
                props.plugMaskShapeSE[i].href.baseVal =
                props.plugOutlineMaskShapeSE[i].href.baseVal = '#' + symbolConf.elmId;
              [props.plugMaskSE[i], props.plugOutlineMaskSE[i]].forEach(function(mask) {
                mask.x.baseVal.value = symbolConf.bBox.left;
                mask.y.baseVal.value = symbolConf.bBox.top;
                mask.width.baseVal.value = symbolConf.bBox.width;
                mask.height.baseVal.value = symbolConf.bBox.height;
              });
              updated = true;
            }

            if (setStat(props, aplStats.plugOutline_colorSE, i, (value = curStats.plugOutline_colorSE[i]),
                events.apl_plugOutline_colorSE
)) {
              props.plugOutlineFaceSE[i].style.fill = value;
              updated = true;
              if (IS_TRIDENT) {
                // [TRIDENT] lineMaskCaps is not updated when plugOutline_colorTraSE is changed
                forceReflowAdd(props, props.lineMaskCaps);
                forceReflowAdd(props, props.lineOutlineMaskCaps);
              }
            }

            if (setStat(props, aplStats.plugOutline_strokeWidthSE, i,
                (value = curStats.plugOutline_strokeWidthSE[i]),
                events.apl_plugOutline_strokeWidthSE
)) {
              props.plugOutlineMaskShapeSE[i].style.strokeWidth = value + 'px';
              updated = true;
            }

            if (setStat(props, aplStats.plugOutline_inStrokeWidthSE, i,
                (value = curStats.plugOutline_inStrokeWidthSE[i]),
                events.apl_plugOutline_inStrokeWidthSE
)) {
              props.plugMaskShapeSE[i].style.strokeWidth = value + 'px';
              updated = true;
            }
          }
        }
      });
    }

    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} `true` if it was changed.
   */
  function updatePosition(props) {
    var options = props.options, curStats = props.curStats, aplStats = props.aplStats,
      curSocketXYSE = curStats.position_socketXYSE,
      curSocketGravitySE, anchorBBoxSE, pathList,
      updated = false;

    function getSocketXY(bBox, socketId) {
      var socketXY = (
        socketId === SOCKET_TOP ? {x: bBox.left + bBox.width / 2, y: bBox.top} :
        socketId === SOCKET_RIGHT ? {x: bBox.right, y: bBox.top + bBox.height / 2} :
        socketId === SOCKET_BOTTOM ? {x: bBox.left + bBox.width / 2, y: bBox.bottom} :
                    /* SOCKET_LEFT */ {x: bBox.left, y: bBox.top + bBox.height / 2});
      socketXY.socketId = socketId;
      return socketXY;
    }

    function socketXY2Point(socketXY) { return {x: socketXY.x, y: socketXY.y}; }

    function socketXYHasChanged(a, b) {
      return a.x !== b.x || a.y !== b.y || a.socketId !== b.socketId;
    }

    function socketGravityHasChanged(a, b) {
      var aType = a == null ? 'auto' : Array.isArray(a) ? 'array' : 'number',
        bType = b == null ? 'auto' : Array.isArray(b) ? 'array' : 'number';
      return aType !== bType ? true :
        aType === 'array' ? a[0] !== b[0] || a[1] !== b[1] : a !== b;
    }

    curStats.position_path = options.path;
    curStats.position_lineStrokeWidth = curStats.line_strokeWidth;
    curStats.position_socketGravitySE = curSocketGravitySE = copyTree(options.socketGravitySE);

    anchorBBoxSE = [0, 1].map(function(i) {
      var anchor = options.anchorSE[i], isAttach = props.optionIsAttach.anchorSE[i],
        attachProps = isAttach !== false ? insAttachProps[anchor._id] : null,

        strokeWidth = isAttach !== false && attachProps.conf.getStrokeWidth ?
          attachProps.conf.getStrokeWidth(attachProps, props) : 0,
        anchorBBox = isAttach !== false && attachProps.conf.getBBoxNest ?
          attachProps.conf.getBBoxNest(attachProps, props, strokeWidth) :
          getBBoxNest(anchor, props.baseWindow);

      curStats.capsMaskAnchor_pathDataSE[i] = isAttach !== false && attachProps.conf.getPathData ?
        attachProps.conf.getPathData(attachProps, props, strokeWidth) : bBox2PathData(anchorBBox);
      curStats.capsMaskAnchor_strokeWidthSE[i] = strokeWidth;
      return anchorBBox;
    });

    // Decide each socket
    (function() {
      var socketXYsWk, socketsLenMin = -1, iFix, iAuto;
      if (options.socketSE[0] && options.socketSE[1]) {
        curSocketXYSE[0] = getSocketXY(anchorBBoxSE[0], options.socketSE[0]);
        curSocketXYSE[1] = getSocketXY(anchorBBoxSE[1], options.socketSE[1]);

      } else {
        if (!options.socketSE[0] && !options.socketSE[1]) {
          socketXYsWk = SOCKET_IDS.map(function(socketId) { return getSocketXY(anchorBBoxSE[1], socketId); });
          SOCKET_IDS.map(function(socketId) { return getSocketXY(anchorBBoxSE[0], socketId); })
            .forEach(function(socketXY0) {
              socketXYsWk.forEach(function(socketXY1) {
                var len = getPointsLength(socketXY0, socketXY1);
                if (len < socketsLenMin || socketsLenMin === -1) {
                  curSocketXYSE[0] = socketXY0;
                  curSocketXYSE[1] = socketXY1;
                  socketsLenMin = len;
                }
              });
            });

        } else {
          if (options.socketSE[0]) {
            iFix = 0;
            iAuto = 1;
          } else {
            iFix = 1;
            iAuto = 0;
          }
          curSocketXYSE[iFix] = getSocketXY(anchorBBoxSE[iFix], options.socketSE[iFix]);
          socketXYsWk = SOCKET_IDS.map(function(socketId) { return getSocketXY(anchorBBoxSE[iAuto], socketId); });
          socketXYsWk.forEach(function(socketXY) {
            var len = getPointsLength(socketXY, curSocketXYSE[iFix]);
            if (len < socketsLenMin || socketsLenMin === -1) {
              curSocketXYSE[iAuto] = socketXY;
              socketsLenMin = len;
            }
          });
        }

        // Adjust auto-socket when no width/height
        [0, 1].forEach(function(i) {
          var distanceX, distanceY;
          if (!options.socketSE[i]) {
            if (!anchorBBoxSE[i].width && !anchorBBoxSE[i].height) {
              distanceX = curSocketXYSE[i ? 0 : 1].x - anchorBBoxSE[i].left;
              distanceY = curSocketXYSE[i ? 0 : 1].y - anchorBBoxSE[i].top;
              curSocketXYSE[i].socketId = Math.abs(distanceX) >= Math.abs(distanceY) ?
                (distanceX >= 0 ? SOCKET_RIGHT : SOCKET_LEFT) :
                (distanceY >= 0 ? SOCKET_BOTTOM : SOCKET_TOP);
            } else if (!anchorBBoxSE[i].width &&
                (curSocketXYSE[i].socketId === SOCKET_LEFT || curSocketXYSE[i].socketId === SOCKET_RIGHT)) {
              curSocketXYSE[i].socketId = curSocketXYSE[i ? 0 : 1].x - anchorBBoxSE[i].left >= 0 ?
                SOCKET_RIGHT : SOCKET_LEFT;
            } else if (!anchorBBoxSE[i].height &&
                (curSocketXYSE[i].socketId === SOCKET_TOP || curSocketXYSE[i].socketId === SOCKET_BOTTOM)) {
              curSocketXYSE[i].socketId = curSocketXYSE[i ? 0 : 1].y - anchorBBoxSE[i].top >= 0 ?
                SOCKET_BOTTOM : SOCKET_TOP;
            }
          }
        });
      }
    })();


    if (curStats.position_path !== aplStats.position_path ||
        curStats.position_lineStrokeWidth !== aplStats.position_lineStrokeWidth ||
        [0, 1].some(function(i) {
          return curStats.position_plugOverheadSE[i] !== aplStats.position_plugOverheadSE[i] ||
            socketXYHasChanged(curSocketXYSE[i], aplStats.position_socketXYSE[i]) ||
            socketGravityHasChanged(curSocketGravitySE[i], aplStats.position_socketGravitySE[i]);
        })) {
      // New position
      props.pathList.baseVal = pathList = [];
      props.pathList.animVal = null;

      // Generate path segments
      switch (curStats.position_path) {

        case PATH_STRAIGHT:
          pathList.push([socketXY2Point(curSocketXYSE[0]), socketXY2Point(curSocketXYSE[1])]);
          break;

        case PATH_ARC:
          (function() {
            var
              downward =
                typeof curSocketGravitySE[0] === 'number' && curSocketGravitySE[0] > 0 ||
                typeof curSocketGravitySE[1] === 'number' && curSocketGravitySE[1] > 0,
              circle8rad = CIRCLE_8_RAD * (downward ? -1 : 1),
              angle = Math.atan2(curSocketXYSE[1].y - curSocketXYSE[0].y, curSocketXYSE[1].x - curSocketXYSE[0].x),
              cp1Angle = -angle + circle8rad,
              cp2Angle = Math.PI - angle - circle8rad,
              crLen = getPointsLength(curSocketXYSE[0], curSocketXYSE[1]) / Math.sqrt(2) * CIRCLE_CP,
              cp1 = {
                x: curSocketXYSE[0].x + Math.cos(cp1Angle) * crLen,
                y: curSocketXYSE[0].y + Math.sin(cp1Angle) * crLen * -1},
              cp2 = {
                x: curSocketXYSE[1].x + Math.cos(cp2Angle) * crLen,
                y: curSocketXYSE[1].y + Math.sin(cp2Angle) * crLen * -1};
            pathList.push([socketXY2Point(curSocketXYSE[0]), cp1, cp2, socketXY2Point(curSocketXYSE[1])]);
          })();
          break;

        case PATH_FLUID:
        case PATH_MAGNET:
          (/* @EXPORT[file:../test/spec/func/PATH_FLUID]@ */function(socketGravitySE) {
            var cx = [], cy = [];
            curSocketXYSE.forEach(function(socketXY, i) {
              var gravity = socketGravitySE[i], offset, anotherSocketXY, overhead, minGravity, len;
              if (Array.isArray(gravity)) { // offset
                offset = {x: gravity[0], y: gravity[1]};
              } else if (typeof gravity === 'number') { // distance
                offset =
                  socketXY.socketId === SOCKET_TOP ? {x: 0, y: -gravity} :
                  socketXY.socketId === SOCKET_RIGHT ? {x: gravity, y: 0} :
                  socketXY.socketId === SOCKET_BOTTOM ? {x: 0, y: gravity} :
                                      /* SOCKET_LEFT */ {x: -gravity, y: 0};
              } else { // auto
                anotherSocketXY = curSocketXYSE[i ? 0 : 1];
                overhead = curStats.position_plugOverheadSE[i];
                minGravity = overhead > 0 ?
                  MIN_OH_GRAVITY + (overhead > MIN_OH_GRAVITY_OH ?
                    (overhead - MIN_OH_GRAVITY_OH) * MIN_OH_GRAVITY_R : 0) :
                  MIN_GRAVITY + (curStats.position_lineStrokeWidth > MIN_GRAVITY_SIZE ?
                    (curStats.position_lineStrokeWidth - MIN_GRAVITY_SIZE) * MIN_GRAVITY_R : 0);
                if (socketXY.socketId === SOCKET_TOP) {
                  len = (socketXY.y - anotherSocketXY.y) / 2;
                  if (len < minGravity) { len = minGravity; }
                  offset = {x: 0, y: -len};
                } else if (socketXY.socketId === SOCKET_RIGHT) {
                  len = (anotherSocketXY.x - socketXY.x) / 2;
                  if (len < minGravity) { len = minGravity; }
                  offset = {x: len, y: 0};
                } else if (socketXY.socketId === SOCKET_BOTTOM) {
                  len = (anotherSocketXY.y - socketXY.y) / 2;
                  if (len < minGravity) { len = minGravity; }
                  offset = {x: 0, y: len};
                } else { // SOCKET_LEFT
                  len = (socketXY.x - anotherSocketXY.x) / 2;
                  if (len < minGravity) { len = minGravity; }
                  offset = {x: -len, y: 0};
                }
              }
              cx[i] = socketXY.x + offset.x;
              cy[i] = socketXY.y + offset.y;
            });
            pathList.push([socketXY2Point(curSocketXYSE[0]),
              {x: cx[0], y: cy[0]}, {x: cx[1], y: cy[1]}, socketXY2Point(curSocketXYSE[1])]);
          }/* @/EXPORT@ */)([curSocketGravitySE[0],
            curStats.position_path === PATH_MAGNET ? 0 : curSocketGravitySE[1]]);
          break;

        case PATH_GRID:
          (/* @EXPORT[file:../test/spec/func/PATH_GRID]@ */function() {
            /**
             * @typedef {Object} DirPoint
             * @property {number} dirId - DIR_UP, DIR_RIGHT, DIR_DOWN, DIR_LEFT
             * @property {number} x
             * @property {number} y
             */
            var
              DIR_UP = 1, DIR_RIGHT = 2, DIR_DOWN = 3, DIR_LEFT = 4, // Correspond with `socketId`
              dpList = [[], []], curDirPoint = [], curPoint;

            function reverseDir(dirId) {
              return dirId === DIR_UP ? DIR_DOWN :
                dirId === DIR_RIGHT ? DIR_LEFT :
                dirId === DIR_DOWN ? DIR_UP : DIR_RIGHT;
            }

            function getAxis(dirId) {
              return dirId === DIR_RIGHT || dirId === DIR_LEFT ? 'x' : 'y';
            }

            function getNextDirPoint(dirPoint, len, dirId) {
              var newDirPoint = {x: dirPoint.x, y: dirPoint.y};
              if (dirId) {
                if (dirId === reverseDir(dirPoint.dirId)) { throw new Error('Invalid dirId: ' + dirId); }
                newDirPoint.dirId = dirId;
              } else {
                newDirPoint.dirId = dirPoint.dirId;
              }

              if (newDirPoint.dirId === DIR_UP) {
                newDirPoint.y -= len;
              } else if (newDirPoint.dirId === DIR_RIGHT) {
                newDirPoint.x += len;
              } else if (newDirPoint.dirId === DIR_DOWN) {
                newDirPoint.y += len;
              } else { // DIR_LEFT
                newDirPoint.x -= len;
              }
              return newDirPoint;
            }

            function inAxisScope(point, dirPoint) {
              return dirPoint.dirId === DIR_UP ? point.y <= dirPoint.y :
                dirPoint.dirId === DIR_RIGHT ? point.x >= dirPoint.x :
                dirPoint.dirId === DIR_DOWN ? point.y >= dirPoint.y :
                  point.x <= dirPoint.x;
            }

            function onAxisLine(point, dirPoint) {
              return dirPoint.dirId === DIR_UP || dirPoint.dirId === DIR_DOWN ?
                point.x === dirPoint.x : point.y === dirPoint.y;
            }

            // Must `scopeContains[0] !== scopeContains[1]`
            function getIndexWithScope(scopeContains) {
              return scopeContains[0] ? {contain: 0, notContain: 1} : {contain: 1, notContain: 0};
            }

            function getAxisDistance(point1, point2, axis) {
              return Math.abs(point2[axis] - point1[axis]);
            }

            // Must `fromPoint.[x|y] !== toPoint.[x|y]`
            function getDirIdWithAxis(fromPoint, toPoint, axis) {
              return axis === 'x' ?
                (fromPoint.x < toPoint.x ? DIR_RIGHT : DIR_LEFT) :
                (fromPoint.y < toPoint.y ? DIR_DOWN : DIR_UP);
            }

            function joinPoints() {
              var scopeContains = [
                  inAxisScope(curDirPoint[1], curDirPoint[0]),
                  inAxisScope(curDirPoint[0], curDirPoint[1])],
                axis = [getAxis(curDirPoint[0].dirId), getAxis(curDirPoint[1].dirId)],
                center, axisScope, distance, points;

              if (axis[0] === axis[1]) { // Same axis
                if (scopeContains[0] && scopeContains[1]) {
                  if (!onAxisLine(curDirPoint[1], curDirPoint[0])) {
                    if (curDirPoint[0][axis[0]] === curDirPoint[1][axis[1]]) { // vertical
                      dpList[0].push(curDirPoint[0]);
                      dpList[1].push(curDirPoint[1]);
                    } else {
                      center = curDirPoint[0][axis[0]] +
                        (curDirPoint[1][axis[1]] - curDirPoint[0][axis[0]]) / 2;
                      dpList[0].push(
                        getNextDirPoint(curDirPoint[0], Math.abs(center - curDirPoint[0][axis[0]])));
                      dpList[1].push(
                        getNextDirPoint(curDirPoint[1], Math.abs(center - curDirPoint[1][axis[1]])));
                    }
                  }
                  return false;

                } else if (scopeContains[0] !== scopeContains[1]) { // turn notContain 90deg
                  axisScope = getIndexWithScope(scopeContains);
                  distance = getAxisDistance(curDirPoint[axisScope.notContain],
                    curDirPoint[axisScope.contain], axis[axisScope.notContain]);
                  if (distance < MIN_GRID_LEN) {
                    curDirPoint[axisScope.notContain] =
                      getNextDirPoint(curDirPoint[axisScope.notContain], MIN_GRID_LEN - distance);
                  }
                  dpList[axisScope.notContain].push(curDirPoint[axisScope.notContain]);
                  curDirPoint[axisScope.notContain] =
                    getNextDirPoint(curDirPoint[axisScope.notContain], MIN_GRID_LEN,
                      onAxisLine(curDirPoint[axisScope.contain], curDirPoint[axisScope.notContain]) ?
                        (axis[axisScope.notContain] === 'x' ? DIR_DOWN : DIR_RIGHT) :
                        getDirIdWithAxis(curDirPoint[axisScope.notContain], curDirPoint[axisScope.contain],
                          (axis[axisScope.notContain] === 'x' ? 'y' : 'x')));

                } else { // turn both 90deg
                  distance =
                    getAxisDistance(curDirPoint[0], curDirPoint[1], axis[0] === 'x' ? 'y' : 'x');
                  dpList.forEach(function(targetDpList, iTarget) {
                    var iAnother = iTarget === 0 ? 1 : 0;
                    targetDpList.push(curDirPoint[iTarget]);
                    curDirPoint[iTarget] = getNextDirPoint(curDirPoint[iTarget], MIN_GRID_LEN,
                      distance >= MIN_GRID_LEN * 2 ?
                        getDirIdWithAxis(curDirPoint[iTarget], curDirPoint[iAnother],
                          (axis[iTarget] === 'x' ? 'y' : 'x')) :
                        (axis[iTarget] === 'x' ? DIR_DOWN : DIR_RIGHT));
                  });
                }

              } else { // Different axis
                if (scopeContains[0] && scopeContains[1]) {
                  if (onAxisLine(curDirPoint[1], curDirPoint[0])) {
                    dpList[1].push(curDirPoint[1]); // Drop curDirPoint[0]
                  } else if (onAxisLine(curDirPoint[0], curDirPoint[1])) {
                    dpList[0].push(curDirPoint[0]); // Drop curDirPoint[1]
                  } else { // Drop curDirPoint[0] and end
                    dpList[0].push(axis[0] === 'x' ?
                      {x: curDirPoint[1].x, y: curDirPoint[0].y} :
                      {x: curDirPoint[0].x, y: curDirPoint[1].y});
                  }
                  return false;

                } else if (scopeContains[0] !== scopeContains[1]) { // turn notContain 90deg
                  axisScope = getIndexWithScope(scopeContains);
                  dpList[axisScope.notContain].push(curDirPoint[axisScope.notContain]);
                  curDirPoint[axisScope.notContain] =
                    getNextDirPoint(curDirPoint[axisScope.notContain], MIN_GRID_LEN,
                      getAxisDistance(curDirPoint[axisScope.notContain],
                          curDirPoint[axisScope.contain], axis[axisScope.contain]) >= MIN_GRID_LEN ?
                        getDirIdWithAxis(curDirPoint[axisScope.notContain], curDirPoint[axisScope.contain],
                          axis[axisScope.contain]) :
                        curDirPoint[axisScope.contain].dirId);

                } else { // turn both 90deg
                  points = [{x: curDirPoint[0].x, y: curDirPoint[0].y},
                    {x: curDirPoint[1].x, y: curDirPoint[1].y}];
                  dpList.forEach(function(targetDpList, iTarget) {
                    var iAnother = iTarget === 0 ? 1 : 0,
                      distance = getAxisDistance(points[iTarget], points[iAnother], axis[iTarget]);
                    if (distance < MIN_GRID_LEN) {
                      curDirPoint[iTarget] = getNextDirPoint(curDirPoint[iTarget], MIN_GRID_LEN - distance);
                    }
                    targetDpList.push(curDirPoint[iTarget]);
                    curDirPoint[iTarget] = getNextDirPoint(curDirPoint[iTarget], MIN_GRID_LEN,
                      getDirIdWithAxis(curDirPoint[iTarget], curDirPoint[iAnother], axis[iAnother]));
                  });
                }
              }
              return true;
            }

            curSocketXYSE.forEach(function(socketXY, i) {
              var dirPoint = socketXY2Point(socketXY),
                len = curSocketGravitySE[i];
              (function(dirLen) {
                dirPoint.dirId = dirLen[0];
                len = dirLen[1];
              })(Array.isArray(len) ? ( // offset
                  len[0] < 0 ? [DIR_LEFT, -len[0]] : // ignore Y
                  len[0] > 0 ? [DIR_RIGHT, len[0]] : // ignore Y
                  len[1] < 0 ? [DIR_UP, -len[1]] :
                  len[1] > 0 ? [DIR_DOWN, len[1]] :
                                [socketXY.socketId, 0] // (0, 0)
                ) :
                typeof len !== 'number' ? [socketXY.socketId, MIN_GRID_LEN] : // auto
                len >= 0 ? [socketXY.socketId, len] : // distance
                            [reverseDir(socketXY.socketId), -len]);
              dpList[i].push(dirPoint);
              curDirPoint[i] = getNextDirPoint(dirPoint, len);
            });
            while (joinPoints()) { /* empty */ }

            dpList[1].reverse();
            dpList[0].concat(dpList[1]).forEach(function(dirPoint, i) {
              var point = {x: dirPoint.x, y: dirPoint.y};
              if (i > 0) { pathList.push([curPoint, point]); }
              curPoint = point;
            });
          }/* @/EXPORT@ */)();
          break;

        // no default
      }

      // Adjust path with plugs
      (function() {
        var pathSegsLen = [];
        curStats.position_plugOverheadSE.forEach(function(plugOverhead, i) {
          var start = !i, pathPoints, iSeg, point, sp, cp, angle, len,
            socketId, axis, dir, minAdjustOffset;
          if (plugOverhead > 0) {
            pathPoints = pathList[(iSeg = start ? 0 : pathList.length - 1)];

            if (pathPoints.length === 2) { // Straight line
              pathSegsLen[iSeg] = pathSegsLen[iSeg] || getPointsLength.apply(null, pathPoints);
              if (pathSegsLen[iSeg] > MIN_ADJUST_LEN) {
                if (pathSegsLen[iSeg] - plugOverhead < MIN_ADJUST_LEN) {
                  plugOverhead = pathSegsLen[iSeg] - MIN_ADJUST_LEN;
                }
                point = getPointOnLine(pathPoints[0], pathPoints[1],
                  (start ? plugOverhead : pathSegsLen[iSeg] - plugOverhead) / pathSegsLen[iSeg]);
                pathList[iSeg] = start ? [point, pathPoints[1]] : [pathPoints[0], point];
                pathSegsLen[iSeg] -= plugOverhead;
              }

            } else { // Cubic bezier
              pathSegsLen[iSeg] = pathSegsLen[iSeg] || getCubicLength.apply(null, pathPoints);
              if (pathSegsLen[iSeg] > MIN_ADJUST_LEN) {
                if (pathSegsLen[iSeg] - plugOverhead < MIN_ADJUST_LEN) {
                  plugOverhead = pathSegsLen[iSeg] - MIN_ADJUST_LEN;
                }
                point = getPointOnCubic(pathPoints[0], pathPoints[1], pathPoints[2], pathPoints[3],
                  getCubicT(pathPoints[0], pathPoints[1], pathPoints[2], pathPoints[3],
                    start ? plugOverhead : pathSegsLen[iSeg] - plugOverhead));

                // Get direct distance and angle
                if (start) {
                  sp = pathPoints[0];
                  cp = point.toP1;
                } else {
                  sp = pathPoints[3];
                  cp = point.fromP2;
                }
                angle = Math.atan2(sp.y - point.y, point.x - sp.x);
                len = getPointsLength(point, cp);
                point.x = sp.x + Math.cos(angle) * plugOverhead;
                point.y = sp.y + Math.sin(angle) * plugOverhead * -1;
                cp.x = point.x + Math.cos(angle) * len;
                cp.y = point.y + Math.sin(angle) * len * -1;

                pathList[iSeg] = start ?
                  [point, point.toP1, point.toP2, pathPoints[3]] :
                  [pathPoints[0], point.fromP1, point.fromP2, point];
                pathSegsLen[iSeg] = null; // to re-calculate
              }

            }
          } else if (plugOverhead < 0) {
            pathPoints = pathList[(iSeg = start ? 0 : pathList.length - 1)];
            socketId = curSocketXYSE[i].socketId;
            axis = socketId === SOCKET_LEFT || socketId === SOCKET_RIGHT ? 'x' : 'y';
            minAdjustOffset = -(anchorBBoxSE[i][axis === 'x' ? 'width' : 'height']);
            if (plugOverhead < minAdjustOffset) { plugOverhead = minAdjustOffset; }
            dir = plugOverhead * (socketId === SOCKET_LEFT || socketId === SOCKET_TOP ? -1 : 1);
            if (pathPoints.length === 2) { // Straight line
              pathPoints[start ? 0 : pathPoints.length - 1][axis] += dir;
            } else { // Cubic bezier
              (start ? [0, 1] : [pathPoints.length - 2, pathPoints.length - 1]).forEach(
                function(i) { pathPoints[i][axis] += dir; });
            }
            pathSegsLen[iSeg] = null; // to re-calculate
          }
        });
      })();

      // apply
      aplStats.position_socketXYSE = copyTree(curSocketXYSE);
      aplStats.position_plugOverheadSE = copyTree(curStats.position_plugOverheadSE);
      aplStats.position_path = curStats.position_path;
      aplStats.position_lineStrokeWidth = curStats.position_lineStrokeWidth;
      aplStats.position_socketGravitySE = copyTree(curSocketGravitySE);
      updated = true;

      if (props.events.apl_position) {
        props.events.apl_position.forEach(function(handler) { handler(props, pathList); });
      }
    }

    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} `true` if it was changed.
   */
  function updatePath(props) {
    var curStats = props.curStats, aplStats = props.aplStats,
      pathList = props.pathList.animVal || props.pathList.baseVal,
      curPathData, curEdge = curStats.path_edge,
      updated = false;

    if (pathList) {
      curEdge.x1 = curEdge.x2 = pathList[0][0].x;
      curEdge.y1 = curEdge.y2 = pathList[0][0].y;
      curStats.path_pathData = curPathData = pathList2PathData(pathList, function(point) {
        if (point.x < curEdge.x1) { curEdge.x1 = point.x; }
        if (point.y < curEdge.y1) { curEdge.y1 = point.y; }
        if (point.x > curEdge.x2) { curEdge.x2 = point.x; }
        if (point.y > curEdge.y2) { curEdge.y2 = point.y; }
      });

      // Apply `pathData`
      if (pathDataHasChanged(curPathData, aplStats.path_pathData)) {
        props.linePath.setPathData(curPathData);
        aplStats.path_pathData = curPathData; // Since curPathData is new anytime, it doesn't need copy.
        updated = true;

        if (IS_TRIDENT) {
          // [TRIDENT] markerOrient is not updated when path is changed
          forceReflowAdd(props, props.plugsFace);
          // [TRIDENT] lineMaskCaps is ignored when path is changed
          forceReflowAdd(props, props.lineMaskCaps);
        } else if (IS_GECKO) {
          // [GECKO] path is not updated when path is changed
          forceReflowAdd(props, props.linePath);
        }

        if (props.events.apl_path) {
          props.events.apl_path.forEach(function(handler) { handler(props, curPathData); });
        }
      }
    }

    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} `true` if it was changed.
   */
  function updateViewBox(props) {
    var curStats = props.curStats, aplStats = props.aplStats,
      curEdge = curStats.path_edge, padding, edge,
      curBBox = curStats.viewBox_bBox, aplBBox = aplStats.viewBox_bBox,
      viewBox = props.svg.viewBox.baseVal, styles = props.svg.style,
      updated = false;

    // Expand bBox with `line` or symbols, and event
    padding = Math.max(curStats.line_strokeWidth / 2,
      curStats.viewBox_plugBCircleSE[0] || 0, curStats.viewBox_plugBCircleSE[1] || 0);
    edge = {x1: curEdge.x1 - padding, y1: curEdge.y1 - padding,
      x2: curEdge.x2 + padding, y2: curEdge.y2 + padding};
    if (props.events.new_edge4viewBox) {
      props.events.new_edge4viewBox.forEach(function(handler) { handler(props, edge); });
    }

    curBBox.x = curStats.lineMask_x = curStats.lineOutlineMask_x = curStats.maskBGRect_x = edge.x1;
    curBBox.y = curStats.lineMask_y = curStats.lineOutlineMask_y = curStats.maskBGRect_y = edge.y1;
    curBBox.width = edge.x2 - edge.x1;
    curBBox.height = edge.y2 - edge.y1;

    ['x', 'y', 'width', 'height'].forEach(function(boxKey) {
      var value;
      if ((value = curBBox[boxKey]) !== aplBBox[boxKey]) {
        viewBox[boxKey] = aplBBox[boxKey] = value;
        styles[BBOX_PROP[boxKey]] = value +
          (boxKey === 'x' || boxKey === 'y' ? props.bodyOffset[boxKey] : 0) + 'px';
        updated = true;
      }
    });

    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} `true` if it was changed.
   */
  function updateMask(props) {
    var curStats = props.curStats, aplStats = props.aplStats,
      lineMaskBGEnabled, value,
      updated = false;

    if (curStats.plug_enabled) {
      [0, 1].forEach(function(i) {
        curStats.capsMaskMarker_enabledSE[i] =
          curStats.plug_enabledSE[i] && curStats.plug_colorTraSE[i] ||
          curStats.plugOutline_enabledSE[i] && curStats.plugOutline_colorTraSE[i];
      });
    } else {
      curStats.capsMaskMarker_enabledSE[0] = curStats.capsMaskMarker_enabledSE[1] = false;
    }
    curStats.capsMaskMarker_enabled =
      curStats.capsMaskMarker_enabledSE[0] || curStats.capsMaskMarker_enabledSE[1];

    // reserve for future version
    // curStats.lineMask_outlineMode = curStats.lineOutline_enabled || lineFGEnabled;
    curStats.lineMask_outlineMode = curStats.lineOutline_enabled;
    curStats.caps_enabled = curStats.capsMaskMarker_enabled ||
      curStats.capsMaskAnchor_enabledSE[0] || curStats.capsMaskAnchor_enabledSE[1];
    curStats.lineMask_enabled = curStats.caps_enabled || curStats.lineMask_outlineMode;
    lineMaskBGEnabled = curStats.lineMask_enabled && !curStats.lineMask_outlineMode;

    if (lineMaskBGEnabled || curStats.lineOutline_enabled) {
      // maskBGRect_x, maskBGRect_y
      ['x', 'y'].forEach(function(boxKey) {
        var statKey = 'maskBGRect_' + boxKey;
        if (setStat(props, aplStats, statKey, (value = curStats[statKey])
)) {
          props.maskBGRect[boxKey].baseVal.value = value;
          updated = true;
        }
      });
    }

    if (setStat(props, aplStats, 'lineMask_enabled', (value = curStats.lineMask_enabled))) {
      props.lineFace.style.mask = value ? 'url(#' + props.lineMaskId + ')' : 'none';
      updated = true;
      if (IS_WEBKIT) {
        forceReflowAdd(props, props.lineMask);
      }
    }

    if (curStats.lineMask_enabled) { // Includes `outlineMode`

      // lineMask_outlineMode
      if (setStat(props, aplStats, 'lineMask_outlineMode', (value = curStats.lineMask_outlineMode))) {
        if (value) {
          props.lineMaskBG.style.display = 'none';
          props.lineMaskShape.style.display = 'inline';
        } else {
          props.lineMaskBG.style.display = 'inline';
          props.lineMaskShape.style.display = 'none';
        }
        updated = true;
      }

      // lineMask_x, lineMask_y
      ['x', 'y'].forEach(function(boxKey) {
        var statKey = 'lineMask_' + boxKey;
        if (setStat(props, aplStats, statKey, (value = curStats[statKey])
)) {
          props.lineMask[boxKey].baseVal.value = value;
          updated = true;
        }
      });

      if (setStat(props, aplStats, 'caps_enabled', (value = curStats.caps_enabled))) {
        props.lineMaskCaps.style.display = props.lineOutlineMaskCaps.style.display =
          value ? 'inline' : 'none';
        updated = true;
        if (IS_WEBKIT) {
          forceReflowAdd(props, props.capsMaskLine);
        }
      }

      if (curStats.caps_enabled) {

        // capsMaskAnchor
        [0, 1].forEach(function(i) {
          var curPathData;

          if (setStat(props, aplStats.capsMaskAnchor_enabledSE, i, (value = curStats.capsMaskAnchor_enabledSE[i])
)) {
            props.capsMaskAnchorSE[i].style.display = value ? 'inline' : 'none';
            updated = true;
            if (IS_WEBKIT) {
              forceReflowAdd(props, props.lineMask);
            }
          }

          if (curStats.capsMaskAnchor_enabledSE[i]) {
            // capsMaskAnchor_pathDataSE
            if (pathDataHasChanged((curPathData = curStats.capsMaskAnchor_pathDataSE[i]),
                aplStats.capsMaskAnchor_pathDataSE[i])) {
              props.capsMaskAnchorSE[i].setPathData(curPathData);
              aplStats.capsMaskAnchor_pathDataSE[i] = curPathData;
              updated = true;
            }

            // capsMaskAnchor_strokeWidthSE
            if (setStat(props, aplStats.capsMaskAnchor_strokeWidthSE, i,
                (value = curStats.capsMaskAnchor_strokeWidthSE[i])
)) {
              props.capsMaskAnchorSE[i].style.strokeWidth = value + 'px';
              updated = true;
            }
          }
        });

        if (setStat(props, aplStats, 'capsMaskMarker_enabled', (value = curStats.capsMaskMarker_enabled))) {
          props.capsMaskLine.style.display = value ? 'inline' : 'none';
          updated = true;
        }

        if (curStats.capsMaskMarker_enabled) {

          // capsMaskMarker
          [0, 1].forEach(function(i) {
            var plugId = curStats.capsMaskMarker_plugSE[i],
              symbolConf = plugId !== PLUG_BEHIND ? SYMBOLS[PLUG_2_SYMBOL[plugId]] : null,
              marker = getMarkerProps(i, symbolConf);

            if (setStat(props, aplStats.capsMaskMarker_enabledSE, i, (value = curStats.capsMaskMarker_enabledSE[i])
)) {
              props.capsMaskLine.style[marker.prop] =
                value ? 'url(#' + props.lineMaskMarkerIdSE[i] + ')' : 'none';
              updated = true;
            }

            if (curStats.capsMaskMarker_enabledSE[i]) {

              // capsMaskMarker_plugSE
              if (setStat(props, aplStats.capsMaskMarker_plugSE, i, plugId
)) {
                props.capsMaskMarkerShapeSE[i].href.baseVal = '#' + symbolConf.elmId;
                setMarkerOrient(props, props.capsMaskMarkerSE[i], marker.orient,
                  symbolConf.bBox, props.svg, props.capsMaskMarkerShapeSE[i], props.capsMaskLine);
                updated = true;
                if (IS_GECKO) {
                  // [GECKO] plugsFace is not updated when plugSE is changed
                  forceReflowAdd(props, props.capsMaskLine);
                  forceReflowAdd(props, props.lineFace);
                }
              }

              // capsMaskMarker_markerWidthSE, capsMaskMarker_markerHeightSE
              ['markerWidth', 'markerHeight'].forEach(function(markerKey) {
                var statKey = 'capsMaskMarker_' + markerKey + 'SE';
                if (setStat(props, aplStats[statKey], i, (value = curStats[statKey][i])
)) {
                  props.capsMaskMarkerSE[i][markerKey].baseVal.value = value;
                  updated = true;
                }
              });
            }
          });
        }
      }
    }

    if (curStats.lineOutline_enabled) {
      // lineOutlineMask_x, lineOutlineMask_y
      ['x', 'y'].forEach(function(boxKey) {
        var statKey = 'lineOutlineMask_' + boxKey;
        if (setStat(props, aplStats, statKey, (value = curStats[statKey])
)) {
          props.lineOutlineMask[boxKey].baseVal.value = value;
          updated = true;
        }
      });
    }

    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {(boolean|number)} on - true:show | false:hide | 1:show(in anim)
   * @returns {void}
   */
  function svgShow(props, on) {
    if (on !== props.isShown) {
      if (!!on !== !!props.isShown) { props.svg.style.visibility = on ? '' : 'hidden'; }
      props.isShown = on;
      if (props.events && props.events.svgShow) {
        props.events.svgShow.forEach(function(handler) { handler(props, on); });
      }
    }
  }

  /**
   * Apply all of `effect`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {void}
   */
  function setEffect(props) {
    var curStats = props.curStats, aplStats = props.aplStats, enabled;

    Object.keys(EFFECTS).forEach(function(effectName) {
      var effectConf = EFFECTS[effectName],
        keyEnabled = effectName + '_enabled', keyOptions = effectName + '_options',
        curOptions = curStats[keyOptions];

      if (setStat(props, aplStats, keyEnabled, (enabled = curStats[keyEnabled]))) { // ON/OFF
        if (enabled) { aplStats[keyOptions] = copyTree(curOptions); }
        effectConf[enabled ? 'init' : 'remove'](props);

      } else if (enabled && hasChanged(curOptions, aplStats[keyOptions])) { // update options
        // traceLog is called by EFFECTS.*
        effectConf.remove(props);
        aplStats[keyEnabled] = true; // it might have been disabled by remove().
        aplStats[keyOptions] = copyTree(curOptions);
        effectConf.init(props);
      }
    });

  }

  /**
   * Apply current `options`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Object} needs - `group` of stats.
   * @returns {void}
   */
  function update(props, needs) {
    var updated = {};
    if (needs.line) {
      updated.line = updateLine(props);
    }
    if (needs.plug || updated.line) {
      updated.plug = updatePlug(props);
    }
    if (needs.lineOutline || updated.line) {
      updated.lineOutline = updateLineOutline(props);
    }
    if (needs.plugOutline || updated.line || updated.plug || updated.lineOutline) {
      updated.plugOutline = updatePlugOutline(props);
    }
    if (needs.faces || updated.line || updated.plug || updated.lineOutline || updated.plugOutline) {
      updated.faces = updateFaces(props);
    }
    if (needs.position || updated.line || updated.plug) {
      updated.position = updatePosition(props);
    }
    if (needs.path || updated.position) {
      updated.path = updatePath(props);
    }
    updated.viewBox = updateViewBox(props);
    updated.mask = updateMask(props);
    if (needs.effect) {
      setEffect(props);
    }

    if ((IS_BLINK || IS_WEBKIT) && updated.line && !updated.path) {
      // [BLINK], [WEBKIT] lineSize is not updated when path is not changed
      forceReflowAdd(props, props.lineShape);
    }
    if (IS_BLINK && updated.plug && !updated.line) {
      // [BLINK] plugColorSE is not updated when Line is not changed
      forceReflowAdd(props, props.plugsFace);
    }
    forceReflowApply(props);

  }

  function getValidAnimOptions(animOptions, defaultAnimOptions) {
    return {
      duration: isFinite(animOptions.duration) && animOptions.duration > 0 ?
        animOptions.duration : defaultAnimOptions.duration,
      timing: anim.validTiming(animOptions.timing) ?
        animOptions.timing : copyTree(defaultAnimOptions.timing)
    };
  }

  function show(props, on, showEffectName, animOptions) {
    var curStats = props.curStats, aplStats = props.aplStats, update = {}, timeRatio;

    function applyStats() {
      ['show_on', 'show_effect', 'show_animOptions'].forEach(function(statName) {
        aplStats[statName] = curStats[statName];
      });
    }

    curStats.show_on = on;
    if (showEffectName && SHOW_EFFECTS[showEffectName]) {
      curStats.show_effect = showEffectName;
      curStats.show_animOptions = getValidAnimOptions(
        isObject(animOptions) ? animOptions : {}, SHOW_EFFECTS[showEffectName].defaultAnimOptions);
    }

    update.show_on = curStats.show_on !== aplStats.show_on;
    update.show_effect = curStats.show_effect !== aplStats.show_effect;
    update.show_animOptions = hasChanged(curStats.show_animOptions, aplStats.show_animOptions);

    if (update.show_effect || update.show_animOptions) {
      if (curStats.show_inAnim) { // change and continue
        timeRatio = update.show_effect ?
          SHOW_EFFECTS[aplStats.show_effect].stop(props, true, true) : // reset prev effect
          SHOW_EFFECTS[aplStats.show_effect].stop(props);
        applyStats();
        SHOW_EFFECTS[aplStats.show_effect].init(props, timeRatio);
      } else if (update.show_on) { // init
        if (aplStats.show_effect && update.show_effect) {
          SHOW_EFFECTS[aplStats.show_effect].stop(props, true, true); // reset prev effect
        }
        applyStats();
        SHOW_EFFECTS[aplStats.show_effect].init(props);
      }
    } else if (update.show_on) { // restart
      applyStats();
      SHOW_EFFECTS[aplStats.show_effect].start(props);
    }

  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {attachProps} attachProps - `attachProps` of `LeaderLineAttachment` instance.
   * @param {string} optionName - Name of bound option.
   * @returns {boolean} `true` when binding succeeded.
   */
  function bindAttachment(props, attachProps, optionName) {
    var bindTarget = {props: props, optionName: optionName};
    if (props.attachments.indexOf(attachProps) < 0 &&
        (!attachProps.conf.bind || attachProps.conf.bind(attachProps, bindTarget))) {
      props.attachments.push(attachProps);
      attachProps.boundTargets.push(bindTarget);
      return true;
    }
    return false;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {attachProps} attachProps - `attachProps` of `LeaderLineAttachment` instance.
   * @param {boolean} [dontRemove] - Don't call `removeAttachment()`.
   * @returns {void}
   */
  function unbindAttachment(props, attachProps, dontRemove) {
    var i = props.attachments.indexOf(attachProps);
    if (i > -1) { props.attachments.splice(i, 1); }

    if (attachProps.boundTargets.some(function(boundTarget, iTarget) {
      if (boundTarget.props === props) {
        if (attachProps.conf.unbind) { attachProps.conf.unbind(attachProps, boundTarget); }
        i = iTarget;
        return true;
      }
      return false;
    })) {
      attachProps.boundTargets.splice(i, 1);
      if (!dontRemove) {
        addDelayedProc(function() { // Do it after all binding and unbinding.
          if (!attachProps.boundTargets.length) { removeAttachment(attachProps); }
        });
      }
    }
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Object} newOptions - New options.
   * @returns {void}
   */
  function setOptions(props, newOptions) {
    /*
      Names of `options`      Keys of API (properties of `newOptions`)
      ----------------------------------------
      anchorSE                start, end
      lineColor               color
      lineSize                size
      socketSE                startSocket, endSocket
      socketGravitySE         startSocketGravity, endSocketGravity
      plugSE                  startPlug, endPlug
      plugColorSE             startPlugColor, endPlugColor
      plugSizeSE              startPlugSize, endPlugSize
      lineOutlineEnabled      outline
      lineOutlineColor        outlineColor
      lineOutlineSize         outlineSize
      plugOutlineEnabledSE    startPlugOutline, endPlugOutline
      plugOutlineColorSE      startPlugOutlineColor, endPlugOutlineColor
      plugOutlineSizeSE       startPlugOutlineSize, endPlugOutlineSize
      labelSEM                startLabel, endLabel, middleLabel
    */
    var options = props.options,
      newWindow, needsWindow, needs = {};

    function getCurOption(root, propName, optionName, index, defaultValue) {
      var curOption = {};
      if (optionName) {
        if (index != null) {
          curOption.container = root[optionName];
          curOption.key = index;
        } else {
          curOption.container = root;
          curOption.key = optionName;
        }
      } else {
        curOption.container = root;
        curOption.key = propName;
      }
      curOption.default = defaultValue;
      curOption.acceptsAuto = curOption.default == null;
      return curOption;
    }

    function setValidId(root, newOptions, propName, key2Id, optionName, index, defaultValue) {
      var curOption = getCurOption(root, propName, optionName, index, defaultValue), updated, key, id;
      if (newOptions[propName] != null &&
          (key = (newOptions[propName] + '').toLowerCase()) && (
            curOption.acceptsAuto && key === KEYWORD_AUTO ||
            (id = key2Id[key])
          ) && id !== curOption.container[curOption.key]) {
        curOption.container[curOption.key] = id; // `undefined` when `KEYWORD_AUTO`
        updated = true;
      }
      if (curOption.container[curOption.key] == null && !curOption.acceptsAuto) {
        curOption.container[curOption.key] = curOption.default;
        updated = true;
      }
      return updated;
    }

    function setValidType(root, newOptions, propName, type, optionName, index, defaultValue, check, trim) {
      var curOption = getCurOption(root, propName, optionName, index, defaultValue), updated, value;

      function isValidType(value, type) { return type === 'number' ? isFinite(value) : typeof value === type; }

      if (!type) {
        if (curOption.default == null) { throw new Error('Invalid `type`: ' + propName); }
        type = typeof curOption.default;
      }
      if (newOptions[propName] != null && (
            curOption.acceptsAuto && (newOptions[propName] + '').toLowerCase() === KEYWORD_AUTO ||
            isValidType((value = newOptions[propName]), type) &&
            ((value = trim && type === 'string' && value ? value.trim() : value) || true) &&
            (!check || check(value))
          ) && value !== curOption.container[curOption.key]) {
        curOption.container[curOption.key] = value; // `undefined` when `KEYWORD_AUTO`
        updated = true;
      }
      if (curOption.container[curOption.key] == null && !curOption.acceptsAuto) {
        curOption.container[curOption.key] = curOption.default;
        updated = true;
      }
      return updated;
    }

    newOptions = newOptions || {};

    // anchorSE
    ['start', 'end'].forEach(function(optionName, i) {
      var newOption = newOptions[optionName], newIsAttachment = false;
      if (newOption &&
          (isElement(newOption) || (newIsAttachment = isAttachment(newOption, 'anchor'))) &&
          newOption !== options.anchorSE[i]) {

        if (props.optionIsAttach.anchorSE[i] !== false) {
          unbindAttachment(props, insAttachProps[options.anchorSE[i]._id]); // Unbind old
        }

        if (newIsAttachment && !bindAttachment(props, insAttachProps[newOption._id], optionName)) { // Bind new
          throw new Error('Can\'t bind attachment');
        }
        options.anchorSE[i] = newOption;
        props.optionIsAttach.anchorSE[i] = newIsAttachment;
        needsWindow = needs.position = true;
      }
    });
    if (!options.anchorSE[0] || !options.anchorSE[1] || options.anchorSE[0] === options.anchorSE[1]) {
      throw new Error('`start` and `end` are required.');
    }

    // Check window.
    if (needsWindow &&
        (newWindow = getCommonWindow(
          props.optionIsAttach.anchorSE[0] !== false ?
            insAttachProps[options.anchorSE[0]._id].element : options.anchorSE[0],
          props.optionIsAttach.anchorSE[1] !== false ?
            insAttachProps[options.anchorSE[1]._id].element : options.anchorSE[1]
        )) !== props.baseWindow) {
      bindWindow(props, newWindow);
      needs.line = needs.plug = needs.lineOutline = needs.plugOutline = needs.faces = needs.effect = true;
    }

    needs.position = setValidId(options, newOptions, 'path',
      PATH_KEY_2_ID, null, null, DEFAULT_OPTIONS.path) || needs.position;
    needs.position = setValidId(options, newOptions, 'startSocket',
      SOCKET_KEY_2_ID, 'socketSE', 0) || needs.position;
    needs.position = setValidId(options, newOptions, 'endSocket',
      SOCKET_KEY_2_ID, 'socketSE', 1) || needs.position;

    // socketGravitySE
    [newOptions.startSocketGravity, newOptions.endSocketGravity].forEach(function(newOption, i) {

      function matchArray(array1, array2) {
        return array1.length === array2.length &&
          array1.every(function(value1, i) { return value1 === array2[i]; });
      }

      var value = false; // `false` means no-update input.
      if (newOption != null) {
        if (Array.isArray(newOption)) {
          if (isFinite(newOption[0]) && isFinite(newOption[1])) {
            value = [newOption[0], newOption[1]];
            if (Array.isArray(options.socketGravitySE[i]) &&
              matchArray(value, options.socketGravitySE[i])) { value = false; }
          }
        } else {
          if ((newOption + '').toLowerCase() === KEYWORD_AUTO) {
            value = null;
          } else if (isFinite(newOption) && newOption >= 0) {
            value = newOption;
          }
          if (value === options.socketGravitySE[i]) { value = false; }
        }
        if (value !== false) {
          options.socketGravitySE[i] = value;
          needs.position = true;
        }
      }
    });

    // Line
    needs.line = setValidType(options, newOptions, 'color',
      null, 'lineColor', null, DEFAULT_OPTIONS.lineColor, null, true) || needs.line;
    needs.line = setValidType(options, newOptions, 'size',
      null, 'lineSize', null, DEFAULT_OPTIONS.lineSize,
      function(value) { return value > 0; }) || needs.line;

    // Plug
    ['startPlug', 'endPlug'].forEach(function(propName, i) {
      needs.plug = setValidId(options, newOptions, propName,
        PLUG_KEY_2_ID, 'plugSE', i, DEFAULT_OPTIONS.plugSE[i]) || needs.plug;
      needs.plug = setValidType(options, newOptions, propName + 'Color',
        'string', 'plugColorSE', i, null, null, true) || needs.plug;
      needs.plug = setValidType(options, newOptions, propName + 'Size',
        null, 'plugSizeSE', i, DEFAULT_OPTIONS.plugSizeSE[i],
        function(value) { return value > 0; }) || needs.plug;
    });

    // LineOutline
    needs.lineOutline = setValidType(options, newOptions, 'outline',
      null, 'lineOutlineEnabled', null, DEFAULT_OPTIONS.lineOutlineEnabled) || needs.lineOutline;
    needs.lineOutline = setValidType(options, newOptions, 'outlineColor',
      null, 'lineOutlineColor', null, DEFAULT_OPTIONS.lineOutlineColor, null, true) || needs.lineOutline;
    needs.lineOutline = setValidType(options, newOptions, 'outlineSize',
      null, 'lineOutlineSize', null, DEFAULT_OPTIONS.lineOutlineSize,
      function(value) { return value > 0 && value <= 0.48; }) || needs.lineOutline;

    // PlugOutline
    ['startPlugOutline', 'endPlugOutline'].forEach(function(propName, i) {
      needs.plugOutline = setValidType(options, newOptions, propName,
        null, 'plugOutlineEnabledSE', i, DEFAULT_OPTIONS.plugOutlineEnabledSE[i]) || needs.plugOutline;
      needs.plugOutline = setValidType(options, newOptions, propName + 'Color',
        'string', 'plugOutlineColorSE', i, null, null, true) || needs.plugOutline;
      // `outlineMax` is checked in `updatePlugOutline`.
      needs.plugOutline = setValidType(options, newOptions, propName + 'Size',
        null, 'plugOutlineSizeSE', i, DEFAULT_OPTIONS.plugOutlineSizeSE[i],
        function(value) { return value >= 1; }) || needs.plugOutline;
    });

    // label
    ['startLabel', 'endLabel', 'middleLabel'].forEach(function(optionName, i) {
      var newOption = newOptions[optionName],
        oldOption = options.labelSEM[i] && !props.optionIsAttach.labelSEM[i] ?
          insAttachProps[options.labelSEM[i]._id].text : options.labelSEM[i],
        newIsAttachment = false, plain, attachProps, label;

      if ((plain = typeof newOption === 'string')) { newOption = newOption.trim(); }
      if ((plain || newOption && (newIsAttachment = isAttachment(newOption, 'label'))) &&
          newOption !== oldOption) {

        if (options.labelSEM[i]) {
          unbindAttachment(props, insAttachProps[options.labelSEM[i]._id]); // Unbind old
          options.labelSEM[i] = '';
        }

        if (newOption) {
          if (newIsAttachment) {
            label = newOption;
            // Only one target can be bound.
            attachProps = insAttachProps[label._id];
            attachProps.boundTargets.slice().forEach( // Copy boundTargets because removeOption may change array.
              function(boundTarget) { attachProps.conf.removeOption(attachProps, boundTarget); });
          } else {
            label = new LeaderLineAttachment(ATTACHMENTS.captionLabel, [newOption]);
          }
          if (!bindAttachment(props, insAttachProps[label._id], optionName)) {
            throw new Error('Can\'t bind attachment');
          }
          options.labelSEM[i] = label;
        }
        props.optionIsAttach.labelSEM[i] = newIsAttachment;
      }
    });

    // effect
    Object.keys(EFFECTS).forEach(function(effectName) {
      var effectConf = EFFECTS[effectName],
        keyEnabled = effectName + '_enabled', keyOptions = effectName + '_options',
        newOption, optionValue;

      function getValidOptions(newEffectOptions) {
        var effectOptions = {};
        effectConf.optionsConf.forEach(function(optionConf) {
          var optionClass = optionConf[0], optionName = optionConf[3], i = optionConf[4];
          if (i != null && !effectOptions[optionName]) { effectOptions[optionName] = []; }
          (typeof optionClass === 'function' ? optionClass :
              optionClass === 'id' ? setValidId : setValidType)
            .apply(null, [effectOptions, newEffectOptions].concat(optionConf.slice(1)));
        });
        return effectOptions;
      }

      function parseAnimOptions(newEffectOptions) {
        var optionValue, keyAnimOptions = effectName + '_animOptions';

        if (!newEffectOptions.hasOwnProperty('animation')) {
          optionValue = !!effectConf.defaultEnabled;
          props.curStats[keyAnimOptions] =
            optionValue ? getValidAnimOptions({}, effectConf.defaultAnimOptions) : null;
        } else if (isObject(newEffectOptions.animation)) {
          optionValue = props.curStats[keyAnimOptions] =
            getValidAnimOptions(newEffectOptions.animation, effectConf.defaultAnimOptions);
        } else { // boolean
          optionValue = !!newEffectOptions.animation;
          props.curStats[keyAnimOptions] =
            optionValue ? getValidAnimOptions({}, effectConf.defaultAnimOptions) : null;
        }
        return optionValue;
      }

      if (newOptions.hasOwnProperty(effectName)) {
        newOption = newOptions[effectName];

        if (isObject(newOption)) {
          props.curStats[keyEnabled] = true;
          optionValue = props.curStats[keyOptions] = getValidOptions(newOption);
          if (effectConf.anim) {
            props.curStats[keyOptions].animation = parseAnimOptions(newOption);
          }
        } else { // boolean
          optionValue = props.curStats[keyEnabled] = !!newOption;
          if (optionValue) {
            props.curStats[keyOptions] = getValidOptions({});
            if (effectConf.anim) {
              props.curStats[keyOptions].animation = parseAnimOptions({});
            }
          }
        }

        if (hasChanged(optionValue, options[effectName])) {
          options[effectName] = optionValue;
          needs.effect = true;
        }
      }
    });


    update(props, needs);
  }

  /**
   * @typedef {Array} EffectOptionConf - Args for checking ID or Type (or function)
   *    ['id', propName, key2Id, optionName, index, defaultValue] or
   *    ['type', propName, type, optionName, index, defaultValue, check, trim] or
   *    [function(effectOptions, newEffectOptions, propName, type, optionName, index),
   *            propName, type, optionName, index]
   */

  /**
   * @typedef {Object} EffectConf
   * @property {{statName: string, StatConf}} stats - Additional stats.
   * @property {EffectOptionConf[]} optionsConf
   * @property {Function} init - function(props)
   * @property {Function} remove - function(props)
   * @property {Function} update - function(props[, valueByEvent])
   * @property {boolean} [anim] - Support animation.
   * @property {AnimOptions} [defaultAnimOptions]
   * @property {boolean} [defaultAnimEnabled]
   */

  /** @type {{effectName: string, EffectConf}} */
  EFFECTS = {
    dash: {
      stats: {dash_len: {}, dash_gap: {}, dash_maxOffset: {}},
      anim: true, defaultAnimOptions: {duration: 1000, timing: 'linear'},

      optionsConf: [
        ['type', 'len', 'number', null, null, null, function(value) { return value > 0; }],
        ['type', 'gap', 'number', null, null, null, function(value) { return value > 0; }]
      ],

      init: function(props) {
        addEventHandler(props, 'apl_line_strokeWidth', EFFECTS.dash.update);
        props.lineFace.style.strokeDashoffset = 0;
        EFFECTS.dash.update(props);
      },

      remove: function(props) {
        var curStats = props.curStats;
        removeEventHandler(props, 'apl_line_strokeWidth', EFFECTS.dash.update);
        if (curStats.dash_animId) {
          anim.remove(curStats.dash_animId);
          curStats.dash_animId = null;
        }
        props.lineFace.style.strokeDasharray = 'none';
        props.lineFace.style.strokeDashoffset = 0;
        initStats(props.aplStats, EFFECTS.dash.stats);
      },

      update: function(props) {
        var curStats = props.curStats, aplStats = props.aplStats,
          effectOptions = aplStats.dash_options,
          update = false, timeRatio;

        curStats.dash_len = effectOptions.len || aplStats.line_strokeWidth * 2;
        curStats.dash_gap = effectOptions.gap || aplStats.line_strokeWidth;
        curStats.dash_maxOffset = curStats.dash_len + curStats.dash_gap;

        update = setStat(props, aplStats, 'dash_len', curStats.dash_len) || update;
        update = setStat(props, aplStats, 'dash_gap', curStats.dash_gap) || update;
        if (update) {
          props.lineFace.style.strokeDasharray = aplStats.dash_len + ',' + aplStats.dash_gap;
        }

        if (curStats.dash_animOptions) {
          update = setStat(props, aplStats, 'dash_maxOffset', curStats.dash_maxOffset);

          if (aplStats.dash_animOptions && ( // ON -> ON (update)
              // Normally, animOptions is not changed because the effect was removed when it was changed.
              update || hasChanged(curStats.dash_animOptions, aplStats.dash_animOptions))) {
            if (curStats.dash_animId) {
              timeRatio = anim.stop(curStats.dash_animId);
              anim.remove(curStats.dash_animId);
            }
            aplStats.dash_animOptions = null;
          }

          if (!aplStats.dash_animOptions) { // OFF -> ON
            curStats.dash_animId = anim.add(
              function(outputRatio) { return (1 - outputRatio) * aplStats.dash_maxOffset + 'px'; },
              function(value) { props.lineFace.style.strokeDashoffset = value; },
              curStats.dash_animOptions.duration, 0, curStats.dash_animOptions.timing, false, timeRatio);
            aplStats.dash_animOptions = copyTree(curStats.dash_animOptions);
          }

        } else if (aplStats.dash_animOptions) { // ON -> OFF
          // Normally, anim was already removed when effectOptions was changed.
          if (curStats.dash_animId) {
            anim.remove(curStats.dash_animId);
            curStats.dash_animId = null;
          }
          props.lineFace.style.strokeDashoffset = 0;
          aplStats.dash_animOptions = null;
        }

      }
    },

    gradient: {
      stats: {gradient_colorSE: {hasSE: true}, gradient_pointSE: {hasSE: true, hasProps: true}},

      optionsConf: [
        ['type', 'startColor', 'string', 'colorSE', 0, null, null, true],
        ['type', 'endColor', 'string', 'colorSE', 1, null, null, true]
      ],

      init: function(props) {
        var baseDocument = props.baseWindow.document, defs = props.defs, element,
          id = APP_ID + '-' + props._id + '-gradient';

        props.efc_gradient_gradient = element =
          defs.appendChild(baseDocument.createElementNS(SVG_NS, 'linearGradient'));
        element.id = id;
        element.gradientUnits.baseVal = SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE;
        [element.x1, element.y1, element.x2, element.y2].forEach(function(len) {
          len.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0);
        });
        props.efc_gradient_stopSE = [0, 1].map(function(i) {
          var element = props.efc_gradient_gradient.appendChild(baseDocument.createElementNS(SVG_NS, 'stop'));
          try {
            element.offset.baseVal = i; // offset === index
          } catch (error) {
            if (error.code === DOMException.NO_MODIFICATION_ALLOWED_ERR) { // [TRIDENT] bug
              element.setAttribute('offset', i);
            } else {
              throw error;
            }
          }
          return element;
        });

        addEventHandler(props, 'cur_plug_colorSE', EFFECTS.gradient.update);
        addEventHandler(props, 'apl_path', EFFECTS.gradient.update);
        props.curStats.line_altColor = true;
        props.lineFace.style.stroke = 'url(#' + id + ')';
        EFFECTS.gradient.update(props);
      },

      remove: function(props) {
        if (props.efc_gradient_gradient) {
          props.defs.removeChild(props.efc_gradient_gradient);
          props.efc_gradient_gradient = props.efc_gradient_stopSE = null;
        }

        removeEventHandler(props, 'cur_plug_colorSE', EFFECTS.gradient.update);
        removeEventHandler(props, 'apl_path', EFFECTS.gradient.update);
        props.curStats.line_altColor = false;
        props.lineFace.style.stroke = props.curStats.line_color;
        initStats(props.aplStats, EFFECTS.gradient.stats);
      },

      update: function(props) {
        var curStats = props.curStats, aplStats = props.aplStats,
          effectOptions = aplStats.gradient_options,
          pathList = props.pathList.animVal || props.pathList.baseVal,
          pathSeg, point;

        [0, 1].forEach(function(i) {
          curStats.gradient_colorSE[i] = effectOptions.colorSE[i] || curStats.plug_colorSE[i];
        });

        point = pathList[0][0];
        curStats.gradient_pointSE[0] = {x: point.x, y: point.y}; // first point of first seg
        pathSeg = pathList[pathList.length - 1];
        point = pathSeg[pathSeg.length - 1];
        curStats.gradient_pointSE[1] = {x: point.x, y: point.y}; // last point of last seg

        [0, 1].forEach(function(i) {
          var value;

          if (setStat(props, aplStats.gradient_colorSE, i, (value = curStats.gradient_colorSE[i])
)) {
            if (IS_WEBKIT) {
              // [WEBKIT] stopColor doesn't support alpha channel
              value = getAlpha(value);
              props.efc_gradient_stopSE[i].style.stopColor = value[1];
              props.efc_gradient_stopSE[i].style.stopOpacity = value[0];
            } else {
              props.efc_gradient_stopSE[i].style.stopColor = value;
            }
          }

          ['x', 'y'].forEach(function(pointKey) {
            if ((value = curStats.gradient_pointSE[i][pointKey]) !== aplStats.gradient_pointSE[i][pointKey]) {
              props.efc_gradient_gradient[pointKey + (i + 1)].baseVal.value =
                aplStats.gradient_pointSE[i][pointKey] = value;
            }
          });
        });
      }
    },

    dropShadow: {
      stats: {dropShadow_dx: {}, dropShadow_dy: {}, dropShadow_blur: {},
        dropShadow_color: {}, dropShadow_opacity: {}, dropShadow_x: {}, dropShadow_y: {}},

      optionsConf: [
        ['type', 'dx', null, null, null, 2],
        ['type', 'dy', null, null, null, 4],
        ['type', 'blur', null, null, null, 3, function(value) { return value >= 0; }],
        ['type', 'color', null, null, null, '#000', null, true],
        ['type', 'opacity', null, null, null, 0.8, function(value) { return value >= 0 && value <= 1; }]
      ],

      init: function(props) {
        var baseDocument = props.baseWindow.document, defs = props.defs,
          id = APP_ID + '-' + props._id + '-dropShadow',
          dropShadow = newDropShadow(baseDocument, id);

        ['elmFilter', 'elmOffset', 'elmBlur', 'styleFlood', 'elmsAppend']
          .forEach(function(key) { props['efc_dropShadow_' + key] = dropShadow[key]; });

        dropShadow.elmsAppend.forEach(function(elm) { defs.appendChild(elm); });
        props.face.setAttribute('filter', 'url(#' + id + ')');

        addEventHandler(props, 'new_edge4viewBox', EFFECTS.dropShadow.adjustEdge);
        EFFECTS.dropShadow.update(props);
      },

      remove: function(props) {
        var defs = props.defs;
        if (props.efc_dropShadow_elmsAppend) {
          props.efc_dropShadow_elmsAppend.forEach(function(elm) { defs.removeChild(elm); });
          props.efc_dropShadow_elmFilter = props.efc_dropShadow_elmOffset = props.efc_dropShadow_elmBlur =
            props.efc_dropShadow_styleFlood = props.efc_dropShadow_elmsAppend = null;
        }

        removeEventHandler(props, 'new_edge4viewBox', EFFECTS.dropShadow.adjustEdge);
        update(props, {}); // To call updateViewBox()
        props.face.removeAttribute('filter');
        initStats(props.aplStats, EFFECTS.dropShadow.stats);
      },

      update: function(props) {
        var curStats = props.curStats, aplStats = props.aplStats,
          effectOptions = aplStats.dropShadow_options,
          value, updateBBox;

        curStats.dropShadow_dx = value = effectOptions.dx;
        if (setStat(props, aplStats, 'dropShadow_dx', value)) {
          props.efc_dropShadow_elmOffset.dx.baseVal = value;
          updateBBox = true;
        }

        curStats.dropShadow_dy = value = effectOptions.dy;
        if (setStat(props, aplStats, 'dropShadow_dy', value)) {
          props.efc_dropShadow_elmOffset.dy.baseVal = value;
          updateBBox = true;
        }

        curStats.dropShadow_blur = value = effectOptions.blur;
        if (setStat(props, aplStats, 'dropShadow_blur', value)) {
          props.efc_dropShadow_elmBlur.setStdDeviation(value, value);
          updateBBox = true;
        }

        if (updateBBox) { update(props, {}); } // To call updateViewBox()

        curStats.dropShadow_color = value = effectOptions.color;
        if (setStat(props, aplStats, 'dropShadow_color', value)) {
          props.efc_dropShadow_styleFlood.floodColor = value;
        }

        curStats.dropShadow_opacity = value = effectOptions.opacity;
        if (setStat(props, aplStats, 'dropShadow_opacity', value)) {
          props.efc_dropShadow_styleFlood.floodOpacity = value;
        }

      },

      adjustEdge: function(props, edge) {
        var curStats = props.curStats, aplStats = props.aplStats, margin, shadowEdge;
        if (curStats.dropShadow_dx != null) {
          margin = curStats.dropShadow_blur * 3; // nearly standard deviation
          shadowEdge = {
            x1: edge.x1 - margin + curStats.dropShadow_dx,
            y1: edge.y1 - margin + curStats.dropShadow_dy,
            x2: edge.x2 + margin + curStats.dropShadow_dx,
            y2: edge.y2 + margin + curStats.dropShadow_dy
          };
          if (shadowEdge.x1 < edge.x1) { edge.x1 = shadowEdge.x1; }
          if (shadowEdge.y1 < edge.y1) { edge.y1 = shadowEdge.y1; }
          if (shadowEdge.x2 > edge.x2) { edge.x2 = shadowEdge.x2; }
          if (shadowEdge.y2 > edge.y2) { edge.y2 = shadowEdge.y2; }

          // position filter
          ['x', 'y'].forEach(function(boxKey) {
            var statKey = 'dropShadow_' + boxKey, value;
            curStats[statKey] = value = edge[boxKey + '1'];
            if (setStat(props, aplStats, statKey, value)) {
              props.efc_dropShadow_elmFilter[boxKey].baseVal.value = value;
            }
          });
        }
      }
    }
  };

  Object.keys(EFFECTS).forEach(function(effectName) {
    var effectConf = EFFECTS[effectName], effectStats = effectConf.stats;
    effectStats[effectName + '_enabled'] = {iniValue: false};
    effectStats[effectName + '_options'] = {hasProps: true};
    if (effectConf.anim) {
      effectStats[effectName + '_animOptions'] = {};
      effectStats[effectName + '_animId'] = {};
    }
  });

  /**
   * @typedef {Object} ShowEffectConf
   * @property {{statName: string, StatConf}} stats - Additional stats. *** NOT SUPPORTED
   * @property {Function} init - function(props[, timeRatio])
   * @property {Function} start - function(props[, timeRatio])
   * @property {Function} stop - function(props[, finish[, on]]) returns previous timeRatio
   * @property {AnimOptions} defaultAnimOptions
   */

  /** @type {{showEffectName: string, ShowEffectConf}} */
  SHOW_EFFECTS = {
    none: {
      defaultAnimOptions: {},

      init: function(props, timeRatio) {
        var curStats = props.curStats;
        if (curStats.show_animId) {
          anim.remove(curStats.show_animId);
          curStats.show_animId = null;
        }
        SHOW_EFFECTS.none.start(props, timeRatio);
      },

      start: function(props, timeRatio) {
        SHOW_EFFECTS.none.stop(props, true);
      },

      stop: function(props, finish, on) {
        var curStats = props.curStats;
        on = on != null ? on : props.aplStats.show_on;
        curStats.show_inAnim = false;
        if (finish) { svgShow(props, on); }
        return on ? 1 : 0;
      }
    },

    fade: {
      defaultAnimOptions: {duration: 300, timing: 'linear'},

      init: function(props, timeRatio) {
        var curStats = props.curStats, aplStats = props.aplStats;
        if (curStats.show_animId) { anim.remove(curStats.show_animId); }
        curStats.show_animId = anim.add(
          function(outputRatio) { return outputRatio; },
          function(value, finish) {
            if (finish) {
              SHOW_EFFECTS.fade.stop(props, true);
            } else {
              props.svg.style.opacity = value + '';
              // [TRIDENT] masks is ignored when opacity of svg is changed
              if (IS_TRIDENT) { forceReflowAdd(props, props.svg); forceReflowApply(props); }
            }
          },
          aplStats.show_animOptions.duration, 1, aplStats.show_animOptions.timing, null, false);
        SHOW_EFFECTS.fade.start(props, timeRatio);
      },

      start: function(props, timeRatio) {
        var curStats = props.curStats, prevTimeRatio;
        if (curStats.show_inAnim) {
          prevTimeRatio = anim.stop(curStats.show_animId);
        }
        svgShow(props, 1);
        curStats.show_inAnim = true;
        anim.start(curStats.show_animId, !props.aplStats.show_on,
          timeRatio != null ? timeRatio : prevTimeRatio);
      },

      stop: function(props, finish, on) {
        var curStats = props.curStats, timeRatio;
        on = on != null ? on : props.aplStats.show_on;
        timeRatio = curStats.show_inAnim ? anim.stop(curStats.show_animId) : on ? 1 : 0;
        curStats.show_inAnim = false;
        if (finish) {
          props.svg.style.opacity = on ? '' : '0';
          svgShow(props, on);
        }
        return timeRatio;
      }
    },

    draw: {
      defaultAnimOptions: {duration: 500, timing: [0.58, 0, 0.42, 1]},

      init: function(props, timeRatio) {
        var curStats = props.curStats, aplStats = props.aplStats,
          pathList = props.pathList.baseVal,
          allPathLen = getAllPathListLen(pathList), pathSegsLen = allPathLen.segsLen, pathLenAll = allPathLen.lenAll;
        if (curStats.show_animId) { anim.remove(curStats.show_animId); }

        curStats.show_animId = anim.add(
          function(outputRatio) {
            var pathLen, i = -1, newPathList, points, point;

            if (outputRatio === 0) {
              // This path might show incorrect angle of plug because it can't get the angle.
              // This path is for updatePath only when show_on === true.
              newPathList = [[pathList[0][0], pathList[0][0]]]; // line from start to start
            } else if (outputRatio === 1) {
              newPathList = pathList;
            } else {
              pathLen = pathLenAll * outputRatio;
              newPathList = [];
              while (pathLen >= pathSegsLen[++i]) {
                newPathList.push(pathList[i]);
                pathLen -= pathSegsLen[i];
              }
              if (pathLen) {
                points = pathList[i];
                if (points.length === 2) {
                  newPathList.push([
                    points[0],
                    getPointOnLine(points[0], points[1], pathLen / pathSegsLen[i])
                  ]);
                } else {
                  point = getPointOnCubic(points[0], points[1], points[2], points[3],
                    getCubicT(points[0], points[1], points[2], points[3], pathLen));
                  newPathList.push([points[0], point.fromP1, point.fromP2, point]);
                }
              }
            }
            return newPathList;
          },
          function(value, finish) {
            if (finish) {
              SHOW_EFFECTS.draw.stop(props, true);
            } else {
              props.pathList.animVal = value;
              update(props, {path: true});
            }
          },
          aplStats.show_animOptions.duration, 1, aplStats.show_animOptions.timing, null, false);
        SHOW_EFFECTS.draw.start(props, timeRatio);
      },

      start: function(props, timeRatio) {
        var curStats = props.curStats, prevTimeRatio;
        if (curStats.show_inAnim) {
          prevTimeRatio = anim.stop(curStats.show_animId);
        }
        svgShow(props, 1);
        curStats.show_inAnim = true;
        addEventHandler(props, 'apl_position', SHOW_EFFECTS.draw.update);
        anim.start(curStats.show_animId, !props.aplStats.show_on,
          timeRatio != null ? timeRatio : prevTimeRatio);
      },

      stop: function(props, finish, on) {
        var curStats = props.curStats, timeRatio;
        on = on != null ? on : props.aplStats.show_on;
        timeRatio = curStats.show_inAnim ? anim.stop(curStats.show_animId) : on ? 1 : 0;
        curStats.show_inAnim = false;
        if (finish) {
          if (on) {
            props.pathList.animVal = null;
            update(props, {path: true});
          } else {
            // This path might show incorrect angle of plug because it can't get the angle.
            // But this is hidden. This path is for updatePath.
            props.pathList.animVal =
              [[props.pathList.baseVal[0][0], props.pathList.baseVal[0][0]]]; // line from start to start
            update(props, {path: true});
          }
          svgShow(props, on);
        }
        return timeRatio;
      },

      update: function(props) {
        removeEventHandler(props, 'apl_position', SHOW_EFFECTS.draw.update);
        if (props.curStats.show_inAnim) {
          SHOW_EFFECTS.draw.init(props, SHOW_EFFECTS.draw.stop(props)); // reset
        } else {
          props.aplStats.show_animOptions = {}; // Make show() reset for new path at next time
        }
      }
    }
  };

  /**
   * @class
   * @param {Element} [start] - Alternative to `options.start`.
   * @param {Element} [end] - Alternative to `options.end`.
   * @param {Object} [options] - Initial options.
   */
  function LeaderLine(start, end, options) {
    var props = {
      // Initialize properties as array.
      options: {anchorSE: [], socketSE: [], socketGravitySE: [], plugSE: [], plugColorSE: [], plugSizeSE: [],
        plugOutlineEnabledSE: [], plugOutlineColorSE: [], plugOutlineSizeSE: [], labelSEM: ['', '', '']},
      optionIsAttach: {anchorSE: [false, false], labelSEM: [false, false, false]},
      curStats: {}, aplStats: {}, attachments: [], events: {}, reflowTargets: []
    };

    initStats(props.curStats, STATS);
    initStats(props.aplStats, STATS);
    Object.keys(EFFECTS).forEach(function(effectName) {
      var effectStats = EFFECTS[effectName].stats;
      initStats(props.curStats, effectStats);
      initStats(props.aplStats, effectStats);
      props.options[effectName] = false;
    });
    initStats(props.curStats, SHOW_STATS);
    initStats(props.aplStats, SHOW_STATS);
    props.curStats.show_effect = DEFAULT_SHOW_EFFECT;
    props.curStats.show_animOptions = copyTree(SHOW_EFFECTS[DEFAULT_SHOW_EFFECT].defaultAnimOptions);

    Object.defineProperty(this, '_id', {value: ++insId});
    props._id = this._id;
    insProps[this._id] = props;

    if (arguments.length === 1) {
      options = start;
      start = null;
    }
    options = options || {};
    if (start || end) {
      options = copyTree(options);
      if (start) { options.start = start; }
      if (end) { options.end = end; }
    }
    props.isShown = props.aplStats.show_on = !options.hide; // isShown is applied in setOptions -> bindWindow
    this.setOptions(options);
  }

  (function() {
    function createSetter(propName) {
      return function(value) {
        var options = {};
        options[propName] = value;
        this.setOptions(options); // eslint-disable-line no-invalid-this
      };
    }

    // Setup option accessor methods (direct)
    [['start', 'anchorSE', 0], ['end', 'anchorSE', 1], ['color', 'lineColor'], ['size', 'lineSize'],
        ['startSocketGravity', 'socketGravitySE', 0], ['endSocketGravity', 'socketGravitySE', 1],
        ['startPlugColor', 'plugColorSE', 0], ['endPlugColor', 'plugColorSE', 1],
        ['startPlugSize', 'plugSizeSE', 0], ['endPlugSize', 'plugSizeSE', 1],
        ['outline', 'lineOutlineEnabled'],
          ['outlineColor', 'lineOutlineColor'], ['outlineSize', 'lineOutlineSize'],
        ['startPlugOutline', 'plugOutlineEnabledSE', 0], ['endPlugOutline', 'plugOutlineEnabledSE', 1],
          ['startPlugOutlineColor', 'plugOutlineColorSE', 0], ['endPlugOutlineColor', 'plugOutlineColorSE', 1],
          ['startPlugOutlineSize', 'plugOutlineSizeSE', 0], ['endPlugOutlineSize', 'plugOutlineSizeSE', 1]]
      .forEach(function(conf) {
        var propName = conf[0], optionName = conf[1], i = conf[2];
        Object.defineProperty(LeaderLine.prototype, propName, {
          get: function() {
            var value = // Don't use closure.
              i != null ? insProps[this._id].options[optionName][i] :
              optionName ? insProps[this._id].options[optionName] :
              insProps[this._id].options[propName];
            return value == null ? KEYWORD_AUTO : copyTree(value);
          },
          set: createSetter(propName),
          enumerable: true
        });
      });
    // Setup option accessor methods (key-to-id)
    [['path', PATH_KEY_2_ID],
        ['startSocket', SOCKET_KEY_2_ID, 'socketSE', 0], ['endSocket', SOCKET_KEY_2_ID, 'socketSE', 1],
        ['startPlug', PLUG_KEY_2_ID, 'plugSE', 0], ['endPlug', PLUG_KEY_2_ID, 'plugSE', 1]]
      .forEach(function(conf) {
        var propName = conf[0], key2Id = conf[1], optionName = conf[2], i = conf[3];
        Object.defineProperty(LeaderLine.prototype, propName, {
          get: function() {
            var value = // Don't use closure.
                i != null ? insProps[this._id].options[optionName][i] :
                optionName ? insProps[this._id].options[optionName] :
                insProps[this._id].options[propName],
              key;
            return !value ? KEYWORD_AUTO :
              Object.keys(key2Id).some(function(optKey) {
                if (key2Id[optKey] === value) { key = optKey; return true; }
                return false;
              }) ? key : new Error('It\'s broken');
          },
          set: createSetter(propName),
          enumerable: true
        });
      });
    // Setup option accessor methods (effect)
    Object.keys(EFFECTS).forEach(function(effectName) {
      var effectConf = EFFECTS[effectName];

      function getOptions(optionValue) {
        var effectOptions = effectConf.optionsConf.reduce(function(effectOptions, optionConf) {
          var optionClass = optionConf[0], propName = optionConf[1], key2Id = optionConf[2],
            optionName = optionConf[3], i = optionConf[4],
            value =
              i != null ? optionValue[optionName][i] :
              optionName ? optionValue[optionName] :
              optionValue[propName],
            key;
          effectOptions[propName] = optionClass === 'id' ? (
              !value ? KEYWORD_AUTO :
              Object.keys(key2Id).some(function(optKey) {
                if (key2Id[optKey] === value) { key = optKey; return true; }
                return false;
              }) ? key : new Error('It\'s broken')
            ) : (value == null ? KEYWORD_AUTO : copyTree(value));
          return effectOptions;
        }, {});
        if (effectConf.anim) {
          effectOptions.animation = copyTree(optionValue.animation);
        }
        return effectOptions;
      }

      Object.defineProperty(LeaderLine.prototype, effectName, {
        get: function() {
          var value = insProps[this._id].options[effectName];
          return isObject(value) ? getOptions(value) : value;
        },
        set: createSetter(effectName),
        enumerable: true
      });
    });
    // Setup option accessor methods (label)
    ['startLabel', 'endLabel', 'middleLabel'].forEach(function(propName, i) {
      Object.defineProperty(LeaderLine.prototype, propName, {
        get: function() {
          var props = insProps[this._id], options = props.options; // Don't use closure.
          return options.labelSEM[i] && !props.optionIsAttach.labelSEM[i] ?
            insAttachProps[options.labelSEM[i]._id].text : options.labelSEM[i] || '';
        },
        set: createSetter(propName),
        enumerable: true
      });
    });
  })();

  LeaderLine.prototype.setOptions = function(newOptions) {
    setOptions(insProps[this._id], newOptions);
    return this;
  };

  LeaderLine.prototype.position = function() {
    update(insProps[this._id], {position: true});
    return this;
  };

  LeaderLine.prototype.remove = function() {
    var props = insProps[this._id], curStats = props.curStats;

    Object.keys(EFFECTS).forEach(function(effectName) {
      var keyAnimId = effectName + '_animId';
      if (curStats[keyAnimId]) { anim.remove(curStats[keyAnimId]); }
    });
    if (curStats.show_animId) { anim.remove(curStats.show_animId); }
    props.attachments.slice().forEach(function(attachProps) { unbindAttachment(props, attachProps); });

    if (props.baseWindow && props.svg) {
      props.baseWindow.document.body.removeChild(props.svg);
    }
    delete insProps[this._id];
  };

  LeaderLine.prototype.show = function(showEffectName, animOptions) {
    show(insProps[this._id], true, showEffectName, animOptions);
    return this;
  };

  LeaderLine.prototype.hide = function(showEffectName, animOptions) {
    show(insProps[this._id], false, showEffectName, animOptions);
    return this;
  };

  /**
   * @param {attachProps} attachProps - `attachProps` of `LeaderLineAttachment` instance.
   * @returns {void}
   */
  removeAttachment = function(attachProps) {
    if (attachProps && insAttachProps[attachProps._id]) {
      attachProps.boundTargets.slice().forEach(
        function(boundTarget) { unbindAttachment(boundTarget.props, attachProps, true); });
      if (attachProps.conf.remove) { attachProps.conf.remove(attachProps); }
      delete insAttachProps[attachProps._id];
    }
  };

  LeaderLineAttachment = (function() {
    /**
     * @class
     * @param {AttachConf} conf - Target AttachConf.
     * @param {Array} args - Initial options.
     */
    function LeaderLineAttachment(conf, args) {
      var attachProps = {conf: conf, curStats: {}, aplStats: {}, boundTargets: []},
        attachOptions, shortOptions = {};

      // Parse arguments
      conf.argOptions.every(function(argOption) {
        if (args.length && (
              typeof argOption.type === 'string' ? typeof args[0] === argOption.type :
              typeof argOption.type === 'function' ? argOption.type(args[0]) : false
            )) {
          shortOptions[argOption.optionName] = args.shift();
          return true;
        } else {
          return false;
        }
      });
      attachOptions = args.length && isObject(args[0]) ? copyTree(args[0]) : {};
      Object.keys(shortOptions).forEach(
        function(optionName) { attachOptions[optionName] = shortOptions[optionName]; });

      if (conf.stats) {
        initStats(attachProps.curStats, conf.stats);
        initStats(attachProps.aplStats, conf.stats);
      }

      Object.defineProperty(this, '_id', {value: ++insAttachId});
      Object.defineProperty(this, 'isRemoved', {
        get: function() { return !insAttachProps[this._id]; }
      });
      attachProps._id = this._id;

      // isRemoved has to be set before this because init() might throw.
      if (!conf.init || conf.init(attachProps, attachOptions)) {
        insAttachProps[this._id] = attachProps;
      }
    }

    LeaderLineAttachment.prototype.remove = function() {
      var that = this, attachProps = insAttachProps[that._id];
      if (attachProps) {
        attachProps.boundTargets.slice().forEach( // Copy boundTargets because removeOption may change array.
          function(boundTarget) { attachProps.conf.removeOption(attachProps, boundTarget); });

        addDelayedProc(function() {
          var attachProps = insAttachProps[that._id];
          if (attachProps) { // it should be removed by unbinding all
            console.error('LeaderLineAttachment was not removed by removeOption');
            removeAttachment(attachProps); // force
          }
        });
      }
    };

    return LeaderLineAttachment;
  })();
  window.LeaderLineAttachment = LeaderLineAttachment;

  /**
   * @param {any} obj - An object to be checked.
   * @param {string} [type] - A required type of LeaderLineAttachment.
   * @returns {(boolean|null)} true: Enabled LeaderLineAttachment, false: Not instance, null: Disabled it
   */
  isAttachment = function(obj, type) {
    return !(obj instanceof LeaderLineAttachment) ? false :
      !obj.isRemoved && (!type || insAttachProps[obj._id].conf.type === type) ? true : null;
  };

  /**
   * @typedef {Object} AttachConf
   * @property {string} type
   * @property {{string, (string|Class)}[]} argOptions - Shortcuts to options, in arguments. (Not Object)
   * @property {{statName: string, StatConf}} stats - Additional stats.
   * @property {Function} init - function(attachProps, attachOptions) returns `true` when succeeded.
   * @property {Function} bind - function(attachProps, bindTarget) returns `true` when succeeded.
   * @property {Function} unbind - function(attachProps, boundTarget)
   * @property {Function} removeOption - function(attachProps, boundTarget)
   * @property {Function} remove - function(attachProps)
   * @property {Function} [getStrokeWidth] - function(attachProps, props) type:anchor (update trigger)
   * @property {Function} [getPathData] - function(attachProps, props, strokeWidth) type:anchor
   * @property {Function} [getBBoxNest] - function(attachProps, props, strokeWidth) type:anchor
   * @property {Function} [initSvg] - function(attachProps, props) type:label
   */

  /** @type {{attachmentName: string, AttachConf}} */
  ATTACHMENTS = {
    pointAnchor: {
      type: 'anchor',
      argOptions: [{optionName: 'element', type: isElement}],

      // attachOptions: element, x, y
      init: function(attachProps, attachOptions) {
        attachProps.element = ATTACHMENTS.pointAnchor.checkElement(attachOptions.element);
        attachProps.x = ATTACHMENTS.pointAnchor.parsePercent(attachOptions.x, true) || [0.5, true];
        attachProps.y = ATTACHMENTS.pointAnchor.parsePercent(attachOptions.y, true) || [0.5, true];
        return true;
      },

      removeOption: function(attachProps, boundTarget) {
        var props = boundTarget.props, newOptions = {}, element = attachProps.element,
          another = props.options.anchorSE[boundTarget.optionName === 'start' ? 1 : 0];
        if (element === another) { // must be not another
          element = another === document.body ?
            new LeaderLineAttachment(ATTACHMENTS.pointAnchor, [element]) : document.body;
        }
        newOptions[boundTarget.optionName] = element;
        setOptions(props, newOptions);
      },

      getBBoxNest: function(attachProps, props) {
        var bBox = getBBoxNest(attachProps.element, props.baseWindow),
          width = bBox.width, height = bBox.height;
        bBox.width = bBox.height = 0;
        bBox.left = bBox.right = bBox.left + attachProps.x[0] * (attachProps.x[1] ? width : 1);
        bBox.top = bBox.bottom = bBox.top + attachProps.y[0] * (attachProps.y[1] ? height : 1);
        return bBox;
      },

      parsePercent: function(value, allowNegative) {
        var matches, num, ratio = false;
        if (isFinite(value)) {
          num = value;
        } else if (typeof value === 'string' && (matches = RE_PERCENT.exec(value)) && matches[2]) {
          num = parseFloat(matches[1]) / 100;
          ratio = num !== 0;
        }
        return num != null && (allowNegative || num >= 0) ? [num, ratio] : null;
      },

      checkElement: function(element) {
        if (element == null) {
          element = document.body;
        } else if (!isElement(element)) {
          throw new Error('`element` must be Element');
        }
        return element;
      }
    },

    areaAnchor: {
      type: 'anchor',
      argOptions: [{optionName: 'element', type: isElement}, {optionName: 'shape', type: 'string'}],
      stats: {color: {}, strokeWidth: {}, elementWidth: {}, elementHeight: {}, elementLeft: {}, elementTop: {},
        pathListRel: {}, bBoxRel: {}, pathData: {}, viewBoxBBox: {hasProps: true}, dashLen: {}, dashGap: {}},

      // attachOptions: element, color(A), fillColor, size(A), dash, shape, x, y, width, height, radius, points
      init: function(attachProps, attachOptions) {
        var points = [], baseDocument, svg, window;
        attachProps.element = ATTACHMENTS.pointAnchor.checkElement(attachOptions.element);
        if (typeof attachOptions.color === 'string') {
          attachProps.color = attachOptions.color.trim();
        }
        if (typeof attachOptions.fillColor === 'string') {
          attachProps.fill = attachOptions.fillColor.trim();
        }
        if (isFinite(attachOptions.size) && attachOptions.size >= 0) {
          attachProps.size = attachOptions.size;
        }
        if (attachOptions.dash) {
          attachProps.dash = true;
          if (isFinite(attachOptions.dash.len) && attachOptions.dash.len > 0) {
            attachProps.dashLen = attachOptions.dash.len;
          }
          if (isFinite(attachOptions.dash.gap) && attachOptions.dash.gap > 0) {
            attachProps.dashGap = attachOptions.dash.gap;
          }
        }

        if (attachOptions.shape === 'circle') {
          attachProps.shape = attachOptions.shape;
        } else if (attachOptions.shape === 'polygon' &&
            Array.isArray(attachOptions.points) && attachOptions.points.length >= 3 &&
            attachOptions.points.every(function(point) {
              var validPoint = {};
              if ((validPoint.x = ATTACHMENTS.pointAnchor.parsePercent(point[0], true)) &&
                  (validPoint.y = ATTACHMENTS.pointAnchor.parsePercent(point[1], true))) {
                points.push(validPoint);
                if (validPoint.x[1] || validPoint.y[1]) { attachProps.hasRatio = true; }
                return true;
              }
              return false;
            })) {
          attachProps.shape = attachOptions.shape;
          attachProps.points = points;
        } else {
          attachProps.shape = 'rect';
          attachProps.radius =
            isFinite(attachOptions.radius) && attachOptions.radius >= 0 ? attachOptions.radius : 0;
        }

        if (attachProps.shape === 'rect' || attachProps.shape === 'circle') {
          attachProps.x = ATTACHMENTS.pointAnchor.parsePercent(attachOptions.x, true) || [-0.05, true];
          attachProps.y = ATTACHMENTS.pointAnchor.parsePercent(attachOptions.y, true) || [-0.05, true];
          attachProps.width = ATTACHMENTS.pointAnchor.parsePercent(attachOptions.width) || [1.1, true];
          attachProps.height = ATTACHMENTS.pointAnchor.parsePercent(attachOptions.height) || [1.1, true];
          if (attachProps.x[1] || attachProps.y[1] ||
            attachProps.width[1] || attachProps.height[1]) { attachProps.hasRatio = true; }
        }

        // SVG
        baseDocument = attachProps.element.ownerDocument;
        attachProps.svg = svg = baseDocument.createElementNS(SVG_NS, 'svg');
        svg.className.baseVal = APP_ID + '-areaAnchor';
        if (!svg.viewBox.baseVal) { svg.setAttribute('viewBox', '0 0 0 0'); } // for Firefox bug
        attachProps.path = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
        attachProps.path.style.fill = attachProps.fill || 'none';
        attachProps.isShown = false;
        svg.style.visibility = 'hidden';
        baseDocument.body.appendChild(svg);
        setupWindow((window = baseDocument.defaultView));
        attachProps.bodyOffset = getBodyOffset(window); // Get `bodyOffset`

        // event handler for this instance
        attachProps.updateColor = function() {
          var curStats = attachProps.curStats, aplStats = attachProps.aplStats,
            llStats = attachProps.boundTargets.length ? attachProps.boundTargets[0].props.curStats : null,
            value;

          curStats.color = value = attachProps.color || (llStats ? llStats.line_color : DEFAULT_OPTIONS.lineColor);
          if (setStat(attachProps, aplStats, 'color', value)) {
            attachProps.path.style.stroke = value;
          }
        };

        attachProps.updateShow = function() {
          svgShow(attachProps, attachProps.boundTargets.some(
            function(boundTarget) { return boundTarget.props.isShown === true; }));
        };
        // event handler to update `strokeWidth` is unnecessary
        // because `getStrokeWidth` is triggered by `updateLine` and `updatePosition`

        return true;
      },

      bind: function(attachProps, bindTarget) {
        var props = bindTarget.props;
        if (!attachProps.color) { addEventHandler(props, 'cur_line_color', attachProps.updateColor); }
        addEventHandler(props, 'svgShow', attachProps.updateShow);
        addDelayedProc(function() { // after updating `attachProps.boundTargets`
          attachProps.updateColor();
          attachProps.updateShow();
        });
        return true;
      },

      unbind: function(attachProps, boundTarget) {
        var props = boundTarget.props;
        if (!attachProps.color) { removeEventHandler(props, 'cur_line_color', attachProps.updateColor); }
        removeEventHandler(props, 'svgShow', attachProps.updateShow);

        if (attachProps.boundTargets.length > 1) { // It's not removed yet.
          addDelayedProc(function() { // after updating `attachProps.boundTargets`
            attachProps.updateColor();
            attachProps.updateShow();
            if (ATTACHMENTS.areaAnchor.update(attachProps)) { // it's not called by unbound ll
              attachProps.boundTargets.forEach(function(boundTarget) { // Update other instances.
                update(boundTarget.props, {position: true});
              });
            }
          });
        }
      },

      removeOption: function(attachProps, boundTarget) {
        ATTACHMENTS.pointAnchor.removeOption(attachProps, boundTarget);
      },

      remove: function(attachProps) {
        if (attachProps.boundTargets.length) { // it should be unbound by LeaderLineAttachment.remove
          console.error('LeaderLineAttachment was not unbound by remove');
          attachProps.boundTargets.forEach(
            function(boundTarget) { ATTACHMENTS.areaAnchor.unbind(attachProps, boundTarget); });
        }
        attachProps.svg.parentNode.removeChild(attachProps.svg);
      },

      getStrokeWidth: function(attachProps, props) {
        if (ATTACHMENTS.areaAnchor.update(attachProps) && attachProps.boundTargets.length > 1) {
          addDelayedProc(function() {
            attachProps.boundTargets.forEach(function(boundTarget) { // Update other instances.
              if (boundTarget.props !== props) { update(boundTarget.props, {position: true}); }
            });
          });
        }
        return attachProps.curStats.strokeWidth;
      },

      getPathData: function(attachProps, props) {
        var bBox = getBBoxNest(attachProps.element, props.baseWindow);
        return pathList2PathData(attachProps.curStats.pathListRel, function(point) {
          point.x += bBox.left;
          point.y += bBox.top;
        });
      },

      getBBoxNest: function(attachProps, props) {
        var bBox = getBBoxNest(attachProps.element, props.baseWindow),
          bBoxRel = attachProps.curStats.bBoxRel;
        return {
          left: bBoxRel.left + bBox.left,
          top: bBoxRel.top + bBox.top,
          right: bBoxRel.right + bBox.left,
          bottom: bBoxRel.bottom + bBox.top,
          width: bBoxRel.width,
          height: bBoxRel.height
        };
      },

      update: function(attachProps) {
        var curStats = attachProps.curStats, aplStats = attachProps.aplStats,
          llStats = attachProps.boundTargets.length ? attachProps.boundTargets[0].props.curStats : null,
          elementBBox, value, updated = {};

        updated.strokeWidth = setStat(attachProps, curStats, 'strokeWidth',
          attachProps.size != null ? attachProps.size :
            (llStats ? llStats.line_strokeWidth : DEFAULT_OPTIONS.lineSize));

        elementBBox = getBBox(attachProps.element);
        updated.elementWidth = setStat(attachProps, curStats, 'elementWidth', elementBBox.width);
        updated.elementHeight = setStat(attachProps, curStats, 'elementHeight', elementBBox.height);
        updated.elementLeft = setStat(attachProps, curStats, 'elementLeft', elementBBox.left);
        updated.elementTop = setStat(attachProps, curStats, 'elementTop', elementBBox.top);

        if (updated.strokeWidth ||
            attachProps.hasRatio && (updated.elementWidth || updated.elementHeight)) { // generate path
          switch (attachProps.shape) {

            case 'rect':
              (function() {
                var areaBBox, radius, maxRadius, side, strokePadding, offsetC, padding, points, cpR;
                areaBBox = {
                  left: attachProps.x[0] * (attachProps.x[1] ? elementBBox.width : 1),
                  top: attachProps.y[0] * (attachProps.y[1] ? elementBBox.height : 1),
                  width: attachProps.width[0] * (attachProps.width[1] ? elementBBox.width : 1),
                  height: attachProps.height[0] * (attachProps.height[1] ? elementBBox.height : 1)
                };
                areaBBox.right = areaBBox.left + areaBBox.width;
                areaBBox.bottom = areaBBox.top + areaBBox.height;

                strokePadding = curStats.strokeWidth / 2;
                maxRadius = (side = Math.min(areaBBox.width, areaBBox.height)) ?
                  side / 2 * Math.SQRT2 + strokePadding : 0;
                radius = !attachProps.radius ? 0 :
                  attachProps.radius <= maxRadius ? attachProps.radius : maxRadius;
                if (radius) {
                  offsetC = (radius - strokePadding) / Math.SQRT2;
                  padding = radius - offsetC;
                  cpR = radius * CIRCLE_CP;

                  points = [
                    {x: areaBBox.left - padding, y: areaBBox.top + offsetC}, // 0 left-top-start
                    {x: areaBBox.left + offsetC, y: areaBBox.top - padding}, // 1 left-top-end
                    {x: areaBBox.right - offsetC, y: areaBBox.top - padding}, // 2 right-top-start
                    {x: areaBBox.right + padding, y: areaBBox.top + offsetC}, // 3 right-top-end
                    {x: areaBBox.right + padding, y: areaBBox.bottom - offsetC}, // 4 right-bottom-start
                    {x: areaBBox.right - offsetC, y: areaBBox.bottom + padding}, // 5 right-bottom-end
                    {x: areaBBox.left + offsetC, y: areaBBox.bottom + padding}, // 6 left-bottom-start
                    {x: areaBBox.left - padding, y: areaBBox.bottom - offsetC} // 7 left-bottom-end
                  ];
                  curStats.pathListRel = [[points[0], {x: points[0].x, y: points[0].y - cpR},
                    {x: points[1].x - cpR, y: points[1].y}, points[1]]];
                  if (points[1].x !== points[2].x) { curStats.pathListRel.push([points[1], points[2]]); }
                  curStats.pathListRel.push([points[2], {x: points[2].x + cpR, y: points[2].y},
                    {x: points[3].x, y: points[3].y - cpR}, points[3]]);
                  if (points[3].y !== points[4].y) { curStats.pathListRel.push([points[3], points[4]]); }
                  curStats.pathListRel.push([points[4], {x: points[4].x, y: points[4].y + cpR},
                    {x: points[5].x + cpR, y: points[5].y}, points[5]]);
                  if (points[5].x !== points[6].x) { curStats.pathListRel.push([points[5], points[6]]); }
                  curStats.pathListRel.push([points[6], {x: points[6].x - cpR, y: points[6].y},
                    {x: points[7].x, y: points[7].y + cpR}, points[7]]);
                  if (points[7].y !== points[0].y) { curStats.pathListRel.push([points[7], points[0]]); }
                  curStats.pathListRel.push([]);

                  padding = radius - offsetC + curStats.strokeWidth / 2;
                  points = [{x: areaBBox.left - padding, y: areaBBox.top - padding}, // left-top
                    {x: areaBBox.right + padding, y: areaBBox.bottom + padding}]; // right-bottom
                  curStats.bBoxRel = {
                    left: points[0].x, top: points[0].y, right: points[1].x, bottom: points[1].y,
                    width: points[1].x - points[0].x, height: points[1].y - points[0].y
                  };

                } else {
                  padding = curStats.strokeWidth / 2;
                  points = [{x: areaBBox.left - padding, y: areaBBox.top - padding}, // left-top
                    {x: areaBBox.right + padding, y: areaBBox.bottom + padding}]; // right-bottom
                  curStats.pathListRel = [
                    [points[0], {x: points[1].x, y: points[0].y}],
                    [{x: points[1].x, y: points[0].y}, points[1]],
                    [points[1], {x: points[0].x, y: points[1].y}],
                    []
                  ];

                  points = [{x: areaBBox.left - curStats.strokeWidth,
                      y: areaBBox.top - curStats.strokeWidth}, // left-top
                    {x: areaBBox.right + curStats.strokeWidth,
                      y: areaBBox.bottom + curStats.strokeWidth}]; // right-bottom
                  curStats.bBoxRel = {
                    left: points[0].x, top: points[0].y, right: points[1].x, bottom: points[1].y,
                    width: points[1].x - points[0].x, height: points[1].y - points[0].y
                  };
                }
              })();
              break;

            case 'circle':
              (function() {
                var areaBBox, cx, cy, radiusX, radiusY, cpRX, cpRY,
                  strokePadding, offsetCX, offsetCY, paddingX, paddingY, points;
                areaBBox = {
                  left: attachProps.x[0] * (attachProps.x[1] ? elementBBox.width : 1),
                  top: attachProps.y[0] * (attachProps.y[1] ? elementBBox.height : 1),
                  width: attachProps.width[0] * (attachProps.width[1] ? elementBBox.width : 1),
                  height: attachProps.height[0] * (attachProps.height[1] ? elementBBox.height : 1)
                };
                if (!areaBBox.width && !areaBBox.height) {
                  areaBBox.width = areaBBox.height = 10; // values are required
                } if (!areaBBox.width) {
                  areaBBox.width = areaBBox.height;
                } if (!areaBBox.height) {
                  areaBBox.height = areaBBox.width;
                }
                areaBBox.right = areaBBox.left + areaBBox.width;
                areaBBox.bottom = areaBBox.top + areaBBox.height;

                cx = areaBBox.left + areaBBox.width / 2;
                cy = areaBBox.top + areaBBox.height / 2;
                strokePadding = curStats.strokeWidth / 2;
                offsetCX = areaBBox.width / 2;
                offsetCY = areaBBox.height / 2;
                radiusX = offsetCX * Math.SQRT2 + strokePadding;
                radiusY = offsetCY * Math.SQRT2 + strokePadding;
                cpRX = radiusX * CIRCLE_CP;
                cpRY = radiusY * CIRCLE_CP;

                points = [
                  {x: cx - radiusX, y: cy}, // 0 left
                  {x: cx, y: cy - radiusY}, // 1 top
                  {x: cx + radiusX, y: cy}, // 2 right
                  {x: cx, y: cy + radiusY} // 3 bottom
                ];
                curStats.pathListRel = [
                  [points[0], {x: points[0].x, y: points[0].y - cpRY},
                    {x: points[1].x - cpRX, y: points[1].y}, points[1]],
                  [points[1], {x: points[1].x + cpRX, y: points[1].y},
                    {x: points[2].x, y: points[2].y - cpRY}, points[2]],
                  [points[2], {x: points[2].x, y: points[2].y + cpRY},
                    {x: points[3].x + cpRX, y: points[3].y}, points[3]],
                  [points[3], {x: points[3].x - cpRX, y: points[3].y},
                    {x: points[0].x, y: points[0].y + cpRY}, points[0]],
                  []
                ];

                paddingX = radiusX - offsetCX + curStats.strokeWidth / 2;
                paddingY = radiusY - offsetCY + curStats.strokeWidth / 2;
                points = [{x: areaBBox.left - paddingX, y: areaBBox.top - paddingY}, // left-top
                  {x: areaBBox.right + paddingX, y: areaBBox.bottom + paddingY}]; // right-bottom
                curStats.bBoxRel = {
                  left: points[0].x, top: points[0].y, right: points[1].x, bottom: points[1].y,
                  width: points[1].x - points[0].x, height: points[1].y - points[0].y
                };
              })();
              break;

            case 'polygon':
              (function() {
                var areaBBox, curPoint, padding, points;
                attachProps.points.forEach(function(point) {
                  var x = point.x[0] * (point.x[1] ? elementBBox.width : 1),
                    y = point.y[0] * (point.y[1] ? elementBBox.height : 1);
                  if (areaBBox) {
                    if (x < areaBBox.left) { areaBBox.left = x; }
                    if (x > areaBBox.right) { areaBBox.right = x; }
                    if (y < areaBBox.top) { areaBBox.top = y; }
                    if (y > areaBBox.bottom) { areaBBox.bottom = y; }
                  } else {
                    areaBBox = {left: x, right: x, top: y, bottom: y};
                  }

                  if (curPoint) {
                    curStats.pathListRel.push([curPoint, {x: x, y: y}]);
                  } else {
                    curStats.pathListRel = [];
                  }
                  curPoint = {x: x, y: y};
                });
                curStats.pathListRel.push([]);

                padding = curStats.strokeWidth / 2;
                points = [{x: areaBBox.left - padding, y: areaBBox.top - padding}, // left-top
                  {x: areaBBox.right + padding, y: areaBBox.bottom + padding}]; // right-bottom
                curStats.bBoxRel = {
                  left: points[0].x, top: points[0].y, right: points[1].x, bottom: points[1].y,
                  width: points[1].x - points[0].x, height: points[1].y - points[0].y
                };
              })();
              break;

            // no default
          }
          updated.pathListRel = updated.bBoxRel = true;
        }
        if (updated.pathListRel || updated.elementLeft || updated.elementTop) {
          curStats.pathData = pathList2PathData(curStats.pathListRel, function(point) {
            point.x += elementBBox.left;
            point.y += elementBBox.top;
          });
        }

        if (setStat(attachProps, aplStats, 'strokeWidth', (value = curStats.strokeWidth))) {
          attachProps.path.style.strokeWidth = value + 'px';
        }

        // Apply `pathData`
        if (pathDataHasChanged((value = curStats.pathData), aplStats.pathData)) {
          attachProps.path.setPathData(value);
          aplStats.pathData = value;
          updated.pathData = true;
        }

        // dash
        if (attachProps.dash) {
          if (updated.pathData || updated.strokeWidth && (!attachProps.dashLen || !attachProps.dashGap)) {
            curStats.dashLen = attachProps.dashLen || curStats.strokeWidth * 2;
            curStats.dashGap = attachProps.dashGap || curStats.strokeWidth;
            /* necessity? (it's necessary when animation is supported)
            (function() { // Adjust dash with pathLen
              var pathLenAll, dashCount;
              pathLenAll = getAllPathDataLen(curStats.pathData);
              dashCount = Math.floor(pathLenAll / (curStats.dashLen + curStats.dashGap));
              if (dashCount >= 2) {
                curStats.dashLen = pathLenAll / dashCount - curStats.dashGap;
              }
            })();
            */
          }
          updated.dash = setStat(attachProps, aplStats, 'dashLen', curStats.dashLen) || updated.dash;
          updated.dash = setStat(attachProps, aplStats, 'dashGap', curStats.dashGap) || updated.dash;
          if (updated.dash) {
            attachProps.path.style.strokeDasharray = aplStats.dashLen + ',' + aplStats.dashGap;
          }
        }

        // ViewBox
        (function() {
          var curVBBBox = curStats.viewBoxBBox, aplVBBBox = aplStats.viewBoxBBox,
            viewBox = attachProps.svg.viewBox.baseVal, styles = attachProps.svg.style;
          curVBBBox.x = curStats.bBoxRel.left + elementBBox.left;
          curVBBBox.y = curStats.bBoxRel.top + elementBBox.top;
          curVBBBox.width = curStats.bBoxRel.width;
          curVBBBox.height = curStats.bBoxRel.height;
          ['x', 'y', 'width', 'height'].forEach(function(boxKey) {
            if ((value = curVBBBox[boxKey]) !== aplVBBBox[boxKey]) {
              viewBox[boxKey] = aplVBBBox[boxKey] = value;
              styles[BBOX_PROP[boxKey]] = value +
                (boxKey === 'x' || boxKey === 'y' ? attachProps.bodyOffset[boxKey] : 0) + 'px';
            }
          });
        })();

        // Returns `true`, when stats anchors use are updated.
        return updated.strokeWidth || updated.pathListRel || updated.bBoxRel;
      }
    },

    mouseHoverAnchor: {
      type: 'anchor',
      argOptions: [{optionName: 'element', type: isElement}, {optionName: 'showEffectName', type: 'string'}],

      style: {
        backgroundImage: 'url(\'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0Ij48cG9seWdvbiBwb2ludHM9IjI0LDAgMCw4IDgsMTEgMCwxOSA1LDI0IDEzLDE2IDE2LDI0IiBmaWxsPSJjb3JhbCIvPjwvc3ZnPg==\')',
        backgroundSize: '', // It's set in init().
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f8f881',
        cursor: 'default'
      },
      hoverStyle: {
        backgroundImage: 'none',
        backgroundColor: '#fadf8f'
      },
      padding: {top: 1, right: 15/* >(backgroundSize.width + backgroundPosition.right) */, bottom: 1, left: 2},
      minHeight: 15,
      backgroundPosition: {right: 2, top: 2},
      backgroundSize: {width: 12, height: 12},

      dirKeys: [['top', 'Top'], ['right', 'Right'], ['bottom', 'Bottom'], ['left', 'Left']],

      // attachOptions: element, style, hoverStyle, showEffectName, animOptions, onSwitch
      init: function(attachProps, attachOptions) {
        var conf = ATTACHMENTS.mouseHoverAnchor,
          curStyle, elmStyle, bBox, displaySave, paddingSave = {},
          showEffectName, animOptions, onSwitch;
        attachProps.element = ATTACHMENTS.pointAnchor.checkElement(attachOptions.element);
        // Check HTML element
        if (!(function(element) {
          var win, doc;
          return !!((doc = element.ownerDocument) && (win = doc.defaultView) && win.HTMLElement &&
            element instanceof win.HTMLElement);
        })(attachProps.element)) {
          throw new Error('`element` must be HTML element');
        }

        conf.style.backgroundSize =
          conf.backgroundSize.width + 'px ' + conf.backgroundSize.height + 'px';

        // copy default
        ['style', 'hoverStyle'].forEach(function(key) {
          var defaultStyle = conf[key];
          attachProps[key] = Object.keys(defaultStyle).reduce(function(copyObj, propName) {
            copyObj[propName] = defaultStyle[propName];
            return copyObj;
          }, {});
        });

        curStyle = attachProps.element.ownerDocument.defaultView.getComputedStyle(attachProps.element, '');
        // display
        if (curStyle.display === 'inline') {
          attachProps.style.display = 'inline-block';
        } else if (curStyle.display === 'none') {
          attachProps.style.display = 'block'; // Can't get default `display` when it is `none`.
        }
        // padding (simulate min-padding)
        ATTACHMENTS.mouseHoverAnchor.dirKeys.forEach(function(key) {
          var confKey = key[0], styleKey = 'padding' + key[1];
          if (parseFloat(curStyle[styleKey]) < conf.padding[confKey]) {
            attachProps.style[styleKey] = conf.padding[confKey] + 'px';
          }
        });

        // Make box layout temporarily to get size before binding.
        if (attachProps.style.display) {
          displaySave = attachProps.element.style.display;
          attachProps.element.style.display = attachProps.style.display;
        }
        ATTACHMENTS.mouseHoverAnchor.dirKeys.forEach(function(key) {
          var styleKey = 'padding' + key[1];
          if (attachProps.style[styleKey]) {
            paddingSave[styleKey] = attachProps.element.style[styleKey];
            attachProps.element.style[styleKey] = attachProps.style[styleKey];
          }
        });
        bBox = attachProps.element.getBoundingClientRect();

        // height (simulate min-height with current style (particularly box-sizing))
        if (bBox.height < conf.minHeight) {
          if (IS_TRIDENT) { // `getComputedStyle().height` returns incorrect value
            (function() {
              var height = conf.minHeight;
              if (curStyle.boxSizing === 'content-box') {
                height -= parseFloat(curStyle.borderTopWidth) + parseFloat(curStyle.borderBottomWidth) +
                  parseFloat(curStyle.paddingTop) + parseFloat(curStyle.paddingBottom);
              } else if (curStyle.boxSizing === 'padding-box') {
                height -= parseFloat(curStyle.borderTopWidth) + parseFloat(curStyle.borderBottomWidth);
              }
              attachProps.style.height = height + 'px';
            })();
          } else {
            attachProps.style.height = parseFloat(curStyle.height) + (conf.minHeight - bBox.height) + 'px';
          }
        }

        if (IS_WEBKIT) { // [WEBKIT] rel-position is not supported
          attachProps.style.backgroundPosition =
            // bBox.width should be larger than (backgroundSize.width + backgroundPosition.right) by padding.
            (bBox.width - conf.backgroundSize.width - conf.backgroundPosition.right) + 'px ' +
            conf.backgroundPosition.top + 'px';
        } else {
          attachProps.style.backgroundPosition =
            'right ' + conf.backgroundPosition.right + 'px top ' + conf.backgroundPosition.top + 'px';
        }

        // Restore
        if (attachProps.style.display) {
          attachProps.element.style.display = displaySave;
        }
        ATTACHMENTS.mouseHoverAnchor.dirKeys.forEach(function(key) {
          var styleKey = 'padding' + key[1];
          if (attachProps.style[styleKey]) {
            attachProps.element.style[styleKey] = paddingSave[styleKey];
          }
        });

        // merge
        ['style', 'hoverStyle'].forEach(function(key) {
          var propStyle = attachProps[key], optionStyle = attachOptions[key];
          if (isObject(optionStyle)) {
            Object.keys(optionStyle).forEach(function(propName) {
              if (typeof optionStyle[propName] === 'string' || isFinite(optionStyle[propName])) {
                propStyle[propName] = optionStyle[propName];
              } else if (optionStyle[propName] == null) {
                delete propStyle[propName];
              }
            });
          }
        });

        if (typeof attachOptions.onSwitch === 'function') { onSwitch = attachOptions.onSwitch; }

        if (attachOptions.showEffectName && SHOW_EFFECTS[attachOptions.showEffectName]) {
          attachProps.showEffectName = showEffectName = attachOptions.showEffectName;
        }
        animOptions = attachOptions.animOptions;
        attachProps.elmStyle = elmStyle = attachProps.element.style;

        // event handler for this instance
        attachProps.mouseenter = function(event) {
          attachProps.hoverStyleSave = conf.getStyles(elmStyle, Object.keys(attachProps.hoverStyle));
          conf.setStyles(elmStyle, attachProps.hoverStyle);
          attachProps.boundTargets.forEach(function(boundTarget) {
            show(boundTarget.props, true, showEffectName, animOptions);
          });
          if (onSwitch) { onSwitch(event); }
        };

        attachProps.mouseleave = function(event) {
          conf.setStyles(elmStyle, attachProps.hoverStyleSave);
          attachProps.boundTargets.forEach(function(boundTarget) {
            show(boundTarget.props, false, showEffectName, animOptions);
          });
          if (onSwitch) { onSwitch(event); }
        };

        return true;
      },

      bind: function(attachProps, bindTarget) {
        if (bindTarget.props.svg) {
          ATTACHMENTS.mouseHoverAnchor.llShow(bindTarget.props, false, attachProps.showEffectName);
        } else { // SVG is not setup yet.
          addDelayedProc(function() {
            ATTACHMENTS.mouseHoverAnchor.llShow(bindTarget.props, false, attachProps.showEffectName);
          });
        }
        if (!attachProps.enabled) {
          attachProps.styleSave =
            ATTACHMENTS.mouseHoverAnchor.getStyles(attachProps.elmStyle, Object.keys(attachProps.style));
          ATTACHMENTS.mouseHoverAnchor.setStyles(attachProps.elmStyle, attachProps.style);
          attachProps.removeEventListener =
            mouseEnterLeave(attachProps.element, attachProps.mouseenter, attachProps.mouseleave);
          attachProps.enabled = true;
        }
        return true;
      },

      unbind: function(attachProps, boundTarget) {
        if (attachProps.enabled && attachProps.boundTargets.length <= 1) { // last one that is unbound
          attachProps.removeEventListener();
          ATTACHMENTS.mouseHoverAnchor.setStyles(attachProps.elmStyle, attachProps.styleSave);
          attachProps.enabled = false;
        }
        ATTACHMENTS.mouseHoverAnchor.llShow(boundTarget.props, true, attachProps.showEffectName);
      },

      removeOption: function(attachProps, boundTarget) {
        ATTACHMENTS.pointAnchor.removeOption(attachProps, boundTarget);
      },

      remove: function(attachProps) {
        if (attachProps.boundTargets.length) { // it should be unbound by LeaderLineAttachment.remove
          console.error('LeaderLineAttachment was not unbound by remove');
          attachProps.boundTargets.forEach(
            function(boundTarget) { ATTACHMENTS.mouseHoverAnchor.unbind(attachProps, boundTarget); });
        }
      },

      getBBoxNest: function(attachProps, props) {
        return getBBoxNest(attachProps.element, props.baseWindow);
      },

      // show/hide immediately
      llShow: function(props, on, showEffectName) {
        SHOW_EFFECTS[showEffectName || props.curStats.show_effect].stop(props, true, on);
        props.aplStats.show_on = on; // It is not updated by svgShow(). (It is used in show().)
      },

      getStyles: function(elmStyle, propNames) {
        return propNames.reduce(function(copyObj, propName) {
          copyObj[propName] = elmStyle[propName];
          return copyObj;
        }, {});
      },

      setStyles: function(elmStyle, styles) {
        Object.keys(styles).forEach(function(propName) { elmStyle[propName] = styles[propName]; });
      }
    },

    captionLabel: {
      type: 'label',
      argOptions: [{optionName: 'text', type: 'string'}],
      stats: {color: {}, x: {}, y: {}},
      textStyleProps: ['fontFamily', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch',
        'fontSize', 'fontSizeAdjust', 'kerning', 'letterSpacing', 'wordSpacing', 'textDecoration'],

      // attachOptions: text, color(A), outlineColor, offset(A), lineOffset, <textStyleProps>
      init: function(attachProps, attachOptions) {
        if (typeof attachOptions.text === 'string') {
          attachProps.text = attachOptions.text.trim();
        }
        if (!attachProps.text) {
          return false;
        }
        if (typeof attachOptions.color === 'string') {
          attachProps.color = attachOptions.color.trim();
        }
        attachProps.outlineColor = typeof attachOptions.outlineColor === 'string' ?
          attachOptions.outlineColor.trim() : '#fff'; // default
        if (Array.isArray(attachOptions.offset) &&
            isFinite(attachOptions.offset[0]) && isFinite(attachOptions.offset[1])) {
          attachProps.offset = {x: attachOptions.offset[0], y: attachOptions.offset[1]};
        }
        if (isFinite(attachOptions.lineOffset)) {
          attachProps.lineOffset = attachOptions.lineOffset;
        }
        ATTACHMENTS.captionLabel.textStyleProps.forEach(function(propName) {
          if (attachOptions[propName] != null) {
            attachProps[propName] = attachOptions[propName];
          }
        });

        // event handler for this instance
        attachProps.updateColor = function(props) {
          ATTACHMENTS.captionLabel.updateColor(attachProps, props);
        };

        attachProps.updateSocketXY = function(props) {
          var curStats = attachProps.curStats, aplStats = attachProps.aplStats,
            llStats = props.curStats, socketXY = llStats.position_socketXYSE[attachProps.socketIndex],
            margin, plugSideLen, anotherSocketXY, value;
          // It's not ready yet.
          if (socketXY.x == null) {
            return;
          }

          if (attachProps.offset) {
            curStats.x = socketXY.x + attachProps.offset.x;
            curStats.y = socketXY.y + attachProps.offset.y;
          } else {
            margin = attachProps.height / 2; // Half of line height
            plugSideLen = Math.max(llStats.attach_plugSideLenSE[attachProps.socketIndex] || 0,
              llStats.line_strokeWidth / 2);
            anotherSocketXY = llStats.position_socketXYSE[attachProps.socketIndex ? 0 : 1];
            if (socketXY.socketId === SOCKET_LEFT || socketXY.socketId === SOCKET_RIGHT) {
              curStats.x = socketXY.socketId === SOCKET_LEFT ?
                socketXY.x - margin - attachProps.width : socketXY.x + margin;
              curStats.y = anotherSocketXY.y < socketXY.y ?
                socketXY.y + plugSideLen + margin :
                socketXY.y - plugSideLen - margin - attachProps.height;
            } else {
              curStats.x = anotherSocketXY.x < socketXY.x ?
                socketXY.x + plugSideLen + margin :
                socketXY.x - plugSideLen - margin - attachProps.width;
              curStats.y = socketXY.socketId === SOCKET_TOP ?
                socketXY.y - margin - attachProps.height : socketXY.y + margin;
            }
          }

          if (setStat(attachProps, aplStats, 'x', (value = curStats.x)
)) {
            attachProps.elmPosition.x.baseVal.getItem(0).value = value;
          }
          if (setStat(attachProps, aplStats, 'y', (value = curStats.y)
)) {
            attachProps.elmPosition.y.baseVal.getItem(0).value = value + attachProps.height;
          }
        };

        attachProps.updatePath = function(props) {
          var curStats = attachProps.curStats, aplStats = attachProps.aplStats,
            pathList = props.pathList.animVal || props.pathList.baseVal,
            point, value;
          // It's not ready yet.
          if (!pathList) {
            return;
          }

          point = ATTACHMENTS.captionLabel.getMidPoint(pathList, attachProps.lineOffset);
          curStats.x = point.x - attachProps.width / 2;
          curStats.y = point.y - attachProps.height / 2;

          if (setStat(attachProps, aplStats, 'x', (value = curStats.x))) {
            attachProps.elmPosition.x.baseVal.getItem(0).value = value;
          }
          if (setStat(attachProps, aplStats, 'y', (value = curStats.y))) {
            attachProps.elmPosition.y.baseVal.getItem(0).value = value + attachProps.height;
          }
        };

        attachProps.updateShow = function(props) {
          ATTACHMENTS.captionLabel.updateShow(attachProps, props);
        };

        if (IS_WEBKIT) { // [WEBKIT] overflow:visible is ignored
          attachProps.adjustEdge = function(props, edge) {
            var curStats = attachProps.curStats;
            if (curStats.x != null) {
              ATTACHMENTS.captionLabel.adjustEdge(edge,
                {x: curStats.x, y: curStats.y, width: attachProps.width, height: attachProps.height},
                attachProps.strokeWidth / 2);
            }
          };
        }

        return true;
      },

      updateColor: function(attachProps, props) {
        var curStats = attachProps.curStats, aplStats = attachProps.aplStats,
          llStats = props.curStats, value;

        curStats.color = value = attachProps.color || llStats.line_color;
        if (setStat(attachProps, aplStats, 'color', value)) {
          attachProps.styleFill.fill = value;
        }
      },

      updateShow: function(attachProps, props) {
        var on = props.isShown === true;
        if (on !== attachProps.isShown) {
          attachProps.styleShow.visibility = on ? '' : 'hidden';
          attachProps.isShown = on;
        }
      },

      adjustEdge: function(edge, bBox, margin) {
        var textEdge = {x1: bBox.x - margin, y1: bBox.y - margin,
          x2: bBox.x + bBox.width + margin, y2: bBox.y + bBox.height + margin};
        if (textEdge.x1 < edge.x1) { edge.x1 = textEdge.x1; }
        if (textEdge.y1 < edge.y1) { edge.y1 = textEdge.y1; }
        if (textEdge.x2 > edge.x2) { edge.x2 = textEdge.x2; }
        if (textEdge.y2 > edge.y2) { edge.y2 = textEdge.y2; }
      },

      /**
       * @param {string} text - Content of `<text>` element.
       * @param {Document} document - Document that contains `<svg>`.
       * @param {SVGSVGElement} svg - Parent `<svg>` element.
       * @param {string} id - ID for `href`.
       * @param {boolean} [stroke] - Setup for `stroke`.
       * @returns {Object} {elmPosition, styleText, styleFill, styleStroke, styleShow, elmsAppend}
       */
      newText: function(text, document, svg, id, stroke) {
        var elmText, elmG, elmDefs, elmUseFill, elmUseStroke, style;

        elmText = document.createElementNS(SVG_NS, 'text');
        elmText.textContent = text;
        [elmText.x, elmText.y].forEach(function(list) {
          var len = svg.createSVGLength();
          len.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0);
          list.baseVal.initialize(len);
        });

        if (typeof svg2SupportedPaintOrder !== 'boolean') {
          svg2SupportedPaintOrder = 'paintOrder' in elmText.style;
        }
        if (stroke && !svg2SupportedPaintOrder) {
          elmDefs = document.createElementNS(SVG_NS, 'defs');
          elmText.id = id;
          elmDefs.appendChild(elmText);
          elmG = document.createElementNS(SVG_NS, 'g');
          elmUseStroke = elmG.appendChild(document.createElementNS(SVG_NS, 'use'));
          elmUseStroke.href.baseVal = '#' + id;
          elmUseFill = elmG.appendChild(document.createElementNS(SVG_NS, 'use'));
          elmUseFill.href.baseVal = '#' + id;
          style = elmUseStroke.style;
          style.strokeLinejoin = 'round';
          return {
            elmPosition: elmText,
            styleText: elmText.style,
            styleFill: elmUseFill.style,
            styleStroke: style,
            styleShow: elmG.style,
            elmsAppend: [elmDefs, elmG]
          };

        } else {
          style = elmText.style;
          if (stroke) {
            style.strokeLinejoin = 'round';
            style.paintOrder = 'stroke';
          }
          return {
            elmPosition: elmText,
            styleText: style,
            styleFill: style,
            styleStroke: stroke ? style : null,
            styleShow: style,
            elmsAppend: [elmText]
          };
        }
      },

      getMidPoint: function(pathList, offset) {
        var allPathLen = getAllPathListLen(pathList), pathSegsLen = allPathLen.segsLen, pathLenAll = allPathLen.lenAll,
          pointLen, points, i = -1, newPathList;

        pointLen = pathLenAll / 2 + (offset || 0);
        if (pointLen <= 0) {
          points = pathList[0];
          return points.length === 2 ? getPointOnLine(points[0], points[1], 0) :
            getPointOnCubic(points[0], points[1], points[2], points[3], 0);
        } else if (pointLen >= pathLenAll) {
          points = pathList[pathList.length - 1];
          return points.length === 2 ? getPointOnLine(points[0], points[1], 1) :
            getPointOnCubic(points[0], points[1], points[2], points[3], 1);
        } else {
          newPathList = [];
          while (pointLen > pathSegsLen[++i]) {
            newPathList.push(pathList[i]);
            pointLen -= pathSegsLen[i];
          }
          points = pathList[i];
          return points.length === 2 ? getPointOnLine(points[0], points[1], pointLen / pathSegsLen[i]) :
            getPointOnCubic(points[0], points[1], points[2], points[3],
              getCubicT(points[0], points[1], points[2], points[3], pointLen));
        }
      },

      initSvg: function(attachProps, props) {
        var text = ATTACHMENTS.captionLabel.newText(attachProps.text, props.baseWindow.document,
            props.svg, APP_ID + '-captionLabel-' + attachProps._id, attachProps.outlineColor),
          bBox, strokeWidth;

        ['elmPosition', 'styleFill', 'styleShow', 'elmsAppend']
          .forEach(function(key) { attachProps[key] = text[key]; });

        attachProps.isShown = false;
        attachProps.styleShow.visibility = 'hidden';
        ATTACHMENTS.captionLabel.textStyleProps.forEach(function(propName) {
          if (attachProps[propName] != null) { text.styleText[propName] = attachProps[propName]; }
        });

        text.elmsAppend.forEach(function(elm) { props.svg.appendChild(elm); });
        bBox = text.elmPosition.getBBox();
        attachProps.width = bBox.width;
        attachProps.height = bBox.height;
        if (attachProps.outlineColor) {
          strokeWidth = bBox.height / 9;
          strokeWidth = strokeWidth > 10 ? 10 : strokeWidth < 2 ? 2 : strokeWidth;
          text.styleStroke.strokeWidth = strokeWidth + 'px';
          text.styleStroke.stroke = attachProps.outlineColor;
        }
        attachProps.strokeWidth = strokeWidth || 0;

        initStats(attachProps.aplStats, ATTACHMENTS.captionLabel.stats); // for bindWindow again
        attachProps.updateColor(props);
        if (attachProps.refSocketXY) {
          attachProps.updateSocketXY(props);
        } else {
          attachProps.updatePath(props);
        }
        if (IS_WEBKIT) { update(props, {}); } // [WEBKIT] overflow:visible is ignored (To call updateViewBox())
        attachProps.updateShow(props);
      },

      bind: function(attachProps, bindTarget) {
        var props = bindTarget.props;

        if (!attachProps.color) { addEventHandler(props, 'cur_line_color', attachProps.updateColor); }
        if ((attachProps.refSocketXY =
            bindTarget.optionName === 'startLabel' || bindTarget.optionName === 'endLabel')) {
          attachProps.socketIndex = bindTarget.optionName === 'startLabel' ? 0 : 1;
          addEventHandler(props, 'apl_position', attachProps.updateSocketXY);
          if (!attachProps.offset) {
            addEventHandler(props, 'cur_attach_plugSideLenSE', attachProps.updateSocketXY);
            addEventHandler(props, 'cur_line_strokeWidth', attachProps.updateSocketXY);
          }
        } else {
          addEventHandler(props, 'apl_path', attachProps.updatePath);
        }
        addEventHandler(props, 'svgShow', attachProps.updateShow);
        // [WEBKIT] overflow:visible is ignored
        if (IS_WEBKIT) { addEventHandler(props, 'new_edge4viewBox', attachProps.adjustEdge); }

        // after set attachProps.refSocketXY
        ATTACHMENTS.captionLabel.initSvg(attachProps, props);

        return true;
      },

      unbind: function(attachProps, boundTarget) {
        var props = boundTarget.props;

        if (attachProps.elmsAppend) {
          attachProps.elmsAppend.forEach(function(elm) { props.svg.removeChild(elm); });
          attachProps.elmPosition = attachProps.styleFill =
            attachProps.styleShow = attachProps.elmsAppend = null;
        }
        initStats(attachProps.curStats, ATTACHMENTS.captionLabel.stats);
        initStats(attachProps.aplStats, ATTACHMENTS.captionLabel.stats);

        if (!attachProps.color) { removeEventHandler(props, 'cur_line_color', attachProps.updateColor); }
        if (attachProps.refSocketXY) {
          removeEventHandler(props, 'apl_position', attachProps.updateSocketXY);
          if (!attachProps.offset) {
            removeEventHandler(props, 'cur_attach_plugSideLenSE', attachProps.updateSocketXY);
            removeEventHandler(props, 'cur_line_strokeWidth', attachProps.updateSocketXY);
          }
        } else {
          removeEventHandler(props, 'apl_path', attachProps.updatePath);
        }
        removeEventHandler(props, 'svgShow', attachProps.updateShow);
        if (IS_WEBKIT) { // [WEBKIT] overflow:visible is ignored
          removeEventHandler(props, 'new_edge4viewBox', attachProps.adjustEdge);
          // addDelayedProc(function() { update(props, {}); }); // reset path_edge
          update(props, {}); // To call updateViewBox()
        }
      },

      removeOption: function(attachProps, boundTarget) {
        var props = boundTarget.props, newOptions = {};
        newOptions[boundTarget.optionName] = '';
        setOptions(props, newOptions);
      },

      remove: function(attachProps) {
        if (attachProps.boundTargets.length) { // it should be unbound by LeaderLineAttachment.remove
          console.error('LeaderLineAttachment was not unbound by remove');
          attachProps.boundTargets.forEach(
            function(boundTarget) { ATTACHMENTS.captionLabel.unbind(attachProps, boundTarget); });
        }
      }
    },

    pathLabel: {
      type: 'label',
      argOptions: [{optionName: 'text', type: 'string'}],
      stats: {color: {}, startOffset: {}, pathData: {}},

      // attachOptions: text, color(A), outlineColor, lineOffset, <textStyleProps>
      init: function(attachProps, attachOptions) {
        if (typeof attachOptions.text === 'string') {
          attachProps.text = attachOptions.text.trim();
        }
        if (!attachProps.text) {
          return false;
        }
        if (typeof attachOptions.color === 'string') {
          attachProps.color = attachOptions.color.trim();
        }
        attachProps.outlineColor = typeof attachOptions.outlineColor === 'string' ?
          attachOptions.outlineColor.trim() : '#fff'; // default
        if (isFinite(attachOptions.lineOffset)) {
          attachProps.lineOffset = attachOptions.lineOffset;
        }
        ATTACHMENTS.captionLabel.textStyleProps.forEach(function(propName) {
          if (attachOptions[propName] != null) {
            attachProps[propName] = attachOptions[propName];
          }
        });

        // event handler for this instance
        attachProps.updateColor = function(props) {
          ATTACHMENTS.captionLabel.updateColor(attachProps, props);
        };

        attachProps.updatePath = function(props) {
          var curStats = attachProps.curStats, aplStats = attachProps.aplStats,
            llStats = props.curStats, pathList = props.pathList.animVal || props.pathList.baseVal,
            value;
          // It's not ready yet.
          if (!pathList) {
            return;
          }

          curStats.pathData = value = ATTACHMENTS.pathLabel.getOffsetPathData(pathList,
            // margin between line and base-line: attachProps.height / 4
            // llStats.line_strokeWidth / 2 + attachProps.strokeWidth / 2 + attachProps.height / 2,
            llStats.line_strokeWidth / 2 + attachProps.strokeWidth / 2 + attachProps.height / 4,
            // margin between corner and text: attachProps.height * 1.25
            attachProps.height * 1.25);

          // Apply `pathData`
          if (pathDataHasChanged(value, aplStats.pathData)) {
            attachProps.elmPath.setPathData(value);
            aplStats.pathData = value;
            attachProps.bBox = attachProps.elmPosition.getBBox(); // for adjustEdge
            attachProps.updateStartOffset(props);
          }
        };

        attachProps.updateStartOffset = function(props) {
          var curStats = attachProps.curStats, aplStats = attachProps.aplStats,
            llStats = props.curStats, pathLenAll, plugBackLen, startOffset;
          // It's not ready yet.
          if (!curStats.pathData) {
            return;
          }
          if (attachProps.semIndex === 2 && !attachProps.lineOffset) {
            return;
          }

          pathLenAll = getAllPathDataLen(curStats.pathData);
          startOffset = attachProps.semIndex === 0 ? 0 : attachProps.semIndex === 1 ? pathLenAll : pathLenAll / 2;
          if (attachProps.semIndex !== 2) {
            plugBackLen = Math.max(
              llStats.attach_plugBackLenSE[attachProps.semIndex] || 0,
              llStats.line_strokeWidth / 2) +
              // margin between plug and text: attachProps.height / 4
              attachProps.strokeWidth / 2 + attachProps.height / 4;
            startOffset += attachProps.semIndex === 0 ? plugBackLen : -plugBackLen;
            startOffset = startOffset < 0 ? 0 : startOffset > pathLenAll ? pathLenAll : startOffset;
          }
          if (attachProps.lineOffset) {
            startOffset += attachProps.lineOffset;
            startOffset = startOffset < 0 ? 0 : startOffset > pathLenAll ? pathLenAll : startOffset;
          }

          curStats.startOffset = startOffset;
          if (setStat(attachProps, aplStats, 'startOffset', startOffset
)) {
            attachProps.elmOffset.startOffset.baseVal.value = startOffset;
          }
        };

        attachProps.updateShow = function(props) {
          ATTACHMENTS.captionLabel.updateShow(attachProps, props);
        };

        if (IS_WEBKIT) { // [WEBKIT] overflow:visible is ignored
          attachProps.adjustEdge = function(props, edge) {
            if (attachProps.bBox) {
              ATTACHMENTS.captionLabel.adjustEdge(edge, attachProps.bBox, attachProps.strokeWidth / 2);
            }
          };
        }

        return true;
      },

      getOffsetPathData: function(pathList, offsetLen, cornerMargin) {
        var STEP_LEN = 16, TOLERANCE = 3, parts = [], lastLineSeg, curPoint;

        function nearPoints(a, b) {
          return Math.abs(a.x - b.x) < TOLERANCE && Math.abs(a.y - b.y) < TOLERANCE;
        }

        pathList.forEach(function(points) {
          var offsetPoints, lineSeg, lastPoints, angle, exPoint, exPointLast, intPoint;
          if (points.length === 2) {
            offsetPoints = getOffsetLine(points[0], points[1], offsetLen);

            if (lastLineSeg) { // continued line
              lastPoints = lastLineSeg.points;
              angle = Math.atan2(lastPoints[1].y - lastPoints[0].y, lastPoints[0].x - lastPoints[1].x) -
                Math.atan2(points[0].y - points[1].y, points[1].x - points[0].x);
              if (angle >= 0 && angle <= Math.PI) { // Inside
                lineSeg = {type: 'line', points: offsetPoints, inside: true};

              } else { // Try to join the outer points of corner.
                exPointLast = extendLine(lastPoints[0], lastPoints[1], offsetLen);
                exPoint = extendLine(offsetPoints[1], offsetPoints[0], offsetLen); // reverse
                if ((intPoint = getIntersection(lastPoints[0], exPointLast, exPoint, offsetPoints[1]))) {
                  // Join the intersecting lines that were extended.
                  lastPoints[1] = intPoint;
                  lineSeg = {type: 'line', points: [intPoint, offsetPoints[1]]};
                } else {
                  lastPoints[1] = nearPoints(exPoint, exPointLast) ? exPoint : exPointLast;
                  lineSeg = {type: 'line', points: [exPoint, offsetPoints[1]]};
                }
                lastLineSeg.len = getPointsLength(lastPoints[0], lastPoints[1]);
              }

            } else { // new line
              lineSeg = {type: 'line', points: offsetPoints};
            }
            lineSeg.len = getPointsLength(lineSeg.points[0], lineSeg.points[1]);
            parts.push((lastLineSeg = lineSeg));
          } else {
            parts.push({type: 'cubic',
              points: getOffsetCubic(points[0], points[1], points[2], points[3], offsetLen, STEP_LEN)});
            lastLineSeg = null;
          }
        });

        // Adjust the inner points of corner. (after adjusting outer points)
        lastLineSeg = null;
        parts.forEach(function(part) {
          var points;
          if (part.type === 'line') {
            if (part.inside) { // lastLineSeg should exist
              // subtract offsetLen from prev-line
              if (lastLineSeg.len > offsetLen) {
                points = lastLineSeg.points;
                points[1] = extendLine(points[0], points[1], -offsetLen);
                lastLineSeg.len = getPointsLength(points[0], points[1]);
              } else { // disable line
                lastLineSeg.points = null;
                lastLineSeg.len = 0;
              }
              // subtract (offsetLen + cornerMargin) from cur-line
              if (part.len > offsetLen + cornerMargin) {
                points = part.points;
                points[0] = extendLine(points[1], points[0], -(offsetLen + cornerMargin));
                part.len = getPointsLength(points[0], points[1]);
              } else { // disable line
                part.points = null;
                part.len = 0;
              }
            }
            lastLineSeg = part;
          } else {
            lastLineSeg = null;
          }
        });

        return parts.reduce(function(pathData, pathSeg) {
          var points = pathSeg.points;
          if (points) {
            if (!curPoint || !nearPoints(points[0], curPoint)) {
              pathData.push({type: 'M', values: [points[0].x, points[0].y]});
            }
            if (pathSeg.type === 'line') {
              pathData.push({type: 'L', values: [points[1].x, points[1].y]});
            } else { // cubic
              points.shift();
              points.forEach(function(point) { pathData.push({type: 'L', values: [point.x, point.y]}); });
            }
            curPoint = points[points.length - 1];
          }
          return pathData;
        }, []);
      },

      /**
       * @param {string} text - Content of `<text>` element.
       * @param {Document} document - Document that contains `<svg>`.
       * @param {string} id - ID for `href`.
       * @param {boolean} [stroke] - Setup for `stroke`.
       * @returns {Object} {elmPosition, elmPath, elmOffset,
       *    styleText, styleFill, styleStroke, styleShow, elmsAppend}
       */
      newText: function(text, document, id, stroke) {
        var pathId, textId, elmDefs, elmPath, elmText, elmTextPath, elmG, elmUseFill, elmUseStroke, style;

        elmDefs = document.createElementNS(SVG_NS, 'defs');
        elmPath = elmDefs.appendChild(document.createElementNS(SVG_NS, 'path'));
        elmPath.id = (pathId = id + '-path');

        elmText = document.createElementNS(SVG_NS, 'text');
        elmTextPath = elmText.appendChild(document.createElementNS(SVG_NS, 'textPath'));
        elmTextPath.href.baseVal = '#' + pathId;
        elmTextPath.startOffset.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0);
        elmTextPath.textContent = text;

        if (typeof svg2SupportedPaintOrder !== 'boolean') {
          svg2SupportedPaintOrder = 'paintOrder' in elmText.style;
        }
        if (stroke && !svg2SupportedPaintOrder) {
          elmText.id = (textId = id + '-text');
          elmDefs.appendChild(elmText);
          elmG = document.createElementNS(SVG_NS, 'g');
          elmUseStroke = elmG.appendChild(document.createElementNS(SVG_NS, 'use'));
          elmUseStroke.href.baseVal = '#' + textId;
          elmUseFill = elmG.appendChild(document.createElementNS(SVG_NS, 'use'));
          elmUseFill.href.baseVal = '#' + textId;
          style = elmUseStroke.style;
          style.strokeLinejoin = 'round';
          return {
            elmPosition: elmText,
            elmPath: elmPath,
            elmOffset: elmTextPath,
            styleText: elmText.style,
            styleFill: elmUseFill.style,
            styleStroke: style,
            styleShow: elmG.style,
            elmsAppend: [elmDefs, elmG]
          };

        } else {
          style = elmText.style;
          if (stroke) {
            style.strokeLinejoin = 'round';
            style.paintOrder = 'stroke';
          }
          return {
            elmPosition: elmText,
            elmPath: elmPath,
            elmOffset: elmTextPath,
            styleText: style,
            styleFill: style,
            styleStroke: stroke ? style : null,
            styleShow: style,
            elmsAppend: [elmDefs, elmText]
          };
        }
      },

      initSvg: function(attachProps, props) {
        var text = ATTACHMENTS.pathLabel.newText(attachProps.text, props.baseWindow.document,
            APP_ID + '-pathLabel-' + attachProps._id, attachProps.outlineColor),
          bBox, strokeWidth;

        ['elmPosition', 'elmPath', 'elmOffset', 'styleFill', 'styleShow', 'elmsAppend']
          .forEach(function(key) { attachProps[key] = text[key]; });

        attachProps.isShown = false;
        attachProps.styleShow.visibility = 'hidden';
        ATTACHMENTS.captionLabel.textStyleProps.forEach(function(propName) {
          if (attachProps[propName] != null) { text.styleText[propName] = attachProps[propName]; }
        });

        text.elmsAppend.forEach(function(elm) { props.svg.appendChild(elm); });
        // Get size in straight
        text.elmPath.setPathData([{type: 'M', values: [0, 100]}, {type: 'h', values: [100]}]);
        bBox = text.elmPosition.getBBox();
        // textAnchor and startOffset might affect the size.
        text.styleText.textAnchor = ['start', 'end', 'middle'][attachProps.semIndex];
        if (attachProps.semIndex === 2 && !attachProps.lineOffset) { // The position never change.
          text.elmOffset.startOffset.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 50);
        }

        attachProps.height = bBox.height;
        if (attachProps.outlineColor) {
          strokeWidth = bBox.height / 9;
          strokeWidth = strokeWidth > 10 ? 10 : strokeWidth < 2 ? 2 : strokeWidth;
          text.styleStroke.strokeWidth = strokeWidth + 'px';
          text.styleStroke.stroke = attachProps.outlineColor;
        }
        attachProps.strokeWidth = strokeWidth || 0;

        initStats(attachProps.aplStats, ATTACHMENTS.pathLabel.stats); // for bindWindow again
        attachProps.updateColor(props);
        attachProps.updatePath(props);
        attachProps.updateStartOffset(props);
        if (IS_WEBKIT) { update(props, {}); } // [WEBKIT] overflow:visible is ignored (To call updateViewBox())
        attachProps.updateShow(props);
      },

      bind: function(attachProps, bindTarget) {
        var props = bindTarget.props;

        if (!attachProps.color) { addEventHandler(props, 'cur_line_color', attachProps.updateColor); }
        addEventHandler(props, 'cur_line_strokeWidth', attachProps.updatePath);
        addEventHandler(props, 'apl_path', attachProps.updatePath);
        attachProps.semIndex = bindTarget.optionName === 'startLabel' ? 0 :
          bindTarget.optionName === 'endLabel' ? 1 : 2;
        if (attachProps.semIndex !== 2 || attachProps.lineOffset) {
          addEventHandler(props, 'cur_attach_plugBackLenSE', attachProps.updateStartOffset);
        }
        addEventHandler(props, 'svgShow', attachProps.updateShow);
        // [WEBKIT] overflow:visible is ignored
        if (IS_WEBKIT) { addEventHandler(props, 'new_edge4viewBox', attachProps.adjustEdge); }

        // after set attachProps.semIndex
        ATTACHMENTS.pathLabel.initSvg(attachProps, props);

        return true;
      },

      unbind: function(attachProps, boundTarget) {
        var props = boundTarget.props;

        if (attachProps.elmsAppend) {
          attachProps.elmsAppend.forEach(function(elm) { props.svg.removeChild(elm); });
          attachProps.elmPosition = attachProps.elmPath = attachProps.elmOffset =
            attachProps.styleFill = attachProps.styleShow = attachProps.elmsAppend = null;
        }
        initStats(attachProps.curStats, ATTACHMENTS.pathLabel.stats);
        initStats(attachProps.aplStats, ATTACHMENTS.pathLabel.stats);

        if (!attachProps.color) { removeEventHandler(props, 'cur_line_color', attachProps.updateColor); }
        removeEventHandler(props, 'cur_line_strokeWidth', attachProps.updatePath);
        removeEventHandler(props, 'apl_path', attachProps.updatePath);
        if (attachProps.semIndex !== 2 || attachProps.lineOffset) {
          removeEventHandler(props, 'cur_attach_plugBackLenSE', attachProps.updateStartOffset);
        }
        removeEventHandler(props, 'svgShow', attachProps.updateShow);
        if (IS_WEBKIT) { // [WEBKIT] overflow:visible is ignored
          removeEventHandler(props, 'new_edge4viewBox', attachProps.adjustEdge);
          // addDelayedProc(function() { update(props, {}); }); // reset path_edge
          update(props, {}); // To call updateViewBox()
        }
      },

      removeOption: function(attachProps, boundTarget) {
        var props = boundTarget.props, newOptions = {};
        newOptions[boundTarget.optionName] = '';
        setOptions(props, newOptions);
      },

      remove: function(attachProps) {
        if (attachProps.boundTargets.length) { // it should be unbound by LeaderLineAttachment.remove
          console.error('LeaderLineAttachment was not unbound by remove');
          attachProps.boundTargets.forEach(
            function(boundTarget) { ATTACHMENTS.pathLabel.unbind(attachProps, boundTarget); });
        }
      }
    }
  };

  Object.keys(ATTACHMENTS).forEach(function(attachmentName) {
    LeaderLine[attachmentName] = function() {
      return new LeaderLineAttachment(ATTACHMENTS[attachmentName], Array.prototype.slice.call(arguments));
    };
  });

  // Update position automatically
  LeaderLine.positionByWindowResize = true;
  window.addEventListener('resize', AnimEvent.add(function(/* event */) {
    // var eventWindow;
    if (LeaderLine.positionByWindowResize) {
      // eventWindow = event.target;
      Object.keys(insProps).forEach(function(id) {
        // Checking window may be needed when managing each window is supported.
        /*
        var props = insProps[id];
        if (props.baseWindow === eventWindow) {
          update(props, {position: true});
        }
        */
        update(insProps[id], {position: true});
      });
    }
  }), false);

  return LeaderLine;
})();
