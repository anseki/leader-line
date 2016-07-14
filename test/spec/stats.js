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

  it(registerTitle('setStat'), function() {
    var props = window.insProps[ll._id];

    // update
    expect(props.curStats.line_color).not.toBe('rgba(255, 0, 0, 0.5)');
    traceLog.clear();
    ll.color = 'rgba(255, 0, 0, 0.5)';
    expect(traceLog.getTaggedLog('updateLine')).toEqual([
      'line_color=rgba(255, 0, 0, 0.5)', 'line_colorTra=true'
    ]);
    expect(props.curStats.line_color).toBe('rgba(255, 0, 0, 0.5)');
    expect(props.curStats.line_colorTra).toBe(true);

    // same line_colorTra
    traceLog.clear();
    ll.color = 'rgba(0, 255, 0, 0.5)';
    expect(traceLog.getTaggedLog('updateLine')).toEqual([
      'line_color=rgba(0, 255, 0, 0.5)'
    ]);
    expect(props.curStats.line_color).toBe('rgba(0, 255, 0, 0.5)');
    expect(props.curStats.line_colorTra).toBe(true);

    pageDone();
  });

  it(registerTitle('updateLine'), function() {

    // line_color
    traceLog.clear();
    ll.color = 'red';
    expect(traceLog.getTaggedLog('updateLine')).toEqual([
      'line_color=red'
    ]);

    // line_colorTra
    traceLog.clear();
    ll.color = 'rgba(255, 0, 0, 0.5)';
    expect(traceLog.getTaggedLog('updateLine')).toEqual([
      'line_color=rgba(255, 0, 0, 0.5)', 'line_colorTra=true'
    ]);

    // line_strokeWidth
    traceLog.clear();
    ll.size = 6;
    expect(traceLog.getTaggedLog('updateLine')).toEqual([
      'line_strokeWidth=6'
    ]);

    pageDone();
  });

  it(registerTitle('updatePlug'), function() {
    var log, props = window.insProps[ll._id],
      plugMarkerWidth, plugMarkerHeight;

    // plug_enabledSE, plug_plugSE
    traceLog.clear();
    ll.startPlug = 'arrow2';
    log = traceLog.getTaggedLog('updatePlug');
    expect(log).toContainAll([
      'plug_enabledSE[0]=true', 'plug_plugSE[0]=arrow2'
    ]);
    expect(log).toNotContainAny([
      'plug_enabledSE[1]=true' // already enabled
    ]);
    expect(props.curStats.plug_enabledSE[1]).toBe(true);

    // plug_colorSE
    traceLog.clear();
    ll.startPlugColor = 'red';
    expect(traceLog.getTaggedLog('updatePlug')).toContainAll([
      'plug_colorSE[0]=red'
    ]);
    expect(props.curStats.plug_colorSE[0]).toBe('red');

    // plug_colorSE auto -> same
    ll.color = 'red';
    traceLog.clear();
    ll.startPlugColor = 'auto';
    expect(traceLog.getTaggedLog('updatePlug')).toEqual(['not-updated']);
    expect(props.curStats.plug_colorSE[0]).toBe('red');

    // plug_colorTraSE
    traceLog.clear();
    ll.startPlugColor = 'rgba(255, 0, 0, 0.5)';
    expect(traceLog.getTaggedLog('updatePlug')).toContainAll([
      'plug_colorSE[0]=rgba(255, 0, 0, 0.5)', 'plug_colorTraSE[0]=true'
    ]);
    expect(props.curStats.plug_colorTraSE[0]).toBe(true);

    // plug_colorTraSE -> same
    traceLog.clear();
    ll.startPlugColor = 'rgba(0, 255, 0, 0.5)';
    log = traceLog.getTaggedLog('updatePlug');
    expect(log).toContainAll([
      'plug_colorSE[0]=rgba(0, 255, 0, 0.5)'
    ]);
    expect(log).toNotContainAny([
      'plug_colorTraSE[0]=true'
    ]);
    expect(props.curStats.plug_colorTraSE[0]).toBe(true);

    // plug_markerWidthSE, plug_markerHeightSE
    traceLog.clear();
    ll.startPlug = 'square';
    expect(traceLog.getTaggedLog('updatePlug')).toContainAll([
      'plug_plugSE[0]=square', 'plug_markerWidthSE[0]', 'plug_markerHeightSE[0]'
    ]);

    // plug_markerWidthSE and plug_markerHeightSE are changed by plugSizeSE
    traceLog.clear();
    ll.startPlugSize = 2;
    expect(traceLog.getTaggedLog('updatePlug')).toContainAll([
      'plug_markerWidthSE[0]', 'plug_markerHeightSE[0]'
    ]);

    // plug_enabled: true plug_enabledSE: [false, true]
    expect(props.curStats.plug_enabledSE[0]).toBe(true);
    expect(props.curStats.plug_enabledSE[1]).toBe(true);
    expect(props.curStats.plug_enabled).toBe(true);
    traceLog.clear();
    ll.startPlug = 'behind';
    log = traceLog.getTaggedLog('updatePlug');
    expect(log).toContainAll([
      'plug_enabledSE[0]=false', 'plug_plugSE[0]=behind'
    ]);
    expect(log).toNotContainAny([
      'plug_enabledSE[1]=true', 'plug_enabled=true' // already enabled
    ]);
    expect(props.curStats.plug_enabledSE[0]).toBe(false);
    expect(props.curStats.plug_enabledSE[1]).toBe(true);
    expect(props.curStats.plug_enabled).toBe(true);

    // plug_colorSE is changed when plug_enabledSE is false also
    traceLog.clear();
    ll.startPlugColor = 'green';
    expect(traceLog.getTaggedLog('updatePlug')).toContainAll([
      'plug_colorSE[0]=green'
    ]);
    expect(props.curStats.plug_enabledSE[0]).toBe(false);
    expect(props.curStats.plug_colorSE[0]).toBe('green');

    // plug_markerWidthSE and plug_markerHeightSE are not changed when plug_enabledSE is false
    expect(props.options.plugSizeSE[0]).toBe(2);
    plugMarkerWidth = props.curStats.plug_markerWidthSE[0];
    plugMarkerHeight = props.curStats.plug_markerHeightSE[0];
    traceLog.clear();
    ll.startPlugSize = 1;
    expect(traceLog.getTaggedLog('updatePlug')).toEqual(['not-updated']);
    expect(props.options.plugSizeSE[0]).toBe(1); // changed
    expect(props.curStats.plug_markerWidthSE[0]).toBe(plugMarkerWidth); // not changed
    expect(props.curStats.plug_markerHeightSE[0]).toBe(plugMarkerHeight); // not changed

    // plug_enabled: false plug_enabledSE: [false, false]
    traceLog.clear();
    ll.endPlug = 'behind';
    log = traceLog.getTaggedLog('updatePlug');
    expect(log).toContainAll([
      'plug_enabledSE[1]=false', 'plug_plugSE[1]=behind', 'plug_enabled=false'
    ]);
    expect(log).toNotContainAny([
      'plug_enabledSE[0]=false' // already disabled
    ]);
    expect(props.curStats.plug_enabledSE[0]).toBe(false);
    expect(props.curStats.plug_enabledSE[1]).toBe(false);
    expect(props.curStats.plug_enabled).toBe(false);

    // plug_enabled: true plug_enabledSE: [true, false]
    plugMarkerWidth = props.curStats.plug_markerWidthSE[0];
    plugMarkerHeight = props.curStats.plug_markerHeightSE[0];
    traceLog.clear();
    ll.startPlug = 'arrow1';
    log = traceLog.getTaggedLog('updatePlug');
    // plug_markerWidthSE and plug_markerHeightSE also are changed by plugSizeSE that was changed before
    expect(log).toContainAll([
      'plug_enabledSE[0]=true', 'plug_plugSE[0]=arrow1',
      'plug_markerWidthSE[0]', 'plug_markerHeightSE[0]', 'plug_enabled=true'
    ]);
    expect(log).toNotContainAny([
      'plug_enabledSE[1]=false' // already disabled
    ]);
    expect(props.curStats.plug_enabledSE[0]).toBe(true);
    expect(props.curStats.plug_enabledSE[1]).toBe(false);
    expect(props.curStats.plug_enabled).toBe(true);
    expect(props.curStats.plug_markerWidthSE[0]).not.toBe(plugMarkerWidth);
    expect(props.curStats.plug_markerHeightSE[0]).not.toBe(plugMarkerHeight);

    pageDone();
  });

  it(registerTitle('updateLineOutline'), function() {

    // lineOutline_enabled
    traceLog.clear();
    ll.outline = true;
    expect(traceLog.getTaggedLog('updateLineOutline')).toEqual([
      'lineOutline_enabled=true'
    ]);

    // lineOutline_color
    traceLog.clear();
    ll.outlineColor = 'red';
    expect(traceLog.getTaggedLog('updateLineOutline')).toEqual([
      'lineOutline_color=red'
    ]);

    // lineOutline_colorTra true
    traceLog.clear();
    ll.outlineColor = 'rgba(255, 0, 0, 0.5)';
    expect(traceLog.getTaggedLog('updateLineOutline')).toContainAll([
      'lineOutline_color=rgba(255, 0, 0, 0.5)', 'lineOutline_colorTra=true'
    ]);

    // lineOutline_colorTra true -> same
    traceLog.clear();
    ll.outlineColor = 'rgba(0, 255, 0, 0.5)';
    expect(traceLog.getTaggedLog('updateLineOutline')).toEqual([
      'lineOutline_color=rgba(0, 255, 0, 0.5)' // lineOutline_colorTra was already enabled
    ]);

    // lineOutline_colorTra false
    traceLog.clear();
    ll.outlineColor = 'rgb(255, 0, 0)';
    expect(traceLog.getTaggedLog('updateLineOutline')).toContainAll([
      'lineOutline_color=rgb(255, 0, 0)', 'lineOutline_colorTra=false'
    ]);

    // lineOutline_strokeWidth
    traceLog.clear();
    ll.outlineSize = 0.4;
    expect(traceLog.getTaggedLog('updateLineOutline')).toContainAll([
      'lineOutline_strokeWidth'
    ]);

    // lineOutline_inStrokeWidth
    traceLog.clear();
    ll.outlineSize = 0.25;
    expect(traceLog.getTaggedLog('updateLineOutline')).toContainAll([
      'lineOutline_inStrokeWidth'
    ]);

    // lineOutline_inStrokeWidth by line_strokeWidth
    traceLog.clear();
    ll.size = 6;
    expect(traceLog.getTaggedLog('updateLineOutline')).toContainAll([
      'lineOutline_inStrokeWidth'
    ]);

    // lineOutline_inStrokeWidth by lineOutline_colorTra
    traceLog.clear();
    ll.outlineColor = 'rgba(0, 255, 0, 0.5)';
    expect(traceLog.getTaggedLog('updateLineOutline')).toContainAll([
      'lineOutline_inStrokeWidth'
    ]);

    pageDone();
  });

  it(registerTitle('updatePlugOutline'), function() {
    var props = window.insProps[ll._id];

    // plugOutline_enabledSE 1 plug_enabledSE[0]: false
    traceLog.clear();
    ll.startPlugOutline = true;
    expect(traceLog.getTaggedLog('updatePlugOutline')).toEqual(['not-updated']);
    expect(props.curStats.plug_enabledSE[0]).toBe(false);
    expect(props.options.plugOutlineEnabledSE[0]).toBe(true);
    expect(props.curStats.plugOutline_enabledSE[0]).toBe(false);

    // plugOutline_enabledSE 2 plug_enabledSE[0]: true
    traceLog.clear();
    ll.startPlug = 'arrow1';
    expect(traceLog.getTaggedLog('updatePlugOutline')).toContainAll([
      'plugOutline_enabledSE[0]=true'
    ]);
    expect(props.curStats.plug_enabledSE[0]).toBe(true);
    expect(props.options.plugOutlineEnabledSE[0]).toBe(true);
    expect(props.curStats.plugOutline_enabledSE[0]).toBe(true);

    // plugOutline_plugSE by updatePlug()
    expect(props.curStats.plugOutline_plugSE[0]).toBe('arrow1');
    ll.startPlug = 'arrow2';
    expect(props.curStats.plugOutline_plugSE[0]).toBe('arrow2');

    // plugOutline_colorSE
    traceLog.clear();
    ll.startPlugOutlineColor = 'red';
    expect(traceLog.getTaggedLog('updatePlugOutline')).toContainAll([
      'plugOutline_colorSE[0]=red'
    ]);
    expect(props.curStats.plugOutline_colorSE[0]).toBe('red');

    // plugOutline_colorSE auto -> same
    ll.outlineColor = 'red';
    traceLog.clear();
    ll.startPlugOutlineColor = 'auto';
    expect(traceLog.getTaggedLog('updatePlugOutline')).toEqual(['not-updated']);
    expect(props.curStats.plugOutline_colorSE[0]).toBe('red');

    // plugOutline_colorTraSE true
    traceLog.clear();
    ll.startPlugOutlineColor = 'rgba(255, 0, 0, 0.5)';
    expect(traceLog.getTaggedLog('updatePlugOutline')).toContainAll([
      'plugOutline_colorSE[0]=rgba(255, 0, 0, 0.5)', 'plugOutline_colorTraSE[0]=true'
    ]);

    // plugOutline_colorTraSE true -> same
    traceLog.clear();
    ll.startPlugOutlineColor = 'rgba(0, 255, 0, 0.5)';
    expect(traceLog.getTaggedLog('updatePlugOutline')).toEqual([
      'plugOutline_colorSE[0]=rgba(0, 255, 0, 0.5)' // plugOutline_colorTraSE was already enabled
    ]);

    // plugOutline_colorTraSE false
    traceLog.clear();
    ll.startPlugOutlineColor = 'rgb(255, 0, 0)';
    expect(traceLog.getTaggedLog('updatePlugOutline')).toContainAll([
      'plugOutline_colorSE[0]=rgb(255, 0, 0)', 'plugOutline_colorTraSE[0]=false'
    ]);

    // plugOutline_strokeWidthSE
    traceLog.clear();
    ll.startPlugOutlineSize = 1.2;
    expect(traceLog.getTaggedLog('updatePlugOutline')).toContainAll([
      'plugOutline_strokeWidthSE[0]'
    ]);

    // plugOutline_inStrokeWidthSE
    traceLog.clear();
    ll.startPlugOutlineSize = 1.4;
    expect(traceLog.getTaggedLog('updatePlugOutline')).toContainAll([
      'plugOutline_inStrokeWidthSE[0]'
    ]);

    // plugOutline_inStrokeWidthSE by line_strokeWidth
    ll.startPlugOutlineColor = 'rgba(255, 0, 0, 0.5)';
    traceLog.clear();
    ll.size = 6;
    expect(traceLog.getTaggedLog('updatePlugOutline')).toContainAll([
      'plugOutline_inStrokeWidthSE[0]'
    ]);

    // plugOutline_inStrokeWidthSE by plugOutline_colorTraSE
    traceLog.clear();
    ll.startPlugOutlineColor = 'rgb(0, 255, 0)';
    expect(traceLog.getTaggedLog('updatePlugOutline')).toContainAll([
      'plugOutline_inStrokeWidthSE[0]'
    ]);

    pageDone();
  });

  it(registerTitle('updateFaces'), function() {
    var props = window.insProps[ll._id];

    pageDone();
  });

  it(registerTitle('updatePosition'), function() {

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

  it(registerTitle('updatePath'), function() {
    var props = window.insProps[ll._id];

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
    var props = window.insProps[ll._id];

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
