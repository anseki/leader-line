/* eslint-env jasmine */
/* global loadPage:false, customMatchers:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('update-stats', function() {
  'use strict';

  var window, document, traceLog, pageDone, ll, titles = [];

  /* eslint-disable no-unused-vars, indent */
  // ================ context
  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    PATH_STRAIGHT = 1, PATH_ARC = 2, PATH_FLUID = 3, PATH_MAGNET = 4, PATH_GRID = 5;
  // ================ /context
  /* eslint-enable no-unused-vars, indent */

  function registerTitle(title) {
    titles.push(title);
    return title;
  }

  beforeEach(function(beforeDone) {
    jasmine.addMatchers(customMatchers);
    loadPage('spec/common/page.html', function(frmWindow, frmDocument, body, done) {
      window = frmWindow;
      document = frmDocument;
      traceLog = window.traceLog;
      traceLog.enabled = true;
      pageDone = done;
      ll = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm3'));
      beforeDone();
    }, 'update-props - ' + titles.shift());
  });

  it(registerTitle('position'), function() {

    // Change `path`
    ll.endPlug = 'behind'; // to avoid changing padding by symbol
    traceLog.clear();
    ll.path = 'straight';
    expect(traceLog.log).toContainAll([
      ['<updatePosition>', 'new-position'],
      ['<updatePath>', 'setPathData']
    ]);

    // Change `socketGravitySE`, it doesn't affect pathData because `path` is 'straight'.
    traceLog.clear();
    ll.startSocketGravity = 10;
    expect(traceLog.log).toContainAll([
      ['<updatePosition>', 'new-position']
    ]
    // no change
    .concat(['<updatePath>', '<updateViewBox>', '<updateMask>']
      .map(function(key) { return [key, 'not-updated']; })));

    pageDone();
  });

  it(registerTitle('updateViewBox'), function() {
    var props = window.insProps[ll._id];

    // down `lineSize` without changing `plugSizeSE`
    // plugBCircleSE[i] = lineSize / DEFAULT_OPTIONS.lineSize(4) * symbolConf.bCircle(8) * plugSizeSE[i]
    ll.startPlug = 'arrow1';
    expect(props.curStats.viewBox_plugBCircleSE[0]).toBe(8);
    expect(props.curStats.viewBox_plugBCircleSE[1]).toBe(8);
    traceLog.clear();
    ll.setOptions({
      size: 2, // /= 2
      startPlugSize: 2, // *= 2
      endPlugSize: 2 // *= 2
    });
    expect(props.curStats.viewBox_plugBCircleSE[0]).toBe(8);
    expect(props.curStats.viewBox_plugBCircleSE[1]).toBe(8);
    expect(traceLog.log).toContainAll([
      ['<updateLine>', 'line_strokeWidth=2'],
      ['<updatePlug>', 'plug_markerWidthSE[0]', 'plug_markerHeightSE[0]',
        'plug_markerWidthSE[1]', 'plug_markerHeightSE[1]'],
      ['<updateLineOutline>', 'lineOutline_strokeWidth=1', 'lineOutline_inStrokeWidth=1.5'],
      ['<updatePosition>', 'new-position']
    ]
    // no change
    .concat(['<updatePlugOutline>',
        '<updatePath>', '<updateViewBox>', '<updateMask>']
      .map(function(key) { return [key, 'not-updated']; })));

    // up `lineSize`
    traceLog.clear();
    ll.setOptions({
      size: 20, // *= 5
      startPlugSize: 0.2, // /= 5
      endPlugSize: 0.2 // /= 5
    });
    expect(props.curStats.viewBox_plugBCircleSE[0]).toBe(8);
    expect(props.curStats.viewBox_plugBCircleSE[1]).toBe(8);
    expect(traceLog.log).toContainAll([
      ['<updateLine>', 'line_strokeWidth=20'],
      ['<updatePlug>', 'plug_markerWidthSE[0]', 'plug_markerHeightSE[0]',
        'plug_markerWidthSE[1]', 'plug_markerHeightSE[1]'],
      ['<updatePosition>', 'new-position'],
      ['<updateViewBox>', 'viewBox_bBox.x', 'viewBox_bBox.y',
        'viewBox_bBox.width', 'viewBox_bBox.height']
    ]
    // no change
    .concat(['<updatePlugOutline>', '<updatePath>', '<updateMask>']
      .map(function(key) { return [key, 'not-updated']; })));

    pageDone();
  });

  it(registerTitle('updateMask'), function() {

    // `mask` is updated when `viewBox` was changed and `<mask>`s are used
    traceLog.clear();
    ll.size = 8;
    expect(traceLog.log).toContainAll([
      ['<updateLine>', 'line_strokeWidth=8'],
      ['<updatePosition>', 'new-position'],
      ['<updatePath>', 'setPathData'],
      ['<updateViewBox>', 'viewBox_bBox.x', 'viewBox_bBox.y',
        'viewBox_bBox.width', 'viewBox_bBox.height'],
      ['<updateMask>', 'maskBGRect_x', 'maskBGRect_y', 'lineMask_x', 'lineMask_y']
    ]
    // no change
    .concat(['<updatePlug>', '<updatePlugOutline>']
      .map(function(key) { return [key, 'not-updated']; })));

    pageDone();
  });

});
