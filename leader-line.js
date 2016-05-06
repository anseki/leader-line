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
   * @class
   * @property {Element} elmFrom - A line is started from this element.
   * @property {Element} elmTo - A line is terminated at this element.
   * @property {SVGSVGElement} elmSvg - <svg> element.
   * @property {SVGPathElement} elmPath - <path> element.
   * @property {Window} baseWindow - Window that contains `svg`.
   * @property {{x: number, y: number}} bodyOffset - Distance between `left/top` of element and its bBox.
   * @property {{socketId: number, x: number, y: number}} socketFrom
   * @property {{socketId: number, x: number, y: number}} socketTo
   * @param {Element} [elmFrom] - 'elmFrom' property.
   * @param {Element} [elmTo] - 'elmTo' property.
   * @param {Object} [options] - Options of an instance.
   */
  function LeaderLine(elmFrom, elmTo, options) {
    var fromFrames, toFrames, baseWindow, baseDocument,
      sheet, stylesHtml, stylesBody, elmSvg, elmPath;

    if (arguments.length < 3) {
      if (!elmFrom || elmFrom.nodeType == null) { // eslint-disable-line eqeqeq
        options = elmFrom;
        elmFrom = elmTo = null;
      } else if (!elmTo || elmTo.nodeType == null) { // eslint-disable-line eqeqeq
        options = elmTo;
        elmTo = null;
      }
    }
    options = options ?
      Object.keys(options).reduce(function(optionsCopy, optionName) {
        optionsCopy[optionName] = options[optionName];
        return optionsCopy;
      }, {}) : {};
    if (elmFrom && elmFrom.nodeType != null) { options.elmFrom = elmFrom; } // eslint-disable-line eqeqeq
    if (elmTo && elmTo.nodeType != null) { options.elmTo = elmTo; } // eslint-disable-line eqeqeq
    if (!options.elmFrom || !options.elmTo || options.elmFrom === options.elmTo) {
      throw new Error('`elmFrom` and `elmTo` are required.');
    }
    // Reset to initialize.
    elmFrom = options.elmFrom;
    elmTo = options.elmTo;

    // Get a common ancestor window
    if (!(fromFrames = getFrames(elmFrom)) || !(toFrames = getFrames(elmTo))) {
      throw new Error('Cannot get frames.');
    }
    if (fromFrames.length && toFrames.length) {
      fromFrames.reverse();
      toFrames.reverse();
      fromFrames.some(function(fromFrame) {
        return toFrames.some(function(toFrame) {
          if (toFrame === fromFrame) {
            baseWindow = toFrame.contentWindow;
            return true;
          }
          return false;
        });
      });
    }
    this.baseWindow = baseWindow = baseWindow || window;
    baseDocument = baseWindow.document;

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

    this.bodyOffset = {x: 0, y: 0};
    stylesHtml = baseWindow.getComputedStyle(baseDocument.documentElement);
    stylesBody = baseWindow.getComputedStyle(baseDocument.body);
    if (stylesBody.position !== 'static') {
      // When `<body>` has `position:(non-static)`,
      // `element{position:absolute}` is positioned relative to inside `<body>` border.
      this.bodyOffset.x -=
        [stylesHtml.marginLeft, stylesHtml.borderLeftWidth, stylesHtml.paddingLeft,
          stylesBody.marginLeft, stylesBody.borderLeftWidth]
        .reduce(function(value, addValue) { return (value += parseFloat(addValue)); }, 0);
      this.bodyOffset.y -=
        [stylesHtml.marginTop, stylesHtml.borderTopWidth, stylesHtml.paddingTop,
          stylesBody.marginTop, stylesBody.borderTopWidth]
        .reduce(function(value, addValue) { return (value += parseFloat(addValue)); }, 0);
    } else if (stylesHtml.position !== 'static') {
      // When `<body>` has `position:static` and `<html>` has `position:(non-static)`
      // `element{position:absolute}` is positioned relative to inside `<html>` border.
      this.bodyOffset.x -=
        [stylesHtml.marginLeft, stylesHtml.borderLeftWidth]
        .reduce(function(value, addValue) { return (value += parseFloat(addValue)); }, 0);
      this.bodyOffset.y -=
        [stylesHtml.marginTop, stylesHtml.borderTopWidth]
        .reduce(function(value, addValue) { return (value += parseFloat(addValue)); }, 0);
    }

    // socket
    ['socketFrom', 'socketTo'].forEach(function(key) {
      var socket;
      options[key] = options[key] &&
        SOCKET_KEY_2_ID[(socket = (options[key] + '').toLowerCase())] ? socket : 'auto';
    });

    // svg
    elmSvg = baseDocument.createElementNS(SVG_NS, 'svg');
    elmSvg.setAttribute('class', 'leader-line');
    if (!elmSvg.viewBox.baseVal) { elmSvg.setAttribute('viewBox', '0 0 0 0'); }
    elmPath = baseDocument.createElementNS(SVG_NS, 'path');
    this.elmPath = elmSvg.appendChild(elmPath);
    this.elmSvg = baseDocument.body.appendChild(elmSvg);

    this.elmFrom = elmFrom;
    this.elmTo = elmTo;
    this.options = options;
    this.update();
  }
  global.LeaderLine = LeaderLine;

  LeaderLine.prototype.update = function() {
    var that = this, bBox1, bBox2, socketXYs1, socketXYs2,
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
    if (that.options.socketFrom !== 'auto' && that.options.socketTo !== 'auto') {
      that.socketFrom = getSocketXY(
        getBBoxNest(that.elmFrom, that.baseWindow), SOCKET_KEY_2_ID[that.options.socketFrom]);
      that.socketTo = getSocketXY(
        getBBoxNest(that.elmTo, that.baseWindow), SOCKET_KEY_2_ID[that.options.socketTo]);
    } else if (that.options.socketFrom === 'auto' && that.options.socketTo === 'auto') {
      bBox1 = getBBoxNest(that.elmFrom, that.baseWindow);
      bBox2 = getBBoxNest(that.elmTo, that.baseWindow);
      socketXYs1 = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBox1, socketId); });
      socketXYs2 = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBox2, socketId); });
      socketXYs1.forEach(function(socketFromXY) {
        socketXYs2.forEach(function(socketToXY) {
          var len = pointsLen(socketFromXY, socketToXY);
          if (len < socketsLenMin || socketsLenMin === -1) {
            that.socketFrom = socketFromXY;
            that.socketTo = socketToXY;
            socketsLenMin = len;
          }
        });
      });
    } else {
      if (that.options.socketFrom === 'auto') {
        fixSideKey = 'To';
        autoSideKey = 'From';
      } else {
        fixSideKey = 'From';
        autoSideKey = 'To';
      }
      fixSideSocketXY = that['socket' + fixSideKey] = getSocketXY(
        getBBoxNest(that['elm' + fixSideKey], that.baseWindow),
        SOCKET_KEY_2_ID[that.options['socket' + fixSideKey]]);
      bBox1 = getBBoxNest(that['elm' + autoSideKey], that.baseWindow);
      socketXYs1 = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBox1, socketId); });
      socketXYs1.forEach(function(socketXY) {
        var len = pointsLen(socketXY, fixSideSocketXY);
        if (len < socketsLenMin || socketsLenMin === -1) {
          that['socket' + autoSideKey] = socketXY;
          socketsLenMin = len;
        }
      });
    }

    // Position svg.
    if (that.socketFrom.x < that.socketTo.x) {
      viewX = that.socketFrom.x;
      viewW = that.socketTo.x - viewX;
    } else {
      viewX = that.socketTo.x;
      viewW = that.socketFrom.x - viewX;
    }
    if (that.socketFrom.y < that.socketTo.y) {
      viewY = that.socketFrom.y;
      viewH = that.socketTo.y - viewY;
    } else {
      viewY = that.socketTo.y;
      viewH = that.socketFrom.y - viewY;
    }
    styles = that.elmSvg.style;
    styles.left = (viewX + that.bodyOffset.x) + 'px';
    styles.top = (viewY + that.bodyOffset.y) + 'px';
    styles.width = viewW + 'px';
    styles.height = viewH + 'px';
    that.elmSvg.viewBox.baseVal.width = viewW;
    that.elmSvg.viewBox.baseVal.height = viewH;

    that.elmPath.setAttribute('d', 'M' + (that.socketFrom.x - viewX) + ',' + (that.socketFrom.y - viewY) +
      'L' + (that.socketTo.x - viewX) + ',' + (that.socketTo.y - viewY));
  };

})(Function('return this')()); // eslint-disable-line no-new-func
