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

  beforeEach(function(beforeDone) {
    loadPage('spec/update-props/update-props.html', function(frmWindow, frmDocument, body, done) {
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
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', 'propsHasChanged:path', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData'
    ]);

    // Change `socketGravitySE`, it doesn't affect pathData because `path` is 'straight'.
    window.traceLog = [];
    ll.startSocketGravity = 10;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', 'propsHasChanged:socketGravitySE[0]', 'new-pathList.baseVal'
    ]);

    pageDone();
  });

  it(registerTitle('updateViewBBox'), function() {
    var props = window.insProps[ll._id];

    // down `lineSize` without changing `plugSizeSE`
    // plugBCircleSE[i] = lineSize / DEFAULT_OPTIONS.lineSize(4) * symbolConf.bCircle(8) * plugSizeSE[i]
    ll.startPlug = 'arrow1';
    expect(props.viewBBoxVals.plugBCircleSE[0]).toBe(8);
    expect(props.viewBBoxVals.plugBCircleSE[1]).toBe(8);
    window.traceLog = [];
    ll.setOptions({
      size: 2, // /= 2
      startPlugSize: 2, // *= 2
      endPlugSize: 2 // *= 2
    });
    expect(props.viewBBoxVals.plugBCircleSE[0]).toBe(8);
    expect(props.viewBBoxVals.plugBCircleSE[1]).toBe(8);
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLine>', 'lineSize=2',
      '<setPlug>', 'plugSize[0]=2', 'plugSize[1]=2',
      '<position>', 'propsHasChanged:lineSize', 'new-pathList.baseVal'
      // updateViewBBox is not called
    ]);

    // up `lineSize`
    window.traceLog = [];
    ll.setOptions({
      size: 20, // *= 5
      startPlugSize: 0.2, // /= 5
      endPlugSize: 0.2 // /= 5
    });
    expect(props.viewBBoxVals.plugBCircleSE[0]).toBe(8);
    expect(props.viewBBoxVals.plugBCircleSE[1]).toBe(8);
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLine>', 'lineSize=20',
      '<setPlug>', 'plugSize[0]=0.2', 'plugSize[1]=0.2',
      '<position>', 'propsHasChanged:lineSize', 'new-pathList.baseVal',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height', // updateViewBBox is called
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);

    pageDone();
  });

  it(registerTitle('updateMask'), function() {

    // `updateMask` is called when `viewBox` was changed and `<mask>`s are used
    window.traceLog = [];
    ll.size = 8;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLine>', 'lineSize=8',
      '<setPlug>',
      '<position>', 'propsHasChanged:plugOverheadSE[0]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height' // updateMask is called
    ]);

    pageDone();
  });

  it(registerTitle('effect events - dash'), function() {
    ll.effect = 'dash';

    // onSetLine
    ll.endPlug = 'behind'; // to avoid changing padding by symbol
    window.traceLog = [];
    ll.size = 5;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLine>', 'lineSize=5',
      '<EFFECTS.dash.onSetLine>', 'strokeDasharray=10,5',
      '<setPlug>',
      '<position>', 'propsHasChanged:plugOverheadSE[0]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);

    // onSetLine - not auto
    ll.effect = ['dash', {dashLen: 12, gapLen: 6}];
    window.traceLog = [];
    ll.size = 4;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLine>', 'lineSize=4',
      '<EFFECTS.dash.onSetLine>',
      '<setPlug>',
      '<position>', 'propsHasChanged:plugOverheadSE[0]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);

    pageDone();
  });

});
