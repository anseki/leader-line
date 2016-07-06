/* eslint-env jasmine */
/* global loadPage:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('update-props', function() {
  'use strict';

  var window, document, pageDone, ll, titles = [];

  // ================ context
  /* eslint-disable no-unused-vars, indent */
  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    PATH_STRAIGHT = 1, PATH_ARC = 2, PATH_FLUID = 3, PATH_MAGNET = 4, PATH_GRID = 5;
  /* eslint-enable no-unused-vars, indent */
  // ================ /context

  function registerTitle(title) {
    titles.push(title);
    return title;
  }

  /**
   * @param {Array} log - `traceLog`.
   * @param {(string|string[])[]} keys - `['<setOptions>', '<position>']` or
   *    `[['<updateLine>', 'lineColor']]` to check the ordering.
   * @returns {boolean} - `true` if all `keys` are contained.
   */
  function toContainAll(log, keys) {
    return keys.every(function(key) {
      var lastI = -1;
      return Array.isArray(key) ? key.every(function(keySeg) {
        var i = log.indexOf(keySeg), res = i > lastI;
        lastI = i;
        return res;
      }) :
      log.indexOf(key) > -1;
    });
  }

  beforeEach(function(beforeDone) {
    loadPage('spec/common/page.html', function(frmWindow, frmDocument, body, done) {
      window = frmWindow;
      document = frmDocument;
      pageDone = done;
      ll = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm3'));
      beforeDone();
    }, 'update-props - ' + titles.shift());
  });

  it(registerTitle('position'), function() {

    // Change `path`
    ll.endPlug = 'behind'; // to avoid changing padding by symbol
    window.traceLog = [];
    ll.path = 'straight';
    expect(toContainAll(window.traceLog, [
      ['<updatePosition>', 'statsHasChanged:path', 'new-position'],
      ['<updatePath>', 'statsHasChanged:pathData', 'setPathData']
    ])).toBe(true);

    // Change `socketGravitySE`, it doesn't affect pathData because `path` is 'straight'.
    window.traceLog = [];
    ll.startSocketGravity = 10;
    expect(window.traceLog).toEqual([
      '<updatePosition>', 'statsHasChanged:socketGravitySE[0]', 'new-position',
      '<updatePath>', '<updateViewBBox>', '<updateMask>' // no change
    ]);

    pageDone();
  });

  it(registerTitle('updateViewBBox'), function() {
    var props = window.insProps[ll._id];

    // down `lineSize` without changing `plugSizeSE`
    // plugBCircleSE[i] = lineSize / DEFAULT_OPTIONS.lineSize(4) * symbolConf.bCircle(8) * plugSizeSE[i]
    ll.startPlug = 'arrow1';
    expect(props.curViewBBox.plugBCircleSE[0]).toBe(8);
    expect(props.curViewBBox.plugBCircleSE[1]).toBe(8);
    window.traceLog = [];
    ll.setOptions({
      size: 2, // /= 2
      startPlugSize: 2, // *= 2
      endPlugSize: 2 // *= 2
    });
    expect(props.curViewBBox.plugBCircleSE[0]).toBe(8);
    expect(props.curViewBBox.plugBCircleSE[1]).toBe(8);
    expect(window.traceLog).toEqual([
      '<updateLine>', 'lineSize=2',
      '<updatePlug>', 'widthSE[0]', 'heightSE[0]', 'widthSE[1]', 'heightSE[1]',
      '<updateLineOutline>', '<updatePlugOutline>', // no change
      '<updatePosition>', 'statsHasChanged:lineSize', 'new-position',
      '<updatePath>', '<updateViewBBox>', '<updateMask>' // no change
    ]);

    // up `lineSize`
    window.traceLog = [];
    ll.setOptions({
      size: 20, // *= 5
      startPlugSize: 0.2, // /= 5
      endPlugSize: 0.2 // /= 5
    });
    expect(props.curViewBBox.plugBCircleSE[0]).toBe(8);
    expect(props.curViewBBox.plugBCircleSE[1]).toBe(8);
    expect(window.traceLog).toEqual([
      '<updateLine>', 'lineSize=20',
      '<updatePlug>', 'widthSE[0]', 'heightSE[0]', 'widthSE[1]', 'heightSE[1]',
      '<updateLineOutline>', '<updatePlugOutline>', // no change
      '<updatePosition>', 'statsHasChanged:lineSize', 'new-position',
      '<updatePath>', // no change
      '<updateViewBBox>', 'x', 'y', 'width', 'height',
      '<updateMask>' // no change
    ]);

    pageDone();
  });

  it(registerTitle('updateMask'), function() {

    // `mask` is updated when `viewBox` was changed and `<mask>`s are used
    window.traceLog = [];
    ll.size = 8;
    expect(window.traceLog).toEqual([
      '<updateLine>', 'lineSize=8',
      '<updatePlug>', '<updateLineOutline>', '<updatePlugOutline>', // no change
      '<updatePosition>', 'statsHasChanged:plugOverheadSE[0]', 'new-position',
      '<updatePath>', 'statsHasChanged:pathData', 'setPathData',
      '<updateViewBBox>', 'x', 'y', 'width', 'height',
      '<updateMask>', 'maskBGRectX', 'maskBGRectY', 'lineMaskX', 'lineMaskY'
    ]);

    pageDone();
  });

});
