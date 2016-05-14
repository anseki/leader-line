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
   * @property {number|null} left
   * @property {number|null} top
   * @property {number|null} width
   * @property {number|null} height
   */

  var
    APP_ID = 'leader-line',
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    SOCKET_KEY_2_ID = {top: SOCKET_TOP, right: SOCKET_RIGHT, bottom: SOCKET_BOTTOM, left: SOCKET_LEFT},

    LINE_STRAIGHT = 1, LINE_ARC = 2, LINE_FLUID = 3, LINE_GRID = 4,
    LINE_KEY_2_ID = {straight: LINE_STRAIGHT, arc: LINE_ARC, fluid: LINE_FLUID, grid: LINE_GRID},

    STYLE_ID = APP_ID + '-styles',
    /* [DEBUG/]
    CSS_TEXT = '@INCLUDE[file:leader-line.css]@',
    [DEBUG/] */
    // [DEBUG]
    CSS_TEXT = '.leader-line{position:absolute;overflow:visible} .leader-line-line{fill:none} #leader-line-defs{width:0;height:0;}',
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
      line: LINE_FLUID,
      color: 'coral',
      size: 4,
      startPlug: PLUG_BEHIND,
      endPlug: DEFAULT_END_PLUG,
      startPlugSize: 1,
      endPlugSize: 1
    },

    SHAPE_PROPS =
      ['line', 'size', 'startPlugOverhead', 'endPlugOverhead', 'startPlugOutlineR', 'endPlugOutlineR'],
    SOCKET_IDS = [SOCKET_TOP, SOCKET_RIGHT, SOCKET_BOTTOM, SOCKET_LEFT],

    MIN_GRAVITY = 50, MIN_ADJUST_LEN = 10,
    IS_IE = !!document.uniqueID,

    /**
     * @typedef {Object.<_id: number, props>} insProps
     */
    insProps = {}, insId = 0, svg2Supported;

  /**
   * Get an element's bounding-box that contains coordinates relative to the element's document or window.
   * @param {Element} element - Target element.
   * @param {boolean} [relWindow] - Whether it's relative to the element's window, or document (i.e. `<html>`).
   * @returns {BBox|null} - A bounding-box or null when failed.
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
      bBox.top += win.pageYOffset;
    }

    return bBox;
  }

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
   * @returns {Element[]|null} - An array of `<iframe>` elements or null when `baseWindow` was not found in the path.
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
   * @returns {BBox|null} - A bounding-box or null when failed.
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
    bBox.top += top;
    return bBox;
  }

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

  function getPointsLength(p0, p1) {
    return Math.sqrt(
      Math.pow(p0.x - p1.x, 2) + Math.pow(p0.y - p1.y, 2));
  }

  function getPointOnLineSeg(p0, p1, t) {
    var xA = p1.x - p0.x, yA = p1.y - p0.y;
    return {
      x: p0.x + xA * t,
      y: p0.y + yA * t,
      angle: Math.atan2(yA, xA) / (Math.PI / 180)
    };
  }

  function getPointOnPath(p0, p1, p2, p3, t) {
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

  function getPathLength(p0, p1, p2, p3, z) {
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

  function getPathT(p0, p1, p2, p3, ll) {
    var e = 0.01, step = 1 / 2, t2 = 1 - step,
      l = getPathLength(p0, p1, p2, p3, t2);
    while (Math.abs(l - ll) > e) {
      step /= 2;
      t2 += (l < ll ? 1 : -1) * step;
      l = getPathLength(p0, p1, p2, p3, t2);
    }
    return t2;
  }

  /**
   * Setup `baseWindow`, `bodyOffset`, `viewBBox`, `startSocketXY`, `endSocketXY`, `positionedShape`,
   *    `pathData`, `startPlugOverhead`, `endPlugOverhead`, `startPlugOutlineR`, `endPlugOutlineR`,
   *    `startMaskBBox`, `endMaskBBox`,
   *    `svg`, `path`, `startMarker`, `endMarker`, `startMarkerUse`, `endMarkerUse`, `maskPath`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Window} newWindow - A common ancestor `window`.
   * @returns {void}
   */
  function bindWindow(props, newWindow) {
    var SVG_NS = 'http://www.w3.org/2000/svg',
      baseDocument = newWindow.document,
      bodyOffset = {x: 0, y: 0},
      sheet, defs, clip, stylesHtml, stylesBody, svg, elmDefs;

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
          stylesBody.marginLeft, stylesBody.borderLeftWidth]
        .reduce(function(value, addValue) { return (value += parseFloat(addValue)); }, 0);
      bodyOffset.y -=
        [stylesHtml.marginTop, stylesHtml.borderTopWidth, stylesHtml.paddingTop,
          stylesBody.marginTop, stylesBody.borderTopWidth]
        .reduce(function(value, addValue) { return (value += parseFloat(addValue)); }, 0);
    } else if (stylesHtml.position !== 'static') {
      // When `<body>` has `position:static` and `<html>` has `position:(non-static)`
      // `element{position:absolute}` is positioned relative to border-box of `<html>`.
      bodyOffset.x -=
        [stylesHtml.marginLeft, stylesHtml.borderLeftWidth]
        .reduce(function(value, addValue) { return (value += parseFloat(addValue)); }, 0);
      bodyOffset.y -=
        [stylesHtml.marginTop, stylesHtml.borderTopWidth]
        .reduce(function(value, addValue) { return (value += parseFloat(addValue)); }, 0);
    }
    props.bodyOffset = bodyOffset;

    // svg
    svg = baseDocument.createElementNS(SVG_NS, 'svg');
    svg.className.baseVal = APP_ID;
    if (!svg.viewBox.baseVal) { svg.setAttribute('viewBox', '0 0 0 0'); } // for Firefox bug
    elmDefs = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'defs'));
    ['start', 'end'].forEach(function(key) {
      props[key + 'Marker'] = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'marker'));
      props[key + 'Marker'].id = props[key + 'MarkerId'];
      props[key + 'Marker'].markerUnits.baseVal = SVGMarkerElement.SVG_MARKERUNITS_STROKEWIDTH;
      if (!props[key + 'Marker'].viewBox.baseVal) {
        props[key + 'Marker'].setAttribute('viewBox', '0 0 0 0'); // for Firefox bug
      }
      props[key + 'MarkerUse'] = props[key + 'Marker'].appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    });
    clip = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'clipPath'));
    clip.id = props.clipId;
    props.maskPath = clip.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
    props.maskPath.className.baseVal = APP_ID + '-mask';
    props.path = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
    props.path.className.baseVal = APP_ID + '-line';
    props.svg = baseDocument.body.appendChild(svg);

    props.viewBBox = {};
    props.startSocketXY = {};
    props.endSocketXY = {};
    props.positionedShape = {};
    props.pathData = [];
    props.startPlugOverhead = props.endPlugOverhead =
      props.startPlugOutlineR = props.endPlugOutlineR = 0;
    props.startMaskBBox = null;
    props.endMaskBBox = null;
  }

  /**
   * Apply `color`, `size`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Array} [styleProps] - To limit properties.
   * @returns {void}
   */
  function setStyles(props, styleProps) {
    var PROP_2_CSSPROP = {color: 'stroke', size: 'strokeWidth'},
      styles = props.path.style;
    (styleProps || ['color', 'size']).forEach(function(styleProp) {
      styles[PROP_2_CSSPROP[styleProp]] = props[styleProp];
    });
  }

  /**
   * Apply `orient` to `marker`.
   * @param {SVGMarkerElement} marker - Target `marker` element.
   * @param {string} orient - `'auto'`, `'auto-start-reverse'` or `angle`.
   * @param {BBox} bBox - `BBox` of target symbol.
   * @param {SVGSVGElement} svg - Parent `svg` element.
   * @param {SVGUseElement} use - Target `use` element.
   * @param {SVGPathElement} path - Target `path` element.
   * @returns {void}
   */
  function setMarkerOrient(marker, orient, bBox, svg, use, path) {
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
        use.transform.baseVal.appendItem(transform);
        marker.setAttribute('orient', 'auto');
        reverseView = true;
      }
    } else {
      marker.setAttribute('orient', orient);
      if (svg2Supported === false) { use.transform.baseVal.clear(); }
    }

    baseVal = marker.viewBox.baseVal;
    if (reverseView) {
      baseVal.x = -(bBox.left + bBox.width);
      baseVal.y = -(bBox.top + bBox.height);
    } else {
      baseVal.x = bBox.left;
      baseVal.y = bBox.top;
    }
    baseVal.width = bBox.width;
    baseVal.height = bBox.height;

    if (IS_IE) { // for IE bug
      parent = path.parentNode;
      parent.removeChild(path);
      parent.appendChild(path);
    }
  }

  /**
   * Apply `startPlug`, `endPlug`, `startPlugColor`, `endPlugColor`, `startPlugSize`, `endPlugSize`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Array} [plugProps] - To limit properties.
   * @returns {void}
   */
  function setPlugs(props, plugProps) {
    plugProps = (plugProps ||
        ['startPlug', 'endPlug', 'startPlugColor', 'endPlugColor', 'startPlugSize', 'endPlugSize'])
      .reduce(function(plugProps, prop) {
        plugProps[prop] = true;
        return plugProps;
      }, {});

    ['start', 'end'].forEach(function(key) {
      var ucKey = key.substr(0, 1).toUpperCase() + key.substr(1),
        plugId = props[key + 'Plug'], symbolConf;

      if (plugId === PLUG_BEHIND) {
        if (plugProps[key + 'Plug']) {
          props.path.style['marker' + ucKey] = 'none';
          props[key + 'PlugOverhead'] = -(props.size / 2);
          props[key + 'PlugOutlineR'] = 0;
        }
      } else {
        symbolConf = SYMBOLS[PLUG_2_SYMBOL[plugId]];
        if (plugProps[key + 'Plug']) {
          props[key + 'MarkerUse'].href.baseVal = '#' + symbolConf.elmId;
          setMarkerOrient(props[key + 'Marker'],
            symbolConf.noRotate ? '0' : key === 'start' ? 'auto-start-reverse' : 'auto',
            symbolConf.bBox, props.svg, props[key + 'MarkerUse'], props.path);
          props.path.style['marker' + ucKey] = 'url(#' + props[key + 'MarkerId'] + ')';
          // Initialize size because the plug might have been `PLUG_BEHIND`.
          plugProps[key + 'PlugSize'] = true;
        }
        if (plugProps[key + 'PlugColor']) {
          props[key + 'MarkerUse'].style.fill = props[key + 'PlugColor'] || props.color;
        }
        if (plugProps[key + 'PlugSize']) {
          props[key + 'Marker'].markerWidth.baseVal.value = symbolConf.widthR * props[key + 'PlugSize'];
          props[key + 'Marker'].markerHeight.baseVal.value = symbolConf.heightR * props[key + 'PlugSize'];
          // Change shape.
          props[key + 'PlugOverhead'] =
            props.size / DEFAULT_OPTIONS.size * symbolConf.overhead * props[key + 'PlugSize'];
          props[key + 'PlugOutlineR'] =
            props.size / DEFAULT_OPTIONS.size * symbolConf.outlineR * props[key + 'PlugSize'];
        }
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
    var props = {};
    Object.defineProperty(this, '_id', { value: insId++ });
    insProps[this._id] = props;
    props.startMarkerId = APP_ID + '-start-marker-' + this._id;
    props.endMarkerId = APP_ID + '-end-marker-' + this._id;
    props.clipId = APP_ID + '-clip-' + this._id;

    if (arguments.length === 1) {
      options = start;
      start = null;
    }
    options = options || {};
    if (start) { options.start = start; }
    if (end) { options.end = end; }

    this.setOptions(options);
  }

  /**
   * @param {Object} options - New options.
   * @returns {void}
   */
  LeaderLine.prototype.setOptions = function(options) {
    var KEY_AUTO = 'auto',
      props = insProps[this._id],
      needsWindow, needsStyles, needsPlugs, needsPosition, newWindow;

    function setValidId(prop, key2Id, setDefault, acceptsAuto) {
      var key, id, update;
      if (options[prop] != null && // eslint-disable-line eqeqeq
          (key = (options[prop] + '').toLowerCase()) && (
            acceptsAuto && key === KEY_AUTO ||
            (id = key2Id[key])
          ) && id !== props[prop]) {
        props[prop] = id; // `undefined` when `KEY_AUTO`
        update = true;
      }
      if (setDefault && props[prop] == null) { // eslint-disable-line eqeqeq
        props[prop] = DEFAULT_OPTIONS[prop];
        update = true;
      }
      return update;
    }

    function setValidType(prop, setDefault, type, acceptsAuto) {
      var value, update;
      type = type || typeof DEFAULT_OPTIONS[prop];
      if (options[prop] != null && ( // eslint-disable-line eqeqeq
            acceptsAuto && (options[prop] + '').toLowerCase() === KEY_AUTO ||
            typeof (value = options[prop]) === type
          ) && value !== props[prop]) {
        props[prop] = value; // `undefined` when `KEY_AUTO`
        update = true;
      }
      if (setDefault && props[prop] == null) { // eslint-disable-line eqeqeq
        props[prop] = DEFAULT_OPTIONS[prop];
        update = true;
      }
      return update;
    }

    function matchArray(array1, array2) {
      return array1.legth === array2.legth &&
        array1.every(function(value1, i) { return value1 === array2[i]; });
    }

    function addPropList(prop, list) {
      if (!list) {
        list = [prop];
      } else if (Array.isArray(list)) {
        list.push(prop);
      } // Otherwise `list` is `true`.
      return list;
    }

    ['start', 'end'].forEach(function(prop) {
      if (options[prop] && options[prop].nodeType != null && // eslint-disable-line eqeqeq
          options[prop] !== props[prop]) {
        props[prop] = options[prop];
        needsWindow = needsPosition = true;
      }
    });
    if (!props.start || !props.end || props.start === props.end) {
      throw new Error('`start` and `end` are required.');
    }

    // Check window.
    if (needsWindow &&
        (newWindow = getCommonWindow(props.start, props.end)) !== props.baseWindow) {
      bindWindow(props, newWindow);
      needsStyles = needsPlugs = true;
    }

    needsPosition = setValidId('line', LINE_KEY_2_ID, true) || needsPosition;
    needsPosition = setValidId('startSocket', SOCKET_KEY_2_ID, false, true) || needsPosition;
    needsPosition = setValidId('endSocket', SOCKET_KEY_2_ID, false, true) || needsPosition;

    if (setValidType('color', true)) { needsStyles = addPropList('color', needsStyles); }
    if (setValidType('size', true)) {
      needsStyles = addPropList('size', needsStyles);
      // Plug-size is changed with line-size automatically
      // but needs to initialize `*PlugOverhead` and `*PlugOutlineR`.
      // (`*PlugSize` doesn't initialize those when it's `PLUG_BEHIND`.)
      needsPlugs = addPropList('startPlug', needsPlugs);
      needsPlugs = addPropList('endPlug', needsPlugs);
      needsPosition = true;
    }

    ['startSocketGravity', 'endSocketGravity'].forEach(function(prop) {
      var value = false; // means no-update input.
      if (options[prop] != null) { // eslint-disable-line eqeqeq
        if (Array.isArray(options[prop])) {
          if (typeof options[prop][0] === 'number' && typeof options[prop][1] === 'number') {
            value = [options[prop][0], options[prop][1]];
            if (Array.isArray(props[prop]) && matchArray(value, props[prop])) { value = false; }
          }
        } else {
          if ((options[prop] + '').toLowerCase() === KEY_AUTO) {
            value = null;
          } else if (typeof options[prop] === 'number' && options[prop] >= 0) {
            value = options[prop];
          }
          if (value === props[prop]) { value = false; }
        }
        if (value !== false) {
          props[prop] = value;
          needsPosition = true;
        }
      }
    });

    ['startPlug', 'endPlug'].forEach(function(prop) {
      if (setValidId(prop, PLUG_KEY_2_ID, true)) {
        needsPlugs = addPropList(prop, needsPlugs);
        needsPosition = true;
      }
      if (setValidType(prop + 'Color', false, 'string', true)) {
        needsPlugs = addPropList(prop + 'Color', needsPlugs);
      }
      if (setValidType(prop + 'Size', true)) {
        needsPlugs = addPropList(prop + 'Size', needsPlugs);
        needsPosition = true;
      }
    });

    if (needsStyles) { // Update styles.
      setStyles(props, Array.isArray(needsStyles) ? needsStyles : null);
    }
    if (needsPlugs) { // Update plugs.
      setPlugs(props, Array.isArray(needsPlugs) ? needsPlugs : null);
    }
    if (needsPosition) { // Call `position()`.
      this.position();
    }

    return this;
  };

  LeaderLine.prototype.position = function() {
    var props = insProps[this._id],
      bBoxes = {}, newSocketXY = {}, newMaskBBox = {}, newPathData, newViewBBox = {},
      socketXYsWk, socketsLenMin = -1, autoKey, fixKey,
      cx = {}, cy = {}, pathSegs = [], pathSegsLen = [], baseVal, styles;

    function getSocketXY(bBox, socketId) {
      var socketXY = (
        socketId === SOCKET_TOP ? {x: bBox.left + bBox.width / 2, y: bBox.top} :
        socketId === SOCKET_RIGHT ? {x: bBox.right, y: bBox.top + bBox.height / 2} :
        socketId === SOCKET_BOTTOM ? {x: bBox.left + bBox.width / 2, y: bBox.bottom} :
                    /* SOCKET_LEFT */ {x: bBox.left, y: bBox.top + bBox.height / 2});
      socketXY.socketId = socketId;
      return socketXY;
    }

    bBoxes.start = getBBoxNest(props.start, props.baseWindow);
    bBoxes.end = getBBoxNest(props.end, props.baseWindow);

    // Decide each socket.
    if (props.startSocket && props.endSocket) {
      newSocketXY.start = getSocketXY(bBoxes.start, props.startSocket);
      newSocketXY.end = getSocketXY(bBoxes.end, props.endSocket);

    } else if (!props.startSocket && !props.endSocket) {
      socketXYsWk = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBoxes.end, socketId); });
      SOCKET_IDS.map(function(socketId) { return getSocketXY(bBoxes.start, socketId); })
        .forEach(function(startSocketXY) {
          socketXYsWk.forEach(function(endSocketXY) {
            var len = getPointsLength(startSocketXY, endSocketXY);
            if (len < socketsLenMin || socketsLenMin === -1) {
              newSocketXY.start = startSocketXY;
              newSocketXY.end = endSocketXY;
              socketsLenMin = len;
            }
          });
        });

    } else {
      if (props.startSocket) {
        fixKey = 'start';
        autoKey = 'end';
      } else {
        fixKey = 'end';
        autoKey = 'start';
      }
      newSocketXY[fixKey] = getSocketXY(bBoxes[fixKey], props[fixKey + 'Socket']);
      socketXYsWk = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBoxes[autoKey], socketId); });
      socketXYsWk.forEach(function(socketXY) {
        var len = getPointsLength(socketXY, newSocketXY[fixKey]);
        if (len < socketsLenMin || socketsLenMin === -1) {
          newSocketXY[autoKey] = socketXY;
          socketsLenMin = len;
        }
      });
    }

    // To limit updated `SocketXY`.
    ['start', 'end'].forEach(function(key) {
      var socketXY1 = newSocketXY[key], socketXY2 = props[key + 'SocketXY'];
      if (socketXY1.x !== socketXY2.x || socketXY1.y !== socketXY2.y ||
          socketXY1.socketId !== socketXY2.socketId) {
        props[key + 'SocketXY'] = newSocketXY[key];
      } else {
        newSocketXY[key] = null;
      }
    });

    // Set `positionedShape` and generate path data.
    if (newSocketXY.start || newSocketXY.end ||
        SHAPE_PROPS.some(function(prop) { return props.positionedShape[prop] !== props[prop]; })) {
      // Generate path segments.
      switch (props.line) {

        case LINE_STRAIGHT:
          pathSegs.push([props.startSocketXY, props.endSocketXY]);
          break;

        case LINE_FLUID:
          ['start', 'end'].forEach(function(key) {
            var gravity = props[key + 'SocketGravity'], socketXY = props[key + 'SocketXY'],
              offset = {}, anotherSocketXY, len;
            if (Array.isArray(gravity)) { // offset
              offset = {x: gravity[0], y: gravity[1]};
            } else if (typeof gravity === 'number') { // distance
              offset =
                socketXY.socketId === SOCKET_TOP ? {x: 0, y: -gravity} :
                socketXY.socketId === SOCKET_RIGHT ? {x: gravity, y: 0} :
                socketXY.socketId === SOCKET_BOTTOM ? {x: 0, y: gravity} :
                                    /* SOCKET_LEFT */ {x: -gravity, y: 0};
            } else { // auto
              anotherSocketXY = props[(key === 'start' ? 'end' : 'start') + 'SocketXY'];
              if (socketXY.socketId === SOCKET_TOP) {
                len = (socketXY.y - anotherSocketXY.y) / 2;
                if (len < MIN_GRAVITY) { len = MIN_GRAVITY; }
                offset = {x: 0, y: -len};
              } else if (socketXY.socketId === SOCKET_RIGHT) {
                len = (anotherSocketXY.x - socketXY.x) / 2;
                if (len < MIN_GRAVITY) { len = MIN_GRAVITY; }
                offset = {x: len, y: 0};
              } else if (socketXY.socketId === SOCKET_BOTTOM) {
                len = (anotherSocketXY.y - socketXY.y) / 2;
                if (len < MIN_GRAVITY) { len = MIN_GRAVITY; }
                offset = {x: 0, y: len};
              } else { // SOCKET_LEFT
                len = (socketXY.x - anotherSocketXY.x) / 2;
                if (len < MIN_GRAVITY) { len = MIN_GRAVITY; }
                offset = {x: -len, y: 0};
              }
            }
            cx[key] = socketXY.x + offset.x;
            cy[key] = socketXY.y + offset.y;
          });
          pathSegs.push([props.startSocketXY,
            {x: cx.start, y: cy.start}, {x: cx.end, y: cy.end}, props.endSocketXY]);
          break;

        // no default
      }
      // Adjust path with plugs.
      ['start', 'end'].forEach(function(key) {
        var prop = key + 'PlugOverhead', start = key === 'start', overhead = props[prop],
          pathSeg, i, point, socketId, minAdjustOffset;
        if (overhead > 0) {
          i = start ? 0 : pathSegs.length - 1;
          pathSeg = pathSegs[i];

          if (pathSeg.length === 2) { // Straight line
            pathSegsLen[i] = pathSegsLen[i] || getPointsLength.apply(null, pathSeg);
            if (pathSegsLen[i] > MIN_ADJUST_LEN) {
              if (pathSegsLen[i] - overhead < MIN_ADJUST_LEN) {
                overhead = pathSegsLen[i] - MIN_ADJUST_LEN;
              }
              point = getPointOnLineSeg(pathSeg[0], pathSeg[1],
                (start ? overhead : pathSegsLen[i] - overhead) / pathSegsLen[i]);
              pathSegs[i] = start ? [point, pathSeg[1]] : [pathSeg[0], point];
              pathSegsLen[i] -= overhead;
            }

          } else { // Cubic bezier
            pathSegsLen[i] = pathSegsLen[i] || getPathLength.apply(null, pathSeg);
            if (pathSegsLen[i] > MIN_ADJUST_LEN) {
              if (pathSegsLen[i] - overhead < MIN_ADJUST_LEN) {
                overhead = pathSegsLen[i] - MIN_ADJUST_LEN;
              }
              point = getPointOnPath(pathSeg[0], pathSeg[1], pathSeg[2], pathSeg[3],
                getPathT(pathSeg[0], pathSeg[1], pathSeg[2], pathSeg[3],
                  start ? overhead : pathSegsLen[i] - overhead));
              pathSegs[i] = start ?
                [point, point.toP1, point.toP2, pathSeg[3]] :
                [pathSeg[0], point.fromP1, point.fromP2, point];
              pathSegsLen[i] -= overhead;
            }

          }
        } else if (overhead < 0) {
          i = start ? 0 : pathSegs.length - 1;
          pathSeg = pathSegs[i];
          socketId = props[key + 'SocketXY'].socketId;
          minAdjustOffset = -(bBoxes[key][
            socketId === SOCKET_LEFT || socketId === SOCKET_RIGHT ? 'width' : 'height']);
          if (overhead < minAdjustOffset) { overhead = minAdjustOffset; }
          point = pathSeg[start ? 0 : pathSeg.length - 1];
          point[socketId === SOCKET_LEFT || socketId === SOCKET_RIGHT ? 'x' : 'y'] +=
            overhead * (socketId === SOCKET_LEFT || socketId === SOCKET_TOP ? -1 : 1);
          newMaskBBox[key] = bBoxes[key];
          pathSegsLen[i] = null; // to re-calculate
        }
      });

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
      // Expand bBox with line or symbol of plugs.
      (function(padding) {
        newViewBBox.x1 -= padding;
        newViewBBox.x2 += padding;
        newViewBBox.y1 -= padding;
        newViewBBox.y2 += padding;
      })(Math.max(props.size / 2, props.startPlugOutlineR, props.endPlugOutlineR));
      newViewBBox.x = newViewBBox.x1;
      newViewBBox.y = newViewBBox.y1;
      newViewBBox.width = newViewBBox.x2 - newViewBBox.x1;
      newViewBBox.height = newViewBBox.y2 - newViewBBox.y1;

      // Apply path data.
      if (newPathData.length !== props.pathData.length ||
          newPathData.some(function(newPathSeg, i) {
            var pathSeg = props.pathData[i];
            return newPathSeg.type !== pathSeg.type ||
              newPathSeg.values.some(function(newPathSegValue, i) {
                return newPathSegValue !== pathSeg.values[i];
              });
          })) {
        props.path.setPathData(newPathData);
        props.pathData = newPathData;
      }
      // Position `<svg>` element and set its `viewBox`.
      baseVal = props.svg.viewBox.baseVal;
      styles = props.svg.style;
      [['x', 'left'], ['y', 'top'], ['width', 'width'], ['height', 'height']].forEach(function(keys) {
        var boxKey = keys[0], cssProp = keys[1];
        if (newViewBBox[boxKey] !== props.viewBBox[boxKey]) {
          props.viewBBox[boxKey] = baseVal[boxKey] = newViewBBox[boxKey];
          styles[cssProp] = newViewBBox[boxKey] +
            (boxKey === 'x' || boxKey === 'y' ? props.bodyOffset[boxKey] : 0) + 'px';
        }
      });

      SHAPE_PROPS.forEach(function(prop) { props.positionedShape[prop] = props[prop]; });
    }
  };

  return LeaderLine;
})();
