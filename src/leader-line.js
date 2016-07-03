/*
 * LeaderLine
 * https://github.com/anseki/leader-line
 *
 * Copyright (c) 2016 anseki
 * Licensed under the MIT license.
 */

/* exported LeaderLine */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

;var LeaderLine = (function() { // eslint-disable-line no-extra-semi
  'use strict';

  /**
   * An object that simulates `DOMRect` to indicate a bounding-box.
   * @typedef {Object} BBox
   * @property {(number|null)} left - ScreenCTM
   * @property {(number|null)} top - ScreenCTM
   * @property {(number|null)} right - ScreenCTM
   * @property {(number|null)} bottom - ScreenCTM
   * @property {(number|null)} width
   * @property {(number|null)} height
   */

  /**
   * An object that has coordinates of ScreenCTM.
   * @typedef {Object} Point
   * @property {number} x
   * @property {number} y
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
     * @property {number} overhead
     * @property {boolean} noRotate
     * @property {number} outlineBase
     * @property {number} outlineMax
     */

    /**
     * @typedef {{symbolId: string, SymbolConf}} SYMBOLS
     */

    PLUG_BEHIND = 'behind',
    DEFS_ID = APP_ID + '-defs',
    /* [DEBUG/]
    DEFS_HTML = @INCLUDE[code:DEFS_HTML]@,
    SYMBOLS = @INCLUDE[code:SYMBOLS]@,
    PLUG_KEY_2_ID = @INCLUDE[code:PLUG_KEY_2_ID]@,
    PLUG_2_SYMBOL = @INCLUDE[code:PLUG_2_SYMBOL]@,
    DEFAULT_END_PLUG = @INCLUDE[code:DEFAULT_END_PLUG]@,
    [DEBUG/] */
    // [DEBUG]
    DEFS_HTML = window.DEFS_HTML,
    SYMBOLS = window.SYMBOLS,
    PLUG_KEY_2_ID = window.PLUG_KEY_2_ID,
    PLUG_2_SYMBOL = window.PLUG_2_SYMBOL,
    DEFAULT_END_PLUG = window.DEFAULT_END_PLUG,
    // [/DEBUG]

    SOCKET_IDS = [SOCKET_TOP, SOCKET_RIGHT, SOCKET_BOTTOM, SOCKET_LEFT],
    KEYWORD_AUTO = 'auto',
    BBOX_PROP = {x: 'left', y: 'top', width: 'width', height: 'height'},

    MIN_GRAVITY = 80, MIN_GRAVITY_SIZE = 4, MIN_GRAVITY_R = 5,
    MIN_OH_GRAVITY = 120, MIN_OH_GRAVITY_OH = 8, MIN_OH_GRAVITY_R = 3.75,
    MIN_ADJUST_LEN = 10, MIN_GRID_LEN = 30,

    CIRCLE_CP = 0.5522847, CIRCLE_8_RAD = 1 / 4 * Math.PI,

    IS_TRIDENT = !!document.uniqueID,
    IS_BLINK = !!(window.chrome && window.chrome.webstore),
    IS_GECKO = 'MozAppearance' in document.documentElement.style,
    IS_EDGE = '-ms-scroll-limit' in document.documentElement.style &&
      '-ms-ime-align' in document.documentElement.style && !window.navigator.msPointerEnabled,
    IS_WEBKIT = !window.chrome && 'WebkitAppearance' in document.documentElement.style,

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
        var proto, cstrtr;
        return obj && toString.call(obj) === '[object Object]' &&
          (!(proto = Object.getPrototypeOf(obj)) ||
            (cstrtr = proto.hasOwnProperty('constructor') && proto.constructor) &&
            typeof cstrtr === 'function' && fnToString.call(cstrtr) === objFnString);
      };
    })(),
    /* [DEBUG/]
    anim = @INCLUDE[code:anim]@,
    [DEBUG/] */
    anim = window.anim, // [DEBUG/]
    /* [DEBUG/]
    pathDataPolyfill = @INCLUDE[code:pathDataPolyfill]@,
    [DEBUG/] */
    pathDataPolyfill = window.pathDataPolyfill, // [DEBUG/]

    /**
     * @typedef {{hasSE, hasProps, isOption, hasChanged}} StatConf
     */

    /**
     * @typedef {{group: {name: StatConf}}} StatConfGroups
     */

    STATS = {
      Line: {
        lineColor: {isOption: true}, lineSize: {isOption: true}
      },
      Plug: {
        plugSE: {hasSE: true, isOption: true},
        plugColorSE: {hasSE: true},
        plugColorTraSE: {hasSE: true},
        widthSE: {hasSE: true}, heightSE: {hasSE: true},
        plugsEnabled: {}
      },
      LineOutline: {
        lineOutlineEnabled: {isOption: true},
        lineOutlineColor: {isOption: true},
        lineOutlineColorTra: {},
        lineOutlineSize: {}
      },
      PlugOutline: {
        plugSE: {hasSE: true},
        plugOutlineEnabledSE: {hasSE: true},
        plugOutlineColorSE: {hasSE: true},
        plugOutlineColorTraSE: {hasSE: true},
        plugOutlineSizeSE: {hasSE: true}
      },
      Position: {
        socketXYSE: {hasSE: true, hasProps: true,
          hasChanged: function(a, b) {
            return ['x', 'y', 'socketId'].some(function(prop) { return a[prop] !== b[prop]; });
          }},
        plugOverheadSE: {hasSE: true},
        path: {isOption: true},
        lineSize: {isOption: true},
        socketGravitySE: {hasSE: true, isOption: true,
          hasChanged: function(a, b) {
            var aType = a == null ? 'auto' : Array.isArray(a) ? 'array' : 'number', // eslint-disable-line eqeqeq
              bType = b == null ? 'auto' : Array.isArray(b) ? 'array' : 'number'; // eslint-disable-line eqeqeq
            return aType !== bType ? true :
              aType === 'array' ? [0, 1].some(function(i) { return a[i] !== b[i]; }) :
              a !== b;
          }}
      },
      Path: {
        pathData: {
          hasChanged: function(a, b) {
            return a == null || b == null || // eslint-disable-line eqeqeq
              a.length !== b.length || a.some(function(aSeg, i) {
                var bSeg = b[i];
                return aSeg.type !== bSeg.type ||
                  aSeg.values.some(function(aSegValue, i) { return aSegValue !== bSeg.values[i]; });
              });
          }}
      },
      ViewBBox: {
        x: {}, y: {}, width: {}, height: {},
        plugBCircleSE: {hasSE: true},
        pathEdge: {hasProps: true}
      },
      Mask: {
        lineMaskEnabled: {},
        lineOutlineEnabled: {},
        lineMaskX: {}, lineMaskY: {},
        lineOutlineMaskX: {}, lineOutlineMaskY: {},
        capsEnabled: {}, capsMarkersEnabled: {},
        maskBGRectX: {}, maskBGRectY: {}
      },
      CapsMaskAnchor: {
        enabledSE: {hasSE: true},
        xSE: {hasSE: true}, ySE: {hasSE: true},
        widthSE: {hasSE: true}, heightSE: {hasSE: true}
      },
      CapsMaskMarker: {
        enabledSE: {hasSE: true},
        plugSE: {hasSE: true},
        widthSE: {hasSE: true}, heightSE: {hasSE: true}
      }
    },
    STAT_NAMES = Object.keys(STATS).reduce(function(names, group) {
      names[group] = Object.keys(STATS[group]);
      return names;
    }, {}),

    /**
     * @typedef {Object} EFFECT_CONF
     * @property {Function} validParams - (props, effectParams) All params must be added even if it is `null`.
     * @property {Function} init - (props, effectParams)
     * @property {Function} remove - (props)
     * @property {Function} [onSetLine] - (props, setProps)
     * @property {Function} [onSetPlug] - (props, setPropsSE)
     * @property {Function} [onPosition] - (props, pathList)
     * @property {Function} [onUpdatePath] - (props, pathList)
     * @property {Function} [onUpdateAnchorBBox] - (props, i)
     */
    EFFECTS = {
      dash: { // effectParams: dashLen, gapLen
        validParams: function(props, effectParams) {
          return ['dashLen', 'gapLen'].reduce(function(params, param) {
            params[param] =
              typeof effectParams[param] === 'number' && effectParams[param] > 0 ?
                effectParams[param] : null;
            return params;
          }, {});
        },
        init: function(props, effectParams) {
          window.traceLog.push('<EFFECTS.dash.init>'); // [DEBUG/]
          props.lineFace.style.strokeDasharray =
            (effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' +
            (effectParams.gapLen || EFFECTS.dash.getGapLen(props));
          props.lineFace.style.strokeDashoffset = '0';
          window.traceLog.push('strokeDasharray=' + (effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' + (effectParams.gapLen || EFFECTS.dash.getGapLen(props))); // [DEBUG/]
        },
        remove: function(props) {
          window.traceLog.push('<EFFECTS.dash.remove>'); // [DEBUG/]
          props.lineFace.style.strokeDasharray = 'none';
          props.lineFace.style.strokeDashoffset = '0';
        },
        onSetLine: function(props, setProps) {
          window.traceLog.push('<EFFECTS.dash.onSetLine>'); // [DEBUG/]
          if ((!setProps || setProps.indexOf('lineSize') > -1) &&
              (!props.effectParams.dashLen || !props.effectParams.gapLen)) {
            props.lineFace.style.strokeDasharray =
              (props.effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' +
              (props.effectParams.gapLen || EFFECTS.dash.getGapLen(props));
            window.traceLog.push('strokeDasharray=' + (props.effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' + (props.effectParams.gapLen || EFFECTS.dash.getGapLen(props))); // [DEBUG/]
          }
        },
        getDashLen: function(props) { return props.options.lineSize * 2; },
        getGapLen: function(props) { return props.options.lineSize; }
      },

      dashAnim: { // effectParams: dashLen, gapLen, duration
        validParams: function(props, effectParams) {
          var params = ['dashLen', 'gapLen'].reduce(function(params, param) {
            params[param] =
              typeof effectParams[param] === 'number' && effectParams[param] > 0 ?
                effectParams[param] : null;
            return params;
          }, {});
          params.duration =
            typeof effectParams.duration === 'number' && effectParams.duration > 10 ?
              effectParams.duration : null;
          return params;
        },
        init: function(props, effectParams) {
          window.traceLog.push('<EFFECTS.dashAnim.init>'); // [DEBUG/]
          if (props.effectParams && props.effectParams.animId) { anim.remove(props.effectParams.animId); }
          props.lineFace.style.strokeDasharray =
            (effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' +
            (effectParams.gapLen || EFFECTS.dash.getGapLen(props));
          props.lineFace.style.strokeDashoffset = '0';
          window.traceLog.push('strokeDasharray=' + (effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' + (effectParams.gapLen || EFFECTS.dash.getGapLen(props))); // [DEBUG/]
          // effectParams.animId = animId;
        },
        remove: function(props) {
          window.traceLog.push('<EFFECTS.dashAnim.remove>'); // [DEBUG/]
          props.lineFace.style.strokeDasharray = 'none';
          props.lineFace.style.strokeDashoffset = '0';
          if (props.effectParams && props.effectParams.animId) { anim.remove(props.effectParams.animId); }
        },
        onSetLine: function(props, setProps) {
          window.traceLog.push('<EFFECTS.dashAnim.onSetLine>'); // [DEBUG/]
          if ((!setProps || setProps.indexOf('lineSize') > -1) &&
              (!props.effectParams.dashLen || !props.effectParams.gapLen)) {
            props.lineFace.style.strokeDasharray =
              (props.effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' +
              (props.effectParams.gapLen || EFFECTS.dash.getGapLen(props));
            window.traceLog.push('strokeDasharray=' + (props.effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' + (props.effectParams.gapLen || EFFECTS.dash.getGapLen(props))); // [DEBUG/]
          }
        }
      }
    },

    /**
     * @typedef {Object.<_id: number, props>} insProps
     */
    insProps = {}, insId = 0, svg2Supported, forceReflowTargets = [];

  // [DEBUG]
  window.insProps = insProps;
  window.traceLog = [];
  window.isObject = isObject;
  // [/DEBUG]

  function forceReflow(target) {
    // for TRIDENT and BLINK bug (reflow like `offsetWidth` can't update)
    setTimeout(function() {
      var parent = target.parentNode, next = target.nextSibling;
      // It has to be removed first for BLINK.
      parent.insertBefore(parent.removeChild(target), next);
    }, 0);
  }
  window.forceReflow = forceReflow; // [DEBUG/]

  function forceReflowAdd(target) {
    if (forceReflowTargets.indexOf(target) < 0) { forceReflowTargets.push(target); }
  }

  function forceReflowApply() {
    forceReflowTargets.forEach(function(target) { forceReflow(target); });
    forceReflowTargets = [];
  }

  function hasChanged(a, b) {
    var typeA;
    return typeof a !== typeof b ||
      (typeA = isObject(a) ? 'obj' : Array.isArray(a) ? 'array' : '') !==
        (isObject(b) ? 'obj' : Array.isArray(b) ? 'array' : '') ||
      (
        typeA === 'obj' ?
          Object.keys(a).some(function(prop) { return hasChanged(a[prop], b[prop]); }) :
        typeA === 'array' ?
          a.length !== b.length || a.some(function(aVal, i) { return hasChanged(aVal, b[i]); }) :
        a !== b
      );
  }
  window.hasChanged = hasChanged; // [DEBUG/]

  /**
   * Parse and get an alpha channel in color notation.
   * @param {string} color - A color notation such as `'rgba(10, 20, 30, 0.6)'`.
   * @returns {number} - A value of alpha channel ([0, 1]) such as `0.6`.
   */
  function getAlpha(color) {
    var matches, func, args, alpha = 1;

    function parseAlpha(value) {
      var alpha = 1, matches = /^\s*([\d\.]+)\s*(\%)?\s*$/.exec(value);
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
    if ((matches = /^\s*(rgba|hsla|hwb|gray|device\-cmyk)\s*\(([\s\S]+)\)\s*$/i.exec(color))) {
      func = matches[1].toLowerCase();
      args = matches[2].split(',');
      alpha =
        (func === 'rgba' || func === 'hsla' || func === 'hwb') && args.length === 4 ? parseAlpha(args[3]) :
        func === 'gray' && args.length === 2 ? parseAlpha(args[1]) :
        func === 'device-cmyk' && args.length >= 5 ? parseAlpha(args[4]) :
        1;
    } else if ((matches = /^\s*\#(?:[\da-f]{6}([\da-f]{2})|[\da-f]{3}([\da-f]))\s*$/i.exec(color))) {
      alpha = parseInt(matches[1] ? matches[1] : matches[2] + matches[2], 16) / 255;
    } else if (/^\s*transparent\s*$/i.test(color)) {
      alpha = 0;
    }
    return alpha;
  }
  window.getAlpha = getAlpha; // [DEBUG/]

  /**
   * Get an element's bounding-box that contains coordinates relative to the element's document or window.
   * @param {Element} element - Target element.
   * @param {boolean} [relWindow] - Whether it's relative to the element's window, or document (i.e. `<html>`).
   * @returns {(BBox|null)} - A bounding-box or null when failed.
   */
  function getBBox(element, relWindow) {
    var bBox = {}, rect, prop, doc, win;
    if (!(doc = element.ownerDocument)) {
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
      if (!(win = doc.defaultView)) {
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
  window.getBBox = getBBox; // [DEBUG/]

  /**
   * Get distance between an element's bounding-box and its content (`<iframe>` element and its document).
   * @param {Element} element - Target element.
   * @returns {{left: number, top: number}} - An object has `left` and `top`.
   */
  function getContentOffset(element) {
    var styles = element.ownerDocument.defaultView.getComputedStyle(element);
    return {
      left: element.clientLeft + parseFloat(styles.paddingLeft),
      top: element.clientTop + parseFloat(styles.paddingTop)
    };
  }

  /**
   * Get `<iframe>` elements in path to an element.
   * @param {Element} element - Target element.
   * @param {Window} [baseWindow] - Start searching at this window. This is excluded from result.
   * @returns {(Element[]|null)} - An array of `<iframe>` elements or null when `baseWindow` was not found in the path.
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
   * @returns {(BBox|null)} - A bounding-box or null when failed.
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
  window.getBBoxNest = getBBoxNest; // [DEBUG/]

  /**
   * Get a common ancestor window.
   * @param {Element} elm1 - A contained element.
   * @param {Element} elm2 - A contained element.
   * @returns {Window} - A common ancestor window.
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
  window.getCommonWindow = getCommonWindow; // [DEBUG/]

  function getPointsLength(p0, p1) {
    var lx = p0.x - p1.x, ly = p0.y - p1.y;
    return Math.sqrt(lx * lx + ly * ly);
  }
  window.getPointsLength = getPointsLength; // [DEBUG/]

  function getPointOnLine(p0, p1, r) {
    var xA = p1.x - p0.x, yA = p1.y - p0.y;
    return {
      x: p0.x + xA * r,
      y: p0.y + yA * r,
      angle: Math.atan2(yA, xA) / (Math.PI / 180)
    };
  }
  window.getPointOnLine = getPointOnLine; // [DEBUG/]

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
  window.getPointOnCubic = getPointOnCubic; // [DEBUG/]

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

    t = t == null || t > 1 ? 1 : t < 0 ? 0 : t; // eslint-disable-line eqeqeq
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
  window.getCubicLength = getCubicLength; // [DEBUG/]

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
  window.getCubicT = getCubicT; // [DEBUG/]

  function getCurStat(props, group, name) {
    return props[STATS[group][name].isOption ? 'options' : 'cur' + group][name];
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {string} group - Group name of `StatConfGroups`.
   * @returns {boolean} - `true` if it was changed.
   */
  function statsHasChanged(props, group) {
    var aplStats = props['apl' + group];
    // [DEBUG]
    function log(out, name) {
      if (out) {
        window.traceLog.push('statsHasChanged:' + name); // eslint-disable-line eqeqeq
      }
      return out;
    }
    // [/DEBUG]
    return STAT_NAMES[group].some(function(name) {
      var statConf = STATS[group][name],
        curValue = getCurStat(props, group, name),
        aplValue = aplStats[name];
      return statConf.hasSE ?
        [0, 1].some(function(i) {
          return (
            log( // [DEBUG/]
            statConf.hasChanged ?
              statConf.hasChanged(aplValue[i], curValue[i]) : aplValue[i] !== curValue[i]
            , name + '[' + i + ']') // [DEBUG/]
            );
        }) :
        log( // [DEBUG/]
        statConf.hasChanged ? statConf.hasChanged(aplValue, curValue) : aplValue !== curValue
        , name) // [DEBUG/]
        ;
    });
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {string} group - Group name of `StatConfGroups`.
   * @returns {void}
   */
  function applyStats(props, group) {
    var aplStats = props['apl' + group];
    STAT_NAMES[group].forEach(function(name) {
      var statConf = STATS[group][name], curValue = getCurStat(props, group, name);
      aplStats[name] = statConf.hasSE ? [curValue[0], curValue[1]] : curValue;
    });
  }

  /**
   * Setup `baseWindow`, `bodyOffset`, `pathList`,
   *    stats (`cur*` and `apl*`), `effect`, `effectParams`, SVG elements.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Window} newWindow - A common ancestor `window`.
   * @returns {void}
   */
  function bindWindow(props, newWindow) {
    window.traceLog.push('<bindWindow>'); // [DEBUG/]
    var SVG_NS = 'http://www.w3.org/2000/svg',
      baseDocument = newWindow.document,
      defs, stylesHtml, stylesBody, bodyOffset = {x: 0, y: 0},
      svg, elmDefs, maskCaps, element;

    function sumProps(value, addValue) { return (value += parseFloat(addValue)); }

    function setupMask(id) {
      var element = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'mask'));
      element.id = id;
      element.maskUnits.baseVal = SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE;
      ['x', 'y', 'width', 'height'].forEach(function(prop) {
        element[prop].baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0);
      });
      return element;
    }

    function setupMarker(id) {
      var element = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'marker'));
      element.id = id;
      element.markerUnits.baseVal = SVGMarkerElement.SVG_MARKERUNITS_STROKEWIDTH;
      if (!element.viewBox.baseVal) {
        element.setAttribute('viewBox', '0 0 0 0'); // for Firefox bug
      }
      return element;
    }

    function setWH100(element) {
      ['width', 'height'].forEach(function(prop) {
        element[prop].baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100);
      });
      return element;
    }

    if (props.baseWindow && props.svg) {
      props.baseWindow.document.body.removeChild(props.svg);
    }
    props.baseWindow = newWindow;

    if (!baseDocument.getElementById(DEFS_ID)) { // Add svg defs
      defs = (new newWindow.DOMParser()).parseFromString(DEFS_HTML, 'image/svg+xml');
      baseDocument.body.appendChild(defs.documentElement);
      pathDataPolyfill(newWindow);
    }

    // Get `bodyOffset`.
    stylesHtml = newWindow.getComputedStyle(baseDocument.documentElement);
    stylesBody = newWindow.getComputedStyle(baseDocument.body);
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
    props.bodyOffset = bodyOffset;

    // Main SVG
    svg = baseDocument.createElementNS(SVG_NS, 'svg');
    svg.className.baseVal = APP_ID;
    if (!svg.viewBox.baseVal) { svg.setAttribute('viewBox', '0 0 0 0'); } // for Firefox bug
    elmDefs = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'defs'));

    props.linePath = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
    props.linePath.id = props.linePathId;
    props.linePath.className.baseVal = APP_ID + '-line-path';
    if (IS_WEBKIT) {
      // [WEBKIT] style in `use` is not updated
      props.linePath.style.fill = 'none';
    }

    props.lineShape = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineShape.id = props.lineShapeId;
    props.lineShape.href.baseVal = '#' + props.linePathId;

    maskCaps = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'g'));
    maskCaps.id = props.capsId;

    props.capsMaskAnchorSE = [0, 1].map(function() {
      var element = maskCaps.appendChild(baseDocument.createElementNS(SVG_NS, 'rect'));
      element.className.baseVal = APP_ID + '-caps-mask-anchor';
      return element;
    });

    props.capsMaskMarkerSE = [0, 1].map(function(i) { return setupMarker(props.lineMaskMarkerIdSE[i]); });
    props.capsMaskMarkerShapeSE = [0, 1].map(function(i) {
      var element = props.capsMaskMarkerSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
      element.className.baseVal = APP_ID + '-caps-mask-marker-shape';
      return element;
    });

    props.capsMaskLine = maskCaps.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.capsMaskLine.className.baseVal = APP_ID + '-caps-mask-line';
    props.capsMaskLine.href.baseVal = '#' + props.lineShapeId;

    props.maskBGRect = setWH100(elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'rect')));
    props.maskBGRect.id = props.maskBGRectId;
    props.maskBGRect.className.baseVal = APP_ID + '-mask-bg-rect';
    if (IS_WEBKIT) {
      // [WEBKIT] style in `use` is not updated
      props.maskBGRect.style.fill = 'white';
    }

    // lineMask
    props.lineMask = setWH100(setupMask(props.lineMaskId));
    props.lineMaskBG = props.lineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineMaskBG.href.baseVal = '#' + props.maskBGRectId;
    props.lineMaskShape = props.lineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineMaskShape.className.baseVal = APP_ID + '-line-mask-shape';
    props.lineMaskShape.href.baseVal = '#' + props.linePathId;
    props.lineMaskShape.style.display = 'none';
    props.lineMaskCaps = props.lineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineMaskCaps.href.baseVal = '#' + props.capsId;

    // lineOutlineMask
    props.lineOutlineMask = setWH100(setupMask(props.lineOutlineMaskId));
    element = props.lineOutlineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + props.maskBGRectId;
    props.lineOutlineMaskShape = props.lineOutlineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineOutlineMaskShape.className.baseVal = APP_ID + '-line-outline-mask-shape';
    props.lineOutlineMaskShape.href.baseVal = '#' + props.linePathId;
    props.lineOutlineMaskCaps = props.lineOutlineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineOutlineMaskCaps.href.baseVal = '#' + props.capsId;

    props.face = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'g'));

    props.lineFace = props.face.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineFace.href.baseVal = '#' + props.lineShapeId;

    props.lineOutlineFace = props.face.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineOutlineFace.href.baseVal = '#' + props.lineShapeId;
    props.lineOutlineFace.style.mask = 'url(#' + props.lineOutlineMaskId + ')';
    props.lineOutlineFace.style.display = 'none';

    // plugMaskSE
    props.plugMaskSE = [0, 1].map(function(i) { return setupMask(props.plugMaskIdSE[i]); });
    props.plugMaskShapeSE = [0, 1].map(function(i) {
      var element = props.plugMaskSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
      element.className.baseVal = APP_ID + '-plug-mask-shape';
      return element;
    });

    // plugOutlineMaskSE
    props.plugOutlineMaskSE = [0, 1].map(function(i) { return setupMask(props.plugOutlineMaskIdSE[i]); });
    props.plugOutlineMaskShapeSE = [0, 1].map(function(i) {
      var element = props.plugOutlineMaskSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
      element.className.baseVal = APP_ID + '-plug-outline-mask-shape';
      return element;
    });

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
      element.style.mask = 'url(#' + props.plugOutlineMaskIdSE[i] + ')';
      element.style.display = 'none';
      return element;
    });

    props.plugsFace = props.face.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.plugsFace.className.baseVal = APP_ID + '-plugs-face';
    props.plugsFace.href.baseVal = '#' + props.lineShapeId;

    props.svg = baseDocument.body.appendChild(svg);

    Object.keys(STATS).forEach(function(group) {
      var curStats = props['cur' + group] = {}, aplStats = props['apl' + group] = {};
      STAT_NAMES[group].forEach(function(name) {
        var statConf = STATS[group][name];
        if (statConf.hasSE) {
          if (statConf.hasProps) {
            if (!statConf.isOption) { curStats[name] = [{}, {}]; }
            aplStats[name] = [{}, {}];
          } else {
            if (!statConf.isOption) { curStats[name] = []; }
            aplStats[name] = [];
          }
        } else if (statConf.hasProps) {
          if (!statConf.isOption) { curStats[name] = {}; }
          aplStats[name] = {};
        }
      });
    });

    props.pathList = {baseVal: [], animVal: []};
    props.effect = null;
    if (props.effectParams && props.effectParams.animId) { anim.remove(props.effectParams.animId); }
    props.effectParams = {};
  }
  window.bindWindow = bindWindow; // [DEBUG/]

  /**
   * Apply `orient` (and `viewBox`) to `marker`.
   * @param {SVGMarkerElement} marker - Target `<marker>` element.
   * @param {string} orient - `'auto'`, `'auto-start-reverse'` or angle.
   * @param {BBox} bBox - `BBox` as `viewBox` of the marker.
   * @param {SVGSVGElement} svg - Parent `<svg>` element.
   * @param {SVGElement} shape - An element that is shown as marker.
   * @param {SVGElement} marked - Target element that has `marker-start/end` such as `<path>`.
   * @returns {void}
   */
  function setMarkerOrient(marker, orient, bBox, svg, shape, marked) {
    var transform, viewBox, reverseView;
    // `setOrientToAuto()`, `setOrientToAngle()`, `orientType` and `orientAngle` of
    // `SVGMarkerElement` don't work in browsers other than Chrome.
    if (orient === 'auto-start-reverse') {
      if (typeof svg2Supported !== 'boolean') {
        marker.setAttribute('orient', 'auto-start-reverse');
        svg2Supported = marker.orientType.baseVal === SVGMarkerElement.SVG_MARKER_ORIENT_UNKNOWN;
      }
      if (svg2Supported) {
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
      if (svg2Supported === false) { shape.transform.baseVal.clear(); }
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
    if (IS_TRIDENT) { forceReflowAdd(marked); }
  }

  function getMarkerProps(i, symbolConf) {
    return {
      prop: i ? 'markerEnd' : 'markerStart',
      orient: !symbolConf ? null : symbolConf.noRotate ? '0' : i ? 'auto' : 'auto-start-reverse'
    };
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updateLine(props) {
    var options = props.options, update = false,
      aplStats = props.aplLine, value;

    // lineColor
    if ((value = options.lineColor) !== aplStats.lineColor) {
      window.traceLog.push('lineColor=' + value); // [DEBUG/]
      props.lineFace.style.stroke = aplStats.lineColor = value;
      update = true;

      if (props.effect && props.effect.onLineColor) {
        props.effect.onLineColor(props, value);
      }
    }

    // lineSize
    if ((value = options.lineSize) !== aplStats.lineSize) {
      window.traceLog.push('lineSize=' + value); // [DEBUG/]
      props.lineShape.style.strokeWidth = aplStats.lineSize = value;
      update = true;
      if (IS_GECKO || IS_TRIDENT) {
        // [TRIDENT] plugsFace is not updated when lineSize is changed
        // [GECKO] plugsFace is ignored
        forceReflowAdd(props.lineShape);
        if (IS_TRIDENT) {
          // [TRIDENT] lineColor is ignored
          forceReflowAdd(props.lineFace);
          // [TRIDENT] lineMaskCaps is ignored when lineSize is changed
          forceReflowAdd(props.lineMaskCaps);
        }
      }

      if (props.effect && props.effect.onLineSize) {
        props.effect.onLineSize(props, value);
      }
    }
    return update;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updatePlug(props) {
    var options = props.options, update = false,
      curStats = props.curPlug, aplStats = props.aplPlug,
      curPlugOutline = props.curPlugOutline, curPosition = props.curPosition,
      curViewBBox = props.curViewBBox, curCapsMaskAnchor = props.curCapsMaskAnchor,
      curCapsMaskMarker = props.curCapsMaskMarker;

    if ((curStats.plugsEnabled =
        options.plugSE[0] !== PLUG_BEHIND || options.plugSE[1] !== PLUG_BEHIND)) {

      // plugsEnabled
      if (!aplStats.plugsEnabled) {
        window.traceLog.push('plugsEnabled=true'); // [DEBUG/]
        aplStats.plugsEnabled = true;
        props.plugsFace.style.display = 'inline';
        update = true;

        if (props.effect && props.effect.onPlugsEnabled) {
          props.effect.onPlugsEnabled(props, true);
        }
      }

      [0, 1].forEach(function(i) {
        var plugId = options.plugSE[i], symbolConf, marker, value;

        if (plugId !== PLUG_BEHIND) {
          symbolConf = SYMBOLS[PLUG_2_SYMBOL[plugId]];

          // plugSE
          if (plugId !== aplStats.plugSE[i]) {
            window.traceLog.push('plugSE[' + i + ']=' + plugId); // [DEBUG/]
            aplStats.plugSE[i] = plugId;
            marker = getMarkerProps(i, symbolConf);
            props.plugFaceSE[i].href.baseVal = '#' + symbolConf.elmId;
            // Since TRIDENT doesn't show markers, set those before `setMarkerOrient` (it calls `forceReflow`).
            props.plugsFace.style[marker.prop] = 'url(#' + props.plugMarkerIdSE[i] + ')';
            setMarkerOrient(props.plugMarkerSE[i], marker.orient,
              symbolConf.bBox, props.svg, props.plugMarkerShapeSE[i], props.plugsFace);
            update = true;
            if (IS_GECKO) {
              // [GECKO] plugsFace is not updated when plugSE is changed
              forceReflowAdd(props.plugsFace);
            }

            if (props.effect && props.effect.onPlugSE) {
              props.effect.onPlugSE(props, plugId, i);
            }
          }

          // plugColorSE
          curStats.plugColorSE[i] = value = options.plugColorSE[i] || options.lineColor;
          if (value !== aplStats.plugColorSE[i]) {
            window.traceLog.push('plugColorSE[' + i + ']=' + value); // [DEBUG/]
            curStats.plugColorTraSE[i] = getAlpha(value) < 1;
            props.plugFaceSE[i].style.fill = aplStats.plugColorSE[i] = value;
            update = true;

            if (props.effect && props.effect.onPlugColorSE) {
              props.effect.onPlugColorSE(props, value, i);
            }
          }

          // widthSE, heightSE
          curStats.widthSE[i] = curCapsMaskMarker.widthSE[i] = symbolConf.widthR * options.plugSizeSE[i];
          curStats.heightSE[i] = curCapsMaskMarker.heightSE[i] = symbolConf.heightR * options.plugSizeSE[i];
          if (IS_WEBKIT) {
            // [WEBKIT] mask in marker is resized with rasterise
            curStats.widthSE[i] *= options.lineSize;
            curStats.heightSE[i] *= options.lineSize;
          }
          [['markerWidth', 'widthSE', 'onPlugWidthSE'], ['markerHeight', 'heightSE', 'onPlugHeightSE']]
            .forEach(function(whKeys) {
              var markerKey = whKeys[0], statKey = whKeys[1], eventKey = whKeys[2];
              if ((value = curStats[statKey][i]) !== aplStats[statKey][i]) {
                window.traceLog.push('Plug.' + statKey + '[' + i + ']'); // [DEBUG/]
                props.plugMarkerSE[i][markerKey].baseVal.value = aplStats[statKey][i] = value;
                update = true;

                if (props.effect && props.effect[eventKey]) {
                  props.effect[eventKey](props, value, i);
                }
              }
            });

          curPosition.plugOverheadSE[i] =
            options.lineSize / DEFAULT_OPTIONS.lineSize * symbolConf.overhead * options.plugSizeSE[i];
          curViewBBox.plugBCircleSE[i] =
            options.lineSize / DEFAULT_OPTIONS.lineSize * symbolConf.bCircle * options.plugSizeSE[i];
          curCapsMaskAnchor.enabledSE[i] = false;

        } else {

          // plugSE
          if (plugId !== aplStats.plugSE[i]) {
            window.traceLog.push('plugSE[' + i + ']=' + plugId); // [DEBUG/]
            aplStats.plugSE[i] = plugId;
            marker = getMarkerProps(i);
            props.plugsFace.style[marker.prop] = 'none';
            update = true;

            if (props.effect && props.effect.onPlugSE) {
              props.effect.onPlugSE(props, plugId, i);
            }
          }

          curPosition.plugOverheadSE[i] = -(options.lineSize / 2);
          curViewBBox.plugBCircleSE[i] = 0;
          curCapsMaskAnchor.enabledSE[i] = true;
        }

        curPlugOutline.plugSE[i] = curCapsMaskMarker.plugSE[i] = plugId;
      });

    } else {

      // plugsEnabled
      if (aplStats.plugsEnabled) {
        window.traceLog.push('plugsEnabled=false'); // [DEBUG/]
        aplStats.plugsEnabled = false;
        props.plugsFace.style.display = 'none';
        update = true;

        if (props.effect && props.effect.onPlugsEnabled) {
          props.effect.onPlugsEnabled(props, false);
        }
      }

      [0, 1].forEach(function(i) {
        curPlugOutline.plugSE[i] = curCapsMaskMarker.plugSE[i] = PLUG_BEHIND;
        curPosition.plugOverheadSE[i] = -(options.lineSize / 2);
        curViewBBox.plugBCircleSE[i] = 0;
        curCapsMaskAnchor.enabledSE[i] = true;
      });
    }
    return update;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updateLineOutline(props) {
    var options = props.options, update = false,
      curStats = props.curLineOutline, aplStats = props.aplLineOutline, value;

    if (options.lineOutlineEnabled) {

      // lineOutlineEnabled
      if (!aplStats.lineOutlineEnabled) {
        window.traceLog.push('lineOutlineEnabled=true'); // [DEBUG/]
        aplStats.lineOutlineEnabled = true;
        props.lineOutlineFace.style.display = 'inline';
        update = true;

        if (props.effect && props.effect.onLineOutlineEnabled) {
          props.effect.onLineOutlineEnabled(props, true);
        }
      }

      // lineOutlineColor
      if ((value = options.lineOutlineColor) !== aplStats.lineOutlineColor) {
        window.traceLog.push('lineOutlineColor=' + value); // [DEBUG/]
        curStats.lineOutlineColorTra = getAlpha(value) < 1;
        props.lineOutlineFace.style.stroke = aplStats.lineOutlineColor = value;
        update = true;

        if (props.effect && props.effect.onLineOutlineColor) {
          props.effect.onLineOutlineColor(props, value);
        }
      }

      // lineOutlineSize
      curStats.lineOutlineSize = value =
        options.lineSize - options.lineSize * options.lineOutlineSize * 2;
      if (value !== aplStats.lineOutlineSize) {
        window.traceLog.push('lineOutlineSize=' + value); // [DEBUG/]
        props.lineOutlineMaskShape.style.strokeWidth = aplStats.lineOutlineSize = value;
        props.lineMaskShape.style.strokeWidth = value + SHAPE_GAP * 2;
        update = true;
        if (IS_TRIDENT) {
          // [TRIDENT] lineOutlineMaskCaps is ignored when lineSize is changed
          forceReflowAdd(props.lineOutlineMaskCaps);
          // [TRIDENT] lineOutlineColor is ignored
          forceReflowAdd(props.lineOutlineFace);
        }

        if (props.effect && props.effect.onLineOutlineSize) {
          props.effect.onLineOutlineSize(props, value);
        }
      }

    } else {

      // lineOutlineEnabled
      if (aplStats.lineOutlineEnabled) {
        window.traceLog.push('lineOutlineEnabled=false'); // [DEBUG/]
        aplStats.lineOutlineEnabled = false;
        props.lineOutlineFace.style.display = 'none';
        update = true;

        if (props.effect && props.effect.onLineOutlineEnabled) {
          props.effect.onLineOutlineEnabled(props, false);
        }
      }
    }
    props.curMask.lineOutlineEnabled = options.lineOutlineEnabled;
    return update;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updatePlugOutline(props) {
    var options = props.options, update = false,
      curStats = props.curPlugOutline, aplStats = props.aplPlugOutline;

    if (props.curPlug.plugsEnabled) {

      [0, 1].forEach(function(i) {
        var plugId = curStats.plugSE[i], symbolConf, value;

        if ((curStats.plugOutlineEnabledSE[i] =
            plugId !== PLUG_BEHIND && options.plugOutlineEnabledSE[i])) {
          symbolConf = SYMBOLS[PLUG_2_SYMBOL[plugId]];

          // plugOutlineEnabledSE
          if (!aplStats.plugOutlineEnabledSE[i]) {
            window.traceLog.push('plugOutlineEnabledSE[' + i + ']=true'); // [DEBUG/]
            aplStats.plugOutlineEnabledSE[i] = true;
            props.plugFaceSE[i].style.mask = 'url(#' + props.plugMaskIdSE[i] + ')';
            props.plugOutlineFaceSE[i].style.display = 'inline';
            update = true;

            if (props.effect && props.effect.onPlugSE) {
              props.effect.onPlugSE(props, plugId, i);
            }
          }

          // plugSE
          if (plugId !== aplStats.plugSE[i]) {
            window.traceLog.push('plugSE[' + i + ']=' + plugId); // [DEBUG/]
            aplStats.plugSE[i] = plugId;
            props.plugOutlineFaceSE[i].href.baseVal =
              props.plugMaskShapeSE[i].href.baseVal =
              props.plugOutlineMaskShapeSE[i].href.baseVal = '#' + symbolConf.elmId;
            [props.plugMaskSE[i], props.plugOutlineMaskSE[i]].forEach(function(mask) {
              mask.x.baseVal.value = symbolConf.bBox.left;
              mask.y.baseVal.value = symbolConf.bBox.top;
              mask.width.baseVal.value = symbolConf.bBox.width;
              mask.height.baseVal.value = symbolConf.bBox.height;
            });
            update = true;

            if (props.effect && props.effect.onPlugOutlineEnabledSE) {
              props.effect.onPlugOutlineEnabledSE(props, true, i);
            }
          }

          // plugOutlineColorSE
          curStats.plugOutlineColorSE[i] = value =
            options.plugOutlineColorSE[i] || options.lineOutlineColor;
          if (value !== aplStats.plugOutlineColorSE[i]) {
            window.traceLog.push('plugOutlineColorSE[' + i + ']=' + value); // [DEBUG/]
            curStats.plugOutlineColorTraSE[i] = getAlpha(value) < 1;
            props.plugOutlineFaceSE[i].style.fill = aplStats.plugOutlineColorSE[i] = value;
            update = true;

            if (props.effect && props.effect.onPlugOutlineColorSE) {
              props.effect.onPlugOutlineColorSE(props, value, i);
            }
          }

          // plugOutlineSizeSE
          curStats.plugOutlineSizeSE[i] = options.plugOutlineSizeSE[i];
          if (curStats.plugOutlineSizeSE[i] > symbolConf.outlineMax) {
            curStats.plugOutlineSizeSE[i] = symbolConf.outlineMax;
          }
          curStats.plugOutlineSizeSE[i] *= symbolConf.outlineBase * 2;
          if ((value = curStats.plugOutlineSizeSE[i]) !== aplStats.plugOutlineSizeSE[i]) {
            window.traceLog.push('plugOutlineSizeSE[' + i + ']=' + value); // [DEBUG/]
            props.plugOutlineMaskShapeSE[i].style.strokeWidth = aplStats.plugOutlineSizeSE[i] = value;
            props.plugMaskShapeSE[i].style.strokeWidth =
              value - SHAPE_GAP / (options.lineSize / DEFAULT_OPTIONS.lineSize) / options.plugSizeSE[i] * 2;
            update = true;

            if (props.effect && props.effect.onPlugOutlineSizeSE) {
              props.effect.onPlugOutlineSizeSE(props, value, i);
            }
          }

        } else if (plugId !== PLUG_BEHIND) { // disable plugOutline only when plug is enabled

          // plugOutlineEnabledSE
          if (aplStats.plugOutlineEnabledSE[i]) {
            window.traceLog.push('plugOutlineEnabledSE[' + i + ']=false'); // [DEBUG/]
            aplStats.plugOutlineEnabledSE[i] = false;
            props.plugFaceSE[i].style.mask = 'none';
            props.plugOutlineFaceSE[i].style.display = 'none';
            update = true;

            if (props.effect && props.effect.onPlugOutlineEnabledSE) {
              props.effect.onPlugOutlineEnabledSE(props, plugId, i);
            }
          }
        }
      });

    } else {
      curStats.plugOutlineEnabledSE[0] = curStats.plugOutlineEnabledSE[1] = false;
    }
    return update;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updatePosition(props) {
    window.traceLog.push('<position>'); // [DEBUG/]
    var options = props.options, update = false,
      curStats = props.curPosition,
      curStatsSocketXYSE = curStats.socketXYSE,
      curCapsMaskAnchor = props.curCapsMaskAnchor,
      anchorBBoxSE, pathList;

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

    anchorBBoxSE = [0, 1].map(function(i) {
      var anchorBBox = getBBoxNest(options.anchorSE[i], props.baseWindow);
      ['x', 'y', 'width', 'height'].forEach(function(boxKey) {
        curCapsMaskAnchor[boxKey + 'SE'][i] = anchorBBox[BBOX_PROP[boxKey]];
      });
      return anchorBBox;
    });

    // Decide each socket
    (function() {
      var socketXYsWk, socketsLenMin = -1, iFix, iAuto;
      if (options.socketSE[0] && options.socketSE[1]) {
        curStatsSocketXYSE[0] = getSocketXY(anchorBBoxSE[0], options.socketSE[0]);
        curStatsSocketXYSE[1] = getSocketXY(anchorBBoxSE[1], options.socketSE[1]);

      } else if (!options.socketSE[0] && !options.socketSE[1]) {
        socketXYsWk = SOCKET_IDS.map(function(socketId) { return getSocketXY(anchorBBoxSE[1], socketId); });
        SOCKET_IDS.map(function(socketId) { return getSocketXY(anchorBBoxSE[0], socketId); })
          .forEach(function(socketXY0) {
            socketXYsWk.forEach(function(socketXY1) {
              var len = getPointsLength(socketXY0, socketXY1);
              if (len < socketsLenMin || socketsLenMin === -1) {
                curStatsSocketXYSE[0] = socketXY0;
                curStatsSocketXYSE[1] = socketXY1;
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
        curStatsSocketXYSE[iFix] = getSocketXY(anchorBBoxSE[iFix], options.socketSE[iFix]);
        socketXYsWk = SOCKET_IDS.map(function(socketId) { return getSocketXY(anchorBBoxSE[iAuto], socketId); });
        socketXYsWk.forEach(function(socketXY) {
          var len = getPointsLength(socketXY, curStatsSocketXYSE[iFix]);
          if (len < socketsLenMin || socketsLenMin === -1) {
            curStatsSocketXYSE[iAuto] = socketXY;
            socketsLenMin = len;
          }
        });
      }
    })();

    // New position
    if (statsHasChanged(props, 'Position')) {
      window.traceLog.push('new-position'); // [DEBUG/]
      pathList = props.pathList.baseVal = [];

      // Generate path segments
      switch (options.path) {

        case PATH_STRAIGHT:
          pathList.push([socketXY2Point(curStatsSocketXYSE[0]), socketXY2Point(curStatsSocketXYSE[1])]);
          break;

        case PATH_ARC:
          (function() {
            var
              downward =
                typeof options.socketGravitySE[0] === 'number' && options.socketGravitySE[0] > 0 ||
                typeof options.socketGravitySE[1] === 'number' && options.socketGravitySE[1] > 0,
              circle8rad = CIRCLE_8_RAD * (downward ? -1 : 1),
              angle = Math.atan2(curStatsSocketXYSE[1].y - curStatsSocketXYSE[0].y, curStatsSocketXYSE[1].x - curStatsSocketXYSE[0].x),
              cp1Angle = -angle + circle8rad,
              cp2Angle = Math.PI - angle - circle8rad,
              crLen = getPointsLength(curStatsSocketXYSE[0], curStatsSocketXYSE[1]) / Math.sqrt(2) * CIRCLE_CP,
              cp1 = {
                x: curStatsSocketXYSE[0].x + Math.cos(cp1Angle) * crLen,
                y: curStatsSocketXYSE[0].y + Math.sin(cp1Angle) * crLen * -1},
              cp2 = {
                x: curStatsSocketXYSE[1].x + Math.cos(cp2Angle) * crLen,
                y: curStatsSocketXYSE[1].y + Math.sin(cp2Angle) * crLen * -1};
            pathList.push([socketXY2Point(curStatsSocketXYSE[0]), cp1, cp2, socketXY2Point(curStatsSocketXYSE[1])]);
          })();
          break;

        case PATH_FLUID:
        case PATH_MAGNET:
          (/* @EXPORT[file:../test/spec/func/PATH_FLUID]@ */function(socketGravitySE) {
            var cx = [], cy = [];
            curStatsSocketXYSE.forEach(function(socketXY, i) {
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
                anotherSocketXY = curStatsSocketXYSE[i ? 0 : 1];
                overhead = curStats.plugOverheadSE[i];
                minGravity = overhead > 0 ?
                  MIN_OH_GRAVITY + (overhead > MIN_OH_GRAVITY_OH ?
                    (overhead - MIN_OH_GRAVITY_OH) * MIN_OH_GRAVITY_R : 0) :
                  MIN_GRAVITY + (options.lineSize > MIN_GRAVITY_SIZE ?
                    (options.lineSize - MIN_GRAVITY_SIZE) * MIN_GRAVITY_R : 0);
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
            pathList.push([socketXY2Point(curStatsSocketXYSE[0]),
              {x: cx[0], y: cy[0]}, {x: cx[1], y: cy[1]}, socketXY2Point(curStatsSocketXYSE[1])]);
          }/* @/EXPORT@ */)([options.socketGravitySE[0],
            options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
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

            curStatsSocketXYSE.forEach(function(socketXY, i) {
              var dirPoint = socketXY2Point(socketXY),
                len = options.socketGravitySE[i];
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
        curStats.plugOverheadSE.forEach(function(plugOverhead, i) {
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
            socketId = curStatsSocketXYSE[i].socketId;
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

      applyStats(props, 'Position');
      update = true;

      if (props.effect && props.effect.onPosition) {
        props.effect.onPosition(props, pathList);
      }
    }
    return update;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updatePath(props) {
    var update = false, curStatsPathData,
      pathList = props.pathList.baseVal,
      pathEdge = props.curViewBBox.pathEdge;

    // Convert to `pathData`.
    curStatsPathData = props.curPath.pathData = [{type: 'M', values: [pathList[0][0].x, pathList[0][0].y]}];
    pathEdge.x1 = pathEdge.x2 = pathList[0][0].x;
    pathEdge.y1 = pathEdge.y2 = pathList[0][0].y;
    pathList.forEach(function(points) {
      curStatsPathData.push(points.length === 2 ?
        {type: 'L', values: [points[1].x, points[1].y]} :
        {type: 'C', values: [points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y]});
      points.forEach(function(point) {
        if (point.x < pathEdge.x1) { pathEdge.x1 = point.x; }
        if (point.x > pathEdge.x2) { pathEdge.x2 = point.x; }
        if (point.y < pathEdge.y1) { pathEdge.y1 = point.y; }
        if (point.y > pathEdge.y2) { pathEdge.y2 = point.y; }
      });
    });

    // Apply `pathData`
    if (statsHasChanged(props, 'Path')) {
      window.traceLog.push('setPathData'); // [DEBUG/]
      props.linePath.setPathData(curStatsPathData);
      props.aplPath.pathData = curStatsPathData;
      update = true;

      if (IS_TRIDENT) {
        // [TRIDENT] markerOrient is not updated when path is changed
        forceReflowAdd(props.plugsFace);
        // [TRIDENT] lineMaskCaps is ignored when path is changed
        forceReflowAdd(props.lineMaskCaps);
      } else if (IS_GECKO) {
        // [GECKO] path is not updated when path is changed
        forceReflowAdd(props.linePath);
      }

      if (props.effect && props.effect.onSetPathData) {
        props.effect.onSetPathData(props, pathList);
      }
    }
    return update;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updateViewBBox(props) {
    var update = false, curStats = props.curViewBBox, aplStats = props.aplViewBBox,
      curStatsPathEdge = curStats.pathEdge,
      padding = Math.max(props.options.lineSize / 2,
        curStats.plugBCircleSE[0] || 0, curStats.plugBCircleSE[1] || 0),
      // Expand bBox with `line` or symbols
      pointsVal = {
        x1: curStatsPathEdge.x1 - padding,
        y1: curStatsPathEdge.y1 - padding,
        x2: curStatsPathEdge.x2 + padding,
        y2: curStatsPathEdge.y2 + padding
      },
      curMask = props.curMask,
      viewBox = props.svg.viewBox.baseVal, styles = props.svg.style;

    curStats.x = curMask.lineMaskX = curMask.lineOutlineMaskX = curMask.maskBGRectX = pointsVal.x1;
    curStats.y = curMask.lineMaskY = curMask.lineOutlineMaskY = curMask.maskBGRectY = pointsVal.y1;
    curStats.width = pointsVal.x2 - pointsVal.x1;
    curStats.height = pointsVal.y2 - pointsVal.y1;

    ['x', 'y', 'width', 'height'].forEach(function(boxKey) {
      var value;
      if ((value = curStats[boxKey]) !== aplStats[boxKey]) {
        window.traceLog.push('viewBox.' + boxKey); // [DEBUG/]
        viewBox[boxKey] = aplStats[boxKey] = value;
        styles[BBOX_PROP[boxKey]] = value +
          (boxKey === 'x' || boxKey === 'y' ? props.bodyOffset[boxKey] : 0) + 'px';
        update = true;
      }
    });
    return update;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updateMask(props) {
    var update = false, curMask = props.curMask, aplMask = props.aplMask,
      curCapsMaskAnchor = props.curCapsMaskAnchor, aplCapsMaskAnchor = props.aplCapsMaskAnchor,
      curCapsMaskMarker = props.curCapsMaskMarker, aplCapsMaskMarker = props.aplCapsMaskMarker,
      curPlug = props.curPlug,
      curPlugOutline = props.curPlugOutline,
      lineMaskBGEnabled, value;

    if (curPlug.plugsEnabled) {
      [0, 1].forEach(function(i) {
        curCapsMaskMarker.enabledSE[i] =
          curCapsMaskMarker.plugSE[i] !== PLUG_BEHIND && curPlug.plugColorTraSE[i] ||
          curPlugOutline.plugOutlineEnabledSE[i] && curPlugOutline.plugOutlineColorTraSE[i];
      });
    } else {
      curCapsMaskMarker.enabledSE[0] = curCapsMaskMarker.enabledSE[1] = false;
    }
    curMask.capsMarkersEnabled = curCapsMaskMarker.enabledSE[0] || curCapsMaskMarker.enabledSE[1];
    curMask.capsEnabled = curMask.capsMarkersEnabled ||
      curCapsMaskAnchor.enabledSE[0] || curCapsMaskAnchor.enabledSE[1];
    curMask.lineMaskEnabled = curMask.capsEnabled || curMask.lineOutlineEnabled;
    lineMaskBGEnabled = curMask.lineMaskEnabled && !curMask.lineOutlineEnabled;

    // maskBGRect
    if (lineMaskBGEnabled || curMask.lineOutlineEnabled) {
      ['x', 'y'].forEach(function(boxKey) {
        var statKey = 'maskBGRect' + boxKey.toUpperCase();
        if ((value = curMask[statKey]) !== aplMask[statKey]) {
          window.traceLog.push('maskBGRect.' + boxKey); // [DEBUG/]
          props.maskBGRect[boxKey].baseVal.value = aplMask[statKey] = value;
          update = true;
        }
      });
    }

    if (curMask.lineMaskEnabled) { // Includes `lineOutlineEnabled`

      // Switch lineMask when it is shown.
      if ((value = curMask.lineOutlineEnabled) !== aplMask.lineOutlineEnabled) {
        window.traceLog.push('lineOutlineEnabled=' + value); // [DEBUG/]
        if ((aplMask.lineOutlineEnabled = value)) {
          props.lineMaskBG.style.display = 'none';
          props.lineMaskShape.style.display = 'inline';
        } else {
          props.lineMaskBG.style.display = 'inline';
          props.lineMaskShape.style.display = 'none';
        }
        update = true;
      }

      if (curMask.capsEnabled) {

        // capsEnabled
        if (!aplMask.capsEnabled) {
          window.traceLog.push('capsEnabled=true'); // [DEBUG/]
          aplMask.capsEnabled = true;
          props.lineMaskCaps.style.display = props.lineOutlineMaskCaps.style.display = 'inline';
          update = true;
        }

        // CapsMaskAnchor
        [0, 1].forEach(function(i) {
          if (curCapsMaskAnchor.enabledSE[i]) {
            if (!aplCapsMaskAnchor.enabledSE[i]) {
              window.traceLog.push('CapsMaskAnchor.enabledSE[' + i + ']=true'); // [DEBUG/]
              aplCapsMaskAnchor.enabledSE[i] = true;
              props.capsMaskAnchorSE[i].style.display = 'inline';
              update = true;
            }
            ['x', 'y', 'width', 'height'].forEach(function(boxKey) {
              var statKey = boxKey + 'SE';
              if ((value = curCapsMaskAnchor[statKey][i]) !== aplCapsMaskAnchor[statKey][i]) {
                window.traceLog.push('CapsMaskAnchor.' + boxKey + '[' + i + ']'); // [DEBUG/]
                props.capsMaskAnchorSE[i][boxKey].baseVal.value = aplCapsMaskAnchor[statKey][i] = value;
                update = true;
              }
            });
          } else if (aplCapsMaskAnchor.enabledSE[i]) {
            window.traceLog.push('CapsMaskAnchor.enabledSE[' + i + ']=false'); // [DEBUG/]
            aplCapsMaskAnchor.enabledSE[i] = false;
            props.capsMaskAnchorSE[i].style.display = 'none';
            update = true;
          }
        });

        if (curMask.capsMarkersEnabled) {

          // capsMarkersEnabled
          if (!aplMask.capsMarkersEnabled) {
            window.traceLog.push('capsMarkersEnabled=true'); // [DEBUG/]
            aplMask.capsMarkersEnabled = true;
            props.capsMaskLine.style.display = 'inline';
            update = true;
          }

          // CapsMaskMarker
          [0, 1].forEach(function(i) {
            var plugId, symbolConf, marker;

            if (curCapsMaskMarker.enabledSE[i]) {
              plugId = curCapsMaskMarker.plugSE[i];
              symbolConf = SYMBOLS[PLUG_2_SYMBOL[plugId]];
              marker = getMarkerProps(i, symbolConf);

              if (!aplCapsMaskMarker.enabledSE[i] || plugId !== aplCapsMaskMarker.plugSE[i]) {
                window.traceLog.push('CapsMaskMarker.enabledSE[' + i + ']=true'); // [DEBUG/]
                window.traceLog.push('plugSE[' + i + ']=' + plugId); // [DEBUG/]
                aplCapsMaskMarker.enabledSE[i] = true;
                aplCapsMaskMarker.plugSE[i] = plugId;
                props.capsMaskMarkerShapeSE[i].href.baseVal = '#' + symbolConf.elmId;
                props.capsMaskLine.style[marker.prop] = 'url(#' + props.lineMaskMarkerIdSE[i] + ')';
                setMarkerOrient(props.capsMaskMarkerSE[i], marker.orient,
                  symbolConf.bBox, props.svg, props.capsMaskMarkerShapeSE[i], props.capsMaskLine);
                update = true;
                if (IS_GECKO) {
                  // [GECKO] plugsFace is not updated when plugSE is changed
                  forceReflowAdd(props.capsMaskLine);
                  forceReflowAdd(props.lineFace);
                }
              }

              [['markerWidth', 'widthSE'], ['markerHeight', 'heightSE']].forEach(function(markerStatKey) {
                var markerKey = markerStatKey[0], statKey = markerStatKey[1];
                if ((value = curCapsMaskMarker[statKey][i]) !== aplCapsMaskMarker[statKey][i]) {
                  window.traceLog.push('CapsMaskMarker.' + statKey + '[' + i + ']'); // [DEBUG/]
                  props.capsMaskMarkerSE[i][markerKey].baseVal.value = aplCapsMaskMarker[statKey][i] = value;
                  update = true;
                }
              });

            } else if (aplCapsMaskMarker.enabledSE[i]) {
              window.traceLog.push('CapsMaskMarker.enabledSE[' + i + ']=false'); // [DEBUG/]
              aplCapsMaskMarker.enabledSE[i] = false;
              marker = getMarkerProps(i);
              props.capsMaskLine.style[marker.prop] = 'none';
              update = true;
            }
          });

        } else if (aplMask.capsMarkersEnabled) {
          // capsMarkersEnabled
          window.traceLog.push('capsMarkersEnabled=false'); // [DEBUG/]
          aplMask.capsMarkersEnabled = false;
          props.capsMaskLine.style.display = 'none';
          update = true;
        }

      } else if (aplMask.capsEnabled) {
        // capsEnabled
        window.traceLog.push('capsEnabled=false'); // [DEBUG/]
        aplMask.capsEnabled = false;
        props.lineMaskCaps.style.display = props.lineOutlineMaskCaps.style.display = 'none';
        update = true;
      }

      // lineMask
      if (!aplMask.lineMaskEnabled) {
        window.traceLog.push('lineMaskEnabled=true'); // [DEBUG/]
        aplMask.lineMaskEnabled = true;
        props.lineFace.style.mask = 'url(#' + props.lineMaskId + ')';
        update = true;
      }
      ['x', 'y'].forEach(function(boxKey) {
        var statKey = 'lineMask' + boxKey.toUpperCase();
        if ((value = curMask[statKey]) !== aplMask[statKey]) {
          window.traceLog.push('lineMask.' + boxKey); // [DEBUG/]
          props.lineMask[boxKey].baseVal.value = aplMask[statKey] = value;
          update = true;
        }
      });

    } else if (aplMask.lineMaskEnabled) {
      // lineMask
      window.traceLog.push('lineMaskEnabled=false'); // [DEBUG/]
      aplMask.lineMaskEnabled = false;
      props.lineFace.style.mask = 'none';
      update = true;
    }

    // lineOutlineMask
    if (curMask.lineOutlineEnabled) {
      ['x', 'y'].forEach(function(boxKey) {
        var statKey = 'lineOutlineMask' + boxKey.toUpperCase();
        if ((value = curMask[statKey]) !== aplMask[statKey]) {
          window.traceLog.push('lineOutlineMask.' + boxKey); // [DEBUG/]
          props.lineOutlineMask[boxKey].baseVal.value = aplMask[statKey] = value;
          update = true;
        }
      });
    }
    return update;
  }

  /**
   * Apply all of `effect`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {void}
   */
  function setEffect(props) {
    window.traceLog.push('<setEffect>'); // [DEBUG/]
    var options = props.options,
      effectConf, effectParams;

    if (options.effect) {
      effectConf = EFFECTS[options.effect[0]];
      effectParams = options.effect[1];
      if (props.effect && effectConf !== props.effect) { props.effect.remove(props); }
      effectConf.init(props, effectParams);
      props.effect = effectConf;
      props.effectParams = effectParams;
    } else if (props.effect) { // Since it might have been called by `bindWindow`, check `props.effect`.
      props.effect.remove(props);
      props.effect = null;
      props.effectParams = {};
    }
  }

  /**
   * @class
   * @param {Element} [start] - Alternative to `options.start`.
   * @param {Element} [end] - Alternative to `options.end`.
   * @param {Object} [options] - Initial options.
   */
  function LeaderLine(start, end, options) {
    var that = this,
      props = { // Initialize properties as array.
        options: {anchorSE: [], socketSE: [], socketGravitySE: [], plugSE: [], plugColorSE: [], plugSizeSE: [],
          plugOutlineEnabledSE: [], plugOutlineColorSE: [], plugOutlineSizeSE: []}
      },
      prefix;

    function createSetter(name) {
      return function(value) {
        var options = {};
        options[name] = value;
        that.setOptions(options);
      };
    }

    function copyTree(obj) {
      return !obj ? obj :
        isObject(obj) ? Object.keys(obj).reduce(function(copyObj, key) {
          copyObj[key] = copyTree(obj[key]);
          return copyObj;
        }, {}) :
        Array.isArray(obj) ? obj.map(copyTree) : obj;
    }
    window.copyTree = copyTree; // [DEBUG/]

    Object.defineProperty(this, '_id', {value: insId++});
    insProps[this._id] = props;

    prefix = APP_ID + '-' + this._id;
    props.linePathId = prefix + '-line-path';
    props.lineShapeId = prefix + '-line-shape';
    props.lineMaskId = prefix + '-line-mask';
    props.lineMaskMarkerIdSE = [prefix + '-caps-mask-marker-0', prefix + '-caps-mask-marker-1'];
    props.capsId = prefix + '-caps';
    props.maskBGRectId = prefix + '-mask-bg-rect';
    props.lineOutlineMaskId = prefix + '-line-outline-mask';
    props.plugMarkerIdSE = [prefix + '-plug-marker-0', prefix + '-plug-marker-1'];
    props.plugMaskIdSE = [prefix + '-plug-mask-0', prefix + '-plug-mask-1'];
    props.plugOutlineMaskIdSE = [prefix + '-plug-outline-mask-0', prefix + '-plug-outline-mask-1'];

    if (arguments.length === 1) {
      options = start;
      start = null;
    }
    options = options || {};
    if (start) { options.start = start; }
    if (end) { options.end = end; }
    this.setOptions(options);

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
        var name = conf[0], optionName = conf[1], i = conf[2];
        Object.defineProperty(that, name, {
          get: function() {
            var value = // Don't use closure.
              i != null ? insProps[that._id].options[optionName][i] : // eslint-disable-line eqeqeq
              optionName ? insProps[that._id].options[optionName] :
              insProps[that._id].options[name];
            return value == null ? KEYWORD_AUTO : copyTree(value); // eslint-disable-line eqeqeq
          },
          set: createSetter(name),
          enumerable: true
        });
      });
    // Setup option accessor methods (key-to-id)
    [['path', PATH_KEY_2_ID],
        ['startSocket', SOCKET_KEY_2_ID, 'socketSE', 0], ['endSocket', SOCKET_KEY_2_ID, 'socketSE', 1],
        ['startPlug', PLUG_KEY_2_ID, 'plugSE', 0], ['endPlug', PLUG_KEY_2_ID, 'plugSE', 1]]
      .forEach(function(conf) {
        var name = conf[0], key2Id = conf[1], optionName = conf[2], i = conf[3];
        Object.defineProperty(that, name, {
          get: function() {
            var value = optionName ? // Don't use closure.
              insProps[that._id].options[optionName][i] :
              insProps[that._id].options[name],
              key;
            return !value ? KEYWORD_AUTO :
              Object.keys(key2Id).some(function(optKey) {
                if (key2Id[optKey] === value) { key = optKey; return true; }
                return false;
              }) ? key : new Error('It\'s broken');
          },
          set: createSetter(name),
          enumerable: true
        });
      });
    // Setup option accessor methods (*effect) e.g. ['startPlugEffect', 'plugEffectSE', 0]
    [['effect']]
      .forEach(function(conf) {
        var name = conf[0], optionName = conf[1], i = conf[2];
        Object.defineProperty(that, name, {
          get: function() {
            var value = // Don't use closure.
              i != null ? insProps[that._id].options[optionName][i] : // eslint-disable-line eqeqeq
              optionName ? insProps[that._id].options[optionName] :
              insProps[that._id].options[name];
            return value ? [value[0], copyTree(value[1])] : void 0;
          },
          set: createSetter(name),
          enumerable: true
        });
      });
  }

  /**
   * @param {Object} newOptions - New options.
   * @returns {void}
   */
  LeaderLine.prototype.setOptions = function(newOptions) {
    window.traceLog.push('<setOptions>'); // [DEBUG/]
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
    */
    var props = insProps[this._id], options = props.options,
      newWindow, needsWindow,
      needsLine, needsPlug, needsLineOutline, needsPlugOutline, needsPosition,
      /* eslint-disable no-unused-vars */
      updatedLine, updatedPlug, updatedLineOutline, updatedPlugOutline, updatedPosition,
      updatedPath, updatedViewBBox, updatedMask,
      /* eslint-enable no-unused-vars */
      needsEffect;

    function getCurOption(name, optionName, index) {
      var curOption = {};
      if (optionName) {
        if (index != null) { // eslint-disable-line eqeqeq
          curOption.container = options[optionName];
          curOption.key = index;
          curOption.default = DEFAULT_OPTIONS[optionName] && DEFAULT_OPTIONS[optionName][index];
        } else {
          curOption.container = options;
          curOption.key = optionName;
          curOption.default = DEFAULT_OPTIONS[optionName];
        }
      } else {
        curOption.container = options;
        curOption.key = name;
        curOption.default = DEFAULT_OPTIONS[name];
      }
      curOption.acceptsAuto = curOption.default == null; // eslint-disable-line eqeqeq
      return curOption;
    }

    function setValidId(name, key2Id, optionName, index) {
      var curOption = getCurOption(name, optionName, index), update, key, id;
      if (newOptions[name] != null && // eslint-disable-line eqeqeq
          (key = (newOptions[name] + '').toLowerCase()) && (
            curOption.acceptsAuto && key === KEYWORD_AUTO ||
            (id = key2Id[key])
          ) && id !== curOption.container[curOption.key]) {
        curOption.container[curOption.key] = id; // `undefined` when `KEYWORD_AUTO`
        update = true;
      }
      if (curOption.container[curOption.key] == null && !curOption.acceptsAuto) { // eslint-disable-line eqeqeq
        curOption.container[curOption.key] = curOption.default;
        update = true;
      }
      return update;
    }

    function setValidType(name, type, optionName, index, check) {
      var curOption = getCurOption(name, optionName, index), update, value;
      if (!type) {
        if (curOption.default == null) { throw new Error('Invalid `type`: ' + name); } // eslint-disable-line eqeqeq
        type = typeof curOption.default;
      }
      if (newOptions[name] != null && ( // eslint-disable-line eqeqeq
            curOption.acceptsAuto && (newOptions[name] + '').toLowerCase() === KEYWORD_AUTO ||
            typeof (value = newOptions[name]) === type && (!check || check(value))
          ) && value !== curOption.container[curOption.key]) {
        curOption.container[curOption.key] = value; // `undefined` when `KEYWORD_AUTO`
        update = true;
      }
      if (curOption.container[curOption.key] == null && !curOption.acceptsAuto) { // eslint-disable-line eqeqeq
        curOption.container[curOption.key] = curOption.default;
        update = true;
      }
      return update;
    }

    function trimString(value) {
      return typeof value === 'string' && value ? value.trim() : value;
    }

    newOptions = newOptions || {};

    // anchorSE
    [newOptions.start, newOptions.end].forEach(function(newOption, i) {
      if (newOption && newOption.nodeType != null && // eslint-disable-line eqeqeq
          newOption !== options.anchorSE[i]) {
        options.anchorSE[i] = newOption;
        needsWindow = needsPosition = true;
      }
    });
    if (!options.anchorSE[0] || !options.anchorSE[1] || options.anchorSE[0] === options.anchorSE[1]) {
      throw new Error('`start` and `end` are required.');
    }

    // Check window.
    if (needsWindow &&
        (newWindow = getCommonWindow(options.anchorSE[0], options.anchorSE[1])) !== props.baseWindow) {
      bindWindow(props, newWindow);
      needsLine = needsPlug = needsLineOutline = needsPlugOutline = needsEffect = true;
    }

    needsPosition = setValidId('path', PATH_KEY_2_ID) || needsPosition;
    needsPosition = setValidId('startSocket', SOCKET_KEY_2_ID, 'socketSE', 0) || needsPosition;
    needsPosition = setValidId('endSocket', SOCKET_KEY_2_ID, 'socketSE', 1) || needsPosition;

    // socketGravitySE
    [newOptions.startSocketGravity, newOptions.endSocketGravity].forEach(function(newOption, i) {

      function matchArray(array1, array2) {
        return array1.legth === array2.legth &&
          array1.every(function(value1, i) { return value1 === array2[i]; });
      }

      var value = false; // `false` means no-update input.
      if (newOption != null) { // eslint-disable-line eqeqeq
        if (Array.isArray(newOption)) {
          if (typeof newOption[0] === 'number' && typeof newOption[1] === 'number') {
            value = [newOption[0], newOption[1]];
            if (Array.isArray(options.socketGravitySE[i]) &&
              matchArray(value, options.socketGravitySE[i])) { value = false; }
          }
        } else {
          if ((newOption + '').toLowerCase() === KEYWORD_AUTO) {
            value = null;
          } else if (typeof newOption === 'number' && newOption >= 0) {
            value = newOption;
          }
          if (value === options.socketGravitySE[i]) { value = false; }
        }
        if (value !== false) {
          options.socketGravitySE[i] = value;
          needsPosition = true;
        }
      }
    });

    // Line
    if (setValidType('color', null, 'lineColor')) {
      options.lineColor = trimString(options.lineColor);
      needsLine = true;
    }
    needsLine = setValidType('size', null, 'lineSize', null,
      function(value) { return value > 0; }) || needsLine;

    // Plug
    ['startPlug', 'endPlug'].forEach(function(name, i) {
      needsPlug = setValidId(name, PLUG_KEY_2_ID, 'plugSE', i) || needsPlug;
      if (setValidType(name + 'Color', 'string', 'plugColorSE', i)) {
        options.plugColorSE[i] = trimString(options.plugColorSE[i]);
        needsPlug = true;
      }
      needsPlug = setValidType(name + 'Size', null, 'plugSizeSE', i,
        function(value) { return value > 0; }) || needsPlug;
    });

    // LineOutline
    needsLineOutline = setValidType('outline', null, 'lineOutlineEnabled') || needsLineOutline;
    if (setValidType('outlineColor', null, 'lineOutlineColor')) {
      options.lineOutlineColor = trimString(options.lineOutlineColor);
      needsLineOutline = true;
    }
    needsLineOutline = setValidType('outlineSize', null, 'lineOutlineSize', null,
      function(value) { return value > 0 && value <= 0.48; }) || needsLineOutline;

    // PlugOutline
    ['startPlugOutline', 'endPlugOutline'].forEach(function(name, i) {
      needsPlugOutline = setValidType(name, null, 'plugOutlineEnabledSE', i) || needsPlugOutline;
      if (setValidType(name + 'Color', 'string', 'plugOutlineColorSE', i)) {
        options.plugOutlineColorSE[i] = trimString(options.plugOutlineColorSE[i]);
        needsPlugOutline = true;
      }
      // `outlineMax` is checked in `updatePlugOutline`.
      needsPlugOutline = setValidType(name + 'Size', null, 'plugOutlineSizeSE', i,
        function(value) { return value >= 1; }) || needsPlugOutline;
    });

    // effect
    (function() {
      var effectName, effectParams;
      if (newOptions.hasOwnProperty('effect')) {
        if (newOptions.effect) {
          if (typeof newOptions.effect === 'string') {
            effectName = newOptions.effect;
            effectParams = {};
          } else if (Array.isArray(newOptions.effect) && typeof newOptions.effect[0] === 'string') {
            effectName = newOptions.effect[0];
            effectParams = newOptions.effect[1] || {};
          }
          if (EFFECTS[effectName]) {
            effectParams = EFFECTS[effectName].validParams(props, effectParams);
            if (!options.effect || effectName !== options.effect[0] ||
                hasChanged(options.effect[1], effectParams)) {
              options.effect = [effectName, effectParams];
              needsEffect = true;
            }
          }
        } else if (options.effect) { // on -> off
          options.effect = null;
          needsEffect = true;
        }
      }
    })();

    if (needsLine) {
      updatedLine = updateLine(props);
    }
    if (needsPlug || updatedLine) {
      updatedPlug = updatePlug(props);
    }
    if (needsLineOutline || updatedLine) {
      updatedLineOutline = updateLineOutline(props);
    }
    if (needsPlugOutline || updatedLine || updatedPlug || updatedLineOutline) {
      updatedPlugOutline = updatePlugOutline(props);
    }
    if ((needsPosition || updatedLine || updatedPlug) && (updatedPosition = updatePosition(props))) {
      updatedPath = updatePath(props);
    }
    updatedViewBBox = updateViewBBox(props);
    updatedMask = updateMask(props);
    if (needsEffect) {
      setEffect(props);
    }

    if (IS_BLINK && updatedLine && !updatedPath) {
      // [BLINK] lineSize is not updated when path is not changed
      forceReflowAdd(props.lineShape);
    }
    forceReflowApply();

    return this;
  };

  LeaderLine.prototype.position = function() {
    var props = insProps[this._id];
    if (updatePosition(props)) { updatePath(props); }
    updateViewBBox(props);
    updateMask(props);
    return this;
  };

  LeaderLine.prototype.remove = function() {
    window.traceLog.push('<remove>'); // [DEBUG/]
    var props = insProps[this._id];
    if (props.baseWindow && props.svg) {
      props.baseWindow.document.body.removeChild(props.svg);
    }
    delete insProps[this._id];
  };

  return LeaderLine;
})();
