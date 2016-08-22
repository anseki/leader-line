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
    RE_PERCENT = /^\s*(\-?[\d\.]+)\s*(\%)?\s*$/,
    SVG_NS = 'http://www.w3.org/2000/svg',

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
        var proto, constructor;
        return obj && toString.call(obj) === '[object Object]' &&
          (!(proto = Object.getPrototypeOf(obj)) ||
            (constructor = proto.hasOwnProperty('constructor') && proto.constructor) &&
            typeof constructor === 'function' && fnToString.call(constructor) === objFnString);
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
      path_pathData: {},
      viewBox_bBox: {hasProps: true},
      viewBox_plugBCircleSE: {hasSE: true}, viewBox_pathEdge: {hasProps: true},
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
    svg2SupportedReverse, svg2SupportedPaintOrder; // Supported SVG 2 features

  // [DEBUG]
  window.insProps = insProps;
  window.insAttachProps = insAttachProps;
  window.isObject = isObject;
  window.IS_TRIDENT = IS_TRIDENT;
  window.IS_BLINK = IS_BLINK;
  window.IS_GECKO = IS_GECKO;
  window.IS_EDGE = IS_EDGE;
  window.IS_WEBKIT = IS_WEBKIT;
  // [/DEBUG]

  function hasChanged(a, b) {
    var typeA, keysA;
    return typeof a !== typeof b ||
      (typeA = isObject(a) ? 'obj' : Array.isArray(a) ? 'array' : '') !==
        (isObject(b) ? 'obj' : Array.isArray(b) ? 'array' : '') ||
      (
        typeA === 'obj' ?
          hasChanged((keysA = Object.keys(a)), Object.keys(b)) ||
            keysA.some(function(prop) { return hasChanged(a[prop], b[prop]); }) :
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
   * @returns {Array} - Alpha channel ([0, 1]) such as `0.6`, and base color. e.g. [0.6, 'rgb(10, 20, 30)']
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
  window.pathList2PathData = pathList2PathData; // [DEBUG/]

  function pathDataHasChanged(a, b) {
    return a == null || b == null || // eslint-disable-line eqeqeq
      a.length !== b.length || a.some(function(aSeg, i) {
        var bSeg = b[i];
        return aSeg.type !== bSeg.type ||
          aSeg.values.some(function(aSegValue, i) { return aSegValue !== bSeg.values[i]; });
      });
  }

  function bBox2PathData(bBox) {
    var right = bBox.right != null ? bBox.right : bBox.left + bBox.width, // eslint-disable-line eqeqeq
      bottom = bBox.bottom != null ? bBox.bottom : bBox.top + bBox.height; // eslint-disable-line eqeqeq
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
      traceLog.add('<execDelayedProcs>'); // [DEBUG/]
      delayedProcs.forEach(function(proc) { proc(); });
      delayedProcs = [];
      traceLog.add('</execDelayedProcs>'); // [DEBUG/]
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
  window.forceReflow = forceReflow; // [DEBUG/]

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

  function setStyles(element, styles) {
    var style = element.style;
    Object.keys(styles).forEach(function(key) { style[key] = styles[key]; });
    return element;
  }

  function initStats(container, statsConf) {
    Object.keys(statsConf).forEach(function(statName) {
      var statConf = statsConf[statName];
      container[statName] =
        statConf.iniValue != null ? ( // eslint-disable-line eqeqeq
          statConf.hasSE ? [statConf.iniValue, statConf.iniValue] : statConf.iniValue
        ) :
        statConf.hasSE ? (statConf.hasProps ? [{}, {}] : []) : statConf.hasProps ? {} : null;
    });
  }

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

  // [DEBUG]
  function checkCurStats(props, key, i, value, log) {
    /* eslint-disable eqeqeq */
    if (value !== (i == null ? props.curStats[key] : props.curStats[key][i])) {
      traceLog.add(log || 'curStats.' + key + (i == null ? '' : '[' + i + ']') + '=%s', value);
    }
    /* eslint-enable eqeqeq */
  }
  // [/DEBUG]

  /**
   * Get distance between `window` and its `<body>`.
   * @param {Window} window - Target `window`.
   * @returns {{x: number, y: number}} - Length.
   */
  function getBodyOffset(window) {
    function sumProps(value, addValue) { return (value += parseFloat(addValue)); }

    var baseDocument = window.document,
      stylesHtml = window.getComputedStyle(baseDocument.documentElement),
      stylesBody = window.getComputedStyle(baseDocument.body),
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
    var baseDocument = window.document, defs;
    if (!baseDocument.getElementById(DEFS_ID)) { // Add svg defs
      defs = (new window.DOMParser()).parseFromString(DEFS_HTML, 'image/svg+xml');
      baseDocument.body.appendChild(defs.documentElement);
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
    traceLog.add('<bindWindow>'); // [DEBUG/]
    var baseDocument = newWindow.document,
      svg, elmDefs, maskCaps, element, aplStats = props.aplStats;

    function setupMask(id) {
      var element = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'mask'));
      element.id = id;
      element.maskUnits.baseVal = SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE;
      [element.x, element.y, element.width, element.height].forEach(function(len) {
        len.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0);
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
      [element.width, element.height].forEach(function(len) {
        len.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PERCENTAGE, 100);
      });
      return element;
    }

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
    elmDefs = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'defs'));

    props.linePath = element = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
    element.id = props.linePathId;
    element.className.baseVal = APP_ID + '-line-path';
    if (IS_WEBKIT) {
      // [WEBKIT] style in `use` is not updated
      element.style.fill = 'none';
    }

    props.lineShape = element = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.id = props.lineShapeId;
    element.href.baseVal = '#' + props.linePathId;

    maskCaps = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'g'));
    maskCaps.id = props.capsId;

    props.capsMaskAnchorSE = [0, 1].map(function() {
      var element = maskCaps.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
      element.className.baseVal = APP_ID + '-caps-mask-anchor';
      return element;
    });

    props.capsMaskMarkerSE = [0, 1].map(function(i) { return setupMarker(props.lineMaskMarkerIdSE[i]); });
    props.capsMaskMarkerShapeSE = [0, 1].map(function(i) {
      var element = props.capsMaskMarkerSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
      element.className.baseVal = APP_ID + '-caps-mask-marker-shape';
      return element;
    });

    props.capsMaskLine = element = maskCaps.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.className.baseVal = APP_ID + '-caps-mask-line';
    element.href.baseVal = '#' + props.lineShapeId;

    props.maskBGRect = element = setWH100(elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'rect')));
    element.id = props.maskBGRectId;
    element.className.baseVal = APP_ID + '-mask-bg-rect';
    if (IS_WEBKIT) {
      // [WEBKIT] style in `use` is not updated
      element.style.fill = 'white';
    }

    // lineMask
    props.lineMask = setWH100(setupMask(props.lineMaskId));
    props.lineMaskBG = element = props.lineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + props.maskBGRectId;
    props.lineMaskShape = element = props.lineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.className.baseVal = APP_ID + '-line-mask-shape';
    element.href.baseVal = '#' + props.linePathId;
    element.style.display = 'none';
    props.lineMaskCaps = element = props.lineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + props.capsId;

    // lineOutlineMask
    props.lineOutlineMask = setWH100(setupMask(props.lineOutlineMaskId));
    element = props.lineOutlineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + props.maskBGRectId;
    props.lineOutlineMaskShape = element =
      props.lineOutlineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.className.baseVal = APP_ID + '-line-outline-mask-shape';
    element.href.baseVal = '#' + props.linePathId;
    props.lineOutlineMaskCaps = element =
      props.lineOutlineMask.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + props.capsId;

    /* reserve for future version
    props.lineFG = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'g'));
    props.lineFG.id = props.lineFGId;
    props.lineFGRect = setWH100(props.lineFG.appendChild(baseDocument.createElementNS(SVG_NS, 'rect')));
    */

    // lineGradient
    props.lineGradient = element = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'linearGradient'));
    element.id = props.lineGradientId;
    element.gradientUnits.baseVal = SVGUnitTypes.SVG_UNIT_TYPE_USERSPACEONUSE;
    [element.x1, element.y1, element.x2, element.y2].forEach(function(len) {
      len.baseVal.newValueSpecifiedUnits(SVGLength.SVG_LENGTHTYPE_PX, 0);
    });
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

    props.lineFace = element = props.face.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + props.lineShapeId;

    props.lineOutlineFace = element = props.face.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.href.baseVal = '#' + props.lineShapeId;
    element.style.mask = 'url(#' + props.lineOutlineMaskId + ')';
    element.style.display = 'none';

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

    props.plugsFace = element = props.face.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    element.className.baseVal = APP_ID + '-plugs-face';
    element.href.baseVal = '#' + props.lineShapeId;
    element.style.display = 'none';

    props.pathList = {};
    // Init stats
    initStats(aplStats, STATS);
    Object.keys(EFFECTS).forEach(function(effectName) {
      var keyEnabled = effectName + '_enabled';
      if (aplStats[keyEnabled]) {
        EFFECTS[effectName].remove(props);
        aplStats[keyEnabled] = false; // it might not have been disabled by remove().
      }
    });

    if (props.curStats.show_inAnim) {
      props.isShown = 1;
      SHOW_EFFECTS[aplStats.show_effect].stop(props, true); // svgShow() is called
    } else if (!props.isShown) {
      svg.style.visibility = 'hidden';
    }
    baseDocument.body.appendChild(svg);

    traceLog.add('</bindWindow>'); // [DEBUG/]
  }
  window.bindWindow = bindWindow; // [DEBUG/]

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {boolean} - `true` if it was changed.
   */
  function updateLine(props) {
    traceLog.add('<updateLine>'); // [DEBUG/]
    var options = props.options, curStats = props.curStats, events = props.events,
      updated = false;

    updated = setStat(props, curStats, 'line_color', options.lineColor, events.cur_line_color) || updated;
    updated = setStat(props, curStats, 'line_colorTra', getAlpha(curStats.line_color)[0] < 1) || updated;
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
        width, height, plugMarkerWidth, plugMarkerHeight, plugSideLen, plugBackLen, value;

      updated = setStat(props, curStats.plug_enabledSE, i, plugId !== PLUG_BEHIND
        /* [DEBUG] */, null, 'plug_enabledSE[' + i + ']=%s'/* [/DEBUG] */) || updated;
      updated = setStat(props, curStats.plug_plugSE, i, plugId
        /* [DEBUG] */, null, 'plug_plugSE[' + i + ']=%s'/* [/DEBUG] */) || updated;
      updated = setStat(props, curStats.plug_colorSE, i, (value = options.plugColorSE[i] || curStats.line_color),
        events.cur_plug_colorSE/* [DEBUG] */, 'plug_colorSE[' + i + ']=%s'/* [/DEBUG] */) || updated;
      updated = setStat(props, curStats.plug_colorTraSE, i, getAlpha(value)[0] < 1
        /* [DEBUG] */, null, 'plug_colorTraSE[' + i + ']=%s'/* [/DEBUG] */) || updated;

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
          /* [DEBUG] */, null, 'plug_markerWidthSE[' + i + ']%_'/* [/DEBUG] */) || updated;
        updated = setStat(props, curStats.plug_markerHeightSE, i, plugMarkerHeight
          /* [DEBUG] */, null, 'plug_markerHeightSE[' + i + ']%_'/* [/DEBUG] */) || updated;

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
        /* [DEBUG] */, 'attach_plugSideLenSE[' + i + ']%_'/* [/DEBUG] */);
      setStat(props, curStats.attach_plugBackLenSE, i, plugBackLen, events.cur_attach_plugBackLenSE
        /* [DEBUG] */, 'attach_plugBackLenSE[' + i + ']%_'/* [/DEBUG] */);
      curStats.capsMaskAnchor_enabledSE[i] = !curStats.plug_enabledSE[i];
    });

    // It might be independent of `curStats.plug_enabledSE` in future version.
    updated = setStat(props, curStats, 'plug_enabled',
      curStats.plug_enabledSE[0] || curStats.plug_enabledSE[1]) || updated;

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
    var options = props.options, curStats = props.curStats,
      outlineWidth,
      updated = false;

    updated = setStat(props, curStats, 'lineOutline_enabled', options.lineOutlineEnabled) || updated;
    updated = setStat(props, curStats, 'lineOutline_color', options.lineOutlineColor) || updated;
    updated = setStat(props, curStats, 'lineOutline_colorTra',
      getAlpha(curStats.lineOutline_color)[0] < 1) || updated;

    outlineWidth = curStats.line_strokeWidth * options.lineOutlineSize;

    updated = setStat(props, curStats, 'lineOutline_strokeWidth', curStats.line_strokeWidth - outlineWidth * 2
      /* [DEBUG] */, null, 'lineOutline_strokeWidth%_'/* [/DEBUG] */) || updated;
    updated = setStat(props, curStats, 'lineOutline_inStrokeWidth',
      curStats.lineOutline_colorTra ?
        curStats.lineOutline_strokeWidth + SHAPE_GAP * 2 :
        curStats.line_strokeWidth - outlineWidth // half
      /* [DEBUG] */, null, 'lineOutline_inStrokeWidth%_'/* [/DEBUG] */) || updated;

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
          !!symbolConf && !!symbolConf.outlineBase // Not depend on `curStats.plug_enabledSE`
        /* [DEBUG] */, null, 'plugOutline_enabledSE[' + i + ']=%s'/* [/DEBUG] */) || updated;
      updated = setStat(props, curStats.plugOutline_colorSE, i,
        (value = options.plugOutlineColorSE[i] || curStats.lineOutline_color)
        /* [DEBUG] */, null, 'plugOutline_colorSE[' + i + ']=%s'/* [/DEBUG] */) || updated;
      updated = setStat(props, curStats.plugOutline_colorTraSE, i, getAlpha(value)[0] < 1
        /* [DEBUG] */, null, 'plugOutline_colorTraSE[' + i + ']=%s'/* [/DEBUG] */) || updated;

      if (symbolConf && symbolConf.outlineBase) { // Not depend on `curStats.plugOutline_enabledSE`

        value = options.plugOutlineSizeSE[i];
        if (value > symbolConf.outlineMax) { value = symbolConf.outlineMax; }
        value *= symbolConf.outlineBase * 2;
        updated = setStat(props, curStats.plugOutline_strokeWidthSE, i, value
          /* [DEBUG] */, null, 'plugOutline_strokeWidthSE[' + i + ']%_'/* [/DEBUG] */) || updated;
        updated = setStat(props, curStats.plugOutline_inStrokeWidthSE, i,
          curStats.plugOutline_colorTraSE[i] ?
            value - SHAPE_GAP / (curStats.line_strokeWidth / DEFAULT_OPTIONS.lineSize) /
              options.plugSizeSE[i] * 2 :
            value / 2 // half
          /* [DEBUG] */, null, 'plugOutline_inStrokeWidthSE[' + i + ']%_'/* [/DEBUG] */) || updated;
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
          events.apl_lineOutline_strokeWidth/* [DEBUG] */, 'lineOutline_strokeWidth%_'/* [/DEBUG] */)) {
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
          events.apl_lineOutline_inStrokeWidth/* [DEBUG] */, 'lineOutline_inStrokeWidth%_'/* [/DEBUG] */)) {
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
            events.apl_plug_enabledSE/* [DEBUG] */, 'plug_enabledSE[' + i + ']=%s'/* [/DEBUG] */)) {
          props.plugsFace.style[marker.prop] = value ? 'url(#' + props.plugMarkerIdSE[i] + ')' : 'none';
          updated = true;
        }

        if (curStats.plug_enabledSE[i]) {

          if (setStat(props, aplStats.plug_plugSE, i, plugId,
              events.apl_plug_plugSE/* [DEBUG] */, 'plug_plugSE[' + i + ']=%s'/* [/DEBUG] */)) {
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
              events.apl_plug_colorSE/* [DEBUG] */, 'plug_colorSE[' + i + ']=%s'/* [/DEBUG] */)) {
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
                events['apl_' + statKey]/* [DEBUG] */, statKey + '[' + i + ']%_'/* [/DEBUG] */)) {
              props.plugMarkerSE[i][markerKey].baseVal.value = value;
              updated = true;
            }
          });

          if (setStat(props, aplStats.plugOutline_enabledSE, i, (value = curStats.plugOutline_enabledSE[i]),
              events.apl_plugOutline_enabledSE
              /* [DEBUG] */, 'plugOutline_enabledSE[' + i + ']=%s'/* [/DEBUG] */)) {
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
                /* [DEBUG] */, 'plugOutline_plugSE[' + i + ']=%s'/* [/DEBUG] */)) {
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
                /* [DEBUG] */, 'plugOutline_colorSE[' + i + ']=%s'/* [/DEBUG] */)) {
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
                /* [DEBUG] */, 'plugOutline_strokeWidthSE[' + i + ']%_'/* [/DEBUG] */)) {
              props.plugOutlineMaskShapeSE[i].style.strokeWidth = value + 'px';
              updated = true;
            }

            if (setStat(props, aplStats.plugOutline_inStrokeWidthSE, i,
                (value = curStats.plugOutline_inStrokeWidthSE[i]),
                events.apl_plugOutline_inStrokeWidthSE
                /* [DEBUG] */, 'plugOutline_inStrokeWidthSE[' + i + ']%_'/* [/DEBUG] */)) {
              props.plugMaskShapeSE[i].style.strokeWidth = value + 'px';
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

    // [DEBUG]
    if (curStats.position_path !== aplStats.position_path) { traceLog.add('position_path'); }
    if (curStats.position_lineStrokeWidth !== aplStats.position_lineStrokeWidth) {
      traceLog.add('position_lineStrokeWidth');
    }
    [0, 1].forEach(function(i) {
      if (curStats.position_plugOverheadSE[i] !== aplStats.position_plugOverheadSE[i]) {
        traceLog.add('position_plugOverheadSE[' + i + ']');
      }
      if (socketXYHasChanged(curSocketXYSE[i], aplStats.position_socketXYSE[i])) {
        traceLog.add('position_socketXYSE[' + i + ']');
      }
      if (socketGravityHasChanged(curSocketGravitySE[i], aplStats.position_socketGravitySE[i])) {
        traceLog.add('position_socketGravitySE[' + i + ']');
      }
    });
    // [/DEBUG]

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
      pathList = props.pathList.animVal || props.pathList.baseVal,
      updated = false;

    if (pathList) {
      curPathEdge.x1 = curPathEdge.x2 = pathList[0][0].x;
      curPathEdge.y1 = curPathEdge.y2 = pathList[0][0].y;
      curStats.path_pathData = curPathData = pathList2PathData(pathList, function(point) {
        if (point.x < curPathEdge.x1) { curPathEdge.x1 = point.x; }
        if (point.x > curPathEdge.x2) { curPathEdge.x2 = point.x; }
        if (point.y < curPathEdge.y1) { curPathEdge.y1 = point.y; }
        if (point.y > curPathEdge.y2) { curPathEdge.y2 = point.y; }
      });

      // Apply `pathData`
      if (pathDataHasChanged(curPathData, aplStats.path_pathData)) {
        traceLog.add('path_pathData'); // [DEBUG/]
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
        traceLog.add(boxKey); // [DEBUG/]
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
            /* [DEBUG] */, null, statKey + '%_'/* [/DEBUG] */)) {
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
              /* [DEBUG] */, null, 'capsMaskAnchor_enabledSE[' + i + ']=%s'/* [/DEBUG] */)) {
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
              traceLog.add('capsMaskAnchor_pathDataSE[' + i + ']'); // [DEBUG/]
              props.capsMaskAnchorSE[i].setPathData(curPathData);
              aplStats.capsMaskAnchor_pathDataSE[i] = curPathData;
              updated = true;
            }

            // capsMaskAnchor_strokeWidthSE
            if (setStat(props, aplStats.capsMaskAnchor_strokeWidthSE, i,
                (value = curStats.capsMaskAnchor_strokeWidthSE[i])
                /* [DEBUG] */, null, 'capsMaskAnchor_strokeWidthSE[' + i + ']=%s'/* [/DEBUG] */)) {
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
                /* [DEBUG] */, null, 'capsMaskMarker_enabledSE[' + i + ']=%s'/* [/DEBUG] */)) {
              props.capsMaskLine.style[marker.prop] =
                value ? 'url(#' + props.lineMaskMarkerIdSE[i] + ')' : 'none';
              updated = true;
            }

            if (curStats.capsMaskMarker_enabledSE[i]) {

              // capsMaskMarker_plugSE
              if (setStat(props, aplStats.capsMaskMarker_plugSE, i, plugId
                  /* [DEBUG] */, null, 'capsMaskMarker_plugSE[' + i + ']=%s'/* [/DEBUG] */)) {
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
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {(boolean|number)} on - true:show | false:hide | 1:show(in anim)
   * @returns {void}
   */
  function svgShow(props, on) {
    traceLog.add('<svgShow>'); // [DEBUG/]
    if (on !== props.isShown) {
      traceLog.add('on=' + on); // [DEBUG/]
      if (!!on !== !!props.isShown) { props.svg.style.visibility = on ? '' : 'hidden'; }
      props.isShown = on;
      if (props.events && props.events.svgShow) {
        props.events.svgShow.forEach(function(handler) { handler(props, on); });
      }
    }
    traceLog.add('</svgShow>'); // [DEBUG/]
  }

  /**
   * Apply all of `effect`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @returns {void}
   */
  function setEffect(props) {
    traceLog.add('<setEffect>'); // [DEBUG/]
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

    // [DEBUG]
    traceLog.add('<update>');
    Object.keys(updated).forEach(function(key) {
      if (updated[key]) { traceLog.add('updated.' + key); }
    });
    traceLog.add('</update>');
    // [/DEBUG]
  }

  function getValidAnimOptions(animOptions, defaultAnimOptions) {
    return {
      duration: typeof animOptions.duration === 'number' && animOptions.duration > 0 ?
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

    // [DEBUG]
    traceLog.add('<show>');
    Object.keys(update).forEach(function(key) {
      if (update[key]) { traceLog.add('update.' + key); }
    });
    traceLog.add('</show>');
    // [/DEBUG]
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {attachProps} attachProps - `attachProps` of `LeaderLineAttachment` instance.
   * @param {string} optionName - Name of bound option.
   * @returns {boolean} - `true` when binding succeeded.
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
        if (index != null) { // eslint-disable-line eqeqeq
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
      curOption.acceptsAuto = curOption.default == null; // eslint-disable-line eqeqeq
      return curOption;
    }

    function setValidId(root, newOptions, propName, key2Id, optionName, index, defaultValue) {
      var curOption = getCurOption(root, propName, optionName, index, defaultValue), updated, key, id;
      if (newOptions[propName] != null && // eslint-disable-line eqeqeq
          (key = (newOptions[propName] + '').toLowerCase()) && (
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

    function setValidType(root, newOptions, propName, type, optionName, index, defaultValue, check, trim) {
      var curOption = getCurOption(root, propName, optionName, index, defaultValue), updated, value;
      if (!type) {
        // eslint-disable-next-line eqeqeq
        if (curOption.default == null) { throw new Error('Invalid `type`: ' + propName); }
        type = typeof curOption.default;
      }
      if (newOptions[propName] != null && ( // eslint-disable-line eqeqeq
            curOption.acceptsAuto && (newOptions[propName] + '').toLowerCase() === KEYWORD_AUTO ||
            typeof (value = newOptions[propName]) === type &&
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
    ['start', 'end'].forEach(function(optionName, i) {
      var newOption = newOptions[optionName], newIsAttachment = false;
      if (newOption &&
          (newOption.nodeType != null || // eslint-disable-line eqeqeq
            (newIsAttachment = isAttachment(newOption, 'anchor'))) &&
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
            label = new LeaderLineAttachment(ATTACHMENTS.caption, {text: newOption});
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
          // eslint-disable-next-line eqeqeq
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

    // [DEBUG]
    traceLog.add('<setOptions>');
    Object.keys(needs).forEach(function(key) { if (needs[key]) { traceLog.add('needs.' + key); } });
    traceLog.add('</setOptions>');
    // [/DEBUG]

    update(props, needs);
  }

  /**
   * @class
   * @param {Element} [start] - Alternative to `options.start`.
   * @param {Element} [end] - Alternative to `options.end`.
   * @param {Object} [options] - Initial options.
   */
  function LeaderLine(start, end, options) {
    var that = this,
      props = {
        // Initialize properties as array.
        options: {anchorSE: [], socketSE: [], socketGravitySE: [], plugSE: [], plugColorSE: [], plugSizeSE: [],
          plugOutlineEnabledSE: [], plugOutlineColorSE: [], plugOutlineSizeSE: [], labelSEM: ['', '', '']},
        optionIsAttach: {anchorSE: [false, false], labelSEM: [false, false, false]},
        curStats: {}, aplStats: {}, attachments: [], events: {}, reflowTargets: []
      },
      prefix;

    function createSetter(propName) {
      return function(value) {
        var options = {};
        options[propName] = value;
        that.setOptions(options);
      };
    }

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

    Object.defineProperty(that, '_id', {value: ++insId});
    insProps[that._id] = props;

    prefix = APP_ID + '-' + that._id;
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
    props.isShown = props.aplStats.show_on = !options.hide; // isShown is applied in setOptions -> bindWindow
    that.setOptions(options);

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
        Object.defineProperty(that, propName, {
          get: function() {
            var value = // Don't use closure.
              i != null ? insProps[that._id].options[optionName][i] : // eslint-disable-line eqeqeq
              optionName ? insProps[that._id].options[optionName] :
              insProps[that._id].options[propName];
            return value == null ? KEYWORD_AUTO : copyTree(value); // eslint-disable-line eqeqeq
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
        Object.defineProperty(that, propName, {
          get: function() {
            var value = // Don't use closure.
                i != null ? insProps[that._id].options[optionName][i] : // eslint-disable-line eqeqeq
                optionName ? insProps[that._id].options[optionName] :
                insProps[that._id].options[propName],
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
              i != null ? optionValue[optionName][i] : // eslint-disable-line eqeqeq
              optionName ? optionValue[optionName] :
              optionValue[propName],
            key;
          effectOptions[propName] = optionClass === 'id' ? (
              !value ? KEYWORD_AUTO :
              Object.keys(key2Id).some(function(optKey) {
                if (key2Id[optKey] === value) { key = optKey; return true; }
                return false;
              }) ? key : new Error('It\'s broken')
            ) : (
              value == null ? KEYWORD_AUTO : copyTree(value) // eslint-disable-line eqeqeq
            );
          return effectOptions;
        }, {});
        if (effectConf.anim) {
          effectOptions.animation = copyTree(optionValue.animation);
        }
        return effectOptions;
      }

      Object.defineProperty(that, effectName, {
        get: function() {
          var value = insProps[that._id].options[effectName];
          return isObject(value) ? getOptions(value) : value;
        },
        set: createSetter(effectName),
        enumerable: true
      });
    });
    // Setup option accessor methods (label)
    ['startLabel', 'endLabel', 'middleLabel'].forEach(function(propName, i) {
      Object.defineProperty(that, propName, {
        get: function() {
          var props = insProps[that._id], options = props.options; // Don't use closure.
          return options.labelSEM[i] && !props.optionIsAttach.labelSEM[i] ?
            insAttachProps[options.labelSEM[i]._id].text : options.labelSEM[i] || '';
        },
        set: createSetter(propName),
        enumerable: true
      });
    });
  }

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
        traceLog.add('<EFFECTS.dash.init>'); // [DEBUG/]
        addEventHandler(props, 'apl_line_strokeWidth', EFFECTS.dash.update);
        props.lineFace.style.strokeDashoffset = 0;
        EFFECTS.dash.update(props);
        traceLog.add('</EFFECTS.dash.init>'); // [DEBUG/]
      },

      remove: function(props) {
        traceLog.add('<EFFECTS.dash.remove>'); // [DEBUG/]
        var curStats = props.curStats;
        removeEventHandler(props, 'apl_line_strokeWidth', EFFECTS.dash.update);
        if (curStats.dash_animId) {
          anim.remove(curStats.dash_animId);
          curStats.dash_animId = null;
        }
        props.lineFace.style.strokeDasharray = 'none';
        props.lineFace.style.strokeDashoffset = 0;
        initStats(props.aplStats, EFFECTS.dash.stats);
        traceLog.add('</EFFECTS.dash.remove>'); // [DEBUG/]
      },

      update: function(props) {
        traceLog.add('<EFFECTS.dash.update>'); // [DEBUG/]
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
            traceLog.add('anim.remove'); // [DEBUG/]
            if (curStats.dash_animId) {
              timeRatio = anim.stop(curStats.dash_animId);
              anim.remove(curStats.dash_animId);
            }
            aplStats.dash_animOptions = null;
          }

          if (!aplStats.dash_animOptions) { // OFF -> ON
            traceLog.add('anim.add'); // [DEBUG/]
            curStats.dash_animId = anim.add(
              function(outputRatio) { return (1 - outputRatio) * aplStats.dash_maxOffset + 'px'; },
              function(value) { props.lineFace.style.strokeDashoffset = value; },
              curStats.dash_animOptions.duration, 0, curStats.dash_animOptions.timing, false, timeRatio);
            aplStats.dash_animOptions = copyTree(curStats.dash_animOptions);
          }

        } else if (aplStats.dash_animOptions) { // ON -> OFF
          // Normally, anim was already removed when effectOptions was changed.
          traceLog.add('anim.remove'); // [DEBUG/]
          if (curStats.dash_animId) {
            anim.remove(curStats.dash_animId);
            curStats.dash_animId = null;
          }
          props.lineFace.style.strokeDashoffset = 0;
          aplStats.dash_animOptions = null;
        }

        traceLog.add('</EFFECTS.dash.update>'); // [DEBUG/]
      }
    },

    gradient: {
      stats: {gradient_colorSE: {hasSE: true}, gradient_pointSE: {hasSE: true, hasProps: true}},

      optionsConf: [
        ['type', 'startColor', 'string', 'colorSE', 0, null, null, true],
        ['type', 'endColor', 'string', 'colorSE', 1, null, null, true]
      ],

      init: function(props) {
        traceLog.add('<EFFECTS.gradient.init>'); // [DEBUG/]
        addEventHandler(props, 'cur_plug_colorSE', EFFECTS.gradient.update);
        addEventHandler(props, 'apl_path', EFFECTS.gradient.update);
        props.curStats.line_altColor = true;
        props.lineFace.style.stroke = 'url(#' + props.lineGradientId + ')';
        EFFECTS.gradient.update(props);
        traceLog.add('</EFFECTS.gradient.init>'); // [DEBUG/]
      },

      remove: function(props) {
        traceLog.add('<EFFECTS.gradient.remove>'); // [DEBUG/]
        removeEventHandler(props, 'cur_plug_colorSE', EFFECTS.gradient.update);
        removeEventHandler(props, 'apl_path', EFFECTS.gradient.update);
        props.curStats.line_altColor = false;
        props.lineFace.style.stroke = props.curStats.line_color;
        initStats(props.aplStats, EFFECTS.gradient.stats);
        traceLog.add('</EFFECTS.gradient.remove>'); // [DEBUG/]
      },

      update: function(props) {
        traceLog.add('<EFFECTS.gradient.update>'); // [DEBUG/]
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
              /* [DEBUG] */, null, 'gradient_colorSE[' + i + ']=%s'/* [/DEBUG] */)) {
            if (IS_WEBKIT) {
              // [WEBKIT] stopColor doesn't support alpha channel
              value = getAlpha(value);
              props.lineGradientStopSE[i].style.stopColor = value[1];
              props.lineGradientStopSE[i].style.stopOpacity = value[0];
            } else {
              props.lineGradientStopSE[i].style.stopColor = value;
            }
          }

          ['x', 'y'].forEach(function(pointKey) {
            if ((value = curStats.gradient_pointSE[i][pointKey]) !== aplStats.gradient_pointSE[i][pointKey]) {
              traceLog.add('gradient_pointSE[' + i + '].' + pointKey); // [DEBUG/]
              props.lineGradient[pointKey + (i + 1)].baseVal.value = aplStats.gradient_pointSE[i][pointKey] = value;
            }
          });
        });
        traceLog.add('</EFFECTS.gradient.update>'); // [DEBUG/]
      }
    },

    dropShadow: {
      stats: {dropShadow_colorSE: {hasSE: true}, dropShadow_pointSE: {hasSE: true, hasProps: true}},

      optionsConf: [
        ['type', 'len', null, null, null, 15, function(value) { return value > 0; }],
        ['type', 'gap', 'number', null, null, null, function(value) { return value > 0; }]
      ],

      init: function(props) {
        traceLog.add('<EFFECTS.dropShadow.init>'); // [DEBUG/]
        traceLog.add('</EFFECTS.dropShadow.init>'); // [DEBUG/]
      },

      remove: function(props) {
        traceLog.add('<EFFECTS.dropShadow.remove>'); // [DEBUG/]
        traceLog.add('</EFFECTS.dropShadow.remove>'); // [DEBUG/]
      },

      update: function(props) {
        traceLog.add('<EFFECTS.dropShadow.update>'); // [DEBUG/]
        traceLog.add('</EFFECTS.dropShadow.update>'); // [DEBUG/]
      }
    }
  };
  window.EFFECTS = EFFECTS; // [DEBUG/]

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
        traceLog.add('<SHOW_EFFECTS.none.init>'); // [DEBUG/]
        var curStats = props.curStats;
        if (curStats.show_animId) {
          anim.remove(curStats.show_animId);
          curStats.show_animId = null;
        }
        SHOW_EFFECTS.none.start(props, timeRatio);
        traceLog.add('</SHOW_EFFECTS.none.init>'); // [DEBUG/]
      },

      start: function(props, timeRatio) {
        traceLog.add('<SHOW_EFFECTS.none.start>'); // [DEBUG/]
        // [DEBUG]
        traceLog.add('timeRatio=' + (timeRatio != null ? 'timeRatio' : 'NONE')); // eslint-disable-line eqeqeq
        // [/DEBUG]
        SHOW_EFFECTS.none.stop(props, true);
        traceLog.add('</SHOW_EFFECTS.none.start>'); // [DEBUG/]
      },

      stop: function(props, finish, on) {
        traceLog.add('<SHOW_EFFECTS.none.stop>'); // [DEBUG/]
        traceLog.add('finish=' + finish); // [DEBUG/]
        // [DEBUG]
        var dbgLog = 'on=' + (on != null ? 'on' : 'aplStats.show_on'); // eslint-disable-line eqeqeq
        // [/DEBUG]
        var curStats = props.curStats;
        on = on != null ? on : props.aplStats.show_on; // eslint-disable-line eqeqeq
        traceLog.add(dbgLog + '=' + on); // [DEBUG/]
        curStats.show_inAnim = false;
        if (finish) { svgShow(props, on); }
        traceLog.add('</SHOW_EFFECTS.none.stop>'); // [DEBUG/]
        return on ? 1 : 0;
      }
    },

    fade: {
      defaultAnimOptions: {duration: 300, timing: 'linear'},

      init: function(props, timeRatio) {
        traceLog.add('<SHOW_EFFECTS.fade.init>'); // [DEBUG/]
        var curStats = props.curStats, aplStats = props.aplStats;
        if (curStats.show_animId) { anim.remove(curStats.show_animId); }
        curStats.show_animId = anim.add(
          function(outputRatio) { return outputRatio; },
          function(value, finish) {
            if (finish) {
              SHOW_EFFECTS.fade.stop(props, true);
            } else {
              props.svg.style.opacity = value;
              // [TRIDENT] masks is ignored when opacity of svg is changed
              if (IS_TRIDENT) { forceReflowAdd(props, props.svg); forceReflowApply(props); }
            }
          },
          aplStats.show_animOptions.duration, 1, aplStats.show_animOptions.timing, null, false);
        SHOW_EFFECTS.fade.start(props, timeRatio);
        traceLog.add('</SHOW_EFFECTS.fade.init>'); // [DEBUG/]
      },

      start: function(props, timeRatio) {
        traceLog.add('<SHOW_EFFECTS.fade.start>'); // [DEBUG/]
        var curStats = props.curStats, prevTimeRatio;
        if (curStats.show_inAnim) {
          prevTimeRatio = anim.stop(curStats.show_animId);
        }
        svgShow(props, 1);
        // [DEBUG]
        traceLog.add('timeRatio=' +
          // eslint-disable-next-line eqeqeq
          (timeRatio != null ? 'timeRatio' : prevTimeRatio != null ? 'prevTimeRatio' : 'NONE'));
        // [/DEBUG]
        curStats.show_inAnim = true;
        anim.start(curStats.show_animId, !props.aplStats.show_on,
          timeRatio != null ? timeRatio : prevTimeRatio); // eslint-disable-line eqeqeq
        traceLog.add('</SHOW_EFFECTS.fade.start>'); // [DEBUG/]
      },

      stop: function(props, finish, on) {
        traceLog.add('<SHOW_EFFECTS.fade.stop>'); // [DEBUG/]
        traceLog.add('finish=' + finish); // [DEBUG/]
        // [DEBUG]
        var dbgLog = 'on=' + (on != null ? 'on' : 'aplStats.show_on'); // eslint-disable-line eqeqeq
        // [/DEBUG]
        var curStats = props.curStats, timeRatio;
        on = on != null ? on : props.aplStats.show_on; // eslint-disable-line eqeqeq
        traceLog.add(dbgLog + '=' + on); // [DEBUG/]
        timeRatio = curStats.show_inAnim ? anim.stop(curStats.show_animId) : on ? 1 : 0;
        curStats.show_inAnim = false;
        if (finish) {
          props.svg.style.opacity = on ? 1 : 0;
          svgShow(props, on);
        }
        traceLog.add('</SHOW_EFFECTS.fade.stop>'); // [DEBUG/]
        return timeRatio;
      }
    },

    draw: {
      defaultAnimOptions: {duration: 500, timing: [0.58, 0, 0.42, 1]},

      init: function(props, timeRatio) {
        traceLog.add('<SHOW_EFFECTS.draw.init>'); // [DEBUG/]
        var curStats = props.curStats, aplStats = props.aplStats,
          pathList = props.pathList.baseVal, pathSegsLen = [], pathLenAll = 0;
        if (curStats.show_animId) { anim.remove(curStats.show_animId); }

        pathList.forEach(function(points) {
          var pathLen = (points.length === 2 ? getPointsLength : getCubicLength).apply(null, points);
          pathSegsLen.push(pathLen);
          pathLenAll += pathLen;
        });

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
        traceLog.add('</SHOW_EFFECTS.draw.init>'); // [DEBUG/]
      },

      start: function(props, timeRatio) {
        traceLog.add('<SHOW_EFFECTS.draw.start>'); // [DEBUG/]
        var curStats = props.curStats, prevTimeRatio;
        if (curStats.show_inAnim) {
          prevTimeRatio = anim.stop(curStats.show_animId);
        }
        svgShow(props, 1);
        // [DEBUG]
        traceLog.add('timeRatio=' +
          // eslint-disable-next-line eqeqeq
          (timeRatio != null ? 'timeRatio' : prevTimeRatio != null ? 'prevTimeRatio' : 'NONE'));
        // [/DEBUG]
        curStats.show_inAnim = true;
        addEventHandler(props, 'apl_position', SHOW_EFFECTS.draw.update);
        anim.start(curStats.show_animId, !props.aplStats.show_on,
          timeRatio != null ? timeRatio : prevTimeRatio); // eslint-disable-line eqeqeq
        traceLog.add('</SHOW_EFFECTS.draw.start>'); // [DEBUG/]
      },

      stop: function(props, finish, on) {
        traceLog.add('<SHOW_EFFECTS.draw.stop>'); // [DEBUG/]
        traceLog.add('finish=' + finish); // [DEBUG/]
        // [DEBUG]
        var dbgLog = 'on=' + (on != null ? 'on' : 'aplStats.show_on'); // eslint-disable-line eqeqeq
        // [/DEBUG]
        var curStats = props.curStats, timeRatio;
        on = on != null ? on : props.aplStats.show_on; // eslint-disable-line eqeqeq
        traceLog.add(dbgLog + '=' + on); // [DEBUG/]
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
        traceLog.add('</SHOW_EFFECTS.draw.stop>'); // [DEBUG/]
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
  window.SHOW_EFFECTS = SHOW_EFFECTS; // [DEBUG/]

  /**
   * attachProps or id must be specified.
   * @param {attachProps|null} attachProps - `attachProps` of `LeaderLineAttachment` instance.
   * @param {number} [id] - `_id` of `LeaderLineAttachment` instance..
   * @returns {void}
   */
  removeAttachment = function(attachProps, id) {
    traceLog.add('<removeAttachment>'); // [DEBUG/]
    if (!attachProps && !(attachProps = insAttachProps[id])) {
      traceLog.add('not-found'); // [DEBUG/]
      traceLog.add('</removeAttachment>'); // [DEBUG/]
      return;
    }
    if (!id && !Object.keys(insAttachProps).some(function(attachId) {
      if (insAttachProps[attachId] === attachProps) {
        id = attachId;
        return true;
      }
      return false;
    })) {
      traceLog.add('not-found'); // [DEBUG/]
      traceLog.add('</removeAttachment>'); // [DEBUG/]
      return;
    }

    attachProps.boundTargets.slice().forEach(
      function(boundTarget) { unbindAttachment(boundTarget.props, attachProps, true); });
    if (attachProps.conf.remove) { attachProps.conf.remove(attachProps); }
    delete insAttachProps[id];
    traceLog.add('</removeAttachment>'); // [DEBUG/]
  };

  LeaderLineAttachment = (function() {
    /**
     * @class
     * @param {AttachConf} conf - Target AttachConf.
     * @param {Object} attachOptions - Initial options.
     */
    function LeaderLineAttachment(conf, attachOptions) {
      var attachProps = {conf: conf, curStats: {}, aplStats: {}, boundTargets: []};

      if (conf.stats) {
        initStats(attachProps.curStats, conf.stats);
        initStats(attachProps.aplStats, conf.stats);
      }

      Object.defineProperty(this, '_id', {value: ++insAttachId});
      Object.defineProperty(this, 'isRemoved', {
        get: function() { return !insAttachProps[this._id]; }
      });

      // isRemoved has to be set before this because init() might throw.
      if (!conf.init || conf.init(attachProps, isObject(attachOptions) ? attachOptions : {}, this._id)) {
        insAttachProps[this._id] = attachProps;
      }
    }

    LeaderLineAttachment.prototype.remove = function() {
      traceLog.add('<LeaderLineAttachment.remove>'); // [DEBUG/]
      var that = this, attachProps = insAttachProps[that._id];
      if (attachProps) {
        attachProps.boundTargets.slice().forEach( // Copy boundTargets because removeOption may change array.
          function(boundTarget) { attachProps.conf.removeOption(attachProps, boundTarget); });

        addDelayedProc(function() {
          var attachProps = insAttachProps[that._id];
          traceLog.add('<LeaderLineAttachment.remove.delayedProc>'); // [DEBUG/]
          if (attachProps) { // it should be removed by unbinding all
            traceLog.add('error-not-removed'); // [DEBUG/]
            console.error('LeaderLineAttachment was not removed by removeOption');
            removeAttachment(attachProps, that._id); // force
          }
          traceLog.add('</LeaderLineAttachment.remove.delayedProc>'); // [DEBUG/]
        });
      }
      traceLog.add('</LeaderLineAttachment.remove>'); // [DEBUG/]
    };

    return LeaderLineAttachment;
  })();
  window.LeaderLineAttachment = LeaderLineAttachment;

  /**
   * @param {any} obj - An object to be checked.
   * @param {string} [type] - A required type of LeaderLineAttachment.
   * @returns {(boolean|null)} - true: Enabled LeaderLineAttachment, false: Not instance, null: Disabled it
   */
  isAttachment = function(obj, type) {
    return !(obj instanceof LeaderLineAttachment) ? false :
      (!type || insAttachProps[obj._id].conf.type === type) && !obj.isRemoved ? true : null;
  };

  /**
   * @typedef {Object} AttachConf
   * @property {string} type
   * @property {{statName: string, StatConf}} stats - Additional stats.
   * @property {Function} init - function(attachProps, attachOptions, id) returns `true` when succeeded.
   * @property {Function} bind - function(attachProps, bindTarget) returns `true` when succeeded.
   * @property {Function} unbind - function(attachProps, boundTarget)
   * @property {Function} removeOption - function(attachProps, boundTarget)
   * @property {Function} remove - function(attachProps)
   * @property {Function} [getStrokeWidth] - function(attachProps, props) type:anchro (update trigger)
   * @property {Function} [getPathData] - function(attachProps, props, strokeWidth) type:anchro
   * @property {Function} [getBBoxNest] - function(attachProps, props, strokeWidth) type:anchro
   */

  /** @type {{attachmentName: string, AttachConf}} */
  ATTACHMENTS = {
    point: {
      type: 'anchor',

      // attachOptions: element, x, y
      init: function(attachProps, attachOptions) {
        traceLog.add('<ATTACHMENTS.point.init>'); // [DEBUG/]
        attachProps.element = ATTACHMENTS.point.checkElement(attachOptions.element);
        attachProps.x = ATTACHMENTS.point.parsePercent(attachOptions.x, true) || [0];
        attachProps.y = ATTACHMENTS.point.parsePercent(attachOptions.y, true) || [0];
        traceLog.add('</ATTACHMENTS.point.init>'); // [DEBUG/]
        return true;
      },

      removeOption: function(attachProps, boundTarget) {
        traceLog.add('<ATTACHMENTS.point.removeOption>'); // [DEBUG/]
        traceLog.add(boundTarget.optionName); // [DEBUG/]
        var props = boundTarget.props, newOptions = {}, element = attachProps.element,
          another = props.options.anchorSE[boundTarget.optionName === 'start' ? 1 : 0];
        if (element === another) { // must be not another
          element = another === document.body ?
            new LeaderLineAttachment(ATTACHMENTS.point, {element: element}) : document.body;
        }
        newOptions[boundTarget.optionName] = element;
        setOptions(props, newOptions);
        traceLog.add('</ATTACHMENTS.point.removeOption>'); // [DEBUG/]
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
        var type = typeof value, matches, num, ratio = false;
        if (type === 'number') {
          num = value;
        } else if (type === 'string' && (matches = RE_PERCENT.exec(value)) && matches[2]) {
          num = parseFloat(matches[1]) / 100;
          ratio = num !== 0;
        }
        return num != null && (allowNegative || num >= 0) ? [num, ratio] : null; // eslint-disable-line eqeqeq
      },

      checkElement: function(element) {
        if (element == null) { // eslint-disable-line eqeqeq
          element = document.body;
        } else if (element.nodeType == null) { // eslint-disable-line eqeqeq
          throw new Error('`element` must be DOM');
        }
        return element;
      }
    },

    area: {
      type: 'anchor',
      stats: {color: {}, strokeWidth: {}, elementWidth: {}, elementHeight: {},
        pathListRel: {}, bBoxRel: {}, pathData: {}, viewBoxBBox: {hasProps: true}},

      // attachOptions: element, color(A), fillColor, size(A), shape, x, y, width, height, radius, points
      init: function(attachProps, attachOptions) {
        traceLog.add('<ATTACHMENTS.area.init>'); // [DEBUG/]
        var points = [], baseDocument, svg, window;
        attachProps.element = ATTACHMENTS.point.checkElement(attachOptions.element);
        if (typeof attachOptions.color === 'string') {
          attachProps.color = attachOptions.color.trim();
        }
        if (typeof attachOptions.fillColor === 'string') {
          attachProps.fill = attachOptions.fillColor.trim();
        }
        if (typeof attachOptions.size === 'number' && attachOptions.size >= 0) {
          attachProps.size = attachOptions.size;
        }

        if (attachOptions.shape === 'circle') {
          attachProps.shape = attachOptions.shape;
        } else if (attachOptions.shape === 'polygon' &&
            Array.isArray(attachOptions.points) && attachOptions.points.length >= 3 &&
            attachOptions.points.every(function(point) {
              var validPoint = {};
              if ((validPoint.x = ATTACHMENTS.point.parsePercent(point[0], true)) &&
                  (validPoint.y = ATTACHMENTS.point.parsePercent(point[1], true))) {
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
            typeof attachOptions.radius === 'number' && attachOptions.radius >= 0 ? attachOptions.radius : 0;
        }

        if (attachProps.shape === 'rect' || attachProps.shape === 'circle') {
          attachProps.x = ATTACHMENTS.point.parsePercent(attachOptions.x, true) || [-0.05, true];
          attachProps.y = ATTACHMENTS.point.parsePercent(attachOptions.y, true) || [-0.05, true];
          attachProps.width = ATTACHMENTS.point.parsePercent(attachOptions.width) || [1.1, true];
          attachProps.height = ATTACHMENTS.point.parsePercent(attachOptions.height) || [1.1, true];
          if (attachProps.x[1] || attachProps.y[1] ||
            attachProps.width[1] || attachProps.height[1]) { attachProps.hasRatio = true; }
        }

        // SVG
        baseDocument = attachProps.element.ownerDocument;
        attachProps.svg = svg = baseDocument.createElementNS(SVG_NS, 'svg');
        svg.className.baseVal = APP_ID + '-attach-area';
        if (!svg.viewBox.baseVal) { svg.setAttribute('viewBox', '0 0 0 0'); } // for Firefox bug
        attachProps.path = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
        attachProps.path.style.fill = attachProps.fill || 'none';
        attachProps.isShown = false;
        svg.style.visibility = 'hidden';
        baseDocument.body.appendChild(svg);
        setupWindow((window = baseDocument.defaultView));
        attachProps.bodyOffset = getBodyOffset(window); // Get `bodyOffset`

        // event handler for each instance
        attachProps.updateColor = function() {
          traceLog.add('<ATTACHMENTS.area.updateColor>'); // [DEBUG/]
          var curStats = attachProps.curStats, aplStats = attachProps.aplStats,
            llStats = attachProps.boundTargets.length ? attachProps.boundTargets[0].props.curStats : null,
            value;

          curStats.color = attachProps.color || (llStats ? llStats.line_color : DEFAULT_OPTIONS.lineColor);
          if (setStat(attachProps, aplStats, 'color', (value = curStats.color))) {
            attachProps.path.style.stroke = value;
          }
          traceLog.add('</ATTACHMENTS.area.updateColor>'); // [DEBUG/]
        };

        attachProps.updateShow = function() {
          svgShow(attachProps, attachProps.boundTargets.some(
            function(boundTarget) { return boundTarget.props.isShown === true; }));
        };
        // event handler to update `strokeWidth` is unnecessary
        // because `getStrokeWidth` is triggered by `updateLine` and `updatePosition`

        traceLog.add('</ATTACHMENTS.area.init>'); // [DEBUG/]
        return true;
      },

      bind: function(attachProps, bindTarget) {
        traceLog.add('<ATTACHMENTS.area.bind>'); // [DEBUG/]
        var props = bindTarget.props;
        if (!attachProps.color) { addEventHandler(props, 'cur_line_color', attachProps.updateColor); }
        addEventHandler(props, 'svgShow', attachProps.updateShow);
        addDelayedProc(function() { // after updating `attachProps.boundTargets`
          attachProps.updateColor();
          attachProps.updateShow();
        });
        traceLog.add('</ATTACHMENTS.area.bind>'); // [DEBUG/]
        return true;
      },

      unbind: function(attachProps, boundTarget) {
        traceLog.add('<ATTACHMENTS.area.unbind>'); // [DEBUG/]
        var props = boundTarget.props;
        if (!attachProps.color) { removeEventHandler(props, 'cur_line_color', attachProps.updateColor); }
        removeEventHandler(props, 'svgShow', attachProps.updateShow);
        addDelayedProc(function() { // after updating `attachProps.boundTargets`
          attachProps.updateColor();
          attachProps.updateShow();
          ATTACHMENTS.area.update(attachProps); // it's not called by unbound ll
        });
        traceLog.add('</ATTACHMENTS.area.unbind>'); // [DEBUG/]
      },

      removeOption: function(attachProps, boundTarget) { ATTACHMENTS.point.removeOption(attachProps, boundTarget); },

      remove: function(attachProps) {
        traceLog.add('<ATTACHMENTS.area.remove>'); // [DEBUG/]
        if (attachProps.boundTargets.length) { // it should be unbound by LeaderLineAttachment.remove
          traceLog.add('error-not-unbound'); // [DEBUG/]
          console.error('LeaderLineAttachment was not unbound by remove');
          attachProps.boundTargets.forEach(
            function(boundTarget) { ATTACHMENTS.area.unbind(attachProps, boundTarget); });
        }
        attachProps.svg.parentNode.removeChild(attachProps.svg);
        traceLog.add('</ATTACHMENTS.area.remove>'); // [DEBUG/]
      },

      getStrokeWidth: function(attachProps) {
        ATTACHMENTS.area.update(attachProps);
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
        traceLog.add('<ATTACHMENTS.area.update>'); // [DEBUG/]
        var curStats = attachProps.curStats, aplStats = attachProps.aplStats,
          llStats = attachProps.boundTargets.length ? attachProps.boundTargets[0].props.curStats : null,
          elementBBox, value, updated = {};

        updated.strokeWidth = setStat(attachProps, curStats, 'strokeWidth',
          attachProps.size != null ? attachProps.size : // eslint-disable-line eqeqeq
            (llStats ? llStats.line_strokeWidth : DEFAULT_OPTIONS.lineSize));

        elementBBox = getBBox(attachProps.element);
        updated.elementWidth = setStat(attachProps, curStats, 'elementWidth', elementBBox.width);
        updated.elementHeight = setStat(attachProps, curStats, 'elementHeight', elementBBox.height);

        if (updated.strokeWidth ||
            attachProps.hasRatio && (updated.elementWidth || updated.elementHeight)) { // generate path
          traceLog.add('generate-path'); // [DEBUG/]
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
          traceLog.add('pathData'); // [DEBUG/]
          attachProps.path.setPathData(value);
          aplStats.pathData = value;
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
              traceLog.add(boxKey); // [DEBUG/]
              viewBox[boxKey] = aplVBBBox[boxKey] = value;
              styles[BBOX_PROP[boxKey]] = value +
                (boxKey === 'x' || boxKey === 'y' ? attachProps.bodyOffset[boxKey] : 0) + 'px';
            }
          });
        })();

        traceLog.add('</ATTACHMENTS.area.update>'); // [DEBUG/]
      }
    },

    caption: {
      type: 'label',
      stats: {color: {}, x: {}, y: {}},
      textStyleProps: ['fontFamily', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch',
        'fontSize', 'fontSizeAdjust', 'kerning', 'letterSpacing', 'wordSpacing', 'textDecoration'],

      // attachOptions: text, color(A), outlineColor, offset(A), <textStyleProps>
      init: function(attachProps, attachOptions, id) {
        traceLog.add('<ATTACHMENTS.caption.init>'); // [DEBUG/]
        if (typeof attachOptions.text === 'string') {
          attachProps.text = attachOptions.text.trim();
        }
        if (!attachProps.text) { return false; }
        if (typeof attachOptions.color === 'string') {
          attachProps.color = attachOptions.color.trim();
        }
        attachProps.outlineColor = '#fff'; // default
        if (typeof attachOptions.outlineColor === 'string') {
          attachProps.outlineColor = attachOptions.outlineColor.trim();
        }
        if (Array.isArray(attachOptions.offset) &&
            typeof attachOptions.offset[0] === 'number' && typeof attachOptions.offset[1] === 'number') {
          attachProps.offset = {x: attachOptions.offset[0], y: attachOptions.offset[1]};
        }
        if (typeof attachOptions.lineOffset === 'number') {
          attachProps.lineOffset = attachOptions.lineOffset;
        }

        ATTACHMENTS.caption.textStyleProps.forEach(function(propName) {
          if (attachOptions[propName] != null) { // eslint-disable-line eqeqeq
            attachProps[propName] = attachOptions[propName];
          }
        });
        attachProps.id = id;

        // event handler for each instance
        attachProps.updateColor = function(props) {
          traceLog.add('<ATTACHMENTS.caption.updateColor>'); // [DEBUG/]
          var curStats = attachProps.curStats, aplStats = attachProps.aplStats,
            llStats = props.curStats, value;

          curStats.color = attachProps.color || llStats.line_color;
          if (setStat(attachProps, aplStats, 'color', (value = curStats.color))) {
            attachProps.styleFill.fill = value;
          }
          traceLog.add('</ATTACHMENTS.caption.updateColor>'); // [DEBUG/]
        };

        attachProps.updateSocketXY = function(props) {
          traceLog.add('<ATTACHMENTS.caption.updateSocketXY>'); // [DEBUG/]
          var curStats = attachProps.curStats, aplStats = attachProps.aplStats,
            llStats = props.curStats, socketXY = llStats.position_socketXYSE[attachProps.socketIndex],
            margin, plugSideLen, anotherSocketXY, value;
          // It's not ready yet.
          if (socketXY.x == null) { return; } // eslint-disable-line eqeqeq

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

          if (setStat(attachProps, aplStats, 'x', (value = curStats.x))) {
            attachProps.elmPosition.x.baseVal.getItem(0).value = value;
          }
          if (setStat(attachProps, aplStats, 'y', (value = curStats.y))) {
            attachProps.elmPosition.y.baseVal.getItem(0).value = value + attachProps.height;
          }
          traceLog.add('</ATTACHMENTS.caption.updateSocketXY>'); // [DEBUG/]
        };

        attachProps.updatePath = function(props) {
          traceLog.add('<ATTACHMENTS.caption.updatePath>'); // [DEBUG/]
          var curStats = attachProps.curStats, aplStats = attachProps.aplStats,
            pathList = props.pathList.animVal || props.pathList.baseVal,
            point, value;

          point = ATTACHMENTS.caption.getMidPoint(pathList, attachProps.lineOffset);
          curStats.x = point.x - attachProps.width / 2;
          curStats.y = point.y - attachProps.height / 2;

          if (setStat(attachProps, aplStats, 'x', (value = curStats.x))) {
            attachProps.elmPosition.x.baseVal.getItem(0).value = value;
          }
          if (setStat(attachProps, aplStats, 'y', (value = curStats.y))) {
            attachProps.elmPosition.y.baseVal.getItem(0).value = value + attachProps.height;
          }
          traceLog.add('</ATTACHMENTS.caption.updatePath>'); // [DEBUG/]
        };

        attachProps.updateShow = function(props) {
          traceLog.add('<ATTACHMENTS.caption.updateShow>'); // [DEBUG/]
          var on = props.isShown === true;
          if (on !== attachProps.isShown) {
            traceLog.add('on=' + on); // [DEBUG/]
            attachProps.styleShow.visibility = on ? '' : 'hidden';
            attachProps.isShown = on;
          }
          traceLog.add('</ATTACHMENTS.caption.updateShow>'); // [DEBUG/]
        };

        traceLog.add('</ATTACHMENTS.caption.init>'); // [DEBUG/]
        return true;
      },

      /**
       * @param {string} text - Content of `<text>` element.
       * @param {Document} document - Document that contains `<svg>`.
       * @param {SVGSVGElement} svg - Parent `<svg>` element.
       * @param {string} id - ID of `<text>` element.
       * @param {boolean} [stroke] - Setup for `stroke`.
       * @returns {Object} - {elmPosition, styleText, styleFill, styleStroke, styleShow, elmsAppend}
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
        var pathSegsLen = [], pathLenAll = 0, pointLen, points, i = -1, newPathList;
        pathList.forEach(function(points) {
          var pathLen = (points.length === 2 ? getPointsLength : getCubicLength).apply(null, points);
          pathSegsLen.push(pathLen);
          pathLenAll += pathLen;
        });

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

      bind: function(attachProps, bindTarget) {
        traceLog.add('<ATTACHMENTS.caption.bind>'); // [DEBUG/]
        var props = bindTarget.props,
          text = ATTACHMENTS.caption.newText(attachProps.text, props.baseWindow.document,
            props.svg, APP_ID + '-attach-caption-' + attachProps.id, attachProps.outlineColor),
          bBox, strokeWidth;

        attachProps.elmPosition = text.elmPosition;
        attachProps.styleFill = text.styleFill;
        attachProps.styleShow = text.styleShow;
        attachProps.elmsAppend = text.elmsAppend;

        attachProps.isShown = false;
        attachProps.styleShow.visibility = 'hidden';
        ATTACHMENTS.caption.textStyleProps.forEach(function(propName) {
          if (attachProps[propName] != null) { // eslint-disable-line eqeqeq
            text.styleText[propName] = attachProps[propName];
          }
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
        addDelayedProc(function() { // after updating `attachProps.boundTargets`
          attachProps.updateColor(props);
          if (attachProps.refSocketXY) {
            attachProps.updateSocketXY(props);
          } else {
            attachProps.updatePath(props);
          }
          attachProps.updateShow(props);
        });
        traceLog.add('</ATTACHMENTS.caption.bind>'); // [DEBUG/]
        return true;
      },

      unbind: function(attachProps, boundTarget) {
        traceLog.add('<ATTACHMENTS.caption.unbind>'); // [DEBUG/]
        var props = boundTarget.props;
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

        if (attachProps.elmsAppend) {
          attachProps.elmsAppend.forEach(function(elm) { props.svg.removeChild(elm); });
        }
        initStats(attachProps.curStats, ATTACHMENTS.caption.stats);
        initStats(attachProps.aplStats, ATTACHMENTS.caption.stats);
        traceLog.add('</ATTACHMENTS.caption.unbind>'); // [DEBUG/]
      },

      removeOption: function(attachProps, boundTarget) {
        traceLog.add('<ATTACHMENTS.caption.removeOption>'); // [DEBUG/]
        traceLog.add(boundTarget.optionName); // [DEBUG/]
        var props = boundTarget.props, newOptions = {};
        newOptions[boundTarget.optionName] = '';
        setOptions(props, newOptions);
        traceLog.add('</ATTACHMENTS.caption.removeOption>'); // [DEBUG/]
      },

      remove: function(attachProps) {
        traceLog.add('<ATTACHMENTS.caption.remove>'); // [DEBUG/]
        if (attachProps.boundTargets.length) { // it should be unbound by LeaderLineAttachment.remove
          traceLog.add('error-not-unbound'); // [DEBUG/]
          console.error('LeaderLineAttachment was not unbound by remove');
          attachProps.boundTargets.forEach(
            function(boundTarget) { ATTACHMENTS.caption.unbind(attachProps, boundTarget); });
        }
        traceLog.add('</ATTACHMENTS.caption.remove>'); // [DEBUG/]
      }
    }
  };
  window.ATTACHMENTS = ATTACHMENTS; // [DEBUG/]

  Object.keys(ATTACHMENTS).forEach(function(attachmentName) {
    LeaderLine[attachmentName] = function(attachOptions) {
      return new LeaderLineAttachment(ATTACHMENTS[attachmentName], attachOptions);
    };
  });

  return LeaderLine;
})();
