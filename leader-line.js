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

  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    SOCKET_IDS = [SOCKET_TOP, SOCKET_RIGHT, SOCKET_BOTTOM, SOCKET_LEFT],
    SOCKET_KEY_2_ID =
      {top: SOCKET_TOP, right: SOCKET_RIGHT, bottom: SOCKET_BOTTOM, left: SOCKET_LEFT},

    DEFAULT_OPTIONS = {
      socketFrom: 'auto',
      socketTo: 'auto',
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

    insProps = {}, insId = 0;

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
   * @param {Object} props - `insProps[id]` of `LeaderLine` instance.
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
   * @param {Object} props - `insProps[id]` of `LeaderLine` instance.
   * @param {Array} [styleProps] - To limit properties.
   * @returns {void}
   */
  function updateStyles(props, styleProps) {
    var optProps = props.optProps, styles = props.elmPath.style;
    (styleProps || ['color', 'width']).forEach(function(styleProp) {
      styles[PROP_2_CSSPROP[styleProp]] = optProps[styleProp];
    });
  }

  /**
   * @param {Object} optProps - `insProps[id].optProps` of `LeaderLineOptions` instance.
   * @param {Object} options - New options.
   * @param {LeaderLine} [leaderLine] - `LeaderLine` instance that its `update()` may be called.
   * @returns {boolean} toUpdate - Whether `update()` must be called.
   */
  function updateOptions(optProps, options, leaderLine) {
    var props, toUpdate, toUpdateWindow, toUpdateStyles, newWindow;

    ['elmFrom', 'elmTo'].forEach(function(key) {
      if (options[key] && options[key].nodeType != null && // eslint-disable-line eqeqeq
          optProps[key] !== options[key]) {
        optProps[key] = options[key];
        toUpdate = toUpdateWindow = true;
      }
    });
    if (optProps.elmFrom && optProps.elmFrom === optProps.elmTo) {
      throw new Error('`elmFrom` and `elmTo` are the same element.');
    }

    // Check window.
    if (leaderLine && toUpdateWindow) {
      newWindow = getCommonWindow(optProps.elmFrom, optProps.elmTo);
      props = insProps[leaderLine._id];
      if (props.baseWindow !== newWindow) {
        bindWindow(props, newWindow);
        toUpdateStyles = true;
      }
    }

    ['socketFrom', 'socketTo'].forEach(function(key) {
      var socket;
      if (options[key] && (
            (socket = (options[key] + '').toLowerCase()) === DEFAULT_OPTIONS[key] ||
            SOCKET_KEY_2_ID[socket]
          ) && optProps[key] !== options[key]) {
        optProps[key] = socket;
        toUpdate = true;
      }
    });

    ['color', 'width'].forEach(function(key) {
      if (options[key] && typeof options[key] === typeof DEFAULT_OPTIONS[key] &&
          optProps[key] !== options[key]) {
        optProps[key] = options[key];
        if (!toUpdateStyles) {
          toUpdateStyles = [key];
        } else if (Array.isArray(toUpdateStyles)) {
          toUpdateStyles.push(key);
        }
        if (key === 'width') {
          toUpdate = true; // `socketXY` must be changed.
        }
      }
    });

    if (leaderLine) {
      if (toUpdateStyles) { // Update styles.
        updateStyles(insProps[leaderLine._id], Array.isArray(toUpdateStyles) ? toUpdateStyles : null);
      }
      if (toUpdate) { // Call `update()`.
        leaderLine.update();
        toUpdate = false;
      }
    }

    return toUpdate;
  }

  /**
   * @class
   * @property {LeaderLine} leaderLine - `LeaderLine` instance that is parent.
   * @property {Element} elmFrom - A line is started from this element.
   * @property {Element} elmTo - A line is terminated at this element.
   * @property {string} socketFrom - `'top'`, `'right'`, `'bottom'`, `'left'` or `'auto'`.
   * @property {string} socketTo - `'top'`, `'right'`, `'bottom'`, `'left'` or `'auto'`.
   * @property {string} color - `stroke` of `<path>` element.
   * @property {number} width - `stroke-width` of `<path>` element.
   * @param {Object} options - Initial options.
   * @param {LeaderLine} leaderLine - `leaderLine` option.
   */
  function LeaderLineOptions(options, leaderLine) {
    var optProps = (insProps[leaderLine._id].optProps = {});
    Object.defineProperty(this, '_id', { value: leaderLine._id });

    updateOptions(optProps, options);
    optProps.leaderLine = leaderLine;

    if (!optProps.elmFrom || !optProps.elmTo) {
      throw new Error('`elmFrom` and `elmTo` are required.');
    }
    ['socketFrom', 'socketTo', 'color', 'width'].forEach(function(key) {
      optProps[key] = optProps[key] || DEFAULT_OPTIONS[key];
    });
  }

  /**
   * @class
   * @property {LeaderLineOptions} options - `LeaderLineOptions` instance.
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
    var props = {};
    Object.defineProperty(this, '_id', { value: insId++ });
    insProps[this._id] = props;

    if (arguments.length === 1) {
      options = elmFrom;
      elmFrom = null;
    }
    options = options || {};
    if (elmFrom) { options.elmFrom = elmFrom; }
    if (elmTo) { options.elmTo = elmTo; }
    Object.defineProperty(this, 'options', { value: new LeaderLineOptions(options, this) });

    bindWindow(props, getCommonWindow(props.optProps.elmFrom, props.optProps.elmTo));
    updateStyles(props);
    this.update();
  }

  LeaderLine.prototype.update = function() {
    var props = insProps[this._id], optProps = props.optProps,
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
    if (optProps.socketFrom !== 'auto' && optProps.socketTo !== 'auto') {
      props.socketFromXY = getSocketXY(
        getBBoxNest(optProps.elmFrom, props.baseWindow), SOCKET_KEY_2_ID[optProps.socketFrom]);
      props.socketToXY = getSocketXY(
        getBBoxNest(optProps.elmTo, props.baseWindow), SOCKET_KEY_2_ID[optProps.socketTo]);
    } else if (optProps.socketFrom === 'auto' && optProps.socketTo === 'auto') {
      bBox1 = getBBoxNest(optProps.elmFrom, props.baseWindow);
      bBox2 = getBBoxNest(optProps.elmTo, props.baseWindow);
      socketXYs1 = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBox1, socketId); });
      socketXYs2 = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBox2, socketId); });
      socketXYs1.forEach(function(socketFromXY) {
        socketXYs2.forEach(function(socketToXY) {
          var len = pointsLen(socketFromXY, socketToXY);
          if (len < socketsLenMin || socketsLenMin === -1) {
            props.socketFromXY = socketFromXY;
            props.socketToXY = socketToXY;
            socketsLenMin = len;
          }
        });
      });
    } else {
      if (optProps.socketFrom === 'auto') {
        fixSideKey = 'To';
        autoSideKey = 'From';
      } else {
        fixSideKey = 'From';
        autoSideKey = 'To';
      }
      fixSideSocketXY = props['socket' + fixSideKey + 'XY'] = getSocketXY(
        getBBoxNest(optProps['elm' + fixSideKey], props.baseWindow),
        SOCKET_KEY_2_ID[optProps['socket' + fixSideKey]]);
      bBox1 = getBBoxNest(optProps['elm' + autoSideKey], props.baseWindow);
      socketXYs1 = SOCKET_IDS.map(function(socketId) { return getSocketXY(bBox1, socketId); });
      socketXYs1.forEach(function(socketXY) {
        var len = pointsLen(socketXY, fixSideSocketXY);
        if (len < socketsLenMin || socketsLenMin === -1) {
          props['socket' + autoSideKey + 'XY'] = socketXY;
          socketsLenMin = len;
        }
      });
    }

    // Position svg.
    if (props.socketFromXY.x < props.socketToXY.x) {
      viewX = props.socketFromXY.x;
      viewW = props.socketToXY.x - viewX;
    } else {
      viewX = props.socketToXY.x;
      viewW = props.socketFromXY.x - viewX;
    }
    if (props.socketFromXY.y < props.socketToXY.y) {
      viewY = props.socketFromXY.y;
      viewH = props.socketToXY.y - viewY;
    } else {
      viewY = props.socketToXY.y;
      viewH = props.socketFromXY.y - viewY;
    }
    styles = props.elmSvg.style;
    styles.left = (viewX + props.bodyOffset.x) + 'px';
    styles.top = (viewY + props.bodyOffset.y) + 'px';
    styles.width = viewW + 'px';
    styles.height = viewH + 'px';
    props.elmSvg.viewBox.baseVal.width = viewW;
    props.elmSvg.viewBox.baseVal.height = viewH;

    props.elmPath.setAttribute('d', 'M' + (props.socketFromXY.x - viewX) + ',' + (props.socketFromXY.y - viewY) +
      'L' + (props.socketToXY.x - viewX) + ',' + (props.socketToXY.y - viewY));
  };

  return LeaderLine;
})();
