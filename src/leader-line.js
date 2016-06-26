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
     * @typedef {{name, hasSE, hasProps, isOption, hasChanged}[]} PROP_CONF
     */
    POSITION_PROPS = [ // `anchorSE` is checked always.
      {name: 'socketXYSE', hasSE: true, hasProps: true,
        hasChanged: function(a, b) {
          return ['x', 'y', 'socketId'].some(function(prop) { return a[prop] !== b[prop]; });
        }},
      {name: 'plugOverheadSE', hasSE: true},
      {name: 'path', isOption: true},
      {name: 'lineSize', isOption: true},
      {name: 'socketGravitySE', hasSE: true, isOption: true,
        hasChanged: function(a, b) {
          var aType = a == null ? 'auto' : Array.isArray(a) ? 'array' : 'number', // eslint-disable-line eqeqeq
            bType = b == null ? 'auto' : Array.isArray(b) ? 'array' : 'number'; // eslint-disable-line eqeqeq
          return aType !== bType ? true :
            aType === 'array' ? [0, 1].some(function(i) { return a[i] !== b[i]; }) :
            a !== b;
        }}
    ],

    PATH_PROPS = [
      {name: 'pathData',
        hasChanged: function(a, b) {
          return a == null || b == null || // eslint-disable-line eqeqeq
            a.length !== b.length || a.some(function(aSeg, i) {
              var bSeg = b[i];
              return aSeg.type !== bSeg.type ||
                aSeg.values.some(function(aSegValue, i) { return aSegValue !== bSeg.values[i]; });
            });
        }}
    ],

    VIEW_BBOX_PROPS = [
      {name: 'x'}, {name: 'y'}, {name: 'width'}, {name: 'height'}
      // `props.viewBBoxVals` contains `plugBCircleSE` and `pathEdge` to calculate.
    ],

    MASK_PROPS = [
      {name: 'plugHasMaskSE', hasSE: true},
      {name: 'anchorHasMaskSE', hasSE: true},
      {name: 'x'}, {name: 'y'}, {name: 'width'}, {name: 'height'}
    ],

    ANCHOR_MASK_PROPS = [
      {name: 'xSE', hasSE: true}, {name: 'ySE', hasSE: true},
      {name: 'widthSE', hasSE: true}, {name: 'heightSE', hasSE: true}
    ],

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
    insProps = {}, insId = 0, svg2Supported;

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

  /**
   * Setup `baseWindow`, `bodyOffset`, `pathList`,
   *    `positionVals`, `pathVals`, `viewBBoxVals`, `maskVals`, `anchorMaskVals`,
   *    `hasTransparency`, `effect`, `effectParams`, SVG elements.
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

    props.lineShape = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineShape.id = props.lineShapeId;
    props.lineShape.href.baseVal = '#' + props.linePathId;

    maskCaps = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'g'));
    maskCaps.id = props.lineMaskCapsId;

    props.lineMaskAnchorSE = [0, 1].map(function() {
      var element = maskCaps.appendChild(baseDocument.createElementNS(SVG_NS, 'rect'));
      element.className.baseVal = APP_ID + '-line-mask-anchor';
      return element;
    });

    props.lineMaskMarkerSE = [0, 1].map(function(i) { return setupMarker(props.lineMaskMarkerIdSE[i]); });
    props.lineMaskMarkerShapeSE = [0, 1].map(function(i) {
      var element = props.lineMaskMarkerSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
      element.className.baseVal = APP_ID + '-line-mask-marker-shape';
      return element;
    });

    props.lineMaskPlug = maskCaps.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineMaskPlug.className.baseVal = APP_ID + '-line-mask-plug';
    props.lineMaskPlug.href.baseVal = '#' + props.lineShapeId;

    props.lineMaskBGRect = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'rect'));
    props.lineMaskBGRect.id = props.lineMaskBGRectId;
    props.lineMaskBGRect.className.baseVal = APP_ID + '-line-mask-bg-rect';
    ['width', 'height'].forEach(function(prop) {
      props.lineMaskBGRect[prop].baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100);
    });

    // ==== lineMask
    props.lineMask = setupMask(props.lineMaskId);
    props.lineMaskBG = props.lineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineMaskBG.href.baseVal = '#' + props.lineMaskBGRectId;
    props.lineMaskShape = props.lineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineMaskShape.className.baseVal = APP_ID + '-line-mask-shape';
    props.lineMaskShape.href.baseVal = '#' + props.linePathId;
    props.lineMaskShape.style.display = 'none';
    props.lineMaskCaps = props.lineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineMaskCaps.href.baseVal = '#' + props.lineMaskCapsId;
    // ==== /lineMask

    // ==== lineOutlineMask
    props.lineOutlineMask = setupMask(props.lineOutlineMaskId);
    element = props.lineOutlineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + props.lineMaskBGRectId;
    props.lineOutlineMaskShape = props.lineOutlineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineOutlineMaskShape.className.baseVal = APP_ID + '-line-outline-mask-shape';
    props.lineOutlineMaskShape.href.baseVal = '#' + props.linePathId;
    props.lineOutlineMaskCaps = props.lineOutlineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineOutlineMaskCaps.href.baseVal = '#' + props.lineMaskCapsId;
    // ==== /lineOutlineMask

    props.lineFace = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineFace.href.baseVal = '#' + props.lineShapeId;
    props.lineFace.style.mask = 'url(#' + props.lineMaskId + ')';

    props.lineOutlineFace = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.lineOutlineFace.href.baseVal = '#' + props.lineShapeId;
    props.lineOutlineFace.style.mask = 'url(#' + props.lineOutlineMaskId + ')';
    props.lineOutlineFace.style.display = 'none';

    // ==== plugMaskSE
    props.plugMaskSE = [0, 1].map(function(i) { return setupMask(props.plugMaskIdSE[i]); });
    props.plugMaskShapeSE = [0, 1].map(function(i) {
      var element = props.plugMaskSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
      element.className.baseVal = APP_ID + '-plug-mask-shape';
      return element;
    });
    // ==== /plugMaskSE

    // ==== plugOutlineMaskSE
    props.plugOutlineMaskSE = [0, 1].map(function(i) { return setupMask(props.plugOutlineMaskIdSE[i]); });
    props.plugOutlineMaskShapeSE = [0, 1].map(function(i) {
      var element = props.plugOutlineMaskSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
      element.className.baseVal = APP_ID + '-plug-outline-mask-shape';
      return element;
    });
    // ==== /plugOutlineMaskSE

    props.plugMarkerSE = [0, 1].map(function(i) { return setupMarker(props.plugMarkerIdSE[i]); });
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

    props.plugsFace = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.plugsFace.className.baseVal = APP_ID + '-plugs-face';
    props.plugsFace.href.baseVal = '#' + props.lineShapeId;

    props.svg = baseDocument.body.appendChild(svg);

    [['positionVals', POSITION_PROPS], ['pathVals', PATH_PROPS], ['viewBBoxVals', VIEW_BBOX_PROPS],
        ['maskVals', MASK_PROPS], ['anchorMaskVals', ANCHOR_MASK_PROPS]]
      .forEach(function(propNameConf) {
        props[propNameConf[0]] = propNameConf[1].reduce(function(values, propConf) {
          if (propConf.hasSE) {
            if (propConf.hasProps) {
              if (!propConf.isOption) { values.current[propConf.name] = [{}, {}]; }
              values.applied[propConf.name] = [{}, {}];
            } else {
              if (!propConf.isOption) { values.current[propConf.name] = []; }
              values.applied[propConf.name] = [];
            }
          } else if (propConf.hasProps) {
            if (!propConf.isOption) { values.current[propConf.name] = {}; }
            values.applied[propConf.name] = {};
          }
          return values;
        }, {current: {}, applied: {}});
      });
    props.viewBBoxVals.plugBCircleSE = [0, 0];
    props.viewBBoxVals.pathEdge = {};
    props.pathList = {baseVal: [], animVal: []};
    props.hasTransparency = {plugColorSE: [], plugOutlineColorSE: []};
    props.effect = null;
    if (props.effectParams && props.effectParams.animId) { anim.remove(props.effectParams.animId); }
    props.effectParams = {};
  }
  window.bindWindow = bindWindow; // [DEBUG/]

  /**
   * Apply `lineColor`, `lineSize`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Array} [setProps] - To limit properties. `[]` and `['']` don't change.
   * @returns {void}
   */
  function setLine(props, setProps) {
    window.traceLog.push('<setLine>'); // [DEBUG/]
    var options = props.options, value;

    (setProps || ['lineColor', 'lineSize']).forEach(function(setProp) {
      switch (setProp) {
        case 'lineColor':
          value = options[setProp];
          window.traceLog.push(setProp + '=' + value); // [DEBUG/]
          props.lineFace.style.stroke = value;
          props.hasTransparency.lineColor = getAlpha(value) < 1;
          break;

        case 'lineSize':
          window.traceLog.push(setProp + '=' + options[setProp]); // [DEBUG/]
          props.lineShape.style.strokeWidth = options[setProp];
          if (IS_GECKO || IS_TRIDENT) {
            // [TRIDENT] plugsFace is not updated when lineSize is changed
            // [GECKO] plugsFace is ignored
            forceReflow(props.lineShape);
            if (IS_TRIDENT) {
              // [TRIDENT] lineColor is ignored
              forceReflow(props.lineFace);
              // [TRIDENT] lineMaskCaps is ignored when lineSize is changed
              forceReflow(props.lineMaskCaps);
            }
          }
          break;
        // no default
      }
    });

    if (props.effect && props.effect.onSetLine) {
      props.effect.onSetLine(props, setProps);
    }
  }

  /**
   * Apply `orient` to `marker`.
   * @param {SVGMarkerElement} marker - Target `<marker>` element.
   * @param {string} orient - `'auto'`, `'auto-start-reverse'` or angle.
   * @param {BBox} bBox - `BBox` as `viewBox` of the marker.
   * @param {SVGSVGElement} svg - Parent `<svg>` element.
   * @param {SVGElement} shape - An element that is shown as marker.
   * @param {SVGElement} marked - Target element that has `marker-start/end` such as `<path>`.
   * @returns {void}
   */
  function setMarkerOrient(marker, orient, bBox, svg, shape, marked) {
    var transform, baseVal, reverseView;
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

    baseVal = marker.viewBox.baseVal;
    if (reverseView) {
      baseVal.x = -bBox.right;
      baseVal.y = -bBox.bottom;
    } else {
      baseVal.x = bBox.left;
      baseVal.y = bBox.top;
    }
    baseVal.width = bBox.width;
    baseVal.height = bBox.height;

    // [TRIDENT] markerOrient is not updated when plugSE is changed
    if (IS_TRIDENT) { forceReflow(marked); }
  }

  /**
   * Apply `plug`, `plugColor`, `plugSize`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {(Array|null)[]} setPropsSE - To limit properties.
   *    Each `[]` and `['']` change only each `plugOverhead` and `plugBCircle`.
   * @returns {void}
   */
  function setPlug(props, setPropsSE) {
    window.traceLog.push('<setPlug>'); // [DEBUG/]
    var options = props.options,
      curPosition = props.positionVals.current,
      plugBCircleSE = props.viewBBoxVals.plugBCircleSE,
      plugHasMaskSE = props.maskVals.current.plugHasMaskSE,
      anchorHasMaskSE = props.maskVals.current.anchorHasMaskSE,
      value;

    setPropsSE.forEach(function(setProps, i) {
      var plugId = options.plugSE[i], symbolConf, orient, markerProp;

      if (plugId !== PLUG_BEHIND) {
        symbolConf = SYMBOLS[PLUG_2_SYMBOL[plugId]];
        (setProps || ['plug', 'plugColor', 'plugSize']).forEach(function(setProp) {
          switch (setProp) {
            case 'plug':
              window.traceLog.push(setProp + '[' + i + ']=' + plugId); // [DEBUG/]
              orient = symbolConf.noRotate ? '0' : i ? 'auto' : 'auto-start-reverse';
              markerProp = i ? 'markerEnd' : 'markerStart';

              props.plugFaceSE[i].href.baseVal =
                props.plugOutlineFaceSE[i].href.baseVal =
                props.plugMaskShapeSE[i].href.baseVal =
                props.plugOutlineMaskShapeSE[i].href.baseVal =
                props.lineMaskMarkerShapeSE[i].href.baseVal = '#' + symbolConf.elmId;
              [props.plugMaskSE[i], props.plugOutlineMaskSE[i]].forEach(function(mask) {
                mask.x.baseVal.value = symbolConf.bBox.left;
                mask.y.baseVal.value = symbolConf.bBox.top;
                mask.width.baseVal.value = symbolConf.bBox.width;
                mask.height.baseVal.value = symbolConf.bBox.height;
              });
              // Since TRIDENT doesn't show markers, set those before `setMarkerOrient` (it calls `forceReflow`).
              props.plugsFace.style[markerProp] = 'url(#' + props.plugMarkerIdSE[i] + ')';
              props.lineMaskPlug.style[markerProp] = 'url(#' + props.lineMaskMarkerIdSE[i] + ')';
              setMarkerOrient(props.plugMarkerSE[i], orient,
                symbolConf.bBox, props.svg, props.plugMarkerShapeSE[i], props.plugsFace);
              setMarkerOrient(props.lineMaskMarkerSE[i], orient,
                symbolConf.bBox, props.svg, props.lineMaskMarkerShapeSE[i], props.lineMaskPlug);
              props.lineMaskAnchorSE[i].style.display = 'none';
              if (IS_GECKO) {
                // [GECKO] plugsFace is not updated when plugSE is changed
                forceReflow(props.plugsFace);
                forceReflow(props.lineMaskPlug);
                forceReflow(props.lineFace);
              }
              break;

            case 'plugColor':
              value = options.plugColorSE[i] || options.lineColor;
              window.traceLog.push(setProp + '[' + i + ']=' + value); // [DEBUG/]
              props.plugFaceSE[i].style.fill = value;
              props.hasTransparency.plugColorSE[i] = getAlpha(value) < 1;
              break;

            case 'plugSize':
              window.traceLog.push(setProp + '[' + i + ']=' + options.plugSizeSE[i]); // [DEBUG/]
              props.plugMarkerSE[i].markerWidth.baseVal.value =
                props.lineMaskMarkerSE[i].markerWidth.baseVal.value =
                symbolConf.widthR * options.plugSizeSE[i];
              props.plugMarkerSE[i].markerHeight.baseVal.value =
                props.lineMaskMarkerSE[i].markerHeight.baseVal.value =
                symbolConf.heightR * options.plugSizeSE[i];
              break;
            // no default
          }
        });
        // Update shape always for `options.lineSize` that might have been changed.
        curPosition.plugOverheadSE[i] =
          options.lineSize / DEFAULT_OPTIONS.lineSize * symbolConf.overhead * options.plugSizeSE[i];
        plugBCircleSE[i] =
          options.lineSize / DEFAULT_OPTIONS.lineSize * symbolConf.bCircle * options.plugSizeSE[i];
        plugHasMaskSE[i] = true;
        anchorHasMaskSE[i] = false;

      } else {
        if (!setProps || setProps.indexOf('plug') > -1) {
          window.traceLog.push('plug[' + i + ']=' + plugId); // [DEBUG/]
          markerProp = i ? 'markerEnd' : 'markerStart';
          props.plugsFace.style[markerProp] = props.lineMaskPlug.style[markerProp] = 'none';
          props.lineMaskAnchorSE[i].style.display = 'inline';
        }
        // Update shape always for `options.lineSize` that might have been changed.
        curPosition.plugOverheadSE[i] = -(options.lineSize / 2);
        plugBCircleSE[i] = 0;
        plugHasMaskSE[i] = false;
        anchorHasMaskSE[i] = true;
      }
    });
    props.lineMaskPlug.style.display =
      options.plugSE[0] !== PLUG_BEHIND || options.plugSE[1] !== PLUG_BEHIND ? 'inline' : 'none';

    if (props.effect && props.effect.onSetPlug) {
      props.effect.onSetPlug(props, setPropsSE);
    }
  }

  /**
   * Apply `lineOutlineEnabled`, `lineOutlineColor`, `lineOutlineSize`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Array} [setProps] - To limit properties. `[]` and `['']` don't change.
   * @returns {void}
   */
  function setLineOutline(props, setProps) {
    window.traceLog.push('<setLineOutline>'); // [DEBUG/]
    var options = props.options, value;

    if (options.lineOutlineEnabled) {
      (setProps || ['lineOutlineEnabled', 'lineOutlineColor', 'lineOutlineSize']).forEach(function(setProp) {
        switch (setProp) {
          case 'lineOutlineEnabled':
            window.traceLog.push(setProp + '=' + options[setProp]); // [DEBUG/]
            props.lineMaskShape.style.display = 'inline';
            props.lineMaskBG.style.display = 'none';
            props.lineOutlineFace.style.display = 'inline';
            break;

          case 'lineOutlineColor':
            value = options[setProp];
            window.traceLog.push(setProp + '=' + value); // [DEBUG/]
            props.lineOutlineFace.style.stroke = value;
            props.hasTransparency.lineOutlineColor = getAlpha(value) < 1;
            break;

          case 'lineOutlineSize':
            window.traceLog.push(setProp + '=' + options[setProp]); // [DEBUG/]
            props.lineMaskShape.style.strokeWidth =
              options.lineSize - (options.lineSize * options.lineOutlineSize - SHAPE_GAP) * 2;
            props.lineOutlineMaskShape.style.strokeWidth =
              options.lineSize - options.lineSize * options.lineOutlineSize * 2;
            if (IS_TRIDENT) {
              // [TRIDENT] lineOutlineMaskCaps is ignored when lineSize is changed
              forceReflow(props.lineOutlineMaskCaps);
              // [TRIDENT] lineOutlineColor is ignored
              forceReflow(props.lineOutlineFace);
            }
            break;
          // no default
        }
      });

    } else {
      if (!setProps || setProps.indexOf('lineOutlineEnabled') > -1) {
        window.traceLog.push('lineOutlineEnabled=' + options.lineOutlineEnabled); // [DEBUG/]
        props.lineMaskShape.style.display = 'none';
        props.lineMaskBG.style.display = 'inline';
        props.lineOutlineFace.style.display = 'none';
      }
    }
  }

  /**
   * Apply `plugOutlineEnabled`, `plugOutlineColor`, `plugOutlineSize`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {(Array|null)[]} setPropsSE - To limit properties.
   * @returns {void}
   */
  function setPlugOutline(props, setPropsSE) {
    window.traceLog.push('<setPlugOutline>'); // [DEBUG/]
    var options = props.options;

    setPropsSE.forEach(function(setProps, i) {
      var plugId = options.plugSE[i], symbolConf, value;

      // Disable it when `plugId === PLUG_BEHIND` even if `plugOutlineEnabledSE`.
      if (options.plugOutlineEnabledSE[i] && plugId !== PLUG_BEHIND) {
        (setProps || ['plugOutlineEnabled', 'plugOutlineColor', 'plugOutlineSize']).forEach(function(setProp) {
          switch (setProp) {
            case 'plugOutlineEnabled':
              window.traceLog.push(setProp + '[' + i + ']=' + options.plugOutlineEnabledSE[i]); // [DEBUG/]
              props.plugFaceSE[i].style.mask = 'url(#' + props.plugMaskIdSE[i] + ')';
              props.plugOutlineFaceSE[i].style.display = 'inline';
              break;

            case 'plugOutlineColor':
              value = options.plugOutlineColorSE[i] || options.lineOutlineColor;
              window.traceLog.push(setProp + '[' + i + ']=' + (value)); // [DEBUG/]
              props.plugOutlineFaceSE[i].style.fill = value;
              props.hasTransparency.plugOutlineColorSE[i] = getAlpha(value) < 1;
              break;

            case 'plugOutlineSize':
              symbolConf = SYMBOLS[PLUG_2_SYMBOL[plugId]];
              if (options.plugOutlineSizeSE[i] > symbolConf.outlineMax) {
                options.plugOutlineSizeSE[i] = symbolConf.outlineMax;
              }
              window.traceLog.push(setProp + '[' + i + ']=' + options.plugOutlineSizeSE[i]); // [DEBUG/]
              props.plugMaskShapeSE[i].style.strokeWidth =
                symbolConf.outlineBase * options.plugOutlineSizeSE[i] * 2;
              props.plugOutlineMaskShapeSE[i].style.strokeWidth =
                (symbolConf.outlineBase * options.plugOutlineSizeSE[i] +
                  2 / (options.lineSize / DEFAULT_OPTIONS.lineSize) / options.plugSizeSE[i]) * 2;
              console.log(2 / (options.lineSize / DEFAULT_OPTIONS.lineSize) / options.plugSizeSE[i]);
              if (IS_BLINK) {
                // [BLINK] plugOutlineSizeSE is ignored when exists plug is changed
                // forceReflow(props.plugOutlineIShapeSE[i]);
              }
              break;
            // no default
          }
        });

      } else {
        if (!setProps || setProps.indexOf('plugOutlineEnabled') > -1) {
          window.traceLog.push('plugOutlineEnabled[' + i + ']=' + options.plugOutlineEnabledSE[i]); // [DEBUG/]
          props.plugFaceSE[i].style.mask = 'none';
          props.plugOutlineFaceSE[i].style.display = 'none';
        }
      }
    });
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
   * @param {Object} values - Saved values such as `props.positionVals`.
   * @param {Object} options - `props.options` of `LeaderLine` instance.
   * @param {Object} conf - Config such as `POSITION_PROPS`.
   * @returns {boolean} - `true` if it was changed.
   */
  function propsHasChanged(values, options, conf) {
    // [DEBUG]
    function log(out, name) {
      if (out) {
        window.traceLog.push('propsHasChanged:' + name); // eslint-disable-line eqeqeq
      }
      return out;
    }
    // [/DEBUG]
    return conf.some(function(propConf) {
      var curValue = (propConf.isOption ? options : values.current)[propConf.name],
        aplValue = values.applied[propConf.name];
      return propConf.hasSE ?
        [0, 1].some(function(i) {
          return (
            log( // [DEBUG/]
            propConf.hasChanged ?
              propConf.hasChanged(aplValue[i], curValue[i]) : aplValue[i] !== curValue[i]
            , propConf.name + '[' + i + ']') // [DEBUG/]
            );
        }) :
        log( // [DEBUG/]
        propConf.hasChanged ? propConf.hasChanged(aplValue, curValue) : aplValue !== curValue
        , propConf.name) // [DEBUG/]
        ;
    });
  }

  /**
   * @param {Object} values - Values that are saved such as `props.positionVals`.
   * @param {Object} options - `props.options` of `LeaderLine` instance.
   * @param {Object} conf - Config such as `POSITION_PROPS`.
   * @returns {void}
   */
  function saveProps(values, options, conf) {
    conf.forEach(function(propConf) {
      var curValue = (propConf.isOption ? options : values.current)[propConf.name];
      values.applied[propConf.name] = propConf.hasSE ? [curValue[0], curValue[1]] : curValue;
    });
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Array.<Point[]>} pathList - Array contains points.
   * @returns {void}
   */
  function updatePath(props, pathList) {
    var pathVals = props.pathVals,
      pathEdge = props.viewBBoxVals.pathEdge;
    // Convert to `pathData`.
    pathVals.current.pathData = [{type: 'M', values: [pathList[0][0].x, pathList[0][0].y]}];
    pathEdge.x1 = pathEdge.x2 = pathList[0][0].x;
    pathEdge.y1 = pathEdge.y2 = pathList[0][0].y;
    pathList.forEach(function(points) {
      pathVals.current.pathData.push(points.length === 2 ?
        {type: 'L', values: [points[1].x, points[1].y]} :
        {type: 'C', values: [points[1].x, points[1].y, points[2].x, points[2].y, points[3].x, points[3].y]});
      points.forEach(function(point) {
        /* eslint-disable eqeqeq */
        if (point.x < pathEdge.x1) { pathEdge.x1 = point.x; }
        if (point.x > pathEdge.x2) { pathEdge.x2 = point.x; }
        if (point.y < pathEdge.y1) { pathEdge.y1 = point.y; }
        if (point.y > pathEdge.y2) { pathEdge.y2 = point.y; }
        /* eslint-enable eqeqeq */
      });
    });

    // Apply `pathData`
    if (propsHasChanged(pathVals, props.options, PATH_PROPS)) {
      window.traceLog.push('setPathData'); // [DEBUG/]
      props.linePath.setPathData(pathVals.current.pathData);
      pathVals.applied.pathData = pathVals.current.pathData;

      if (IS_TRIDENT) {
        // [TRIDENT] markerOrient is not updated when path is changed
        forceReflow(props.plugsFace);
        // [TRIDENT] lineMaskCaps is ignored when path is changed
        forceReflow(props.lineMaskCaps);
      } else if (IS_GECKO) {
        // [GECKO] path is not updated when path is changed
        forceReflow(props.linePath);
      }

      if (props.effect && props.effect.onUpdatePath) {
        props.effect.onUpdatePath(props, pathList);
      }
    }
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updateViewBBox(props) {
    var viewBBoxVals = props.viewBBoxVals,
      padding = Math.max(
        props.options.lineSize / 2, viewBBoxVals.plugBCircleSE[0], viewBBoxVals.plugBCircleSE[1]),
      // Expand bBox with `line` or symbols
      pointsVal = {
        x1: viewBBoxVals.pathEdge.x1 - padding,
        y1: viewBBoxVals.pathEdge.y1 - padding,
        x2: viewBBoxVals.pathEdge.x2 + padding,
        y2: viewBBoxVals.pathEdge.y2 + padding
      },
      viewHasChanged = false;

    viewBBoxVals.current.x = pointsVal.x1;
    viewBBoxVals.current.y = pointsVal.y1;
    viewBBoxVals.current.width = pointsVal.x2 - pointsVal.x1;
    viewBBoxVals.current.height = pointsVal.y2 - pointsVal.y1;

    // Position `<svg>` element and set its `viewBox`
    (function(baseVal, styles) {
      ['x', 'y', 'width', 'height'].forEach(function(boxKey) {
        if (viewBBoxVals.current[boxKey] !== viewBBoxVals.applied[boxKey]) {
          window.traceLog.push('viewBox.' + boxKey); // [DEBUG/]
          viewBBoxVals.applied[boxKey] = baseVal[boxKey] = viewBBoxVals.current[boxKey];
          styles[BBOX_PROP[boxKey]] = viewBBoxVals.current[boxKey] +
            (boxKey === 'x' || boxKey === 'y' ? props.bodyOffset[boxKey] : 0) + 'px';
          viewHasChanged = true;
        }
      });
    })(props.svg.viewBox.baseVal, props.svg.style);

    return viewHasChanged;
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {boolean} viewHasChanged - `true` if it was changed.
   * @returns {void}
   */
  function updateMask(props, viewHasChanged) {
    var maskVals = props.maskVals,
      plugHasMaskSE = maskVals.current.plugHasMaskSE,
      anchorHasMaskSE = maskVals.current.anchorHasMaskSE,
      // plugMaskIsNewSE = [], anchorMaskIsNewSE = [],
      viewBBoxVals;

    // In current version, masks are used anytime and those were already updated when `viewHasChanged`.
    // Therefore, those are not updated when any `*MaskIsNewSE` is `true`.

    [0, 1].forEach(function(i) {
      /*
      var curPlugHasMask = plugHasMaskSE[i],
        aplPlugHasMaskSE = maskVals.applied.plugHasMaskSE,
        curAnchorHasMask = anchorHasMaskSE[i],
        aplAnchorHasMaskSE = maskVals.applied.anchorHasMaskSE;

      if (!aplPlugHasMaskSE[i] && curPlugHasMask) { // off -> on
        window.traceLog.push('new-plugMask[' + i + ']'); // [DEBUG/]
        plugMaskIsNewSE[i] = true;
      }
      aplPlugHasMaskSE[i] = curPlugHasMask;

      if (!aplAnchorHasMaskSE[i] && curAnchorHasMask) { // off -> on
        window.traceLog.push('new-anchorMask[' + i + ']'); // [DEBUG/]
        anchorMaskIsNewSE[i] = true;
      }
      aplAnchorHasMaskSE[i] = curAnchorHasMask;
      */
      maskVals.applied.plugHasMaskSE[i] = plugHasMaskSE[i];
      maskVals.applied.anchorHasMaskSE[i] = anchorHasMaskSE[i];
    });

    // Update `<mask>`s that are positioned based on `viewBox`
    if (viewHasChanged && ( // `viewBox` was changed and `<mask>`s are used
          plugHasMaskSE[0] || plugHasMaskSE[1] || anchorHasMaskSE[0] || anchorHasMaskSE[1])/* ||
        // Or, `<mask>`s that might not yet be positioned are used
        plugMaskIsNewSE[0] || plugMaskIsNewSE[1] || anchorMaskIsNewSE[0] || anchorMaskIsNewSE[1] */) {
      viewBBoxVals = props.viewBBoxVals.current;
      ['x', 'y', 'width', 'height'].forEach(function(boxKey) {
        if ((maskVals.current[boxKey] = viewBBoxVals[boxKey]) !== maskVals.applied[boxKey]) {
          window.traceLog.push('mask.' + boxKey); // [DEBUG/]
          maskVals.applied[boxKey] =
            props.lineMask[boxKey].baseVal.value =
            props.lineOutlineMask[boxKey].baseVal.value = maskVals.current[boxKey];
          if (boxKey === 'x' || boxKey === 'y') {
            props.lineMaskBGRect[boxKey].baseVal.value = maskVals.current[boxKey];
          }
        }
      });
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
    props.lineMaskMarkerIdSE = [prefix + '-line-mask-marker-0', prefix + '-line-mask-marker-1'];
    props.lineMaskCapsId = prefix + '-line-mask-caps';
    props.lineMaskBGRectId = prefix + '-line-mask-bg-rect';
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
      Names of `options` : Keys of API
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
      newWindow, currentValue,
      needsWindow, needsLine, needsPlugSE = [null, null],
      needsLineOutline, needsPlugOutlineSE = [null, null], needsEffect, needsPosition;

    function getInternal(name, optionName, index) {
      var internal = {};
      if (optionName) {
        if (index != null) { // eslint-disable-line eqeqeq
          internal.currentOptions = options[optionName];
          internal.optionKey = index;
          internal.defaultOption = DEFAULT_OPTIONS[optionName] && DEFAULT_OPTIONS[optionName][index];
        } else {
          internal.currentOptions = options;
          internal.optionKey = optionName;
          internal.defaultOption = DEFAULT_OPTIONS[optionName];
        }
      } else {
        internal.currentOptions = options;
        internal.optionKey = name;
        internal.defaultOption = DEFAULT_OPTIONS[name];
      }
      internal.acceptsAuto = internal.defaultOption == null; // eslint-disable-line eqeqeq
      return internal;
    }

    function setValidId(name, key2Id, optionName, index) {
      var internal = getInternal(name, optionName, index), update, key, id;
      if (newOptions[name] != null && // eslint-disable-line eqeqeq
          (key = (newOptions[name] + '').toLowerCase()) && (
            internal.acceptsAuto && key === KEYWORD_AUTO ||
            (id = key2Id[key])
          ) && id !== internal.currentOptions[internal.optionKey]) {
        internal.currentOptions[internal.optionKey] = id; // `undefined` when `KEYWORD_AUTO`
        update = true;
      }
      // eslint-disable-next-line eqeqeq
      if (internal.currentOptions[internal.optionKey] == null && !internal.acceptsAuto) {
        internal.currentOptions[internal.optionKey] = internal.defaultOption;
        update = true;
      }
      return update;
    }

    function setValidType(name, type, optionName, index, check) {
      var internal = getInternal(name, optionName, index), update, value;
      if (!type) {
        // eslint-disable-next-line eqeqeq
        if (internal.defaultOption == null) { throw new Error('Invalid `type`: ' + name); }
        type = typeof internal.defaultOption;
      }
      if (newOptions[name] != null && ( // eslint-disable-line eqeqeq
            internal.acceptsAuto && (newOptions[name] + '').toLowerCase() === KEYWORD_AUTO ||
            typeof (value = newOptions[name]) === type &&
              (!check || check(value))
          ) && value !== internal.currentOptions[internal.optionKey]) {
        internal.currentOptions[internal.optionKey] = value; // `undefined` when `KEYWORD_AUTO`
        update = true;
      }
      // eslint-disable-next-line eqeqeq
      if (internal.currentOptions[internal.optionKey] == null && !internal.acceptsAuto) {
        internal.currentOptions[internal.optionKey] = internal.defaultOption;
        update = true;
      }
      return update;
    }

    function addPropList(prop, list) {
      if (!list) {
        list = [prop];
      } else if (Array.isArray(list)) {
        if (list.indexOf(prop) < 0) { list.push(prop); }
      } // Otherwise `list` is `true`.
      return list;
    }

    function matchArray(array1, array2) {
      return array1.legth === array2.legth &&
        array1.every(function(value1, i) { return value1 === array2[i]; });
    }

    newOptions = newOptions || {};

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
      needsLine = needsPlugSE[0] = needsPlugSE[1] =
        needsLineOutline = needsPlugOutlineSE[0] = needsPlugOutlineSE[1] = needsEffect = true;
    }

    needsPosition = setValidId('path', PATH_KEY_2_ID) || needsPosition;
    needsPosition = setValidId('startSocket', SOCKET_KEY_2_ID, 'socketSE', 0) || needsPosition;
    needsPosition = setValidId('endSocket', SOCKET_KEY_2_ID, 'socketSE', 1) || needsPosition;

    // Since `plugOutline*`s might be affected by `plug*`s and `lineOutline*`s, check `plugOutline*`s before those.
    ['startPlugOutline', 'endPlugOutline'].forEach(function(name, i) {
      var currentValue = options.plugOutlineEnabledSE[i];
      if (setValidType(name, null, 'plugOutlineEnabledSE', i)) {
        needsPlugOutlineSE[i] = addPropList('plugOutlineEnabled', needsPlugOutlineSE[i]);
        if (!currentValue) { // off -> on
          needsPlugOutlineSE[i] = addPropList('plugOutlineColor', needsPlugOutlineSE[i]);
          needsPlugOutlineSE[i] = addPropList('plugOutlineSize', needsPlugOutlineSE[i]);
        }
      }
      // Update at least `options` even if `plugOutlineEnabled` and visual is not changed.
      if (setValidType(name + 'Color', 'string', 'plugOutlineColorSE', i)) {
        if (typeof options.plugOutlineColorSE[i] === 'string' && options.plugOutlineColorSE[i]) {
          options.plugOutlineColorSE[i] = options.plugOutlineColorSE[i].trim();
        }
        needsPlugOutlineSE[i] = addPropList('plugOutlineColor', needsPlugOutlineSE[i]);
      }
      if (setValidType(name + 'Size', null, 'plugOutlineSizeSE', i,
          function(value) { return value >= 1; })) { // `outlineMax` is checked in `setPlugOutline`.
        needsPlugOutlineSE[i] = addPropList('plugOutlineSize', needsPlugOutlineSE[i]);
      }
    });

    // Since `plug*`s might be affected by `lineColor` and `lineSize`, check `plug*`s before those.
    ['startPlug', 'endPlug'].forEach(function(name, i) {
      var currentValue = options.plugSE[i];
      if (setValidId(name, PLUG_KEY_2_ID, 'plugSE', i)) {
        needsPlugSE[i] = addPropList('plug', needsPlugSE[i]);
        needsPosition = true;
        if (currentValue === PLUG_BEHIND) { // off -> on
          needsPlugSE[i] = addPropList('plugColor', needsPlugSE[i]);
          needsPlugSE[i] = addPropList('plugSize', needsPlugSE[i]);
        }
        if (currentValue === PLUG_BEHIND || options.plugSE[i] === PLUG_BEHIND) { // off -> on / on -> off
          needsPlugOutlineSE[i] = true; // Update all of `plugOutline*`.
        } else if (options.plugOutlineEnabledSE[i]) { // on -> on
          needsPlugOutlineSE[i] = addPropList('plugOutlineSize', needsPlugOutlineSE[i]); // for new SymbolConf
        }
      }
      // Update at least `options` even if `PLUG_BEHIND` and visual is not changed.
      if (setValidType(name + 'Color', 'string', 'plugColorSE', i)) {
        if (typeof options.plugColorSE[i] === 'string' && options.plugColorSE[i]) {
          options.plugColorSE[i] = options.plugColorSE[i].trim();
        }
        needsPlugSE[i] = addPropList('plugColor', needsPlugSE[i]);
      }
      if (setValidType(name + 'Size', null, 'plugSizeSE', i,
          function(value) { return value > 0; })) {
        needsPlugSE[i] = addPropList('plugSize', needsPlugSE[i]);
        needsPosition = true;
        if (options.plugOutlineEnabledSE[i]) {
          needsPlugOutlineSE[i] = addPropList('plugOutlineSize', needsPlugOutlineSE[i]);
        }
      }
    });

    // Since `lineOutlineSize` might be affected by `lineSize`, check `lineOutline*`s before those.
    currentValue = options.lineOutlineEnabled;
    if (setValidType('outline', null, 'lineOutlineEnabled')) {
      needsLineOutline = addPropList('lineOutlineEnabled', needsLineOutline);
      if (!currentValue) { // off -> on
        needsLineOutline = addPropList('lineOutlineColor', needsLineOutline);
        needsLineOutline = addPropList('lineOutlineSize', needsLineOutline);
      }
    }
    // Update at least `options` even if `lineOutlineEnabled` and visual is not changed.
    if (setValidType('outlineColor', null, 'lineOutlineColor')) {
      if (typeof options.lineOutlineColor === 'string' && options.lineOutlineColor) {
        options.lineOutlineColor = options.lineOutlineColor.trim();
      }
      needsLineOutline = addPropList('lineOutlineColor', needsLineOutline);
      options.plugSE.forEach(function(plug, i) {
        if (plug !== PLUG_BEHIND && options.plugOutlineEnabledSE[i] && !options.plugOutlineColorSE[i]) {
          needsPlugOutlineSE[i] = addPropList('plugOutlineColor', needsPlugOutlineSE[i]);
        }
      });
    }
    if (setValidType('outlineSize', null, 'lineOutlineSize', null,
        function(value) { return value > 0 && value <= 0.48; })) {
      needsLineOutline = addPropList('lineOutlineSize', needsLineOutline);
    }

    if (setValidType('color', null, 'lineColor')) {
      if (typeof options.lineColor === 'string' && options.lineColor) {
        options.lineColor = options.lineColor.trim();
      }
      needsLine = addPropList('lineColor', needsLine);
      options.plugSE.forEach(function(plug, i) {
        if (plug !== PLUG_BEHIND && !options.plugColorSE[i]) {
          needsPlugSE[i] = addPropList('plugColor', needsPlugSE[i]);
        }
      });
    }
    if (setValidType('size', null, 'lineSize', null, function(value) { return value > 0; })) {
      needsLine = addPropList('lineSize', needsLine);
      needsPosition = true;
      // For `plugOverhead` and `plugBCircle`.
      needsPlugSE.forEach(function(list, i) { needsPlugSE[i] = addPropList('', list); });
      if (options.lineOutlineEnabled) {
        needsLineOutline = addPropList('lineOutlineSize', needsLineOutline);
      }
      [0, 1].forEach(function(i) {
        if (options.plugOutlineEnabledSE[i]) {
          needsPlugOutlineSE[i] = addPropList('plugOutlineSize', needsPlugOutlineSE[i]);
        }
      });
    }

    [newOptions.startSocketGravity, newOptions.endSocketGravity].forEach(function(newOption, i) {
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

    if (needsLine) { // Update styles of `line`.
      setLine(props, Array.isArray(needsLine) ? needsLine : null);
    }
    if (needsPlugSE[0] || needsPlugSE[1]) { // Update plugs.
      setPlug(props, [
        /* eslint-disable eqeqeq */
        needsPlugSE[0] == null ? [] : Array.isArray(needsPlugSE[0]) ? needsPlugSE[0] : null,
        needsPlugSE[1] == null ? [] : Array.isArray(needsPlugSE[1]) ? needsPlugSE[1] : null]);
        /* eslint-enable eqeqeq */
    }
    if (needsLineOutline) { // Update `lineOutline`.
      setLineOutline(props, Array.isArray(needsLineOutline) ? needsLineOutline : null);
    }
    if (needsPlugOutlineSE[0] || needsPlugOutlineSE[1]) { // Update `plugOutline`.
      setPlugOutline(props, [
        needsPlugOutlineSE[0] == null ? [] : // eslint-disable-line eqeqeq
          Array.isArray(needsPlugOutlineSE[0]) ? needsPlugOutlineSE[0] : null,
        needsPlugOutlineSE[1] == null ? [] : // eslint-disable-line eqeqeq
          Array.isArray(needsPlugOutlineSE[1]) ? needsPlugOutlineSE[1] : null]);
    }
    if (needsPosition) { // Call `position()`.
      this.position();
    }
    // Since current EFFECT_CONF might have event-handlers, call `setEffect` at the end.
    if (needsEffect) { // Update `effect`.
      setEffect(props);
    }

    return this;
  };

  LeaderLine.prototype.position = function() {
    window.traceLog.push('<position>'); // [DEBUG/]
    var props = insProps[this._id],
      options = props.options,
      curPosition = props.positionVals.current, socketXYSE = curPosition.socketXYSE,
      anchorMaskVals = props.anchorMaskVals,
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

    anchorBBoxSE = [getBBoxNest(options.anchorSE[0], props.baseWindow),
      getBBoxNest(options.anchorSE[1], props.baseWindow)];

    // Decide each socket
    (function() {
      var socketXYsWk, socketsLenMin = -1, iFix, iAuto;
      if (options.socketSE[0] && options.socketSE[1]) {
        socketXYSE[0] = getSocketXY(anchorBBoxSE[0], options.socketSE[0]);
        socketXYSE[1] = getSocketXY(anchorBBoxSE[1], options.socketSE[1]);

      } else if (!options.socketSE[0] && !options.socketSE[1]) {
        socketXYsWk = SOCKET_IDS.map(function(socketId) { return getSocketXY(anchorBBoxSE[1], socketId); });
        SOCKET_IDS.map(function(socketId) { return getSocketXY(anchorBBoxSE[0], socketId); })
          .forEach(function(socketXY0) {
            socketXYsWk.forEach(function(socketXY1) {
              var len = getPointsLength(socketXY0, socketXY1);
              if (len < socketsLenMin || socketsLenMin === -1) {
                socketXYSE[0] = socketXY0;
                socketXYSE[1] = socketXY1;
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
        socketXYSE[iFix] = getSocketXY(anchorBBoxSE[iFix], options.socketSE[iFix]);
        socketXYsWk = SOCKET_IDS.map(function(socketId) { return getSocketXY(anchorBBoxSE[iAuto], socketId); });
        socketXYsWk.forEach(function(socketXY) {
          var len = getPointsLength(socketXY, socketXYSE[iFix]);
          if (len < socketsLenMin || socketsLenMin === -1) {
            socketXYSE[iAuto] = socketXY;
            socketsLenMin = len;
          }
        });
      }
    })();

    // New position
    if (propsHasChanged(props.positionVals, options, POSITION_PROPS)) {
      window.traceLog.push('new-pathList.baseVal'); // [DEBUG/]
      pathList = props.pathList.baseVal = [];

      // Generate path segments
      switch (options.path) {

        case PATH_STRAIGHT:
          pathList.push([socketXY2Point(socketXYSE[0]), socketXY2Point(socketXYSE[1])]);
          break;

        case PATH_ARC:
          (function() {
            var
              downward =
                typeof options.socketGravitySE[0] === 'number' && options.socketGravitySE[0] > 0 ||
                typeof options.socketGravitySE[1] === 'number' && options.socketGravitySE[1] > 0,
              circle8rad = CIRCLE_8_RAD * (downward ? -1 : 1),
              angle = Math.atan2(socketXYSE[1].y - socketXYSE[0].y, socketXYSE[1].x - socketXYSE[0].x),
              cp1Angle = -angle + circle8rad,
              cp2Angle = Math.PI - angle - circle8rad,
              crLen = getPointsLength(socketXYSE[0], socketXYSE[1]) / Math.sqrt(2) * CIRCLE_CP,
              cp1 = {
                x: socketXYSE[0].x + Math.cos(cp1Angle) * crLen,
                y: socketXYSE[0].y + Math.sin(cp1Angle) * crLen * -1},
              cp2 = {
                x: socketXYSE[1].x + Math.cos(cp2Angle) * crLen,
                y: socketXYSE[1].y + Math.sin(cp2Angle) * crLen * -1};
            pathList.push([socketXY2Point(socketXYSE[0]), cp1, cp2, socketXY2Point(socketXYSE[1])]);
          })();
          break;

        case PATH_FLUID:
        case PATH_MAGNET:
          (/* @EXPORT[file:../test/spec/func/PATH_FLUID]@ */function(socketGravitySE) {
            var cx = [], cy = [];
            socketXYSE.forEach(function(socketXY, i) {
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
                anotherSocketXY = socketXYSE[i ? 0 : 1];
                overhead = curPosition.plugOverheadSE[i];
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
            pathList.push([socketXY2Point(socketXYSE[0]),
              {x: cx[0], y: cy[0]}, {x: cx[1], y: cy[1]}, socketXY2Point(socketXYSE[1])]);
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

            socketXYSE.forEach(function(socketXY, i) {
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
        curPosition.plugOverheadSE.forEach(function(plugOverhead, i) {
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
            socketId = socketXYSE[i].socketId;
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

      if (props.effect && props.effect.onPosition) {
        props.effect.onPosition(props, pathList);
      }

      updatePath(props, pathList);
      saveProps(props.positionVals, options, POSITION_PROPS);
    }

    updateMask(props, updateViewBBox(props));

    // Decide `anchorMask` (check coordinates also)
    anchorBBoxSE.forEach(function(anchorBBox, i) {
      if (props.maskVals.current.anchorHasMaskSE[i]) {
        var update;
        ['x', 'y', 'width', 'height'].forEach(function(boxKey) {
          var propKey = boxKey + 'SE';
          if ((anchorMaskVals.current[propKey][i] = anchorBBox[BBOX_PROP[boxKey]]) !==
              anchorMaskVals.applied[propKey][i]) {
            window.traceLog.push('anchorMask[' + i + '].' + boxKey); // [DEBUG/]
            anchorMaskVals.applied[propKey][i] =
              props.lineMaskAnchorSE[i][boxKey].baseVal.value = anchorMaskVals.current[propKey][i];
            update = true;
          }
        });
        if (update && props.effect && props.effect.onUpdateAnchorBBox) {
          props.effect.onUpdateAnchorBBox(props, i);
        }
      }
    });

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
