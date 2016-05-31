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
   * @property {(number|null)} left
   * @property {(number|null)} top
   * @property {(number|null)} right
   * @property {(number|null)} bottom
   * @property {(number|null)} width
   * @property {(number|null)} height
   */

  /**
   * An object that has coordinates.
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

    STYLE_ID = APP_ID + '-styles',
    /* [DEBUG/]
    CSS_TEXT = '@INCLUDE[file:leader-line.css]@',
    [DEBUG/] */
    // [DEBUG]
    CSS_TEXT = '',
    // [/DEBUG]

    /**
     * @typedef {Object} SymbolConf
     * @property {string} elmId
     * @property {BBox} bBox
     * @property {number} widthR
     * @property {number} heightR
     * @property {number} outlineR
     * @property {number} overhead
     * @property {boolean} noRotate
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

    DEFAULT_OPTIONS = {
      path: PATH_FLUID,
      color: 'coral',
      size: 4,
      startPlug: PLUG_BEHIND,
      endPlug: DEFAULT_END_PLUG,
      startPlugSize: 1,
      endPlugSize: 1
    },

    POSITION_PROPS = [ // `anchorSE` and `socketXYSE` are checked always.
      {name: 'plugOverheadSE', has2: true},
      {name: 'plugOutlineRSE', has2: true},
      {name: 'path', isOption: true},
      {name: 'size', isOption: true},
      {name: 'socketGravitySE', has2: true, isOption: true}
    ],
    SOCKET_IDS = [SOCKET_TOP, SOCKET_RIGHT, SOCKET_BOTTOM, SOCKET_LEFT],
    KEYWORD_AUTO = 'auto',

    MIN_GRAVITY = 80, MIN_GRAVITY_SIZE = 4, MIN_GRAVITY_R = 5,
    MIN_OH_GRAVITY = 120, MIN_OH_GRAVITY_OH = 8, MIN_OH_GRAVITY_R = 3.75,
    MIN_ADJUST_LEN = 10, MIN_GRID_LEN = 30,

    CIRCLE_CP = 0.5522847, CIRCLE_8_RAD = 1 / 4 * Math.PI,
    IS_IE = !!document.uniqueID,

    /**
     * @typedef {Object.<_id: number, props>} insProps
     */
    insProps = {}, insId = 0, svg2Supported;

  // [DEBUG]
  window.insProps = insProps;
  window.traceLog = [];
  // [/DEBUG]

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
   * @returns {Window} commonWindow - A common ancestor window.
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
    return Math.sqrt(
      Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2));
  }

  function getPointOnLine(p0, p1, t) {
    var xA = p1.x - p0.x, yA = p1.y - p0.y;
    return {
      x: p0.x + xA * t,
      y: p0.y + yA * t,
      angle: Math.atan2(yA, xA) / (Math.PI / 180)
    };
  }

  function getPointOnCubic(p0, p1, p2, p3, t) {
    var
      t1 = 1 - t,
      t13 = Math.pow(t1, 3),
      t12 = Math.pow(t1, 2),
      t2 = t * t,
      t3 = t2 * t,
      x = t13 * p0.x + t12 * 3 * t * p1.x + t1 * 3 * t * t * p2.x + t3 * p3.x,
      y = t13 * p0.y + t12 * 3 * t * p1.y + t1 * 3 * t * t * p2.y + t3 * p3.y,
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

  function getCubicLength(p0, p1, p2, p3, z) {
    function base3(t, p0v, p1v, p2v, p3v) {
      var t1 = -3 * p0v + 9 * p1v - 9 * p2v + 3 * p3v,
        t2 = t * t1 + 6 * p0v - 12 * p1v + 6 * p2v;
      return t * t2 - 3 * p0v + 3 * p1v;
    }

    var
      TVALUES = [-0.1252, 0.1252, -0.3678, 0.3678, -0.5873, 0.5873,
        -0.7699, 0.7699, -0.9041, 0.9041, -0.9816, 0.9816],
      CVALUES = [0.2491, 0.2491, 0.2335, 0.2335, 0.2032, 0.2032,
        0.1601, 0.1601, 0.1069, 0.1069, 0.0472, 0.0472],
      sum = 0, n = 12, z2, ct, xbase, ybase, comb, i;

    if (z == null) { z = 1; } // eslint-disable-line eqeqeq
    z = z > 1 ? 1 : z < 0 ? 0 : z;
    z2 = z / 2;
    for (i = 0; i < n; i++) {
      ct = z2 * TVALUES[i] + z2;
      xbase = base3(ct, p0.x, p1.x, p2.x, p3.x);
      ybase = base3(ct, p0.y, p1.y, p2.y, p3.y);
      comb = xbase * xbase + ybase * ybase;
      sum += CVALUES[i] * Math.sqrt(comb);
    }
    return z2 * sum;
  }

  function getCubicT(p0, p1, p2, p3, ll) {
    var e = 0.01, step = 1 / 2, t2 = 1 - step,
      l = getCubicLength(p0, p1, p2, p3, t2);
    while (Math.abs(l - ll) > e) {
      step /= 2;
      t2 += (l < ll ? 1 : -1) * step;
      l = getCubicLength(p0, p1, p2, p3, t2);
    }
    return t2;
  }

  /**
   * Setup `baseWindow`, `bodyOffset`, `viewBBox`, `socketXYSE`,
   *    `pathData`, `plugOverheadSE`, `plugOutlineRSE`,
   *    `maskBBoxSE`,
   *    `svg`, `path`, `markerSE`, `markerUseSE`,
   *    `maskPathSE`, `positionValues`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Window} newWindow - A common ancestor `window`.
   * @returns {void}
   */
  function bindWindow(props, newWindow) {
    window.traceLog.push('<bindWindow>'); // [DEBUG/]
    var SVG_NS = 'http://www.w3.org/2000/svg',
      baseDocument = newWindow.document,
      bodyOffset = {x: 0, y: 0},
      sheet, defs, stylesHtml, stylesBody, svg, elmDefs;

    function sumProps(value, addValue) { return (value += parseFloat(addValue)); }

    if (props.baseWindow && props.svg) {
      props.baseWindow.document.body.removeChild(props.svg);
    }
    props.baseWindow = newWindow;

    if (!baseDocument.getElementById(STYLE_ID)) { // Add style rules
      if (baseDocument.createStyleSheet) { // IE
        sheet = baseDocument.createStyleSheet();
        sheet.owningElement.id = STYLE_ID;
        sheet.cssText = CSS_TEXT;
      } else {
        sheet = (baseDocument.getElementsByTagName('head')[0] || baseDocument.documentElement)
          .appendChild(baseDocument.createElement('style'));
        sheet.type = 'text/css';
        sheet.id = STYLE_ID;
        sheet.textContent = CSS_TEXT;
      }
    }

    if (!baseDocument.getElementById(DEFS_ID)) { // Add svg defs
      defs = baseDocument.body.appendChild(baseDocument.createElement('div'));
      defs.id = DEFS_ID;
      defs.innerHTML = DEFS_HTML;
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

    // svg
    svg = baseDocument.createElementNS(SVG_NS, 'svg');
    svg.className.baseVal = APP_ID;
    if (!svg.viewBox.baseVal) { svg.setAttribute('viewBox', '0 0 0 0'); } // for Firefox bug
    elmDefs = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'defs'));

    [
      ['markerSE', function(i) {
        var element = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'marker'));
        element.id = props.markerIdSE[i];
        element.markerUnits.baseVal = SVGMarkerElement.SVG_MARKERUNITS_STROKEWIDTH;
        if (!element.viewBox.baseVal) {
          element.setAttribute('viewBox', '0 0 0 0'); // for Firefox bug
        }
        return element;
      }],
      ['markerUseSE', function(i) {
        return props.markerSE[i].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
      }],
      ['maskPathSE', function(i) {
        var clip = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'clipPath')),
          element = clip.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
        clip.id = props.clipIdSE[i];
        element.className.baseVal = APP_ID + '-mask';
        return element;
      }]
    ].forEach(function(propCreate) {
      props[propCreate[0]] = [0, 1].map(function(i) { return propCreate[1](i); });
    });

    props.path = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
    props.path.className.baseVal = APP_ID + '-path';
    props.svg = baseDocument.body.appendChild(svg);

    props.viewBBox = {};
    props.socketXYSE = [{}, {}];
    props.pathData = [];
    props.plugOverheadSE = [0, 0];
    props.plugOutlineRSE = [0, 0];
    props.maskBBoxSE = [null, null];
    // Initialize properties as array.
    props.positionValues = POSITION_PROPS.reduce(function(values, prop) {
      if (prop.has2) { values[prop.name] = []; }
      return values;
    }, {});
  }
  window.bindWindow = bindWindow; // [DEBUG/]

  /**
   * Apply `color`, `size`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Array} [styleProps] - To limit properties. `[]` and `['']` are also accepted.
   * @returns {void}
   */
  function setStyles(props, styleProps) {
    window.traceLog.push('<setStyles>'); // [DEBUG/]
    var PROP_2_CSSPROP = {color: 'stroke', size: 'strokeWidth'},
      options = props.options, styles = props.path.style;
    (styleProps || ['color', 'size']).forEach(function(styleProp) {
      if (styleProp) {
        window.traceLog.push(styleProp + ' = ' + options[styleProp]); // [DEBUG/]
        styles[PROP_2_CSSPROP[styleProp]] = options[styleProp];
      }
    });
  }

  /**
   * Apply `orient` to `marker`.
   * @param {SVGMarkerElement} marker - Target `<marker>` element.
   * @param {string} orient - `'auto'`, `'auto-start-reverse'` or angle.
   * @param {BBox} bBox - `BBox` as `viewBox` of the marker.
   * @param {SVGSVGElement} svg - Parent `<svg>` element.
   * @param {SVGElement} content - An element that is shown as marker.
   * @param {SVGElement} marked - Target element that has `marker-start/end` such as `<path>`.
   * @returns {void}
   */
  function setMarkerOrient(marker, orient, bBox, svg, content, marked) {
    var transform, baseVal, reverseView, parent;
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
        content.transform.baseVal.appendItem(transform);
        marker.setAttribute('orient', 'auto');
        reverseView = true;
      }
    } else {
      marker.setAttribute('orient', orient);
      if (svg2Supported === false) { content.transform.baseVal.clear(); }
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

    if (IS_IE) { // for IE bug (reflow like `offsetWidth` can't update)
      parent = marked.parentNode;
      parent.removeChild(marked);
      parent.appendChild(marked);
    }
  }

  /**
   * Apply `plug`, `plugColor`, `plugSize`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {(Array|null)[]} plugProps - To limit properties. `[[]]` and `[['']]` are also accepted.
   * @returns {void}
   */
  function setPlugs(props, plugProps) {
    window.traceLog.push('<setPlugs>'); // [DEBUG/]
    var options = props.options;

    plugProps.forEach(function(plugProps, i) {
      var plugId = options.plugSE[i], symbolConf;

      plugProps = (plugProps || ['plug', 'plugColor', 'plugSize']).reduce(function(plugProps, prop) {
        if (prop) { plugProps[prop] = true; }
        return plugProps;
      }, {});

      if (plugId === PLUG_BEHIND) {
        if (plugProps.plug) {
          window.traceLog.push('plug[' + i + '] = ' + plugId); // [DEBUG/]
          props.path.style[i ? 'markerEnd' : 'markerStart'] = 'none';
        }
        // Update shape always for `options.size` that might have been changed.
        props.plugOverheadSE[i] = -(options.size / 2);
        props.plugOutlineRSE[i] = 0;
      } else {
        symbolConf = SYMBOLS[PLUG_2_SYMBOL[plugId]];
        if (plugProps.plug) {
          window.traceLog.push('plug[' + i + '] = ' + plugId); // [DEBUG/]
          props.markerUseSE[i].href.baseVal = '#' + symbolConf.elmId;
          setMarkerOrient(props.markerSE[i],
            symbolConf.noRotate ? '0' : i ? 'auto' : 'auto-start-reverse',
            symbolConf.bBox, props.svg, props.markerUseSE[i], props.path);
          props.path.style[i ? 'markerEnd' : 'markerStart'] = 'url(#' + props.markerIdSE[i] + ')';
          // Initialize size and color because the plug might have been `PLUG_BEHIND`.
          plugProps.PlugSize = plugProps.PlugColor = true;
        }
        if (plugProps.PlugColor) {
          window.traceLog.push('plugColor[' + i + '] = ' + (options.plugColorSE[i] || options.color)); // [DEBUG/]
          props.markerUseSE[i].style.fill = options.plugColorSE[i] || options.color;
        }
        if (plugProps.PlugSize) {
          window.traceLog.push('plugSize[' + i + '] = ' + options.plugSizeSE[i]); // [DEBUG/]
          props.markerSE[i].markerWidth.baseVal.value = symbolConf.widthR * options.plugSizeSE[i];
          props.markerSE[i].markerHeight.baseVal.value = symbolConf.heightR * options.plugSizeSE[i];
        }
        // Update shape always for `options.size` that might have been changed.
        props.plugOverheadSE[i] =
          options.size / DEFAULT_OPTIONS.size * symbolConf.overhead * options.plugSizeSE[i];
        props.plugOutlineRSE[i] =
          options.size / DEFAULT_OPTIONS.size * symbolConf.outlineR * options.plugSizeSE[i];
      }
    });
  }

  /**
   * @class
   * @param {Element} [start] - Alternative to `options.start`.
   * @param {Element} [end] - Alternative to `options.end`.
   * @param {Object} [options] - Initial options.
   */
  function LeaderLine(start, end, options) {
    var that = this,
      props = {options: // Initialize properties as array.
        {anchorSE: [], socketSE: [], socketGravitySE: [], plugSE: [], plugColorSE: [], plugSizeSE: []}};

    function createSetter(name) {
      return function(value) {
        var options = {};
        options[name] = value;
        that.setOptions(options);
      };
    }

    function shallowCopy(obj) {
      return Array.isArray(obj) ? obj.slice() :
        Object.keys(obj).reduce(function(copyObj, key) {
          copyObj[key] = obj[key];
          return copyObj;
        }, {});
    }

    Object.defineProperty(this, '_id', {value: insId++});
    insProps[this._id] = props;

    props.markerIdSE = [APP_ID + '-' + this._id + '-marker-0', APP_ID + '-' + this._id + '-marker-1'];
    props.clipIdSE = [APP_ID + '-' + this._id + '-clip-0', APP_ID + '-' + this._id + '-clip-1'];

    if (arguments.length === 1) {
      options = start;
      start = null;
    }
    options = options || {};
    if (start) { options.start = start; }
    if (end) { options.end = end; }
    this.setOptions(options);

    // Setup option accessor methods (direct)
    [['start', 'anchorSE', 0], ['end', 'anchorSE', 1], ['color'], ['size'],
        ['startSocketGravity', 'socketGravitySE', 0], ['endSocketGravity', 'socketGravitySE', 1],
        ['startPlugColor', 'plugColorSE', 0], ['endPlugColor', 'plugColorSE', 1],
        ['startPlugSize', 'plugSizeSE', 0], ['endPlugSize', 'plugSizeSE', 1]]
      .forEach(function(conf) {
        var name = conf[0], optionName = conf[1], i = conf[2];
        Object.defineProperty(that, name, {
          get: function() {
            var value = optionName ? // Don't use closure.
              insProps[that._id].options[optionName][i] :
              insProps[that._id].options[name];
            return value == null ? KEYWORD_AUTO : // eslint-disable-line eqeqeq
              // eslint-disable-next-line eqeqeq
              typeof value === 'object' && value.nodeType == null ? shallowCopy(value) : value;
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
  }

  /**
   * @param {Object} newOptions - New options.
   * @returns {void}
   */
  LeaderLine.prototype.setOptions = function(newOptions) {
    /*
      Names of `options` : Keys of API
      ----------------------------------------
      anchorSE          start, end
      socketSE          startSocket, endSocket
      socketGravitySE   startSocketGravity, endSocketGravity
      plugSE            startPlug, endPlug
      plugColorSE       startPlugColor, endPlugColor
      plugSizeSE        startPlugSize, endPlugSize
    */
    window.traceLog.push('<setOptions>'); // [DEBUG/]
    var props = insProps[this._id], options = props.options,
      needsWindow, needsStyles, needsPlugs = [], needsPosition, newWindow;

    function setValidId(name, key2Id, optionName, index) {
      var acceptsAuto = DEFAULT_OPTIONS[name] == null, // eslint-disable-line eqeqeq
        currentOptions, optionKey, update, key, id;
      if (optionName) {
        currentOptions = options[optionName];
        optionKey = index;
      } else {
        currentOptions = options;
        optionKey = name;
      }

      if (newOptions[name] != null && // eslint-disable-line eqeqeq
          (key = (newOptions[name] + '').toLowerCase()) && (
            acceptsAuto && key === KEYWORD_AUTO ||
            (id = key2Id[key])
          ) && id !== currentOptions[optionKey]) {
        currentOptions[optionKey] = id; // `undefined` when `KEYWORD_AUTO`
        update = true;
      }
      if (currentOptions[optionKey] == null && !acceptsAuto) { // eslint-disable-line eqeqeq
        currentOptions[optionKey] = DEFAULT_OPTIONS[name];
        update = true;
      }
      return update;
    }

    function setValidType(name, type, optionName, index) {
      var acceptsAuto = DEFAULT_OPTIONS[name] == null, // eslint-disable-line eqeqeq
        currentOptions, optionKey, update, value;
      if (optionName) {
        currentOptions = options[optionName];
        optionKey = index;
      } else {
        currentOptions = options;
        optionKey = name;
      }
      type = type || typeof DEFAULT_OPTIONS[optionName];

      if (newOptions[name] != null && ( // eslint-disable-line eqeqeq
            acceptsAuto && (newOptions[name] + '').toLowerCase() === KEYWORD_AUTO ||
            typeof (value = newOptions[name]) === type
          ) && value !== currentOptions[optionKey]) {
        currentOptions[optionKey] = value; // `undefined` when `KEYWORD_AUTO`
        update = true;
      }
      if (currentOptions[optionKey] == null && !acceptsAuto) { // eslint-disable-line eqeqeq
        currentOptions[optionKey] = DEFAULT_OPTIONS[name];
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

    ['start', 'end'].forEach(function(name, i) {
      if (newOptions[name] && newOptions[name].nodeType != null && // eslint-disable-line eqeqeq
          newOptions[name] !== options.anchorSE[i]) {
        options.anchorSE[i] = newOptions[name];
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
      needsStyles = needsPlugs[0] = needsPlugs[1] = true;
    }

    needsPosition = setValidId('path', PATH_KEY_2_ID) || needsPosition;
    needsPosition = setValidId('startSocket', SOCKET_KEY_2_ID, 'socketSE', 0) || needsPosition;
    needsPosition = setValidId('endSocket', SOCKET_KEY_2_ID, 'socketSE', 1) || needsPosition;

    if (setValidType('color')) {
      needsStyles = addPropList('color', needsStyles);
      needsPlugs[0] = addPropList('plugColor', needsPlugs[0]);
      needsPlugs[1] = addPropList('plugColor', needsPlugs[1]);
    }
    if (setValidType('size')) {
      needsStyles = addPropList('size', needsStyles);
      needsPlugs[0] = addPropList('', needsPlugs[0]); // For `plugOverheadSE` and `plugOutlineRSE`.
      needsPlugs[1] = addPropList('', needsPlugs[1]); // For `plugOverheadSE` and `plugOutlineRSE`.
      needsPosition = true;
    }

    ['startSocketGravity', 'endSocketGravity'].forEach(function(name, i) {
      var value = false; // `false` means no-update input.
      if (newOptions[name] != null) { // eslint-disable-line eqeqeq
        if (Array.isArray(newOptions[name])) {
          if (typeof newOptions[name][0] === 'number' && typeof newOptions[name][1] === 'number') {
            value = [newOptions[name][0], newOptions[name][1]];
            if (Array.isArray(options.socketGravitySE[i]) &&
              matchArray(value, options.socketGravitySE[i])) { value = false; }
          }
        } else {
          if ((newOptions[name] + '').toLowerCase() === KEYWORD_AUTO) {
            value = null;
          } else if (typeof newOptions[name] === 'number' && newOptions[name] >= 0) {
            value = newOptions[name];
          }
          if (value === options.socketGravitySE[i]) { value = false; }
        }
        if (value !== false) {
          options.socketGravitySE[i] = value;
          needsPosition = true;
        }
      }
    });

    ['startPlug', 'endPlug'].forEach(function(name, i) {
      if (setValidId(name, PLUG_KEY_2_ID, 'plugSE', i)) {
        needsPlugs[i] = addPropList('plug', needsPlugs[i]);
        needsPosition = true;
      }
      if (setValidType(name + 'Color', 'string', 'plugColorSE', i)) {
        needsPlugs[i] = addPropList('plugColor', needsPlugs[i]);
      }
      if (setValidType(name + 'Size', null, 'plugSizeSE', i)) {
        needsPlugs[i] = addPropList('plugSize', needsPlugs[i]);
        needsPosition = true;
      }
    });

    if (needsStyles) { // Update styles of `<path>`.
      setStyles(props, Array.isArray(needsStyles) ? needsStyles : null);
    }
    if (needsPlugs[0] || needsPlugs[1]) { // Update plugs.
      setPlugs(props, [Array.isArray(needsPlugs[0]) ? needsPlugs[0] : null,
        Array.isArray(needsPlugs[1]) ? needsPlugs[1] : null]);
    }
    if (needsPosition) { // Call `position()`.
      this.position();
    }

    return this;
  };

  LeaderLine.prototype.position = function() {
    window.traceLog.push('<position>'); // [DEBUG/]
    var props = insProps[this._id], options = props.options,
      bBoxSE, newSocketXYSE, newMaskBBoxSE = [], newPathData, newViewBBox = {},
      pathSegs = [], viewHasChanged;

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

    bBoxSE = [
      getBBoxNest(options.anchorSE[0], props.baseWindow),
      getBBoxNest(options.anchorSE[1], props.baseWindow)];

    // Decide each socket
    (function() {
      var socketXYsWk, socketsLenMin = -1, iFix, iAuto;
      if (options.socketSE[0] && options.socketSE[1]) {
        newSocketXYSE = [
          getSocketXY(bBoxSE[0], options.socketSE[0]),
          getSocketXY(bBoxSE[1], options.socketSE[1])];

      } else if (!options.socketSE[0] && !options.socketSE[1]) {
        socketXYsWk = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBoxSE[1], socketId); });
        SOCKET_IDS.map(function(socketId) { return getSocketXY(bBoxSE[0], socketId); })
          .forEach(function(socketXY0) {
            socketXYsWk.forEach(function(socketXY1) {
              var len = getPointsLength(socketXY0, socketXY1);
              if (len < socketsLenMin || socketsLenMin === -1) {
                newSocketXYSE = [socketXY0, socketXY1];
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
        newSocketXYSE = [];
        newSocketXYSE[iFix] = getSocketXY(bBoxSE[iFix], options.socketSE[iFix]);
        socketXYsWk = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBoxSE[iAuto], socketId); });
        socketXYsWk.forEach(function(socketXY) {
          var len = getPointsLength(socketXY, newSocketXYSE[iFix]);
          if (len < socketsLenMin || socketsLenMin === -1) {
            newSocketXYSE[iAuto] = socketXY;
            socketsLenMin = len;
          }
        });
      }
    })();

    // To limit updated `socketXY`
    newSocketXYSE.forEach(function(socketXY1, i) {
      var socketXY2 = props.socketXYSE[i];
      if (socketXY1.x !== socketXY2.x || socketXY1.y !== socketXY2.y ||
          socketXY1.socketId !== socketXY2.socketId) {
        props.socketXYSE[i] = socketXY1;
      } else {
        newSocketXYSE[i] = null;
      }
    });

    // Decide `maskBBox` (coordinates might have changed)
    bBoxSE.forEach(function(maskBBox1, i) {
      var maskBBox2 = props.maskBBoxSE[i],
        enabled1 = props.plugOverheadSE[i] < 0, enabled2 = !!maskBBox2;
      if (enabled1 !== enabled2 ||
          enabled1 && enabled2 && ['left', 'top', 'width', 'height'].some(function(prop) { // omission right, bottom
            return maskBBox1[prop] !== maskBBox2[prop];
          })) {
        if (enabled1) {
          props.maskBBoxSE[i] = newMaskBBoxSE[i] = maskBBox1;
        } else {
          props.maskBBoxSE[i] = null;
          newMaskBBoxSE[i] = false; // To indicate that it was changed.
        }
      }
    });

    // New position
    if (newSocketXYSE[0] || newSocketXYSE[1] ||
        newMaskBBoxSE[0] != null || newMaskBBoxSE[1] != null || // eslint-disable-line eqeqeq
        POSITION_PROPS.some(function(prop) {
          var curValue = (prop.isOption ? options : props)[prop.name],
            positionValue = props.positionValues[prop.name];
          return prop.has2 ?
            [0, 1].some(function(i) { return positionValue[i] !== curValue[i]; }) :
            positionValue !== curValue;
        })) {
      window.traceLog.push('(update)'); // [DEBUG/]

      // Generate path segments
      switch (options.path) {

        case PATH_STRAIGHT:
          pathSegs.push([socketXY2Point(props.socketXYSE[0]), socketXY2Point(props.socketXYSE[1])]);
          break;

        case PATH_ARC:
          (function() {
            var
              downward =
                typeof options.socketGravitySE[0] === 'number' && options.socketGravitySE[0] > 0 ||
                typeof options.socketGravitySE[1] === 'number' && options.socketGravitySE[1] > 0,
              circle8rad = CIRCLE_8_RAD * (downward ? -1 : 1),
              angle = Math.atan2(props.socketXYSE[1].y - props.socketXYSE[0].y,
                props.socketXYSE[1].x - props.socketXYSE[0].x),
              cp1Angle = -angle + circle8rad,
              cp2Angle = Math.PI - angle - circle8rad,
              crLen = getPointsLength(props.socketXYSE[0], props.socketXYSE[1]) / Math.sqrt(2) * CIRCLE_CP,
              cp1 = {
                x: props.socketXYSE[0].x + Math.cos(cp1Angle) * crLen,
                y: props.socketXYSE[0].y + Math.sin(cp1Angle) * crLen * -1},
              cp2 = {
                x: props.socketXYSE[1].x + Math.cos(cp2Angle) * crLen,
                y: props.socketXYSE[1].y + Math.sin(cp2Angle) * crLen * -1};
            pathSegs.push(
              [socketXY2Point(props.socketXYSE[0]), cp1, cp2, socketXY2Point(props.socketXYSE[1])]);
          })();
          break;

        case PATH_FLUID:
        case PATH_MAGNET:
          (/* @EXPORT[file:../test/spec/functions/PATH_FLUID]@ */function(socketGravitySE) {
            var cx = [], cy = [];
            props.socketXYSE.forEach(function(socketXY, i) {
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
                anotherSocketXY = props.socketXYSE[i ? 0 : 1];
                overhead = props.plugOverheadSE[i];
                minGravity = overhead > 0 ?
                  MIN_OH_GRAVITY + (overhead > MIN_OH_GRAVITY_OH ?
                    (overhead - MIN_OH_GRAVITY_OH) * MIN_OH_GRAVITY_R : 0) :
                  MIN_GRAVITY + (options.size > MIN_GRAVITY_SIZE ?
                    (options.size - MIN_GRAVITY_SIZE) * MIN_GRAVITY_R : 0);
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
            pathSegs.push([socketXY2Point(props.socketXYSE[0]),
              {x: cx[0], y: cy[0]}, {x: cx[1], y: cy[1]}, socketXY2Point(props.socketXYSE[1])]);
          }/* @/EXPORT@ */)([options.socketGravitySE[0],
            options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
          break;

        case PATH_GRID:
          (/* @EXPORT[file:../test/spec/functions/PATH_GRID]@ */function() {
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
                if (dirId === reverseDir(dirPoint.dirId)) { throw new Error('Invalid dirId'); }
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

            props.socketXYSE.forEach(function(socketXY, i) {
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
              if (i > 0) { pathSegs.push([curPoint, point]); }
              curPoint = point;
            });
          }/* @/EXPORT@ */)();
          break;

        // no default
      }

      // Adjust path with plugs
      (function() {
        var pathSegsLen = [];
        props.plugOverheadSE.forEach(function(plugOverhead, i) {
          var start = !i, pathSeg, iSeg, point, sp, cp, angle, len,
            socketId, axis, dir, minAdjustOffset;
          if (plugOverhead > 0) {
            pathSeg = pathSegs[(iSeg = start ? 0 : pathSegs.length - 1)];

            if (pathSeg.length === 2) { // Straight line
              pathSegsLen[iSeg] = pathSegsLen[iSeg] || getPointsLength.apply(null, pathSeg);
              if (pathSegsLen[iSeg] > MIN_ADJUST_LEN) {
                if (pathSegsLen[iSeg] - plugOverhead < MIN_ADJUST_LEN) {
                  plugOverhead = pathSegsLen[iSeg] - MIN_ADJUST_LEN;
                }
                point = getPointOnLine(pathSeg[0], pathSeg[1],
                  (start ? plugOverhead : pathSegsLen[iSeg] - plugOverhead) / pathSegsLen[iSeg]);
                pathSegs[iSeg] = start ? [point, pathSeg[1]] : [pathSeg[0], point];
                pathSegsLen[iSeg] -= plugOverhead;
              }

            } else { // Cubic bezier
              pathSegsLen[iSeg] = pathSegsLen[iSeg] || getCubicLength.apply(null, pathSeg);
              if (pathSegsLen[iSeg] > MIN_ADJUST_LEN) {
                if (pathSegsLen[iSeg] - plugOverhead < MIN_ADJUST_LEN) {
                  plugOverhead = pathSegsLen[iSeg] - MIN_ADJUST_LEN;
                }
                point = getPointOnCubic(pathSeg[0], pathSeg[1], pathSeg[2], pathSeg[3],
                  getCubicT(pathSeg[0], pathSeg[1], pathSeg[2], pathSeg[3],
                    start ? plugOverhead : pathSegsLen[iSeg] - plugOverhead));

                // Get direct distance and angle
                if (start) {
                  sp = pathSeg[0];
                  cp = point.toP1;
                } else {
                  sp = pathSeg[3];
                  cp = point.fromP2;
                }
                angle = Math.atan2(sp.y - point.y, point.x - sp.x);
                len = getPointsLength(point, cp);
                point.x = sp.x + Math.cos(angle) * plugOverhead;
                point.y = sp.y + Math.sin(angle) * plugOverhead * -1;
                cp.x = point.x + Math.cos(angle) * len;
                cp.y = point.y + Math.sin(angle) * len * -1;

                pathSegs[iSeg] = start ?
                  [point, point.toP1, point.toP2, pathSeg[3]] :
                  [pathSeg[0], point.fromP1, point.fromP2, point];
                pathSegsLen[iSeg] = null; // to re-calculate
              }

            }
          } else if (plugOverhead < 0) {
            pathSeg = pathSegs[(iSeg = start ? 0 : pathSegs.length - 1)];
            socketId = props.socketXYSE[i].socketId;
            axis = socketId === SOCKET_LEFT || socketId === SOCKET_RIGHT ? 'x' : 'y';
            minAdjustOffset = -(bBoxSE[i][axis === 'x' ? 'width' : 'height']);
            if (plugOverhead < minAdjustOffset) { plugOverhead = minAdjustOffset; }
            dir = plugOverhead * (socketId === SOCKET_LEFT || socketId === SOCKET_TOP ? -1 : 1);
            if (pathSeg.length === 2) { // Straight line
              pathSeg[start ? 0 : pathSeg.length - 1][axis] += dir;
            } else { // Cubic bezier
              (start ? [0, 1] : [pathSeg.length - 2, pathSeg.length - 1]).forEach(
                function(i) { pathSeg[i][axis] += dir; });
            }
            pathSegsLen[iSeg] = null; // to re-calculate
          }
        });
      })();

      // Convert path segments to `pathData`.
      newPathData = [{type: 'M', values: [pathSegs[0][0].x, pathSegs[0][0].y]}];
      pathSegs.forEach(function(pathSeg) {
        newPathData.push(pathSeg.length === 2 ?
          {type: 'L', values: [pathSeg[1].x, pathSeg[1].y]} :
          {type: 'C', values: [pathSeg[1].x, pathSeg[1].y,
            pathSeg[2].x, pathSeg[2].y, pathSeg[3].x, pathSeg[3].y]});
        pathSeg.forEach(function(point) {
          /* eslint-disable eqeqeq */
          if (newViewBBox.x1 == null || point.x < newViewBBox.x1) { newViewBBox.x1 = point.x; }
          if (newViewBBox.x2 == null || point.x > newViewBBox.x2) { newViewBBox.x2 = point.x; }
          if (newViewBBox.y1 == null || point.y < newViewBBox.y1) { newViewBBox.y1 = point.y; }
          if (newViewBBox.y2 == null || point.y > newViewBBox.y2) { newViewBBox.y2 = point.y; }
          /* eslint-enable eqeqeq */
        });
      });

      // Expand bBox with path or symbols
      (function(padding) {
        newViewBBox.x1 -= padding;
        newViewBBox.x2 += padding;
        newViewBBox.y1 -= padding;
        newViewBBox.y2 += padding;
      })(Math.max(options.size / 2, props.plugOutlineRSE[0], props.plugOutlineRSE[1]));
      newViewBBox.x = newViewBBox.x1;
      newViewBBox.y = newViewBBox.y1;
      newViewBBox.width = newViewBBox.x2 - newViewBBox.x1;
      newViewBBox.height = newViewBBox.y2 - newViewBBox.y1;

      // Apply path data
      if (newPathData.length !== props.pathData.length ||
          newPathData.some(function(newPathSeg, i) {
            var pathSeg = props.pathData[i];
            return newPathSeg.type !== pathSeg.type ||
              newPathSeg.values.some(function(newPathSegValue, i) {
                return newPathSegValue !== pathSeg.values[i];
              });
          })) {
        window.traceLog.push('(setPathData)'); // [DEBUG/]
        props.path.setPathData(newPathData);
        props.pathData = newPathData;
      }

      // Position `<svg>` element and set its `viewBox`
      (function() {
        var baseVal = props.svg.viewBox.baseVal, styles = props.svg.style;
        [['x', 'left'], ['y', 'top'], ['width', 'width'], ['height', 'height']].forEach(function(keys) {
          var boxKey = keys[0], cssProp = keys[1];
          if (newViewBBox[boxKey] !== props.viewBBox[boxKey]) {
            window.traceLog.push('viewBox[' + boxKey + ']'); // [DEBUG/]
            props.viewBBox[boxKey] = baseVal[boxKey] = newViewBBox[boxKey];
            styles[cssProp] = newViewBBox[boxKey] +
              (boxKey === 'x' || boxKey === 'y' ? props.bodyOffset[boxKey] : 0) + 'px';
            viewHasChanged = true;
          }
        });
      })();

      // Apply mask for plugs
      if (viewHasChanged && (props.maskBBoxSE[0] || props.maskBBoxSE[1]) ||
          newMaskBBoxSE[0] != null || newMaskBBoxSE[1] != null) { // eslint-disable-line eqeqeq
        if (!props.maskBBoxSE[0] && !props.maskBBoxSE[1]) {
          window.traceLog.push('mask = none'); // [DEBUG/]
          props.path.style.clipPath = 'none';
        } else {
          // Separate `clipPath` elements for overlapping masks.
          // `mask` is faster than
          props.maskBBoxSE.forEach(function(maskBBox, i) {
            if (maskBBox) {
              window.traceLog.push('mask[' + i + ']'); // [DEBUG/]
              props.maskPathSE[i].setPathData([
                {type: 'M', values: [newViewBBox.x, newViewBBox.y]},
                {type: 'h', values: [newViewBBox.width]},
                {type: 'v', values: [newViewBBox.height]},
                {type: 'h', values: [-newViewBBox.width]},
                {type: 'z'},
                {type: 'M', values: [maskBBox.left, maskBBox.top]},
                {type: 'h', values: [maskBBox.width]},
                {type: 'v', values: [maskBBox.height]},
                {type: 'h', values: [-maskBBox.width]},
                {type: 'z'}
              ]);
            }
          });
          if (props.maskBBoxSE[0] && props.maskBBoxSE[1]) {
            props.maskPathSE[1].style.clipPath = 'url(#' + props.clipIdSE[0] + ')';
            props.path.style.clipPath = 'url(#' + props.clipIdSE[1] + ')';
          } else {
            props.maskPathSE[1].style.clipPath = 'none';
            props.path.style.clipPath = 'url(#' +
              props.clipIdSE[props.maskBBoxSE[0] ? 0 : 1] + ')';
          }
        }
      }

      POSITION_PROPS.forEach(function(prop) {
        var curValue = (prop.isOption ? options : props)[prop.name];
        props.positionValues[prop.name] = prop.has2 ? [curValue[0], curValue[1]] : curValue;
      });
    }
  };

  return LeaderLine;
})();
