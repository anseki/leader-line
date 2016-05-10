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
   * Properties of a `LeaderLine` instance. (P): public
   * @typedef {Object} props
   * @property {Window} baseWindow - Window that contains `LeaderLine` contents.
   * @property {{x: number, y: number}} bodyOffset - Distance between `baseWindow` and its `<body>`.
   * @property {DOMRect} viewBBox - A bounding-box (includes `x` and `y`) of a part that should be shown.
   * @property {{socketId: number, x: number, y: number}} startSocketXY
   * @property {{socketId: number, x: number, y: number}} endSocketXY
   * @property {{line, startPlug, endPlug}} shape - Current values.
   * @property {Array} pathData - Sequence of path segments of current `elmPath`.
   * @property {DOMRect} startMaskBBox - A bounding-box of current `elmStartMask`.
   * @property {DOMRect} endMaskBBox - A bounding-box of current `elmEndMask`.
   * @property {SVGSVGElement} elmSvg - '<svg>' element.
   * @property {SVGPathElement} elmPath - '<path>' element.
   * @property {SVGRectElement} elmStartMask - A mask for `start`.
   * @property {SVGRectElement} elmEndMask - A mask for `end`.
   * @property {SVGMarkerElement} elmStartMarker - A marker for `start`.
   * @property {SVGMarkerElement} elmEndMarker - A marker for `end`.
   * @property {SVGUseElement} elmStartMarkerUse - `<use>` element of `elmStartMarker`.
   * @property {SVGUseElement} elmEndMarkerUse - `<use>` element of `elmEndMarker`.
   * @property {string} startMarkerId - ID of `elmStartMarker`.
   * @property {string} endMarkerId - ID of `elmEndMarker`.
   * @property {Element} start - (P) An element that is starting point of a line.
   * @property {Element} end - (P) An element that is end point of a line.
   * @property {number} startSocket - (P) `socketId`.
   * @property {number} endSocket - (P) `socketId`.
   * @property {number} line - (P) `lineId`.
   * @property {Array} startGravity - (P) Pixels as gravity. `[distance]` or offset `[x, y]` (`[]` as auto).
   * @property {Array} endGravity - (P) Pixels as gravity. `[distance]` or offset `[x, y]` (`[]` as auto).
   * @property {number} startPlug - (P) `plugId`.
   * @property {number} endPlug - (P) `plugId`.
   * @property {string} color - (P) `stroke` of `<path>` element.
   * @property {string} width - (P) `stroke-width` of `<path>` element.
   */

  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4, SOCKET_AUTO = 5,
    SOCKET_KEY_2_ID =
      {top: SOCKET_TOP, right: SOCKET_RIGHT, bottom: SOCKET_BOTTOM, left: SOCKET_LEFT, auto: SOCKET_AUTO},
    SOCKET_FIX_IDS = [SOCKET_TOP, SOCKET_RIGHT, SOCKET_BOTTOM, SOCKET_LEFT],

    LINE_STRAIGHT = 1, LINE_ARC = 2, LINE_FLUID = 3, LINE_GRID = 4,
    LINE_KEY_2_ID = {straight: LINE_STRAIGHT, arc: LINE_ARC, fluid: LINE_FLUID, grid: LINE_GRID},

    PLUG_BEHIND = 1, PLUG_DISC = 2, PLUG_SQUARE = 3,
    PLUG_ARROW1 = 4, PLUG_ARROW2 = 5, PLUG_ARROW3 = 6,
    PLUG_KEY_2_ID = {behind: PLUG_BEHIND, disc: PLUG_DISC, square: PLUG_SQUARE,
      arrow1: PLUG_ARROW1, arrow2: PLUG_ARROW2, arrow3: PLUG_ARROW3},

    MIN_GRAVITY = 50,

    DEFAULT_OPTIONS = {
      startSocket: SOCKET_AUTO,
      endSocket: SOCKET_AUTO,
      line: LINE_FLUID,
      startGravity: [],
      endGravity: [],
      startPlug: PLUG_BEHIND,
      endPlug: PLUG_ARROW1,
      color: 'coral',
      width: '4px'
    },

    STYLE_ID = 'leader-line-styles',
    /* [DEBUG/]
    CSS_TEXT = '@INCLUDE[file:leader-line.css]@',
    [DEBUG/] */
    // [DEBUG]
    CSS_TEXT = '.leader-line{position:absolute;overflow:visible} .leader-line .line{fill:none} #leader-line-defs{width:0;height:0;}',
    // [/DEBUG]
    SVG_NS = 'http://www.w3.org/2000/svg',
    PROP_2_CSSPROP = {color: 'stroke', width: 'strokeWidth'},

    DEFS_ID = 'leader-line-defs',
    /* [DEBUG/]
    DEFS_HTML = @INCLUDE[code:DEFS_HTML]@,
    SYMBOLS = @INCLUDE[code:SYMBOLS]@,
    [DEBUG/] */
    // [DEBUG]
    DEFS_HTML = window.DEFS_HTML,
    SYMBOLS = window.SYMBOLS,
    // [/DEBUG]

    /**
     * @typedef {Object.<_id: number, props>} insProps
     */
    insProps = {}, insId = 0;

  /**
   * Get an element's bounding-box that contains coordinates relative to the element's document or window.
   * @param {Element} element - Target element.
   * @param {boolean} [relWindow] - Whether it's relative to the element's window, or document (i.e. `<html>`).
   * @returns {DOMRect|null} - A bounding-box or null when failed.
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
   * @returns {DOMRect|null} - A bounding-box or null when failed.
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

  function pointsLen(point1, point2) {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
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

  function getLength(p0, p1, p2, p3, z) {
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

  function getT(p0, p1, p2, p3, ll) {
    var e = 0.01, step = 1 / 2, t2 = 1 - step,
      l = getLength(p0, p1, p2, p3, t2);
    while (Math.abs(l - ll) > e) {
      step /= 2;
      t2 += (l < ll ? 1 : -1) * step;
      l = getLength(p0, p1, p2, p3, t2);
    }
    return t2;
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

  /**
   * Setup `baseWindow`, `bodyOffset`, `viewBBox`, `startSocketXY`, `endSocketXY`, `shape`, `pathData`,
   *    `startMaskBBox`, `endMaskBBox`, `elmSvg`, `elmPath`, `elmStartMask`, `elmEndMask`,
   *    `elmStartMarker`, `elmEndMarker`, `elmStartMarkerUse`, `elmEndMarkerUse`, `startMarkerId`, `endMarkerId`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Window} newWindow - A common ancestor `window`.
   * @param {number} id - ID of instance.
   * @returns {void}
   */
  function bindWindow(props, newWindow, id) {
    var baseDocument = newWindow.document,
      bodyOffset = {x: 0, y: 0},
      sheet, defs, stylesHtml, stylesBody, elmSvg, elmDefs;

    if (props.baseWindow && props.elmSvg) {
      props.baseWindow.document.body.removeChild(props.elmSvg);
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
    elmSvg = baseDocument.createElementNS(SVG_NS, 'svg');
    elmSvg.setAttribute('class', 'leader-line');
    if (!elmSvg.viewBox.baseVal) { elmSvg.setAttribute('viewBox', '0 0 0 0'); }

    props.startMarkerId = 'start-marker-' + id;
    props.endMarkerId = 'end-marker-' + id;
    elmDefs = elmSvg.appendChild(baseDocument.createElementNS(SVG_NS, 'defs'));
    props.elmStartMarker = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'marker'));
    props.elmEndMarker = elmDefs.appendChild(baseDocument.createElementNS(SVG_NS, 'marker'));
    props.elmStartMarker.setAttribute('id', props.startMarkerId);
    props.elmEndMarker.setAttribute('id', props.endMarkerId);
    props.elmStartMarkerUse = props.elmStartMarker.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
    props.elmEndMarkerUse = props.elmEndMarker.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));

    props.elmPath = elmSvg.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
    props.elmPath.setAttribute('class', 'line');
    props.elmStartMask = elmSvg.appendChild(baseDocument.createElementNS(SVG_NS, 'rect'));
    props.elmEndMask = elmSvg.appendChild(baseDocument.createElementNS(SVG_NS, 'rect'));
    props.elmStartMask.setAttribute('class', 'leader-line-mask');
    props.elmEndMask.setAttribute('class', 'leader-line-mask');

    props.elmSvg = baseDocument.body.appendChild(elmSvg);

    props.viewBBox = {};
    props.startSocketXY = {};
    props.endSocketXY = {};
    props.shape = {};
    props.pathData = [];
    props.startMaskBBox = {};
    props.endMaskBBox = {};
  }

  /**
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Array} [styleProps] - To limit properties.
   * @returns {void}
   */
  function setStyles(props, styleProps) {
    var styles = props.elmPath.style;
    (styleProps || ['color', 'width']).forEach(function(styleProp) {
      styles[PROP_2_CSSPROP[styleProp]] = props[styleProp];
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

    if (arguments.length === 1) {
      options = start;
      start = null;
    }
    options = options || {};
    if (start) { options.start = start; }
    if (end) { options.end = end; }

    this.option(options);
  }

  /**
   * @param {Object} options - New options.
   * @returns {void}
   */
  LeaderLine.prototype.option = function(options) {
    var props = insProps[this._id],
      needsCheckWindow, needsUpdateStyles, needsPosition, newWindow;

    function matchArray(array1, array2) {
      return array1.legth === array2.legth &&
        array1.every(function(value1, i) { return value1 === array2[i]; });
    }

    function addStyleProp(key) {
      if (!needsUpdateStyles) {
        needsUpdateStyles = [key];
      } else if (Array.isArray(needsUpdateStyles)) {
        needsUpdateStyles.push(key);
      } // Otherwise `needsUpdateStyles` is `true`.
      if (key === 'width') { needsPosition = true; } // `*socketXY` must be changed.
    }

    ['start', 'end'].forEach(function(key) {
      if (options[key] && options[key].nodeType != null && // eslint-disable-line eqeqeq
          props[key] !== options[key]) {
        props[key] = options[key];
        needsCheckWindow = needsPosition = true;
      }
    });
    if (!props.start || !props.end || props.start === props.end) {
      throw new Error('`start` and `end` are required.');
    }

    // Check window.
    if (needsCheckWindow) {
      newWindow = getCommonWindow(props.start, props.end);
      if (props.baseWindow !== newWindow) {
        bindWindow(props, newWindow, this._id);
        needsUpdateStyles = true;
      }
    }

    ['startSocket', 'endSocket', 'line', 'startPlug', 'endPlug'].forEach(function(key) {
      var id,
        key2Id = key === 'startSocket' || key === 'endSocket' ? SOCKET_KEY_2_ID :
          key === 'line' ? LINE_KEY_2_ID : PLUG_KEY_2_ID;
      if (options[key] && (id = key2Id[(options[key] + '').toLowerCase()]) && props[key] !== id) {
        props[key] = id;
        needsPosition = true;
      }
      if (!props[key]) {
        props[key] = DEFAULT_OPTIONS[key];
        needsPosition = true;
      }
    });

    ['startGravity', 'endGravity'].forEach(function(key) {
      var value;
      if (options[key]) {
        if (typeof options[key] === 'number') {
          if (options[key] >= 0) { value = [options[key]]; }
        } else if (Array.isArray(options[key])) {
          if (typeof options[key][0] === 'number' && typeof options[key][1] === 'number') {
            value = [options[key][0], options[key][1]];
          }
        } else if ((options[key] + '').toLowerCase() === 'auto') {
          value = [];
        }
        if (value && (!props[key] || !matchArray(value, props[key]))) {
          props[key] = value;
          needsPosition = true;
        }
      }
      if (!props[key]) {
        props[key] = DEFAULT_OPTIONS[key];
        needsPosition = true;
      }
    });

    ['color', 'width'].forEach(function(key) {
      if (options[key] && typeof options[key] === typeof DEFAULT_OPTIONS[key] &&
          props[key] !== options[key]) {
        props[key] = options[key];
        addStyleProp(key);
      }
      if (!props[key]) {
        props[key] = DEFAULT_OPTIONS[key];
        addStyleProp(key);
      }
    });

    if (needsUpdateStyles) { // Update styles.
      setStyles(props, Array.isArray(needsUpdateStyles) ? needsUpdateStyles : null);
    }
    if (needsPosition) { // Call `position()`.
      this.position();
    }

    return this;
  };

  LeaderLine.prototype.position = function() {
    var props = insProps[this._id],
      newBBox = {}, newSocketXY = {}, newPathData, newViewBBox = {},
      socketXYsWk, socketsLenMin = -1, autoKey, fixKey,
      cx = {}, cy = {}, baseVal, styles;

    function getSocketXY(bBox, socketId) {
      var socketXY = (
        socketId === SOCKET_TOP ? {x: bBox.left + bBox.width / 2, y: bBox.top} :
        socketId === SOCKET_RIGHT ? {x: bBox.right, y: bBox.top + bBox.height / 2} :
        socketId === SOCKET_BOTTOM ? {x: bBox.left + bBox.width / 2, y: bBox.bottom} :
                    /* SOCKET_LEFT */ {x: bBox.left, y: bBox.top + bBox.height / 2});
      socketXY.socketId = socketId;
      return socketXY;
    }

    newBBox.start = getBBoxNest(props.start, props.baseWindow);
    newBBox.end = getBBoxNest(props.end, props.baseWindow);

    // Decide each socket.
    if (props.startSocket !== SOCKET_AUTO && props.endSocket !== SOCKET_AUTO) {
      newSocketXY.start = getSocketXY(newBBox.start, props.startSocket);
      newSocketXY.end = getSocketXY(newBBox.end, props.endSocket);

    } else if (props.startSocket === SOCKET_AUTO && props.endSocket === SOCKET_AUTO) {
      socketXYsWk = SOCKET_FIX_IDS.map(function(socketId) { return getSocketXY(newBBox.end, socketId); });
      SOCKET_FIX_IDS.map(function(socketId) { return getSocketXY(newBBox.start, socketId); })
        .forEach(function(startSocketXY) {
          socketXYsWk.forEach(function(endSocketXY) {
            var len = pointsLen(startSocketXY, endSocketXY);
            if (len < socketsLenMin || socketsLenMin === -1) {
              newSocketXY.start = startSocketXY;
              newSocketXY.end = endSocketXY;
              socketsLenMin = len;
            }
          });
        });

    } else {
      if (props.startSocket === SOCKET_AUTO) {
        fixKey = 'end';
        autoKey = 'start';
      } else {
        fixKey = 'start';
        autoKey = 'end';
      }
      newSocketXY[fixKey] = getSocketXY(newBBox[fixKey], props[fixKey + 'Socket']);
      socketXYsWk = SOCKET_FIX_IDS.map(function(socketId) { return getSocketXY(newBBox[autoKey], socketId); });
      socketXYsWk.forEach(function(socketXY) {
        var len = pointsLen(socketXY, newSocketXY[fixKey]);
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

    // Set `shape` and generate path data.
    if (newSocketXY.start || newSocketXY.end || props.shape.line !== props.line ||
        props.shape.startPlug !== props.startPlug || props.shape.endPlug !== props.endPlug) {
      switch (props.line) {

        case LINE_STRAIGHT:
          newPathData = [
            {type: 'M', values: [props.startSocketXY.x, props.startSocketXY.y]},
            {type: 'L', values: [props.endSocketXY.x, props.endSocketXY.y]}
          ];
          props.shape.line = props.line;
          break;

        case LINE_FLUID:
          ['start', 'end'].forEach(function(key) {
            var gravity = props[key + 'Gravity'], socketXY = props[key + 'SocketXY'],
              offset = {}, anotherSocketXY, len;
            if (gravity.length === 2) { // offset
              offset = {x: gravity[0], y: gravity[1]};
            } else if (gravity.length === 1) { // distance
              offset =
                socketXY.socketId === SOCKET_TOP ? {x: 0, y: -gravity[0]} :
                socketXY.socketId === SOCKET_RIGHT ? {x: gravity[0], y: 0} :
                socketXY.socketId === SOCKET_BOTTOM ? {x: 0, y: gravity[0]} :
                                    /* SOCKET_LEFT */ {x: -gravity[0], y: 0};
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
          newPathData = [
            {type: 'M', values: [props.startSocketXY.x, props.startSocketXY.y]},
            {type: 'C', values: [
              cx.start, cy.start, cx.end, cy.end,
              props.endSocketXY.x, props.endSocketXY.y]}
          ];
          props.shape.line = props.line;
          break;

        // no default
      }

      ['startPlug', 'endPlug'].forEach(function(key) {
        switch (props[key]) {

          case PLUG_DISC:
            
            props.shape[key] = props[key];
            break;

          // no default
        }
      });

      // Apply path data.
      if (newPathData.length !== props.pathData.length ||
          newPathData.some(function(newPathSeg, i) {
            var pathSeg = props.pathData[i];
            return newPathSeg.type !== pathSeg.type ||
              newPathSeg.values.some(function(newPathSegValue, i) {
                return newPathSegValue !== pathSeg.values[i];
              });
          })) {
        props.elmPath.setPathData(newPathData);
        props.pathData = newPathData;

        // Position svg element and set its `viewBox`.
        if (props.startSocketXY.x < props.endSocketXY.x) {
          newViewBBox.x = props.startSocketXY.x;
          newViewBBox.width = props.endSocketXY.x - newViewBBox.x;
        } else {
          newViewBBox.x = props.endSocketXY.x;
          newViewBBox.width = props.startSocketXY.x - newViewBBox.x;
        }
        if (props.startSocketXY.y < props.endSocketXY.y) {
          newViewBBox.y = props.startSocketXY.y;
          newViewBBox.height = props.endSocketXY.y - newViewBBox.y;
        } else {
          newViewBBox.y = props.endSocketXY.y;
          newViewBBox.height = props.startSocketXY.y - newViewBBox.y;
        }
        baseVal = props.elmSvg.viewBox.baseVal;
        styles = props.elmSvg.style;
        [['x', 'left'], ['y', 'top'], ['width', 'width'], ['height', 'height']].forEach(function(keys) {
          var boxKey = keys[0], cssKey = keys[1];
          if (newViewBBox[boxKey] !== props.viewBBox[boxKey]) {
            props.viewBBox[boxKey] = baseVal[boxKey] = newViewBBox[boxKey];
            styles[cssKey] =
              (boxKey === 'x' || boxKey === 'y' ? newViewBBox[boxKey] + props.bodyOffset[boxKey] :
                newViewBBox[boxKey]) + 'px';
          }
        });
      }
    }
  };

  return LeaderLine;
})();
