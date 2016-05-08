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
   * @property {{socketId: number, x: number, y: number}} startSocketXY
   * @property {{socketId: number, x: number, y: number}} endSocketXY
   * @property {SVGSVGElement} elmSvg - '<svg>' element.
   * @property {SVGPathElement} elmPath - '<path>' element.
   * @property {Element} start - (P) A line is started at this element.
   * @property {Element} end - (P) A line is terminated at this element.
   * @property {string} startSocket - (P) `'top'`, `'right'`, `'bottom'`, `'left'` or `'auto'`.
   * @property {string} endSocket - (P) `'top'`, `'right'`, `'bottom'`, `'left'` or `'auto'`.
   * @property {string} color - (P) `stroke` of `<path>` element.
   * @property {number} width - (P) `stroke-width` of `<path>` element.
   */

  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    SOCKET_IDS = [SOCKET_TOP, SOCKET_RIGHT, SOCKET_BOTTOM, SOCKET_LEFT],
    SOCKET_KEY_2_ID =
      {top: SOCKET_TOP, right: SOCKET_RIGHT, bottom: SOCKET_BOTTOM, left: SOCKET_LEFT},

    DEFAULT_OPTIONS = {
      startSocket: 'auto',
      endSocket: 'auto',
      color: 'coral',
      width: '3px'
    },

    STYLE_ID = 'leader-line-styles',
    /* [DEBUG/]
    CSS_TEXT = '@INCLUDE[leader-line.css]@]';
    [DEBUG/] */
    // [DEBUG]
    CSS_TEXT = '.leader-line{position:absolute;overflow:visible}',
    // [/DEBUG]
    SVG_NS = 'http://www.w3.org/2000/svg',
    PROP_2_CSSPROP = {color: 'stroke', width: 'strokeWidth'},

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
   * Setup `baseWindow`, `bodyOffset`, `elmSvg` and `elmPath`.
   * @param {props} props - `props` of `LeaderLine` instance.
   * @param {Window} newWindow - A common ancestor `window`.
   * @returns {void}
   */
  function bindWindow(props, newWindow) {
    var baseDocument = newWindow.document,
      bodyOffset = {x: 0, y: 0},
      sheet, stylesHtml, stylesBody, elmSvg, elmPath;

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
    elmPath = baseDocument.createElementNS(SVG_NS, 'path');
    props.elmPath = elmSvg.appendChild(elmPath);
    props.elmSvg = baseDocument.body.appendChild(elmSvg);
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
        bindWindow(props, newWindow);
        needsUpdateStyles = true;
      }
    }

    ['startSocket', 'endSocket'].forEach(function(key) {
      var socket;
      if (options[key] && (
            (socket = (options[key] + '').toLowerCase()) === DEFAULT_OPTIONS[key] ||
            SOCKET_KEY_2_ID[socket]
          ) && props[key] !== options[key]) {
        props[key] = socket;
        needsPosition = true;
      }
      if (!props[key]) {
        props[key] = DEFAULT_OPTIONS[key];
        needsPosition = true;
      }
    });

    ['color', 'width'].forEach(function(key) {
      function addStyleProp() {
        if (!needsUpdateStyles) {
          needsUpdateStyles = [key];
        } else if (Array.isArray(needsUpdateStyles)) {
          needsUpdateStyles.push(key);
        } // Otherwise `needsUpdateStyles` is `true`.
        if (key === 'width') { needsPosition = true; } // `*socketXY` must be changed.
      }

      if (options[key] && typeof options[key] === typeof DEFAULT_OPTIONS[key] &&
          props[key] !== options[key]) {
        props[key] = options[key];
        addStyleProp();
      }
      if (!props[key]) {
        props[key] = DEFAULT_OPTIONS[key];
        addStyleProp();
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
      newSocketXY = {}, bBox1, bBox2, socketXYs1, socketXYs2, socketsLenMin = -1, autoKey, fixKey,
      viewX, viewY, viewW, viewH, styles;

    function getSocketXY(bBox, socketId) {
      var socketXY = (
        socketId === SOCKET_TOP ? {x: bBox.left + bBox.width / 2, y: bBox.top} :
        socketId === SOCKET_RIGHT ? {x: bBox.right, y: bBox.top + bBox.height / 2} :
        socketId === SOCKET_BOTTOM ? {x: bBox.left + bBox.width / 2, y: bBox.bottom} :
                    /* SOCKET_LEFT */ {x: bBox.left, y: bBox.top + bBox.height / 2});
      socketXY.socketId = socketId;
      return socketXY;
    }

    // Decide each socket.
    if (props.startSocket !== 'auto' && props.endSocket !== 'auto') {
      newSocketXY.start = getSocketXY(
        getBBoxNest(props.start, props.baseWindow), SOCKET_KEY_2_ID[props.startSocket]);
      newSocketXY.end = getSocketXY(
        getBBoxNest(props.end, props.baseWindow), SOCKET_KEY_2_ID[props.endSocket]);

    } else if (props.startSocket === 'auto' && props.endSocket === 'auto') {
      bBox1 = getBBoxNest(props.start, props.baseWindow);
      bBox2 = getBBoxNest(props.end, props.baseWindow);
      socketXYs1 = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBox1, socketId); });
      socketXYs2 = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBox2, socketId); });
      socketXYs1.forEach(function(socketXY1) {
        socketXYs2.forEach(function(socketXY2) {
          var len = pointsLen(socketXY1, socketXY2);
          if (len < socketsLenMin || socketsLenMin === -1) {
            newSocketXY.start = socketXY1;
            newSocketXY.end = socketXY2;
            socketsLenMin = len;
          }
        });
      });

    } else {
      if (props.startSocket === 'auto') {
        fixKey = 'end';
        autoKey = 'start';
      } else {
        fixKey = 'start';
        autoKey = 'end';
      }
      newSocketXY[fixKey] = getSocketXY(
        getBBoxNest(props[fixKey], props.baseWindow), SOCKET_KEY_2_ID[props[fixKey + 'Socket']]);
      bBox1 = getBBoxNest(props[autoKey], props.baseWindow);
      socketXYs1 = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBox1, socketId); });
      socketXYs1.forEach(function(socketXY) {
        var len = pointsLen(socketXY, newSocketXY[fixKey]);
        if (len < socketsLenMin || socketsLenMin === -1) {
          newSocketXY[autoKey] = socketXY;
          socketsLenMin = len;
        }
      });
    }

    ['start', 'end'].forEach(function(key) {
      var socketXY1 = newSocketXY[key], socketXY2 = props[key + 'SocketXY'];
      if (socketXY1.x !== socketXY2.x || socketXY1.y !== socketXY2.y ||
          socketXY1.socketId !== socketXY2.socketId) {
        props[key + 'SocketXY'] = newSocketXY[key];
      } else {
        newSocketXY[key] = null;
      }
    });

    // Position svg.
    if (props.startSocketXY.x < props.endSocketXY.x) {
      viewX = props.startSocketXY.x;
      viewW = props.endSocketXY.x - viewX;
    } else {
      viewX = props.endSocketXY.x;
      viewW = props.startSocketXY.x - viewX;
    }
    if (props.startSocketXY.y < props.endSocketXY.y) {
      viewY = props.startSocketXY.y;
      viewH = props.endSocketXY.y - viewY;
    } else {
      viewY = props.endSocketXY.y;
      viewH = props.startSocketXY.y - viewY;
    }
    styles = props.elmSvg.style;
    styles.left = (viewX + props.bodyOffset.x) + 'px';
    styles.top = (viewY + props.bodyOffset.y) + 'px';
    styles.width = viewW + 'px';
    styles.height = viewH + 'px';
    props.elmSvg.viewBox.baseVal.width = viewW;
    props.elmSvg.viewBox.baseVal.height = viewH;

    props.elmPath.setAttribute('d', 'M' + (props.startSocketXY.x - viewX) + ',' + (props.startSocketXY.y - viewY) +
      'L' + (props.endSocketXY.x - viewX) + ',' + (props.endSocketXY.y - viewY));
  };

  return LeaderLine;
})();
