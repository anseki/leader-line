/*
 * LeaderLine
 * https://github.com/anseki/leader-line
 *
 * Copyright (c) 2016 anseki
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
     * @typedef {{hasSE, hasProps, hasChanged}} StatConf
     */

    /**
     * @typedef {{group: {name: StatConf}}} StatConfGroups
     */

    STATS = {
      line_altColor: {}, line_color: {}, line_colorTra: {}, line_strokeWidth: {},
      plug_enabled: {}, plug_enabledSE: {hasSE: true},
      plug_plugSE: {hasSE: true},
      plug_colorSE: {hasSE: true}, plug_colorTraSE: {hasSE: true},
      plug_markerWidthSE: {hasSE: true}, plug_markerHeightSE: {hasSE: true},
      lineOutline_enabled: {},
      lineOutline_color: {}, lineOutline_colorTra: {},
      lineOutline_strokeWidth: {}, lineOutline_inStrokeWidth: {},
      plugOutline_enabledSE: {hasSE: true},
      plugOutline_plugSE: {hasSE: true},
      plugOutline_colorSE: {hasSE: true}, plugOutline_colorTraSE: {hasSE: true},
      plugOutline_strokeWidthSE: {hasSE: true}, plugOutline_inStrokeWidthSE: {hasSE: true},
      position_socketXYSE: {hasSE: true, hasProps: true}, position_plugOverheadSE: {hasSE: true},
      position_path: {}, position_lineStrokeWidth: {}, position_socketGravitySE: {hasSE: true},
      path_pathData: {},
      viewBox_bBox: {hasProps: true},
      viewBox_plugBCircleSE: {hasSE: true}, viewBox_pathEdge: {hasProps: true},
      lineMask_enabled: {},
      lineMask_outlineMode: {},
      lineMask_x: {}, lineMask_y: {},
      lineOutlineMask_x: {}, lineOutlineMask_y: {},
      maskBGRect_x: {}, maskBGRect_y: {},
      capsMaskAnchor_enabledSE: {hasSE: true},
      capsMaskAnchor_bBoxSE: {hasSE: true, hasProps: true},
      capsMaskMarker_enabled: {}, capsMaskMarker_enabledSE: {hasSE: true},
      capsMaskMarker_plugSE: {hasSE: true},
      capsMaskMarker_markerWidthSE: {hasSE: true}, capsMaskMarker_markerHeightSE: {hasSE: true},
      caps_enabled: {}
    },

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
          traceLog.add('<EFFECTS.dash.init>'); // [DEBUG/]
          props.lineFace.style.strokeDasharray =
            (effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' +
            (effectParams.gapLen || EFFECTS.dash.getGapLen(props));
          props.lineFace.style.strokeDashoffset = '0';
          traceLog.add('strokeDasharray=' + (effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' + (effectParams.gapLen || EFFECTS.dash.getGapLen(props))); // [DEBUG/]
          traceLog.add('</EFFECTS.dash.init>'); // [DEBUG/]
        },
        remove: function(props) {
          traceLog.add('<EFFECTS.dash.remove>'); // [DEBUG/]
          props.lineFace.style.strokeDasharray = 'none';
          props.lineFace.style.strokeDashoffset = '0';
          traceLog.add('</EFFECTS.dash.remove>'); // [DEBUG/]
        },
        onSetLine: function(props, setProps) {
          traceLog.add('<EFFECTS.dash.onSetLine>'); // [DEBUG/]
          if ((!setProps || setProps.indexOf('lineSize') > -1) &&
              (!props.effectParams.dashLen || !props.effectParams.gapLen)) {
            props.lineFace.style.strokeDasharray =
              (props.effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' +
              (props.effectParams.gapLen || EFFECTS.dash.getGapLen(props));
            traceLog.add('strokeDasharray=' + (props.effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' + (props.effectParams.gapLen || EFFECTS.dash.getGapLen(props))); // [DEBUG/]
          }
          traceLog.add('</EFFECTS.dash.onSetLine>'); // [DEBUG/]
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
          traceLog.add('<EFFECTS.dashAnim.init>'); // [DEBUG/]
          if (props.effectParams && props.effectParams.animId) { anim.remove(props.effectParams.animId); }
          props.lineFace.style.strokeDasharray =
            (effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' +
            (effectParams.gapLen || EFFECTS.dash.getGapLen(props));
          props.lineFace.style.strokeDashoffset = '0';
          traceLog.add('strokeDasharray=' + (effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' + (effectParams.gapLen || EFFECTS.dash.getGapLen(props))); // [DEBUG/]
          // effectParams.animId = animId;
          traceLog.add('</EFFECTS.dashAnim.init>'); // [DEBUG/]
        },
        remove: function(props) {
          traceLog.add('<EFFECTS.dashAnim.remove>'); // [DEBUG/]
          props.lineFace.style.strokeDasharray = 'none';
          props.lineFace.style.strokeDashoffset = '0';
          if (props.effectParams && props.effectParams.animId) { anim.remove(props.effectParams.animId); }
          traceLog.add('</EFFECTS.dashAnim.remove>'); // [DEBUG/]
        },
        onSetLine: function(props, setProps) {
          traceLog.add('<EFFECTS.dashAnim.onSetLine>'); // [DEBUG/]
          if ((!setProps || setProps.indexOf('lineSize') > -1) &&
              (!props.effectParams.dashLen || !props.effectParams.gapLen)) {
            props.lineFace.style.strokeDasharray =
              (props.effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' +
              (props.effectParams.gapLen || EFFECTS.dash.getGapLen(props));
            traceLog.add('strokeDasharray=' + (props.effectParams.dashLen || EFFECTS.dash.getDashLen(props)) + ',' + (props.effectParams.gapLen || EFFECTS.dash.getGapLen(props))); // [DEBUG/]
          }
          traceLog.add('</EFFECTS.dashAnim.onSetLine>'); // [DEBUG/]
        }
      }
    },

    /**
     * @typedef {Object.<_id: number, props>} insProps
     */
    insProps = {}, insId = 0, svg2Supported, forceReflowTargets = [];

  // [DEBUG]
  window.insProps = insProps;
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

  function copyTree(obj) {
    return !obj ? obj :
      isObject(obj) ? Object.keys(obj).reduce(function(copyObj, key) {
        copyObj[key] = copyTree(obj[key]);
        return copyObj;
      }, {}) :
      Array.isArray(obj) ? obj.map(copyTree) : obj;
  }
  window.copyTree = copyTree; // [DEBUG/]

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
   * Setup `baseWindow`, `bodyOffset`, `pathList`,
   *    stats (`cur*` and `apl*`), `effect`, `effectParams`, SVG elements.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Window} newWindow - A common ancestor `window`.
   * @returns {void}
   */
  function bindWindow(props, newWindow) {
    traceLog.add('<bindWindow>'); // [DEBUG/]
    var SVG_NS = 'http://www.w3.org/2000/svg',
      baseDocument = newWindow.document,
      defs, stylesHtml, stylesBody, bodyOffset = {x: 0, y: 0},
      svg, elmDefs, maskCaps, element, aplStats = props.aplStats;

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

    /* reserve for future version
    props.lineFG = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'g'));
    props.lineFG.id = props.lineFGId;
    props.lineFGRect = setWH100(props.lineFG.appendChild(baseDocument.createElementNS(SVG_NS, 'rect')));
    */

    // lineGradient
    props.lineGradient = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'linearGradient'));
    props.lineGradient.id = props.lineGradientId;
    props.lineGradient.gradientUnits.baseVal = SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE;
    props.lineGradientStopSE = [0, 1].map(function(i) {
      var element = props.lineGradient.appendChild(baseDocument.createElementNS(SVG_NS, 'stop'));
      try {
        element.offset.baseVal = i; // offset === index
      } catch (error) {
        if (error.code === DOMException.NO_MODIFICATION_ALLOWED_ERR) {
          // [TRIDENT] bug
          element.setAttribute('offset', i);
        } else {
          throw error;
        }
      }
      return element;
    });

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
    props.plugsFace.style.display = 'none';

    props.svg = baseDocument.body.appendChild(svg);

    props.pathList = {baseVal: [], animVal: []};
    props.effect = null;
    if (props.effectParams && props.effectParams.animId) { anim.remove(props.effectParams.animId); }
    props.effectParams = {};

    // Init stats
    Object.keys(STATS).forEach(function(name) {
      var statConf = STATS[name];
      aplStats[name] = statConf.hasSE ? (statConf.hasProps ? [{}, {}] : []) : statConf.hasProps ? {} : null;
    });
    aplStats.plug_enabled =
      aplStats.plug_enabledSE[0] = aplStats.plug_enabledSE[1] =
      aplStats.lineOutline_enabled =
      aplStats.plugOutline_enabledSE[0] = aplStats.plugOutline_enabledSE[1] =
      aplStats.lineMask_enabled = aplStats.lineMask_outlineMode =
      aplStats.capsMaskAnchor_enabledSE[0] = aplStats.capsMaskAnchor_enabledSE[1] =
      aplStats.capsMaskMarker_enabled =
      aplStats.capsMaskMarker_enabledSE[0] = aplStats.capsMaskMarker_enabledSE[1] =
      aplStats.caps_enabled = false;
    aplStats.plug_plugSE[0] = aplStats.plug_plugSE[1] =
      aplStats.plugOutline_plugSE[0] = aplStats.plugOutline_plugSE[1] =
      aplStats.capsMaskMarker_plugSE[0] = aplStats.capsMaskMarker_plugSE[1] = PLUG_BEHIND;
    traceLog.add('</bindWindow>'); // [DEBUG/]
  }
  window.bindWindow = bindWindow; // [DEBUG/]

  function setStat(props, container, key, value, eventHandlers/* [DEBUG] */, log/* [/DEBUG] */) {
    if (value !== container[key]) {
      traceLog.add(log || key + '=%s', value); // [DEBUG/]
      container[key] = value;
      if (eventHandlers) {
        eventHandlers.forEach(function(handler) { handler(props, value, key); });
      }
      return true;
    }
    return false;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updateLine(props) {
    traceLog.add('<updateLine>'); // [DEBUG/]
    var options = props.options, curStats = props.curStats, events = props.events,
      updated = false;

    updated = setStat(props, curStats, 'line_color', options.lineColor,
      events.cur_line_color) || updated;

    updated = setStat(props, curStats, 'line_colorTra', getAlpha(curStats.line_color) < 1,
      events.cur_line_colorTra) || updated;

    updated = setStat(props, curStats, 'line_strokeWidth', options.lineSize,
      events.cur_line_strokeWidth) || updated;

    if (!updated) { traceLog.add('not-updated'); } // [DEBUG/]
    traceLog.add('</updateLine>'); // [DEBUG/]
    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updatePlug(props) {
    traceLog.add('<updatePlug>'); // [DEBUG/]
    var options = props.options, curStats = props.curStats, events = props.events,
      updated = false;

    [0, 1].forEach(function(i) {
      var plugId = options.plugSE[i], symbolConf,
        width, height, plugMarkerWidth, plugMarkerHeight, value;

      updated = setStat(props, curStats.plug_enabledSE, i, plugId !== PLUG_BEHIND,
        events.cur_plug_enabledSE/* [DEBUG] */, 'plug_enabledSE[' + i + ']=%s'/* [/DEBUG] */) || updated;

      updated = setStat(props, curStats.plug_plugSE, i, plugId,
        events.cur_plug_plugSE/* [DEBUG] */, 'plug_plugSE[' + i + ']=%s'/* [/DEBUG] */) || updated;

      updated = setStat(props, curStats.plug_colorSE, i, (value = options.plugColorSE[i] || curStats.line_color),
        events.cur_plug_colorSE/* [DEBUG] */, 'plug_colorSE[' + i + ']=%s'/* [/DEBUG] */) || updated;

      updated = setStat(props, curStats.plug_colorTraSE, i, getAlpha(value) < 1,
        events.cur_plug_colorTraSE/* [DEBUG] */, 'plug_colorTraSE[' + i + ']=%s'/* [/DEBUG] */) || updated;

      if (plugId !== PLUG_BEHIND) { // Not depend on `curStats.plug_enabledSE`
        symbolConf = SYMBOLS[PLUG_2_SYMBOL[plugId]];
        plugMarkerWidth = width = symbolConf.widthR * options.plugSizeSE[i];
        plugMarkerHeight = height = symbolConf.heightR * options.plugSizeSE[i];

        if (IS_WEBKIT) {
          // [WEBKIT] mask in marker is resized with rasterise
          plugMarkerWidth *= curStats.line_strokeWidth;
          plugMarkerHeight *= curStats.line_strokeWidth;
        }

        updated = setStat(props, curStats.plug_markerWidthSE, i, plugMarkerWidth,
          events.cur_plug_markerWidthSE
          /* [DEBUG] */, 'plug_markerWidthSE[' + i + ']%_'/* [/DEBUG] */) || updated;

        updated = setStat(props, curStats.plug_markerHeightSE, i, plugMarkerHeight,
          events.cur_plug_markerHeightSE
          /* [DEBUG] */, 'plug_markerHeightSE[' + i + ']%_'/* [/DEBUG] */) || updated;

        curStats.capsMaskMarker_markerWidthSE[i] = width;
        curStats.capsMaskMarker_markerHeightSE[i] = height;
      }

      curStats.plugOutline_plugSE[i] = curStats.capsMaskMarker_plugSE[i] = plugId;
      if (curStats.plug_enabledSE[i]) {
        value = curStats.line_strokeWidth / DEFAULT_OPTIONS.lineSize;
        curStats.position_plugOverheadSE[i] = value * symbolConf.overhead * options.plugSizeSE[i];
        curStats.viewBox_plugBCircleSE[i] = value * symbolConf.bCircle * options.plugSizeSE[i];
      } else {
        curStats.position_plugOverheadSE[i] = -(curStats.line_strokeWidth / 2);
        curStats.viewBox_plugBCircleSE[i] = 0;
      }
      curStats.capsMaskAnchor_enabledSE[i] = !curStats.plug_enabledSE[i];
    });

    // It might be independent of `curStats.plug_enabledSE` in future version.
    updated = setStat(props, curStats, 'plug_enabled', curStats.plug_enabledSE[0] || curStats.plug_enabledSE[1],
      events.cur_plug_enabled) || updated;

    if (!updated) { traceLog.add('not-updated'); } // [DEBUG/]
    traceLog.add('</updatePlug>'); // [DEBUG/]
    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updateLineOutline(props) {
    traceLog.add('<updateLineOutline>'); // [DEBUG/]
    var options = props.options, curStats = props.curStats, events = props.events,
      outlineWidth,
      updated = false;

    updated = setStat(props, curStats, 'lineOutline_enabled', options.lineOutlineEnabled,
      events.cur_lineOutline_enabled) || updated;

    updated = setStat(props, curStats, 'lineOutline_color', options.lineOutlineColor,
      events.cur_lineOutline_color) || updated;

    updated = setStat(props, curStats, 'lineOutline_colorTra', getAlpha(curStats.lineOutline_color) < 1,
      events.cur_lineOutline_colorTra) || updated;

    outlineWidth = curStats.line_strokeWidth * options.lineOutlineSize;

    updated = setStat(props, curStats, 'lineOutline_strokeWidth', curStats.line_strokeWidth - outlineWidth * 2,
      events.cur_lineOutline_strokeWidth/* [DEBUG] */, 'lineOutline_strokeWidth%_'/* [/DEBUG] */) || updated;

    updated = setStat(props, curStats, 'lineOutline_inStrokeWidth',
      curStats.lineOutline_colorTra ?
        curStats.lineOutline_strokeWidth + SHAPE_GAP * 2 :
        curStats.line_strokeWidth - outlineWidth, // half
      events.cur_lineOutline_inStrokeWidth/* [DEBUG] */, 'lineOutline_inStrokeWidth%_'/* [/DEBUG] */) || updated;

    if (!updated) { traceLog.add('not-updated'); } // [DEBUG/]
    traceLog.add('</updateLineOutline>'); // [DEBUG/]
    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updatePlugOutline(props) {
    traceLog.add('<updatePlugOutline>'); // [DEBUG/]
    var options = props.options, curStats = props.curStats, events = props.events,
      updated = false;

    [0, 1].forEach(function(i) {
      var plugId = curStats.plugOutline_plugSE[i], symbolConf, value;

      updated = setStat(props, curStats.plugOutline_enabledSE, i,
        curStats.plug_enabled && curStats.plug_enabledSE[i] && options.plugOutlineEnabledSE[i],
        events.cur_plugOutline_enabledSE
        /* [DEBUG] */, 'plugOutline_enabledSE[' + i + ']=%s'/* [/DEBUG] */) || updated;

      updated = setStat(props, curStats.plugOutline_colorSE, i,
        (value = options.plugOutlineColorSE[i] || curStats.lineOutline_color),
        events.cur_plugOutline_colorSE
        /* [DEBUG] */, 'plugOutline_colorSE[' + i + ']=%s'/* [/DEBUG] */) || updated;

      updated = setStat(props, curStats.plugOutline_colorTraSE, i, getAlpha(value) < 1,
        events.cur_plugOutline_colorTraSE
        /* [DEBUG] */, 'plugOutline_colorTraSE[' + i + ']=%s'/* [/DEBUG] */) || updated;

      if (plugId !== PLUG_BEHIND) { // Not depend on `curStats.plugOutline_enabledSE`
        symbolConf = SYMBOLS[PLUG_2_SYMBOL[plugId]];

        value = options.plugOutlineSizeSE[i];
        if (value > symbolConf.outlineMax) { value = symbolConf.outlineMax; }
        value *= symbolConf.outlineBase * 2;
        updated = setStat(props, curStats.plugOutline_strokeWidthSE, i, value,
          events.cur_plugOutline_strokeWidthSE
          /* [DEBUG] */, 'plugOutline_strokeWidthSE[' + i + ']%_'/* [/DEBUG] */) || updated;

        updated = setStat(props, curStats.plugOutline_inStrokeWidthSE, i,
          curStats.plugOutline_colorTraSE[i] ?
            value - SHAPE_GAP / (curStats.line_strokeWidth / DEFAULT_OPTIONS.lineSize) /
              options.plugSizeSE[i] * 2 :
            value / 2, // half
          events.cur_plugOutline_inStrokeWidthSE
          /* [DEBUG] */, 'plugOutline_inStrokeWidthSE[' + i + ']%_'/* [/DEBUG] */) || updated;
      }
    });

    if (!updated) { traceLog.add('not-updated'); } // [DEBUG/]
    traceLog.add('</updatePlugOutline>'); // [DEBUG/]
    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updateFaces(props) {
    traceLog.add('<updateFaces>'); // [DEBUG/]
    var curStats = props.curStats, aplStats = props.aplStats,
      value, updated = false;

    if (!curStats.line_altColor && setStat(props, aplStats, 'line_color', (value = curStats.line_color))) {
      props.lineFace.style.stroke = value;
      updated = true;
    }

    if (setStat(props, aplStats, 'line_strokeWidth', (value = curStats.line_strokeWidth))) {
      props.lineShape.style.strokeWidth = value;
      updated = true;
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
    }

    if (setStat(props, aplStats, 'lineOutline_enabled', (value = curStats.lineOutline_enabled))) {
      props.lineOutlineFace.style.display = value ? 'inline' : 'none';
      updated = true;
    }

    if (curStats.lineOutline_enabled) {

      if (setStat(props, aplStats, 'lineOutline_color', (value = curStats.lineOutline_color))) {
        props.lineOutlineFace.style.stroke = value;
        updated = true;
      }

      if (setStat(props, aplStats, 'lineOutline_strokeWidth', (value = curStats.lineOutline_strokeWidth))) {
        props.lineOutlineMaskShape.style.strokeWidth = value;
        updated = true;
        if (IS_TRIDENT) {
          // [TRIDENT] lineOutlineMaskCaps is ignored when lineSize is changed
          forceReflowAdd(props.lineOutlineMaskCaps);
          // [TRIDENT] lineOutlineColor is ignored
          forceReflowAdd(props.lineOutlineFace);
        }
      }

      if (setStat(props, aplStats, 'lineOutline_inStrokeWidth', (value = curStats.lineOutline_inStrokeWidth))) {
        props.lineMaskShape.style.strokeWidth = value;
        updated = true;
        if (IS_TRIDENT) {
          // [TRIDENT] lineOutlineMaskCaps is ignored when lineSize is changed
          forceReflowAdd(props.lineOutlineMaskCaps);
          // [TRIDENT] lineOutlineColor is ignored
          forceReflowAdd(props.lineOutlineFace);
        }
      }
    }

    if (setStat(props, aplStats, 'plug_enabled', (value = curStats.plug_enabled))) {
      props.lineFace.style.stroke = value;
      props.plugsFace.style.display = value ? 'inline' : 'none';
      updated = true;
    }

    if (curStats.plug_enabled) {

      [0, 1].forEach(function(i) {
        var plugId = curStats.plug_plugSE[i],
          symbolConf = plugId !== PLUG_BEHIND ? SYMBOLS[PLUG_2_SYMBOL[plugId]] : null,
          marker = getMarkerProps(i, symbolConf);

        if (setStat(props, aplStats.plug_enabledSE, i, (value = curStats.plug_enabledSE[i])
            /* [DEBUG] */, null, 'plug_enabledSE[' + i + ']=%s'/* [/DEBUG] */)) {
          props.plugsFace.style[marker.prop] = value ? 'url(#' + props.plugMarkerIdSE[i] + ')' : 'none';
          updated = true;
        }

        if (curStats.plug_enabledSE[i]) {

          if (setStat(props, aplStats.plug_plugSE, i, plugId
              /* [DEBUG] */, null, 'plug_plugSE[' + i + ']=%s'/* [/DEBUG] */)) {
            props.plugFaceSE[i].href.baseVal = '#' + symbolConf.elmId;
            setMarkerOrient(props.plugMarkerSE[i], marker.orient,
              symbolConf.bBox, props.svg, props.plugMarkerShapeSE[i], props.plugsFace);
            updated = true;
            if (IS_GECKO) {
              // [GECKO] plugsFace is not updated when plugSE is changed
              forceReflowAdd(props.plugsFace);
            }
          }

          if (setStat(props, aplStats.plug_colorSE, i, (value = curStats.plug_colorSE[i])
              /* [DEBUG] */, null, 'plug_colorSE[' + i + ']=%s'/* [/DEBUG] */)) {
            props.plugFaceSE[i].style.fill = value;
            updated = true;
            if (IS_BLINK && !curStats.line_colorTra) {
              // [BLINK] capsMaskLine is not updated when line has no alpha
              forceReflowAdd(props.capsMaskLine);
            }
          }

          // plug_markerWidthSE, plug_markerHeightSE
          ['markerWidth', 'markerHeight'].forEach(function(markerKey) {
            var statKey = 'plug_' + markerKey + 'SE';
            if (setStat(props, aplStats[statKey], i, (value = curStats[statKey][i])
                /* [DEBUG] */, null, statKey + '[' + i + ']%_'/* [/DEBUG] */)) {
              props.plugMarkerSE[i][markerKey].baseVal.value = value;
              updated = true;
            }
          });

          if (setStat(props, aplStats.plugOutline_enabledSE, i, (value = curStats.plugOutline_enabledSE[i])
              /* [DEBUG] */, null, 'plugOutline_enabledSE[' + i + ']=%s'/* [/DEBUG] */)) {
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

            if (setStat(props, aplStats.plugOutline_plugSE, i, plugId
                /* [DEBUG] */, null, 'plugOutline_plugSE[' + i + ']=%s'/* [/DEBUG] */)) {
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

            if (setStat(props, aplStats.plugOutline_colorSE, i, (value = curStats.plugOutline_colorSE[i])
                /* [DEBUG] */, null, 'plugOutline_colorSE[' + i + ']=%s'/* [/DEBUG] */)) {
              props.plugOutlineFaceSE[i].style.fill = value;
              updated = true;
            }

            if (setStat(props, aplStats.plugOutline_strokeWidthSE, i,
                (value = curStats.plugOutline_strokeWidthSE[i])
                /* [DEBUG] */, null, 'plugOutline_strokeWidthSE[' + i + ']=%s'/* [/DEBUG] */)) {
              props.plugOutlineMaskShapeSE[i].style.strokeWidth = value;
              updated = true;
            }

            if (setStat(props, aplStats.plugOutline_inStrokeWidthSE, i,
                (value = curStats.plugOutline_inStrokeWidthSE[i])
                /* [DEBUG] */, null, 'plugOutline_inStrokeWidthSE[' + i + ']=%s'/* [/DEBUG] */)) {
              props.plugMaskShapeSE[i].style.strokeWidth = value;
              updated = true;
            }
          }
        }
      });
    }

    if (!updated) { traceLog.add('not-updated'); } // [DEBUG/]
    traceLog.add('</updateFaces>'); // [DEBUG/]
    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updatePosition(props) {
    traceLog.add('<updatePosition>'); // [DEBUG/]
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
      var aType = a == null ? 'auto' : Array.isArray(a) ? 'array' : 'number', // eslint-disable-line eqeqeq
        bType = b == null ? 'auto' : Array.isArray(b) ? 'array' : 'number'; // eslint-disable-line eqeqeq
      return aType !== bType ? true :
        aType === 'array' ? a[0] !== b[0] || a[1] !== b[1] : a !== b;
    }

    curStats.position_path = options.path;
    curStats.position_lineStrokeWidth = curStats.line_strokeWidth;
    curStats.position_socketGravitySE = curSocketGravitySE = copyTree(options.socketGravitySE);

    anchorBBoxSE = [0, 1].map(function(i) {
      var anchorBBox = getBBoxNest(options.anchorSE[i], props.baseWindow),
        curCapsMaskAnchorBBox = curStats.capsMaskAnchor_bBoxSE[i];
      ['x', 'y', 'width', 'height'].forEach(function(boxKey) {
        curCapsMaskAnchorBBox[boxKey] = anchorBBox[BBOX_PROP[boxKey]];
      });
      return anchorBBox;
    });

    // Decide each socket
    (function() {
      var socketXYsWk, socketsLenMin = -1, iFix, iAuto;
      if (options.socketSE[0] && options.socketSE[1]) {
        curSocketXYSE[0] = getSocketXY(anchorBBoxSE[0], options.socketSE[0]);
        curSocketXYSE[1] = getSocketXY(anchorBBoxSE[1], options.socketSE[1]);

      } else if (!options.socketSE[0] && !options.socketSE[1]) {
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
    })();

    if (curStats.position_path !== aplStats.position_path ||
        curStats.position_lineStrokeWidth !== aplStats.position_lineStrokeWidth ||
        [0, 1].some(function(i) {
          return curStats.position_plugOverheadSE[i] !== aplStats.position_plugOverheadSE[i] ||
            socketXYHasChanged(curSocketXYSE[i], aplStats.position_socketXYSE[i]) ||
            socketGravityHasChanged(curSocketGravitySE[i], aplStats.position_socketGravitySE[i]);
        })) {
      // New position
      traceLog.add('new-position'); // [DEBUG/]
      props.pathList.baseVal = pathList = [];

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

    if (!updated) { traceLog.add('not-updated'); } // [DEBUG/]
    traceLog.add('</updatePosition>'); // [DEBUG/]
    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updatePath(props) {
    traceLog.add('<updatePath>'); // [DEBUG/]
    var curStats = props.curStats, aplStats = props.aplStats,
      curPathData,
      curPathEdge = curStats.viewBox_pathEdge,
      pathList = props.pathList.baseVal,
      updated = false;

    function pathDataHasChanged(a, b) {
      return a == null || b == null || // eslint-disable-line eqeqeq
        a.length !== b.length || a.some(function(aSeg, i) {
          var bSeg = b[i];
          return aSeg.type !== bSeg.type ||
            aSeg.values.some(function(aSegValue, i) { return aSegValue !== bSeg.values[i]; });
        });
    }

    // Convert to `pathData`.
    curStats.path_pathData = curPathData = [{type: 'M', values: [pathList[0][0].x, pathList[0][0].y]}];
    curPathEdge.x1 = curPathEdge.x2 = pathList[0][0].x;
    curPathEdge.y1 = curPathEdge.y2 = pathList[0][0].y;
    pathList.forEach(function(points) {
      curPathData.push(points.length === 2 ?
        {type: 'L', values: [points[1].x, points[1].y]} :
        {type: 'C', values: [points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y]});
      points.forEach(function(point) {
        if (point.x < curPathEdge.x1) { curPathEdge.x1 = point.x; }
        if (point.x > curPathEdge.x2) { curPathEdge.x2 = point.x; }
        if (point.y < curPathEdge.y1) { curPathEdge.y1 = point.y; }
        if (point.y > curPathEdge.y2) { curPathEdge.y2 = point.y; }
      });
    });

    // Apply `pathData`
    if (pathDataHasChanged(curPathData, aplStats.path_pathData)) {
      traceLog.add('setPathData'); // [DEBUG/]
      props.linePath.setPathData(curPathData);
      aplStats.path_pathData = curPathData; // Since curPathData is new anytime, it doesn't need copy.
      updated = true;

      if (IS_TRIDENT) {
        // [TRIDENT] markerOrient is not updated when path is changed
        forceReflowAdd(props.plugsFace);
        // [TRIDENT] lineMaskCaps is ignored when path is changed
        forceReflowAdd(props.lineMaskCaps);
      } else if (IS_GECKO) {
        // [GECKO] path is not updated when path is changed
        forceReflowAdd(props.linePath);
      }

      if (props.events.apl_path) {
        props.events.apl_path.forEach(function(handler) { handler(props, curPathData); });
      }
    }

    if (!updated) { traceLog.add('not-updated'); } // [DEBUG/]
    traceLog.add('</updatePath>'); // [DEBUG/]
    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updateViewBox(props) {
    traceLog.add('<updateViewBox>'); // [DEBUG/]
    var curStats = props.curStats, aplStats = props.aplStats,
      curPathEdge = curStats.viewBox_pathEdge,
      curBBox = curStats.viewBox_bBox, aplBBox = aplStats.viewBox_bBox,
      padding = Math.max(curStats.line_strokeWidth / 2,
        curStats.viewBox_plugBCircleSE[0] || 0, curStats.viewBox_plugBCircleSE[1] || 0),
      // Expand bBox with `line` or symbols
      points = {
        x1: curPathEdge.x1 - padding,
        y1: curPathEdge.y1 - padding,
        x2: curPathEdge.x2 + padding,
        y2: curPathEdge.y2 + padding
      },
      viewBox = props.svg.viewBox.baseVal, styles = props.svg.style,
      updated = false;

    curBBox.x = curStats.lineMask_x = curStats.lineOutlineMask_x = curStats.maskBGRect_x = points.x1;
    curBBox.y = curStats.lineMask_y = curStats.lineOutlineMask_y = curStats.maskBGRect_y = points.y1;
    curBBox.width = points.x2 - points.x1;
    curBBox.height = points.y2 - points.y1;

    ['x', 'y', 'width', 'height'].forEach(function(boxKey) {
      var value;
      if ((value = curBBox[boxKey]) !== aplBBox[boxKey]) {
        traceLog.add('viewBox_bBox.' + boxKey); // [DEBUG/]
        viewBox[boxKey] = aplBBox[boxKey] = value;
        styles[BBOX_PROP[boxKey]] = value +
          (boxKey === 'x' || boxKey === 'y' ? props.bodyOffset[boxKey] : 0) + 'px';
        updated = true;
      }
    });

    if (!updated) { traceLog.add('not-updated'); } // [DEBUG/]
    traceLog.add('</updateViewBox>'); // [DEBUG/]
    return updated;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updateMask(props) {
    traceLog.add('<updateMask>'); // [DEBUG/]
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
            /* [DEBUG] */, null, statKey + '%_'/* [/DEBUG] */)) {
          props.maskBGRect[boxKey].baseVal.value = value;
          updated = true;
        }
      });
    }

    if (setStat(props, aplStats, 'lineMask_enabled', (value = curStats.lineMask_enabled))) {
      props.lineFace.style.mask = value ? 'url(#' + props.lineMaskId + ')' : 'none';
      updated = true;
    }

    if (curStats.lineMask_enabled) { // Includes `outlineMode`

      // when lineMask is shown
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
            /* [DEBUG] */, null, statKey + '%_'/* [/DEBUG] */)) {
          props.lineMask[boxKey].baseVal.value = value;
          updated = true;
        }
      });

      if (setStat(props, aplStats, 'caps_enabled', (value = curStats.caps_enabled))) {
        props.lineMaskCaps.style.display = props.lineOutlineMaskCaps.style.display =
          value ? 'inline' : 'none';
        updated = true;
      }

      if (curStats.caps_enabled) {

        // capsMaskAnchor
        [0, 1].forEach(function(i) {
          var curBBox, aplBBox;

          if (setStat(props, aplStats.capsMaskAnchor_enabledSE, i, (value = curStats.capsMaskAnchor_enabledSE[i])
              /* [DEBUG] */, null, 'capsMaskAnchor_enabledSE[' + i + ']=%s'/* [/DEBUG] */)) {
            props.capsMaskAnchorSE[i].style.display = value ? 'inline' : 'none';
            updated = true;
          }

          if (curStats.capsMaskAnchor_enabledSE[i]) {
            // capsMaskAnchor_bBoxSE
            curBBox = curStats.capsMaskAnchor_bBoxSE[i];
            aplBBox = aplStats.capsMaskAnchor_bBoxSE[i];
            ['x', 'y', 'width', 'height'].forEach(function(boxKey) {
              if (setStat(props, aplBBox, boxKey, (value = curBBox[boxKey])
                  /* [DEBUG] */, null, 'capsMaskAnchor_bBoxSE[' + i + '].' + boxKey + '%_'/* [/DEBUG] */)) {
                props.capsMaskAnchorSE[i][boxKey].baseVal.value = value;
                updated = true;
              }
            });
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
                /* [DEBUG] */, null, 'capsMaskMarker_enabledSE[' + i + ']=%s'/* [/DEBUG] */)) {
              props.capsMaskLine.style[marker.prop] =
                value ? 'url(#' + props.lineMaskMarkerIdSE[i] + ')' : 'none';
              updated = true;
            }

            if (curStats.capsMaskMarker_enabledSE[i]) {

              if (setStat(props, aplStats.capsMaskMarker_plugSE, i, plugId
                  /* [DEBUG] */, null, 'capsMaskMarker_plugSE[' + i + ']=%s'/* [/DEBUG] */)) {
                props.capsMaskMarkerShapeSE[i].href.baseVal = '#' + symbolConf.elmId;
                setMarkerOrient(props.capsMaskMarkerSE[i], marker.orient,
                  symbolConf.bBox, props.svg, props.capsMaskMarkerShapeSE[i], props.capsMaskLine);
                updated = true;
                if (IS_GECKO) {
                  // [GECKO] plugsFace is not updated when plugSE is changed
                  forceReflowAdd(props.capsMaskLine);
                  forceReflowAdd(props.lineFace);
                }
              }

              // capsMaskMarker_markerWidthSE, capsMaskMarker_markerHeightSE
              ['markerWidth', 'markerHeight'].forEach(function(markerKey) {
                var statKey = 'capsMaskMarker_' + markerKey + 'SE';
                if (setStat(props, aplStats[statKey], i, (value = curStats[statKey][i])
                    /* [DEBUG] */, null, statKey + '[' + i + ']%_'/* [/DEBUG] */)) {
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
            /* [DEBUG] */, null, statKey + '%_'/* [/DEBUG] */)) {
          props.lineOutlineMask[boxKey].baseVal.value = value;
          updated = true;
        }
      });
    }

    if (!updated) { traceLog.add('not-updated'); } // [DEBUG/]
    traceLog.add('</updateMask>'); // [DEBUG/]
    return updated;
  }

  /**
   * Apply all of `effect`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {void}
   */
  function setEffect(props) {
    traceLog.add('<setEffect>'); // [DEBUG/]
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
    traceLog.add('</setEffect>'); // [DEBUG/]
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
    if (updated.line || updated.plug || updated.lineOutline || updated.plugOutline) {
      updated.faces = updateFaces(props);
    }
    if ((needs.position || updated.line || updated.plug) &&
        (updated.position = updatePosition(props))) {
      updated.path = updatePath(props);
    }
    updated.viewBox = updateViewBox(props);
    updated.mask = updateMask(props);
    if (needs.effect) {
      setEffect(props);
    }

    if (IS_BLINK && updated.line && !updated.path) {
      // [BLINK] lineSize is not updated when path is not changed
      forceReflowAdd(props.lineShape);
    }
    if (IS_BLINK && updated.plug && !updated.line) {
      // [BLINK] plugColorSE is not updated when Line is not changed
      forceReflowAdd(props.plugsFace);
    }
    forceReflowApply();

    // [DEBUG]
    traceLog.add('<update>');
    Object.keys(updated).forEach(function(key) {
      if (updated[key]) { traceLog.add('updated.' + key); }
    });
    traceLog.add('</update>');
    // [/DEBUG]
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

    Object.defineProperty(this, '_id', {value: insId++});
    insProps[this._id] = props;

    props.curStats = {};
    props.aplStats = {};
    Object.keys(STATS).forEach(function(name) {
      var statConf = STATS[name];
      if (statConf.hasSE) {
        if (statConf.hasProps) {
          props.curStats[name] = [{}, {}];
          props.aplStats[name] = [{}, {}];
        } else {
          props.curStats[name] = [];
          props.aplStats[name] = [];
        }
      } else if (statConf.hasProps) {
        props.curStats[name] = {};
        props.aplStats[name] = {};
      }
    });

    // handlers
    props.events = [
    ].reduce(function(events, eventType) {
      events[eventType] = [];
      return events;
    }, {});

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
    // reserve for future version
    // props.lineFGId = prefix + '-line-fg';
    props.lineGradientId = prefix + '-line-gradient';

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
      newWindow, needsWindow, needs = {};

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
      var curOption = getCurOption(name, optionName, index), updated, key, id;
      if (newOptions[name] != null && // eslint-disable-line eqeqeq
          (key = (newOptions[name] + '').toLowerCase()) && (
            curOption.acceptsAuto && key === KEYWORD_AUTO ||
            (id = key2Id[key])
          ) && id !== curOption.container[curOption.key]) {
        curOption.container[curOption.key] = id; // `undefined` when `KEYWORD_AUTO`
        updated = true;
      }
      if (curOption.container[curOption.key] == null && !curOption.acceptsAuto) { // eslint-disable-line eqeqeq
        curOption.container[curOption.key] = curOption.default;
        updated = true;
      }
      return updated;
    }

    function setValidType(name, type, optionName, index, check, trim) {
      var curOption = getCurOption(name, optionName, index), updated, value;
      if (!type) {
        if (curOption.default == null) { throw new Error('Invalid `type`: ' + name); } // eslint-disable-line eqeqeq
        type = typeof curOption.default;
      }
      if (newOptions[name] != null && ( // eslint-disable-line eqeqeq
            curOption.acceptsAuto && (newOptions[name] + '').toLowerCase() === KEYWORD_AUTO ||
            typeof (value = newOptions[name]) === type &&
            ((value = trim && type === 'string' && value ? value.trim() : value) || true) &&
            (!check || check(value))
          ) && value !== curOption.container[curOption.key]) {
        curOption.container[curOption.key] = value; // `undefined` when `KEYWORD_AUTO`
        updated = true;
      }
      if (curOption.container[curOption.key] == null && !curOption.acceptsAuto) { // eslint-disable-line eqeqeq
        curOption.container[curOption.key] = curOption.default;
        updated = true;
      }
      return updated;
    }

    newOptions = newOptions || {};

    // anchorSE
    [newOptions.start, newOptions.end].forEach(function(newOption, i) {
      if (newOption && newOption.nodeType != null && // eslint-disable-line eqeqeq
          newOption !== options.anchorSE[i]) {
        options.anchorSE[i] = newOption;
        needsWindow = needs.position = true;
      }
    });
    if (!options.anchorSE[0] || !options.anchorSE[1] || options.anchorSE[0] === options.anchorSE[1]) {
      throw new Error('`start` and `end` are required.');
    }

    // Check window.
    if (needsWindow &&
        (newWindow = getCommonWindow(options.anchorSE[0], options.anchorSE[1])) !== props.baseWindow) {
      bindWindow(props, newWindow);
      needs.line = needs.plug = needs.lineOutline = needs.plugOutline = needs.effect = true;
    }

    needs.position = setValidId('path', PATH_KEY_2_ID) || needs.position;
    needs.position = setValidId('startSocket', SOCKET_KEY_2_ID, 'socketSE', 0) || needs.position;
    needs.position = setValidId('endSocket', SOCKET_KEY_2_ID, 'socketSE', 1) || needs.position;

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
          needs.position = true;
        }
      }
    });

    // Line
    needs.line = setValidType('color', null, 'lineColor', null, null, true) || needs.line;
    needs.line = setValidType('size', null, 'lineSize', null,
      function(value) { return value > 0; }) || needs.line;

    // Plug
    ['startPlug', 'endPlug'].forEach(function(name, i) {
      needs.plug = setValidId(name, PLUG_KEY_2_ID, 'plugSE', i) || needs.plug;
      needs.plug = setValidType(name + 'Color', 'string', 'plugColorSE', i, null, true) || needs.plug;
      needs.plug = setValidType(name + 'Size', null, 'plugSizeSE', i,
        function(value) { return value > 0; }) || needs.plug;
    });

    // LineOutline
    needs.lineOutline = setValidType('outline', null, 'lineOutlineEnabled') || needs.lineOutline;
    needs.lineOutline = setValidType('outlineColor', null, 'lineOutlineColor') || needs.lineOutline;
    needs.lineOutline = setValidType('outlineSize', null, 'lineOutlineSize', null,
      function(value) { return value > 0 && value <= 0.48; }) || needs.lineOutline;

    // PlugOutline
    ['startPlugOutline', 'endPlugOutline'].forEach(function(name, i) {
      needs.plugOutline = setValidType(name, null, 'plugOutlineEnabledSE', i) || needs.plugOutline;
      needs.plugOutline = setValidType(name + 'Color', 'string', 'plugOutlineColorSE', i) || needs.plugOutline;
      // `outlineMax` is checked in `updatePlugOutline`.
      needs.plugOutline = setValidType(name + 'Size', null, 'plugOutlineSizeSE', i,
        function(value) { return value >= 1; }) || needs.plugOutline;
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
              needs.effect = true;
            }
          }
        } else if (options.effect) { // on -> off
          options.effect = null;
          needs.effect = true;
        }
      }
    })();

    // [DEBUG]
    traceLog.add('<setOptions>');
    Object.keys(needs).forEach(function(key) {
      if (needs[key]) { traceLog.add('needs.' + key); }
    });
    traceLog.add('</setOptions>');
    // [/DEBUG]

    update(props, needs);
    return this;
  };

  LeaderLine.prototype.position = function() {
    update(insProps[this._id], {position: true});
    return this;
  };

  LeaderLine.prototype.remove = function() {
    var props = insProps[this._id];
    if (props.baseWindow && props.svg) {
      props.baseWindow.document.body.removeChild(props.svg);
    }
    delete insProps[this._id];
  };

  return LeaderLine;
})();
