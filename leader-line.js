/*
 * LeaderLine
 * https://github.com/anseki/leader-line
 *
 * Copyright (c) 2016 anseki
 * Licensed under the MIT license.
 */

;(function(global) { // eslint-disable-line no-extra-semi
  'use strict';

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
  global.getBBox = getBBox; // [DEBUG/]

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
  global.getFrameOffset = getContentOffset; // [DEBUG/]

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
  global.getFrames = getFrames; // [DEBUG/]

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
  global.getBBoxNest = getBBoxNest; // [DEBUG/]

  /**
   * @class
   * @param {Element} elmFrom - A line is started from this element.
   * @param {Element} elmTo - A line is terminated at this element.
   * @param {SVGSVGElement} svg - <svg> element.
   * @param {Window} baseWindow - Window that contains `svg`.
   * @param {{left: number, top: number}} bodyOffset - Distance between `left/top` of element and its bBox.
   */
  function LeaderLine(elmFrom, elmTo) {
    var fromFrames, toFrames, baseWindow, baseDocument, stylesHtml, stylesBody;

    if (!elmFrom || !elmTo || elmFrom === elmTo) {
      throw new Error('Cannot get elmFrom and elmTo.');
    }
    this.elmFrom = elmFrom;
    this.elmTo = elmTo;

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

    this.bodyOffset = {left: 0, top: 0};
    stylesHtml = baseWindow.getComputedStyle(baseDocument.documentElement);
    stylesBody = baseWindow.getComputedStyle(baseDocument.body);
    if (stylesBody.position !== 'static') {
      // When `<body>` has `position:(non-static)`,
      // `element{position:absolute}` is positioned relative to inside `<body>` border.
      this.bodyOffset.left -=
        [stylesHtml.marginLeft, stylesHtml.borderLeftWidth, stylesHtml.paddingLeft,
          stylesBody.marginLeft, stylesBody.borderLeftWidth]
        .reduce(function(value, addValue) { return (value += parseFloat(addValue)); }, 0);
      this.bodyOffset.top -=
        [stylesHtml.marginTop, stylesHtml.borderTopWidth, stylesHtml.paddingTop,
          stylesBody.marginTop, stylesBody.borderTopWidth]
        .reduce(function(value, addValue) { return (value += parseFloat(addValue)); }, 0);
    } else if (stylesHtml.position !== 'static') {
      // When `<body>` has `position:static` and `<html>` has `position:(non-static)`
      // `element{position:absolute}` is positioned relative to inside `<html>` border.
      this.bodyOffset.left -=
        [stylesHtml.marginLeft, stylesHtml.borderLeftWidth]
        .reduce(function(value, addValue) { return (value += parseFloat(addValue)); }, 0);
      this.bodyOffset.top -=
        [stylesHtml.marginTop, stylesHtml.borderTopWidth]
        .reduce(function(value, addValue) { return (value += parseFloat(addValue)); }, 0);
    }

    this.elm1 = baseDocument.createElement('div');
    this.elm2 = baseDocument.createElement('div');
    this.elm1.className = 'pt1';
    this.elm2.className = 'pt2';
    this.elm1.style.position = this.elm2.style.position = 'absolute';
    this.elm1.style.width = this.elm2.style.width = this.elm1.style.height = this.elm2.style.height = '10px';
    this.elm1.style.backgroundColor = '#acecea';
    this.elm2.style.backgroundColor = '#12d3f1';
    baseDocument.body.appendChild(this.elm1);
    baseDocument.body.appendChild(this.elm2);
    this.update();
  }
  global.LeaderLine = LeaderLine;

  LeaderLine.prototype.update = function() {
    var crd = getBBoxNest(this.elmFrom, this.baseWindow);
    this.elm1.style.left = (crd.left + this.bodyOffset.left) + 'px';
    this.elm1.style.top = (crd.top + this.bodyOffset.top) + 'px';
    crd = getBBoxNest(this.elmTo, this.baseWindow);
    this.elm2.style.left = (crd.left + this.bodyOffset.left) + 'px';
    this.elm2.style.top = (crd.top + this.bodyOffset.top) + 'px';
  };

})(Function('return this')()); // eslint-disable-line no-new-func
