/*
 * LeaderLine
 * https://github.com/anseki/leader-line
 *
 * Copyright (c) 2016 anseki
 * Licensed under the MIT license.
 */

;(function(global) { // eslint-disable-line no-extra-semi
  'use strict';

  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    SOCKET_IDS = [SOCKET_TOP, SOCKET_RIGHT, SOCKET_BOTTOM, SOCKET_LEFT],
    SOCKET_KEY_2_ID = {top: SOCKET_TOP, right: SOCKET_RIGHT, bottom: SOCKET_BOTTOM, left: SOCKET_LEFT},

    DEFAULT_OPTIONS = {
      socketFrom: 'auto',
      socketTo: 'auto',
      color: 'coral',
      width: 3
    },

    STYLE_ID = 'leader-line-styles',
    /* [DEBUG/]
    CSS_TEXT = '@INCLUDE[leader-line.css]@]';
    [DEBUG/] */
    // [DEBUG]
    CSS_TEXT = '.leader-line{position:absolute;overflow:visible} .leader-line path{stroke-width:30;stroke:red;}',
    // [/DEBUG]
    SVG_NS = 'http://www.w3.org/2000/svg';

  /**
   * Get an element's bounding-box that contains coordinates relative to the element's document or window.
   * @param {Element} element - target element.
   * @param {boolean} [relWindow] - The coordinates relative to the element's window or document (i.e. <html>).
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
   * Get distance between an element and its content (<iframe> element and its document).
   * @param {Element} element - target element.
   * @returns {{left: number, top: number}} - An Object has `left` and `top`.
   */
  function getContentOffset(element) {
    var styles = element.ownerDocument.defaultView.getComputedStyle(element);
    return {
      left: element.clientLeft + parseFloat(styles.paddingLeft),
      top: element.clientTop + parseFloat(styles.paddingTop)
    };
  }

  /**
   * Get <iframe> elements in path to an element.
   * @param {Element} element - target element.
   * @param {Window} [baseWindow] - Start window. This is excluded.
   * @returns {Element[]|null} - An Array of <iframe> elements or null when `baseWindow` was not found in the path.
   */
  function getFrames(element, baseWindow) {
    var frames = [], doc, win, curElement = element;
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
   * @param {Element} element - target element.
   * @param {Window} [baseWindow] - Window that is base of coordinates.
   * @returns {DOMRect|null} - A bounding-box or null when failed.
   */
  function getBBoxNest(element, baseWindow) {
    var bBox, frames, left = 0, top = 0;
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
   * Get a common ancestor `window`.
   * @param {Element} elm1 - A contained element.
   * @param {Element} elm2 - A contained element.
   * @returns {Window} commonWindow - A common ancestor `window`.
   */
  function getCommonWindow(elm1, elm2) {
    var fromFrames, toFrames, commonWindow;
    if (!(fromFrames = getFrames(elm1)) || !(toFrames = getFrames(elm2))) {
      throw new Error('Cannot get frames.');
    }
    if (fromFrames.length && toFrames.length) {
      fromFrames.reverse();
      toFrames.reverse();
      fromFrames.some(function(fromFrame) {
        return toFrames.some(function(toFrame) {
          if (toFrame === fromFrame) {
            commonWindow = toFrame.contentWindow;
            return true;
          }
          return false;
        });
      });
    }
    return commonWindow || window;
  }

  /**
   * Setup `elmSvg`, `elmPath`, `baseWindow` and `bodyOffset`.
   * @param {LeaderLine} leaderLine - `LeaderLine` instance that is parent.
   * @param {Window} newWindow - A common ancestor `window`.
   * @returns {void}
   */
  function bindWindow(leaderLine, newWindow) {
    var baseDocument = newWindow.document, bodyOffset = {x: 0, y: 0},
      sheet, stylesHtml, stylesBody, elmSvg, elmPath;

    if (leaderLine.baseWindow && leaderLine.elmSvg) {
      leaderLine.baseWindow.document.body.removeChild(leaderLine.elmSvg);
    }
    leaderLine.baseWindow = newWindow;

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
    leaderLine.bodyOffset = bodyOffset;

    // svg
    elmSvg = baseDocument.createElementNS(SVG_NS, 'svg');
    elmSvg.setAttribute('class', 'leader-line');
    if (!elmSvg.viewBox.baseVal) { elmSvg.setAttribute('viewBox', '0 0 0 0'); }
    elmPath = baseDocument.createElementNS(SVG_NS, 'path');
    leaderLine.elmPath = elmSvg.appendChild(elmPath);
    leaderLine.elmSvg = baseDocument.body.appendChild(elmSvg);
  }

  /**
   * @param {LeaderLine} leaderLine - `LeaderLine` instance.
   * @param {LeaderLineOptions} leaderLineOptions - `LeaderLineOptions` instance.
   * @param {Array} [props] - To limit properties.
   * @returns {void}
   */
  function updateStyles(leaderLine, leaderLineOptions, props) {
    
  }

  /**
   * @param {LeaderLineOptions} leaderLineOptions - `LeaderLineOptions` instance.
   * @param {Object} options - New options.
   * @param {LeaderLine} [leaderLine] - `LeaderLine` instance that its `update()` may be called.
   * @returns {boolean} toUpdate - Whether `update()` must be called.
   */
  function updateOptions(leaderLineOptions, options, leaderLine) {
    var toUpdate = false, toUpdateWindow = false, toUpdateStyles = false, newWindow;

    ['elmFrom', 'elmTo'].forEach(function(key) {
      if (options[key] && options[key].nodeType != null && // eslint-disable-line eqeqeq
          leaderLineOptions[key] !== options[key]) {
        leaderLineOptions[key] = options[key];
        toUpdate = toUpdateWindow = true;
      }
    });
    if (leaderLineOptions.elmFrom && leaderLineOptions.elmFrom === leaderLineOptions.elmTo) {
      throw new Error('`elmFrom` and `elmTo` are the same element.');
    }

    // Check window.
    if (toUpdateWindow && leaderLine) {
      newWindow = getCommonWindow(leaderLineOptions.elmFrom, leaderLineOptions.elmTo);
      if (leaderLine.baseWindow !== newWindow) {
        bindWindow(leaderLine, newWindow);
        toUpdateStyles = true;
      }
    }

    ['socketFrom', 'socketTo'].forEach(function(key) {
      var socket;
      if (options[key] && SOCKET_KEY_2_ID[(socket = (options[key] + '').toLowerCase())] &&
          leaderLineOptions[key] !== options[key]) {
        leaderLineOptions[key] = socket;
        toUpdate = true;
      }
    });

    if (options.color && typeof options.color === 'string' &&
        leaderLineOptions.color !== options.color) {
      leaderLineOptions.color = options.color;
      if (!toUpdateStyles) {
        toUpdateStyles = ['color'];
      } else if (Array.isArray(toUpdateStyles)) {
        toUpdateStyles.push('color');
      }
    }

    if (options.width && typeof options.width === 'number' &&
        leaderLineOptions.width !== options.width) {
      leaderLineOptions.width = options.width;
      toUpdate = true; // `socketXY` must be changed.
      if (!toUpdateStyles) {
        toUpdateStyles = ['width'];
      } else if (Array.isArray(toUpdateStyles)) {
        toUpdateStyles.push('width');
      }
    }

    // Update styles.
    if (toUpdateStyles && leaderLine) {
      updateStyles(leaderLine, leaderLineOptions, Array.isArray(toUpdateStyles) ? toUpdateStyles : null);
    }

    // `update()`.
    if (toUpdate && leaderLine) {
      leaderLine.update();
      toUpdate = false;
    }

    return toUpdate;
  }

  /**
   * @class
   * @property {Element} elmFrom - A line is started from this element.
   * @property {Element} elmTo - A line is terminated at this element.
   * @property {string} socketFrom - `'top'`, `'right'`, `'bottom'`, `'left'` or `'auto'`.
   * @property {string} socketTo - `'top'`, `'right'`, `'bottom'`, `'left'` or `'auto'`.
   * @property {string} color - `stroke` of `<path>` element.
   * @property {number} width - `stroke-width` of `<path>` element.
   * @param {Object} options - Initial options.
   * @param {LeaderLine} leaderLine - `LeaderLine` instance that is parent.
   */
  function LeaderLineOptions(options, leaderLine) {
    var that = this;
    that.leaderLine = leaderLine;

    if (!options.elmFrom || !options.elmTo ||
        options.elmFrom.nodeType == null || options.elmTo.nodeType == null || // eslint-disable-line eqeqeq
        options.elmFrom === options.elmTo) {
      throw new Error('`elmFrom` and `elmTo` are required.');
    }
    this.elmFrom = options.elmFrom;
    this.elmTo = options.elmTo;

    ['socketFrom', 'socketTo'].forEach(function(key) {
      var socket;
      that[key] = options[key] &&
        SOCKET_KEY_2_ID[(socket = (options[key] + '').toLowerCase())] ? socket : DEFAULT_OPTIONS[key];
    });

    that.color = typeof options.color === 'string' ? options.color : DEFAULT_OPTIONS.color;
    that.width = typeof options.width === 'number' ? options.width : DEFAULT_OPTIONS.width;
  }

  /**
   * @class
   * @property {LeaderLineOptions} options - Options of an instance.
   * @property {SVGSVGElement} elmSvg - '<svg>' element.
   * @property {SVGPathElement} elmPath - '<path>' element.
   * @property {Window} baseWindow - Window that contains `elmSvg`.
   * @property {{x: number, y: number}} bodyOffset - Distance between `left/top` of element and its bBox.
   * @property {{socketId: number, x: number, y: number}} socketFromXY
   * @property {{socketId: number, x: number, y: number}} socketToXY
   * @param {Element} [elmFrom] - Alternative to `options.elmFrom`.
   * @param {Element} [elmTo] - Alternative to `options.elmTo`.
   * @param {Object} [options] - Initial options.
   */
  function LeaderLine(elmFrom, elmTo, options) {
    if (arguments.length === 1) {
      options = elmFrom;
      elmFrom = null;
    }
    options = options || {};
    if (elmFrom) { options.elmFrom = elmFrom; }
    if (elmTo) { options.elmTo = elmTo; }
    this.options = options = new LeaderLineOptions(options, this);

    bindWindow(this, getCommonWindow(options.elmFrom, options.elmTo));
    this.update();
  }
  global.LeaderLine = LeaderLine;

  LeaderLine.prototype.update = function() {
    var that = this, options = that.options,
      bBox1, bBox2, socketXYs1, socketXYs2,
      socketsLenMin = -1, autoSideKey, fixSideKey, fixSideSocketXY,
      viewX, viewY, viewW, viewH, styles;

    function getSocketXY(bBox, socketId) {
      var socketXY = (
        socketId === SOCKET_TOP ? {x: bBox.left + bBox.width / 2, y: bBox.top} :
        socketId === SOCKET_RIGHT ? {x: bBox.right, y: bBox.top + bBox.height / 2} :
        socketId === SOCKET_BOTTOM ? {x: bBox.left + bBox.width / 2, y: bBox.bottom} :
        socketId === SOCKET_LEFT ? {x: bBox.left, y: bBox.top + bBox.height / 2} :
        null);
      if (socketXY) { socketXY.socketId = socketId; }
      return socketXY;
    }

    // Decide each socket.
    if (options.socketFrom !== 'auto' && options.socketTo !== 'auto') {
      that.socketFromXY = getSocketXY(
        getBBoxNest(options.elmFrom, that.baseWindow), SOCKET_KEY_2_ID[options.socketFrom]);
      that.socketToXY = getSocketXY(
        getBBoxNest(options.elmTo, that.baseWindow), SOCKET_KEY_2_ID[options.socketTo]);
    } else if (options.socketFrom === 'auto' && options.socketTo === 'auto') {
      bBox1 = getBBoxNest(options.elmFrom, that.baseWindow);
      bBox2 = getBBoxNest(options.elmTo, that.baseWindow);
      socketXYs1 = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBox1, socketId); });
      socketXYs2 = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBox2, socketId); });
      socketXYs1.forEach(function(socketFromXY) {
        socketXYs2.forEach(function(socketToXY) {
          var len = pointsLen(socketFromXY, socketToXY);
          if (len < socketsLenMin || socketsLenMin === -1) {
            that.socketFromXY = socketFromXY;
            that.socketToXY = socketToXY;
            socketsLenMin = len;
          }
        });
      });
    } else {
      if (options.socketFrom === 'auto') {
        fixSideKey = 'To';
        autoSideKey = 'From';
      } else {
        fixSideKey = 'From';
        autoSideKey = 'To';
      }
      fixSideSocketXY = that['socket' + fixSideKey + 'XY'] = getSocketXY(
        getBBoxNest(options['elm' + fixSideKey], that.baseWindow),
        SOCKET_KEY_2_ID[options['socket' + fixSideKey]]);
      bBox1 = getBBoxNest(options['elm' + autoSideKey], that.baseWindow);
      socketXYs1 = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBox1, socketId); });
      socketXYs1.forEach(function(socketXY) {
        var len = pointsLen(socketXY, fixSideSocketXY);
        if (len < socketsLenMin || socketsLenMin === -1) {
          that['socket' + autoSideKey + 'XY'] = socketXY;
          socketsLenMin = len;
        }
      });
    }

    // Position svg.
    if (that.socketFromXY.x < that.socketToXY.x) {
      viewX = that.socketFromXY.x;
      viewW = that.socketToXY.x - viewX;
    } else {
      viewX = that.socketToXY.x;
      viewW = that.socketFromXY.x - viewX;
    }
    if (that.socketFromXY.y < that.socketToXY.y) {
      viewY = that.socketFromXY.y;
      viewH = that.socketToXY.y - viewY;
    } else {
      viewY = that.socketToXY.y;
      viewH = that.socketFromXY.y - viewY;
    }
    styles = that.elmSvg.style;
    styles.left = (viewX + that.bodyOffset.x) + 'px';
    styles.top = (viewY + that.bodyOffset.y) + 'px';
    styles.width = viewW + 'px';
    styles.height = viewH + 'px';
    that.elmSvg.viewBox.baseVal.width = viewW;
    that.elmSvg.viewBox.baseVal.height = viewH;

    that.elmPath.setAttribute('d', 'M' + (that.socketFromXY.x - viewX) + ',' + (that.socketFromXY.y - viewY) +
      'L' + (that.socketToXY.x - viewX) + ',' + (that.socketToXY.y - viewY));
  };

})(Function('return this')()); // eslint-disable-line no-new-func
