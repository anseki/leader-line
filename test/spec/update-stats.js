/* eslint-env jasmine */
/* global loadPage:false, customMatchers:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('update-stats', function() {
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

  beforeEach(function(beforeDone) {
    jasmine.addMatchers(customMatchers);
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
    expect(window.traceLog).toContainAll([
      ['<updatePosition>', 'statsHasChanged:path', 'new-position'],
      ['<updatePath>', 'statsHasChanged:pathData', 'setPathData']
    ]);

    // Change `socketGravitySE`, it doesn't affect pathData because `path` is 'straight'.
    window.traceLog = [];
    ll.startSocketGravity = 10;
    expect(window.traceLog).toContainAll([
      ['<updatePosition>', 'statsHasChanged:socketGravitySE[0]', 'new-position']
    ]
    // no change
    .concat(['<updatePath>', '<updateViewBBox>', '<updateMask>']
      .map(function(key) { return [key, 'not-updated']; })));

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
    expect(window.traceLog).toContainAll([
      ['<updateLine>', 'lineSize=2'],
      ['<updatePlug>', 'widthSE[0]', 'heightSE[0]', 'widthSE[1]', 'heightSE[1]'],
      ['<updatePosition>', 'statsHasChanged:lineSize', 'new-position']
    ]
    // no change
    .concat(['<updateLineOutline>', '<updatePlugOutline>',
        '<updatePath>', '<updateViewBBox>', '<updateMask>']
      .map(function(key) { return [key, 'not-updated']; })));

    // up `lineSize`
    window.traceLog = [];
    ll.setOptions({
      size: 20, // *= 5
      startPlugSize: 0.2, // /= 5
      endPlugSize: 0.2 // /= 5
    });
    expect(props.curViewBBox.plugBCircleSE[0]).toBe(8);
    expect(props.curViewBBox.plugBCircleSE[1]).toBe(8);
    expect(window.traceLog).toContainAll([
      ['<updateLine>', 'lineSize=20'],
      ['<updatePlug>', 'widthSE[0]', 'heightSE[0]', 'widthSE[1]', 'heightSE[1]'],
      ['<updatePosition>', 'statsHasChanged:lineSize', 'new-position'],
      ['<updateViewBBox>', 'x', 'y', 'width', 'height']
    ]
    // no change
    .concat(['<updateLineOutline>', '<updatePlugOutline>', '<updatePath>', '<updateMask>']
      .map(function(key) { return [key, 'not-updated']; })));

    pageDone();
  });

  it(registerTitle('updateMask'), function() {

    // `mask` is updated when `viewBox` was changed and `<mask>`s are used
    window.traceLog = [];
    ll.size = 8;
    expect(window.traceLog).toContainAll([
      ['<updateLine>', 'lineSize=8'],
      ['<updatePosition>', 'statsHasChanged:plugOverheadSE[0]', 'new-position'],
      ['<updatePath>', 'statsHasChanged:pathData', 'setPathData'],
      ['<updateViewBBox>', 'x', 'y', 'width', 'height'],
      ['<updateMask>', 'maskBGRectX', 'maskBGRectY', 'lineMaskX', 'lineMaskY']
    ]
    // no change
    .concat(['<updatePlug>', '<updateLineOutline>', '<updatePlugOutline>']
      .map(function(key) { return [key, 'not-updated']; })));

    pageDone();
  });

});
