/* eslint-env jasmine */
/* global loadPage:false, customMatchers:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('stats', function() {
  'use strict';

  var window, document, traceLog, pageDone, ll, titles = [];

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
    }/* , 'stats - ' + titles.shift() */);
  });

  it(registerTitle('setStat()'), function() {
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

  it(registerTitle('updateLine()'), function() {

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

  it(registerTitle('updatePlug()'), function() {
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

  it(registerTitle('updateLineOutline()'), function() {

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

  it(registerTitle('updatePlugOutline()'), function() {
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

    // plugOutline_strokeWidthSE is limited by symbolConf
    // arrow2: {outlineBase: 1, outlineMax: 1.75}
    traceLog.clear();
    ll.startPlugOutlineSize = 1.7;
    expect(traceLog.getTaggedLog('updatePlugOutline')).toContainAll([
      'plugOutline_strokeWidthSE[0]', 'plugOutline_inStrokeWidthSE[0]'
    ]);
    expect(props.options.plugOutlineEnabledSE[0]).toBe(true);
    expect(props.curStats.plugOutline_enabledSE[0]).toBe(true);
    expect(props.curStats.plugOutline_strokeWidthSE[0]).toBe(3.4); // options.plugOutlineSizeSE * outlineBase * 2
    expect(ll.startPlugOutlineSize).toBe(1.7);

    // over outlineMax
    traceLog.clear();
    ll.startPlugOutlineSize = 1.76;
    expect(traceLog.getTaggedLog('updatePlugOutline')).toContainAll([
      'plugOutline_strokeWidthSE[0]', 'plugOutline_inStrokeWidthSE[0]'
    ]);
    expect(props.options.plugOutlineEnabledSE[0]).toBe(true);
    expect(props.curStats.plugOutline_enabledSE[0]).toBe(true);
    // adjusted
    expect(props.curStats.plugOutline_strokeWidthSE[0]).toBe(3.5); // options.plugOutlineSizeSE * outlineBase * 2
    expect(ll.startPlugOutlineSize).toBe(1.76); // not adjusted

    // outlineMax
    traceLog.clear();
    ll.startPlugOutlineSize = 1.75;
    expect(traceLog.getTaggedLog('updatePlugOutline')).toEqual(['not-updated']); // not changed
    expect(props.options.plugOutlineEnabledSE[0]).toBe(true);
    expect(props.curStats.plugOutline_enabledSE[0]).toBe(true);
    expect(props.curStats.plugOutline_strokeWidthSE[0]).toBe(3.5); // options.plugOutlineSizeSE * outlineBase * 2
    expect(ll.startPlugOutlineSize).toBe(1.75);

    // change symbol
    // arrow1: {outlineBase: 2, outlineMax: 1.5}
    traceLog.clear();
    ll.startPlug = 'arrow1';
    expect(traceLog.getTaggedLog('updatePlugOutline')).toContainAll([
      'plugOutline_strokeWidthSE[0]', 'plugOutline_inStrokeWidthSE[0]'
    ]);
    expect(props.options.plugOutlineEnabledSE[0]).toBe(true);
    expect(props.curStats.plugOutline_enabledSE[0]).toBe(true);
    // adjusted
    expect(props.curStats.plugOutline_strokeWidthSE[0]).toBe(6); // options.plugOutlineSizeSE * outlineBase * 2
    expect(ll.startPlugOutlineSize).toBe(1.75); // not adjusted

    // change symbol
    // hand: {outlineMax: null}
    traceLog.clear();
    ll.startPlug = 'hand';
    expect(traceLog.getTaggedLog('updatePlugOutline')).toContainAll([
      'plugOutline_enabledSE[0]=false'
    ]);
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plugOutline_enabledSE[0]=false'
    ]);
    expect(props.options.plugOutlineEnabledSE[0]).toBe(true);
    expect(props.curStats.plugOutline_enabledSE[0]).toBe(false);
    expect(ll.startPlugOutlineSize).toBe(1.75); // not adjusted

    pageDone();
  });

  it(registerTitle('updateFaces()'), function() {
    var log, props = window.insProps[ll._id], value;

    // line_color
    traceLog.clear();
    ll.color = 'red';
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'line_color=red'
    ]);
    expect(props.aplStats.line_color).toBe('red');

    // line_strokeWidth
    traceLog.clear();
    ll.size = 6;
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'line_strokeWidth=6'
    ]);
    expect(props.aplStats.line_strokeWidth).toBe(6);

    // lineOutline_enabled
    traceLog.clear();
    ll.outline = true;
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'lineOutline_enabled=true'
    ]);
    expect(props.aplStats.lineOutline_enabled).toBe(true);

    // lineOutline_color
    traceLog.clear();
    ll.outlineColor = 'red';
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'lineOutline_color=red'
    ]);
    expect(props.aplStats.lineOutline_color).toBe('red');

    // lineOutline_strokeWidth
    traceLog.clear();
    ll.outlineSize = 0.4;
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'lineOutline_strokeWidth'
    ]);
    expect(props.aplStats.lineOutline_strokeWidth).toBe(props.curStats.lineOutline_strokeWidth);

    // lineOutline_inStrokeWidth
    traceLog.clear();
    ll.outlineSize = 0.25;
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'lineOutline_inStrokeWidth'
    ]);
    expect(props.aplStats.lineOutline_inStrokeWidth).toBe(props.curStats.lineOutline_inStrokeWidth);

    // lineOutline_enabled false
    traceLog.clear();
    ll.outline = false;
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'lineOutline_enabled=false'
    ]);
    expect(props.aplStats.lineOutline_enabled).toBe(false);

    // lineOutline_color when lineOutline_enabled: false
    traceLog.clear();
    ll.outlineColor = 'blue';
    expect(traceLog.getTaggedLog('updateFaces')).toEqual(['not-updated']);
    expect(props.curStats.lineOutline_color).toBe('blue'); // only cur* is changed
    expect(props.aplStats.lineOutline_color).not.toBe('blue');

    // lineOutline_strokeWidth when lineOutline_enabled: false
    value = props.curStats.lineOutline_strokeWidth;
    traceLog.clear();
    ll.outlineSize = 0.3;
    expect(traceLog.getTaggedLog('updateFaces')).toEqual(['not-updated']);
    expect(props.curStats.lineOutline_strokeWidth).not.toBe(value); // only cur* is changed
    expect(props.aplStats.lineOutline_strokeWidth).not.toBe(props.curStats.lineOutline_strokeWidth);

    // lineOutline_inStrokeWidth when lineOutline_enabled: false
    value = props.curStats.lineOutline_inStrokeWidth;
    traceLog.clear();
    ll.outlineSize = 0.35;
    expect(traceLog.getTaggedLog('updateFaces')).toEqual(['not-updated']);
    expect(props.curStats.lineOutline_inStrokeWidth).not.toBe(value); // only cur* is changed
    expect(props.aplStats.lineOutline_inStrokeWidth).not.toBe(props.curStats.lineOutline_inStrokeWidth);

    // lineOutline_enabled true
    traceLog.clear();
    ll.outline = true;
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'lineOutline_enabled=true', 'lineOutline_color=blue', 'lineOutline_strokeWidth', 'lineOutline_inStrokeWidth'
    ]);
    expect(props.aplStats.lineOutline_enabled).toBe(true);
    expect(props.aplStats.lineOutline_color).toBe('blue');
    expect(props.aplStats.lineOutline_strokeWidth).toBe(props.curStats.lineOutline_strokeWidth);
    expect(props.aplStats.lineOutline_inStrokeWidth).toBe(props.curStats.lineOutline_inStrokeWidth);

    // plug_enabledSE, plug_plugSE
    expect(props.aplStats.plug_enabledSE[0]).toBe(false);
    traceLog.clear();
    ll.startPlug = 'arrow2';
    log = traceLog.getTaggedLog('updateFaces');
    expect(log).toContainAll([
      'plug_enabledSE[0]=true', 'plug_plugSE[0]=arrow2'
    ]);
    expect(log).toNotContainAny([
      'plug_enabledSE[1]=true' // already enabled
    ]);
    expect(props.aplStats.plug_enabledSE[0]).toBe(true);

    // plug_colorSE
    traceLog.clear();
    ll.startPlugColor = 'green';
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plug_colorSE[0]=green'
    ]);
    expect(props.aplStats.plug_colorSE[0]).toBe('green');

    // plug_markerWidthSE, plug_markerHeightSE
    traceLog.clear();
    ll.startPlugSize = 2;
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plug_markerWidthSE[0]', 'plug_markerHeightSE[0]'
    ]);

    // plug_enabledSE false
    traceLog.clear();
    ll.startPlug = 'behind';
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plug_enabledSE[0]=false'
    ]);
    expect(props.aplStats.plug_enabledSE[0]).toBe(false);

    // plug_enabledSE false -> plug_enabled false
    traceLog.clear();
    ll.endPlug = 'behind';
    expect(traceLog.getTaggedLog('updateFaces')).toEqual([
      'plug_enabled=false' // plug_enabledSE[1] is not changed (true)
    ]);
    expect(props.aplStats.plug_enabledSE[0]).toBe(false);
    expect(props.curStats.plug_enabledSE[1]).toBe(false); // only cur* is changed
    expect(props.aplStats.plug_enabledSE[1]).toBe(true);
    expect(props.aplStats.plug_enabled).toBe(false);

    // plug_colorSE when plug_enabled: false
    traceLog.clear();
    ll.endPlugColor = 'pink';
    expect(traceLog.getTaggedLog('updateFaces')).toEqual(['not-updated']);
    expect(props.curStats.plug_colorSE[1]).toBe('pink'); // only cur* is changed
    expect(props.aplStats.plug_colorSE[1]).not.toBe('pink');

    // plug_markerWidthSE and plug_markerHeightSE are updated when plug_enabled: true
    traceLog.clear();
    ll.endPlugSize = 2.2;
    // updated.plug: false -> updateFaces() is not called
    expect(traceLog.getTaggedLog('updateFaces') == null).toBe(true);

    // plug_enabledSE true -> plug_enabled true
    expect(props.curStats.plug_enabledSE[1]).toBe(false);
    expect(props.aplStats.plug_enabledSE[1]).toBe(true);
    traceLog.clear();
    ll.endPlug = 'arrow1';
    expect(traceLog.getTaggedLog('updateFaces')).toEqual([
      'plug_enabled=true', // plug_enabledSE[1] is already enabled
      'plug_colorSE[1]=pink', 'plug_markerWidthSE[1]', 'plug_markerHeightSE[1]'
    ]);
    expect(props.curStats.plug_enabledSE[1]).toBe(true);
    expect(props.aplStats.plug_enabledSE[1]).toBe(true);
    expect(props.aplStats.plug_enabled).toBe(true);
    expect(props.aplStats.plug_colorSE[1]).toBe('pink');
    expect(props.aplStats.plug_markerWidthSE[1]).toBe(props.curStats.plug_markerWidthSE[1]);
    expect(props.aplStats.plug_markerHeightSE[1]).toBe(props.curStats.plug_markerHeightSE[1]);

    // plug_enabledSE false -> plug_enabled false apl*: true
    traceLog.clear();
    ll.endPlug = 'behind';
    expect(traceLog.getTaggedLog('updateFaces')).toEqual([
      'plug_enabled=false' // plug_enabledSE[1] is not changed (true)
    ]);
    expect(props.aplStats.plug_enabledSE[0]).toBe(false);
    expect(props.curStats.plug_enabledSE[1]).toBe(false); // only cur* is changed
    expect(props.aplStats.plug_enabledSE[1]).toBe(true);
    expect(props.aplStats.plug_enabled).toBe(false);

    // plug_enabledSE true -> plug_enabled true apl*: false
    traceLog.clear();
    ll.startPlug = 'arrow2';
    expect(traceLog.getTaggedLog('updateFaces')).toEqual([
      'plug_enabled=true', 'plug_enabledSE[0]=true', 'plug_enabledSE[1]=false' // plug_enabledSE[1] is changed
    ]);
    expect(props.aplStats.plug_enabledSE[0]).toBe(true);
    expect(props.aplStats.plug_enabledSE[1]).toBe(false);
    expect(props.aplStats.plug_enabled).toBe(true);

    // plugOutline_enabledSE true
    traceLog.clear();
    ll.startPlugOutline = true;
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plugOutline_enabledSE[0]=true', 'plugOutline_plugSE[0]=arrow2'
    ]);
    expect(props.aplStats.plugOutline_enabledSE[0]).toBe(true);

    // plugOutline_plugSE
    traceLog.clear();
    ll.startPlug = 'arrow1';
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plugOutline_plugSE[0]=arrow1'
    ]);
    expect(props.aplStats.plugOutline_plugSE[0]).toBe('arrow1');

    // plugOutline_colorSE
    traceLog.clear();
    ll.startPlugOutlineColor = 'green';
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plugOutline_colorSE[0]=green'
    ]);
    expect(props.aplStats.plugOutline_colorSE[0]).toBe('green');

    // plugOutline_strokeWidthSE
    traceLog.clear();
    ll.startPlugOutlineSize = 1.1;
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plugOutline_strokeWidthSE[0]'
    ]);
    expect(props.aplStats.plugOutline_strokeWidthSE[0]).toBe(props.curStats.plugOutline_strokeWidthSE[0]);

    // plugOutline_inStrokeWidthSE
    traceLog.clear();
    ll.startPlugOutlineSize = 1.2;
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plugOutline_inStrokeWidthSE[0]'
    ]);
    expect(props.aplStats.plugOutline_inStrokeWidthSE[0]).toBe(props.curStats.plugOutline_inStrokeWidthSE[0]);

    // plugOutline_enabledSE false
    traceLog.clear();
    ll.startPlugOutline = false;
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plugOutline_enabledSE[0]=false'
    ]);
    expect(props.aplStats.plugOutline_enabledSE[0]).toBe(false);

    // plugOutline_plugSE, plugOutline_colorSE, plugOutline_strokeWidthSE, plugOutline_inStrokeWidthSE
    // when plugOutline_enabledSE: false
    traceLog.clear();
    ll.setOptions({startPlug: 'square', startPlugOutlineColor: 'yellow', startPlugOutlineSize: 1.3});
    log = traceLog.getTaggedLog('updateFaces');
    expect(log).toContainAll([
      'plug_plugSE[0]=square'
    ]);
    expect(log).toNotContainAny([
      'plugOutline_plugSE[0]=square', 'plugOutline_colorSE[0]=yellow',
      'plugOutline_strokeWidthSE[0]', 'plugOutline_inStrokeWidthSE[0]'
    ]);
    // only cur* is changed
    expect(props.curStats.plugOutline_plugSE[0]).toBe('square');
    expect(props.aplStats.plugOutline_plugSE[0]).not.toBe('square');
    expect(props.curStats.plugOutline_colorSE[0]).toBe('yellow');
    expect(props.aplStats.plugOutline_colorSE[0]).not.toBe('yellow');

    // plugOutline_enabledSE true
    traceLog.clear();
    ll.startPlugOutline = true;
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plugOutline_enabledSE[0]=true',
      'plugOutline_plugSE[0]=square', 'plugOutline_colorSE[0]=yellow',
      'plugOutline_strokeWidthSE[0]', 'plugOutline_inStrokeWidthSE[0]'
    ]);
    expect(props.aplStats.plugOutline_plugSE[0]).toBe('square');
    expect(props.aplStats.plugOutline_colorSE[0]).toBe('yellow');
    expect(props.aplStats.plugOutline_strokeWidthSE[0]).toBe(props.curStats.plugOutline_strokeWidthSE[0]);
    expect(props.aplStats.plugOutline_inStrokeWidthSE[0]).toBe(props.curStats.plugOutline_inStrokeWidthSE[0]);

    // plug_enabled false
    traceLog.clear();
    ll.startPlug = 'behind';
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plug_enabled=false'
    ]);
    expect(props.aplStats.plug_enabled).toBe(false);

    // plugOutline_colorSE, plugOutline_strokeWidthSE, plugOutline_inStrokeWidthSE
    // when plug_enabled: false
    traceLog.clear();
    ll.setOptions({startPlugOutlineColor: 'lime', startPlugOutlineSize: 1.4});
    expect(traceLog.getTaggedLog('updateFaces')).toEqual(['not-updated']);
    // only cur* is changed
    expect(props.curStats.plugOutline_colorSE[0]).toBe('lime');
    expect(props.aplStats.plugOutline_colorSE[0]).not.toBe('lime');

    // plug_enabled true
    traceLog.clear();
    ll.startPlug = 'square';
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plug_enabled=true',
      'plugOutline_colorSE[0]=lime',
      'plugOutline_strokeWidthSE[0]', 'plugOutline_inStrokeWidthSE[0]'
    ]);
    expect(props.aplStats.plug_enabled).toBe(true);
    expect(props.aplStats.plugOutline_plugSE[0]).toBe('square');
    expect(props.aplStats.plugOutline_colorSE[0]).toBe('lime');
    expect(props.aplStats.plugOutline_strokeWidthSE[0]).toBe(props.curStats.plugOutline_strokeWidthSE[0]);
    expect(props.aplStats.plugOutline_inStrokeWidthSE[0]).toBe(props.curStats.plugOutline_inStrokeWidthSE[0]);

    // plug_enabledSE false
    traceLog.clear();
    ll.setOptions({startPlug: 'behind', endPlug: 'arrow1'});
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plug_enabledSE[0]=false'
    ]);
    expect(props.aplStats.plug_enabledSE[0]).toBe(false);

    // plugOutline_colorSE, plugOutline_strokeWidthSE, plugOutline_inStrokeWidthSE
    // when plug_enabled: false
    traceLog.clear();
    ll.setOptions({startPlugOutlineColor: 'red', startPlugOutlineSize: 1.3});
    expect(traceLog.getTaggedLog('updateFaces')).toEqual(['not-updated']);
    // only cur* is changed
    expect(props.curStats.plugOutline_colorSE[0]).toBe('red');
    expect(props.aplStats.plugOutline_colorSE[0]).not.toBe('red');

    // plug_enabledSE true
    traceLog.clear();
    ll.startPlug = 'disc';
    expect(traceLog.getTaggedLog('updateFaces')).toContainAll([
      'plug_enabledSE[0]=true',
      'plugOutline_plugSE[0]=disc', 'plugOutline_colorSE[0]=red',
      'plugOutline_strokeWidthSE[0]', 'plugOutline_inStrokeWidthSE[0]'
    ]);
    expect(props.aplStats.plug_enabledSE[0]).toBe(true);
    expect(props.aplStats.plugOutline_plugSE[0]).toBe('disc');
    expect(props.aplStats.plugOutline_colorSE[0]).toBe('red');
    expect(props.aplStats.plugOutline_strokeWidthSE[0]).toBe(props.curStats.plugOutline_strokeWidthSE[0]);
    expect(props.aplStats.plugOutline_inStrokeWidthSE[0]).toBe(props.curStats.plugOutline_inStrokeWidthSE[0]);

    pageDone();
  });

  it(registerTitle('updatePosition()'), function() {

    // position_socketXYSE
    traceLog.clear();
    ll.startSocket = 'top';
    expect(traceLog.getTaggedLog('updatePosition')).toContainAll([
      'position_socketXYSE[0]', 'new-position'
    ]);

    // position_plugOverheadSE
    ll.endPlug = 'square';
    traceLog.clear();
    ll.endPlug = 'arrow2';
    expect(traceLog.getTaggedLog('updatePosition')).toContainAll([
      'position_plugOverheadSE[1]', 'new-position'
    ]);

    // position_path
    ll.endPlug = 'behind'; // to avoid changing padding by symbol
    traceLog.clear();
    ll.path = 'straight';
    expect(traceLog.getTaggedLog('updatePosition')).toContainAll([
      'position_path', 'new-position'
    ]);

    // position_lineStrokeWidth
    traceLog.clear();
    ll.size = 5;
    expect(traceLog.getTaggedLog('updatePosition')).toContainAll([
      'position_lineStrokeWidth', 'new-position'
    ]);

    // position_socketGravitySE
    traceLog.clear();
    ll.startSocketGravity = 10;
    expect(traceLog.getTaggedLog('updatePosition')).toContainAll([
      'position_socketGravitySE[0]', 'new-position'
    ]);

    pageDone();
  });

  it(registerTitle('updatePath()'), function() {

    ll.endPlug = 'behind'; // to avoid changing padding by symbol
    traceLog.clear();
    ll.path = 'straight';
    expect(traceLog.getTaggedLog('updatePath')).toEqual(['path_pathData']);

    traceLog.clear();
    ll.startSocketGravity = 0; // `straight` ignores `gravity`
    expect(traceLog.getTaggedLog('updatePath')).toEqual(['not-updated']);

    pageDone();
  });

  it(registerTitle('updateViewBox()'), function() {
    var props = window.insProps[ll._id];

    traceLog.clear();
    ll.startPlug = 'arrow2';
    expect(traceLog.getTaggedLog('updateViewBox')).toEqual(['x', 'y', 'width', 'height']);

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
    expect(traceLog.getTaggedLog('updateLine')).toContainAll([
      'line_strokeWidth=2'
    ]);
    if (!window.IS_WEBKIT) {
      expect(traceLog.getTaggedLog('updatePlug')).toContainAll([
        'plug_markerWidthSE[0]', 'plug_markerHeightSE[0]', 'plug_markerWidthSE[1]', 'plug_markerHeightSE[1]'
      ]);
    }
    expect(traceLog.getTaggedLog('updatePosition')).toContainAll([
      'new-position'
    ]);
    expect(traceLog.getTaggedLog('updatePath')).toEqual(['not-updated']);
    expect(traceLog.getTaggedLog('updateViewBox')).toEqual(['not-updated']);

    // up `lineSize`
    traceLog.clear();
    ll.setOptions({
      size: 20, // *= 5
      startPlugSize: 0.2, // /= 5
      endPlugSize: 0.2 // /= 5
    });
    expect(props.curStats.viewBox_plugBCircleSE[0]).toBe(8);
    expect(props.curStats.viewBox_plugBCircleSE[1]).toBe(8);
    expect(traceLog.getTaggedLog('updateLine')).toContainAll([
      'line_strokeWidth=20'
    ]);
    if (!window.IS_WEBKIT) {
      expect(traceLog.getTaggedLog('updatePlug')).toContainAll([
        'plug_markerWidthSE[0]', 'plug_markerHeightSE[0]', 'plug_markerWidthSE[1]', 'plug_markerHeightSE[1]'
      ]);
    }
    expect(traceLog.getTaggedLog('updatePosition')).toContainAll([
      'new-position'
    ]);
    expect(traceLog.getTaggedLog('updatePath')).toEqual(['not-updated']);
    expect(traceLog.getTaggedLog('updateViewBox')).toEqual(['x', 'y', 'width', 'height']);

    pageDone();
  });

  it(registerTitle('updateMask()'), function() {
    var log, props = window.insProps[ll._id];

    // maskBGRect_x, maskBGRect_y
    // props.maskBGRect is used in props.lineMask (!lineOutline_enabled), props.lineOutlineMask
    expect(props.curStats.capsMaskMarker_enabled).toBe(false);
    expect(props.curStats.capsMaskAnchor_enabledSE[0]).toBe(true);
    expect(props.curStats.capsMaskAnchor_enabledSE[1]).toBe(false);
    expect(props.curStats.caps_enabled).toBe(true);
    expect(props.curStats.lineMask_enabled && !props.curStats.lineMask_outlineMode).toBe(true); // lineMaskBGEnabled
    traceLog.clear();
    ll.startSocket = ll.startSocket === 'auto' || ll.startSocket === 'left' ? 'top' : 'left';
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'maskBGRect_x', 'maskBGRect_y'
    ]);

    ll.setOptions({startPlug: 'arrow1', endPlug: 'behind'});
    expect(props.curStats.capsMaskMarker_enabled).toBe(false);
    expect(props.curStats.capsMaskAnchor_enabledSE[0]).toBe(false);
    expect(props.curStats.capsMaskAnchor_enabledSE[1]).toBe(true);
    expect(props.curStats.caps_enabled).toBe(true);
    expect(props.curStats.lineMask_enabled && !props.curStats.lineMask_outlineMode).toBe(true); // lineMaskBGEnabled
    traceLog.clear();
    ll.startSocket = ll.startSocket === 'auto' || ll.startSocket === 'left' ? 'top' : 'left';
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'maskBGRect_x', 'maskBGRect_y'
    ]);

    ll.setOptions({startPlug: 'arrow1', endPlug: 'arrow2'});
    expect(props.curStats.capsMaskMarker_enabled).toBe(false);
    expect(props.curStats.capsMaskAnchor_enabledSE[0]).toBe(false);
    expect(props.curStats.capsMaskAnchor_enabledSE[1]).toBe(false);
    expect(props.curStats.caps_enabled).toBe(false);
    expect(props.curStats.lineMask_enabled && !props.curStats.lineMask_outlineMode).toBe(false); // lineMaskBGEnabled
    traceLog.clear();
    ll.startSocket = ll.startSocket === 'auto' || ll.startSocket === 'left' ? 'top' : 'left';
    expect(traceLog.getTaggedLog('updateMask')).toNotContainAny([
      'maskBGRect_x', 'maskBGRect_y'
    ]);

    ll.startPlugColor = 'rgba(255, 0, 0, 0.5)';
    expect(props.curStats.capsMaskMarker_enabled).toBe(true);
    expect(props.curStats.capsMaskAnchor_enabledSE[0]).toBe(false);
    expect(props.curStats.capsMaskAnchor_enabledSE[1]).toBe(false);
    expect(props.curStats.caps_enabled).toBe(true);
    expect(props.curStats.lineMask_enabled && !props.curStats.lineMask_outlineMode).toBe(true); // lineMaskBGEnabled
    traceLog.clear();
    ll.startSocket = ll.startSocket === 'auto' || ll.startSocket === 'left' ? 'top' : 'left';
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'maskBGRect_x', 'maskBGRect_y'
    ]);

    // lineMask_enabled
    // curStats.lineMask_enabled = curStats.caps_enabled || curStats.lineMask_outlineMode;
    expect(props.curStats.capsMaskMarker_enabled).toBe(true);
    expect(props.curStats.capsMaskAnchor_enabledSE[0]).toBe(false);
    expect(props.curStats.capsMaskAnchor_enabledSE[1]).toBe(false);
    expect(props.curStats.caps_enabled).toBe(true);
    expect(props.curStats.lineMask_outlineMode).toBe(false);
    expect(props.curStats.lineMask_enabled).toBe(true);
    traceLog.clear();
    ll.startPlugColor = 'rgb(255, 0, 0)';
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'lineMask_enabled=false'
    ]);
    expect(props.curStats.lineMask_enabled).toBe(false);

    traceLog.clear();
    ll.setOptions({startPlug: 'behind', endPlug: 'arrow1', startPlugColor: 'rgb(255, 0, 0)'});
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'lineMask_enabled=true'
    ]);
    expect(props.curStats.capsMaskMarker_enabled).toBe(false);
    expect(props.curStats.capsMaskAnchor_enabledSE[0]).toBe(true);
    expect(props.curStats.capsMaskAnchor_enabledSE[1]).toBe(false);
    expect(props.curStats.caps_enabled).toBe(true);
    expect(props.curStats.lineMask_enabled).toBe(true);

    // lineMask_outlineMode
    expect(props.curStats.lineMask_outlineMode).toBe(false);
    traceLog.clear();
    ll.outline = true;
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'lineMask_outlineMode=true'
    ]);
    expect(props.curStats.lineMask_outlineMode).toBe(true);

    // lineMask_x, lineMask_y
    traceLog.clear();
    ll.startSocket = ll.startSocket === 'auto' || ll.startSocket === 'left' ? 'top' : 'left';
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'lineMask_x', 'lineMask_y'
    ]);

    // lineMask_enabled false
    traceLog.clear();
    ll.setOptions({startPlug: 'arrow2', endPlug: 'arrow1', outline: false});
    log = traceLog.getTaggedLog('updateMask');
    expect(log).toContainAll([
      'lineMask_enabled=false'
    ]);
    expect(log).toNotContainAny([
      'lineMask_outlineMode=false'
    ]);
    expect(props.curStats.capsMaskMarker_enabled).toBe(false);
    expect(props.curStats.capsMaskAnchor_enabledSE[0]).toBe(false);
    expect(props.curStats.capsMaskAnchor_enabledSE[1]).toBe(false);
    expect(props.curStats.caps_enabled).toBe(false);
    expect(props.curStats.lineMask_enabled).toBe(false);
    expect(props.curStats.lineMask_outlineMode).toBe(false); // apl* is not updated
    expect(props.aplStats.lineMask_outlineMode).toBe(true); // apl* is not updated

    // lineMask_x, lineMask_y when lineMask_enabled: false
    traceLog.clear();
    ll.startSocket = ll.startSocket === 'auto' || ll.startSocket === 'left' ? 'top' : 'left';
    expect(traceLog.getTaggedLog('updateMask')).toNotContainAny([
      'lineMask_x', 'lineMask_y'
    ]);
    // only cur* is changed
    expect(props.curStats.lineMask_x).toBe(props.curStats.viewBox_bBox.x);
    expect(props.curStats.lineMask_y).toBe(props.curStats.viewBox_bBox.y);
    expect(props.aplStats.lineMask_x).not.toBe(props.curStats.viewBox_bBox.x);
    expect(props.aplStats.lineMask_y).not.toBe(props.curStats.viewBox_bBox.y);

    // lineMask_enabled true
    traceLog.clear();
    ll.setOptions({startPlug: 'behind', endPlug: 'arrow1'});
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'lineMask_enabled=true',
      'lineMask_outlineMode=false', // apl* is updated
      'lineMask_x', 'lineMask_y'
    ]);
    expect(props.curStats.lineMask_enabled).toBe(true);
    expect(props.aplStats.lineMask_outlineMode).toBe(false); // apl* is updated
    expect(props.aplStats.lineMask_x).toBe(props.curStats.viewBox_bBox.x);
    expect(props.aplStats.lineMask_y).toBe(props.curStats.viewBox_bBox.y);

    // capsMaskAnchor_enabledSE, capsMaskAnchor_pathDataSE
    expect(props.curStats.capsMaskAnchor_enabledSE[1]).toBe(false);
    ll.setOptions({end: document.getElementById('elm2'), endPlug: 'behind'});
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'capsMaskAnchor_enabledSE[1]=true', 'capsMaskAnchor_pathDataSE[1]'
    ]);
    expect(props.curStats.capsMaskAnchor_enabledSE[1]).toBe(true);

    // caps_enabled false
    traceLog.clear();
    ll.setOptions({startPlug: 'arrow2', endPlug: 'arrow1', outline: true});
    log = traceLog.getTaggedLog('updateMask');
    expect(log).toContainAll([
      'caps_enabled=false'
    ]);
    expect(log).toNotContainAny([
      'capsMaskAnchor_enabledSE[1]=false'
    ]);
    expect(props.curStats.capsMaskAnchor_enabledSE[0]).toBe(false);
    expect(props.curStats.capsMaskAnchor_enabledSE[1]).toBe(false);
    expect(props.aplStats.capsMaskAnchor_enabledSE[1]).toBe(true); // apl* is not updated
    expect(props.curStats.caps_enabled).toBe(false);
    expect(props.curStats.lineMask_enabled).toBe(true);
    expect(props.aplStats.lineMask_outlineMode).toBe(true);

    // capsMaskAnchor_pathDataSE when caps_enabled false
    ll.end = document.getElementById('elm3');
    expect(traceLog.getTaggedLog('updateMask')).toNotContainAny([
      'capsMaskAnchor_pathDataSE[1]'
    ]);

    // caps_enabled true
    traceLog.clear();
    ll.endPlug = 'behind';
    log = traceLog.getTaggedLog('updateMask');
    expect(log).toContainAll([
      'caps_enabled=true', 'capsMaskAnchor_pathDataSE[1]'
    ]);
    expect(log).toNotContainAny([
      'capsMaskAnchor_enabledSE[1]=true' // apl* was not disabled
    ]);
    expect(props.curStats.capsMaskAnchor_enabledSE[0]).toBe(false);
    expect(props.curStats.capsMaskAnchor_enabledSE[1]).toBe(true);
    expect(props.aplStats.capsMaskAnchor_enabledSE[1]).toBe(true); // apl* is not updated (was not disabled)
    expect(props.curStats.caps_enabled).toBe(true);


    // capsMaskAnchor_pathDataSE when capsMaskAnchor_enabledSE false
    ll.start = document.getElementById('elm2');
    expect(traceLog.getTaggedLog('updateMask')).toNotContainAny([
      'capsMaskAnchor_pathDataSE[0]'
    ]);

    // capsMaskAnchor_enabledSE true
    traceLog.clear();
    ll.startPlug = 'behind';
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'capsMaskAnchor_enabledSE[0]=true',
      'capsMaskAnchor_pathDataSE[0]'
    ]);
    expect(props.curStats.capsMaskAnchor_enabledSE[0]).toBe(true);

    // capsMaskMarker_enabled, capsMaskMarker_enabledSE,
    // capsMaskMarker_plugSE, capsMaskMarker_markerWidthSE, capsMaskMarker_markerHeightSE
    traceLog.clear();
    ll.setOptions({endPlug: 'square', endPlugColor: 'rgba(255, 0, 0, 0.5)'});
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'capsMaskMarker_enabled=true', 'capsMaskMarker_enabledSE[1]=true',
      'capsMaskMarker_plugSE[1]=square', 'capsMaskMarker_markerWidthSE[1]', 'capsMaskMarker_markerHeightSE[1]'
    ]);

    // capsMaskMarker_enabledSE false
    traceLog.clear();
    ll.endPlugColor = 'rgb(255, 0, 0)';
    log = traceLog.getTaggedLog('updateMask');
    expect(log).toContainAll([
      'capsMaskMarker_enabled=false'
    ]);
    expect(log).toNotContainAny([
      'capsMaskMarker_enabledSE[1]=false' // apl* is not updated
    ]);

    // capsMaskMarker_plugSE, capsMaskMarker_markerWidthSE, capsMaskMarker_markerHeightSE
    // when capsMaskMarker_enabledSE false
    ll.endPlug = 'arrow2';
    expect(traceLog.getTaggedLog('updateMask')).toNotContainAny([
      'capsMaskMarker_plugSE[1]=arrow2', 'capsMaskMarker_markerWidthSE[1]', 'capsMaskMarker_markerHeightSE[1]'
    ]);

    // capsMaskMarker_enabledSE true
    traceLog.clear();
    ll.endPlugColor = 'rgba(255, 0, 0, 0.5)';
    log = traceLog.getTaggedLog('updateMask');
    expect(log).toContainAll([
      'capsMaskMarker_enabled=true',
      'capsMaskMarker_plugSE[1]=arrow2', 'capsMaskMarker_markerWidthSE[1]', 'capsMaskMarker_markerHeightSE[1]'
    ]);
    expect(log).toNotContainAny([
      'capsMaskMarker_enabledSE[1]=true' // apl* was not disabled
    ]);

    // lineOutlineMask_x, lineOutlineMask_y
    ll.outline = true;
    expect(props.curStats.lineOutline_enabled).toBe(true);
    traceLog.clear();
    ll.startSocket = ll.startSocket === 'auto' || ll.startSocket === 'left' ? 'top' : 'left';
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'lineOutlineMask_x', 'lineOutlineMask_y'
    ]);

    // lineOutline_enabled false
    traceLog.clear();
    ll.outline = false;
    expect(props.curStats.lineOutline_enabled).toBe(false);

    // lineOutlineMask_x, lineOutlineMask_y when lineOutline_enabled: false
    traceLog.clear();
    ll.startSocket = ll.startSocket === 'auto' || ll.startSocket === 'left' ? 'top' : 'left';
    expect(traceLog.getTaggedLog('updateMask')).toNotContainAny([
      'lineOutlineMask_x', 'lineOutlineMask_y'
    ]);
    // only cur* is changed
    expect(props.curStats.lineOutlineMask_x).toBe(props.curStats.viewBox_bBox.x);
    expect(props.curStats.lineOutlineMask_y).toBe(props.curStats.viewBox_bBox.y);
    expect(props.aplStats.lineOutlineMask_x).not.toBe(props.curStats.viewBox_bBox.x);
    expect(props.aplStats.lineOutlineMask_y).not.toBe(props.curStats.viewBox_bBox.y);

    // lineOutline_enabled true
    traceLog.clear();
    ll.outline = true;
    expect(traceLog.getTaggedLog('updateMask')).toContainAll([
      'lineOutlineMask_x', 'lineOutlineMask_y'
    ]);
    expect(props.curStats.lineOutline_enabled).toBe(true);
    expect(props.aplStats.lineOutlineMask_x).toBe(props.curStats.viewBox_bBox.x);
    expect(props.aplStats.lineOutlineMask_y).toBe(props.curStats.viewBox_bBox.y);

    pageDone();
  });

  it(registerTitle('iniValue avoids unnecessary updating'), function() {

    ll.remove();

    traceLog.clear();
    ll = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm2'));
    expect(traceLog.log).toEqual([
      /* eslint-disable indent */
      '<bindWindow>', '</bindWindow>',
      '<setOptions>',
        'needs.position', 'needs.effect', 'needs.faces', 'needs.plugOutline', 'needs.lineOutline',
        'needs.plug', 'needs.line',
      '</setOptions>',

      '<updateLine>',
        // default stats: line_altColor, line_colorTra
        'line_color=coral', 'line_strokeWidth=4',
      '</updateLine>',

      '<updatePlug>',
        // default stats: plug_enabledSE[0], plug_plugSE[0], plug_colorTraSE
        'plug_colorSE[0]=coral',
        'attach_plugSideLenSE[0]', 'attach_plugBackLenSE[0]',
        'plug_enabledSE[1]=true', 'plug_plugSE[1]=arrow1', 'plug_colorSE[1]=coral',
        'plug_markerWidthSE[1]', 'plug_markerHeightSE[1]',
        'attach_plugSideLenSE[1]', 'attach_plugBackLenSE[1]',
        'plug_enabled=true',
      '</updatePlug>',

      '<updateLineOutline>',
        // default stats: lineOutline_enabled, lineOutline_colorTra
        'lineOutline_color=indianred',
        'lineOutline_strokeWidth',
        'lineOutline_inStrokeWidth',
      '</updateLineOutline>',

      '<updatePlugOutline>',
        // default stats: plugOutline_enabledSE, plugOutline_plugSE, plugOutline_colorTraSE
        'plugOutline_colorSE[0]=indianred',
        'plugOutline_colorSE[1]=indianred',
        'plugOutline_strokeWidthSE[1]',
        'plugOutline_inStrokeWidthSE[1]',
      '</updatePlugOutline>',

      '<updateFaces>',
        // default stats: plug_enabledSE[0], plug_plugSE[0]
        'line_color=coral', 'line_strokeWidth=4',
        'plug_enabled=true',
        'plug_enabledSE[1]=true', 'plug_plugSE[1]=arrow1', 'plug_colorSE[1]=coral',
        'plug_markerWidthSE[1]', 'plug_markerHeightSE[1]',
      '</updateFaces>',

      '<updatePosition>',
        // default stats: position_socketGravitySE
        'position_path', 'position_lineStrokeWidth',
        'position_plugOverheadSE[0]', 'position_socketXYSE[0]',
        'position_plugOverheadSE[1]', 'position_socketXYSE[1]',
        'new-position',
      '</updatePosition>',

      '<updatePath>', 'path_pathData', '</updatePath>',
      '<updateViewBox>', 'x', 'y', 'width', 'height', '</updateViewBox>',

      '<updateMask>',
        // default stats: lineMask_outlineMode, capsMaskAnchor_enabledSE[1], capsMaskMarker_plugSE[0]
        'maskBGRect_x', 'maskBGRect_y',
        'lineMask_enabled=true', 'lineMask_x', 'lineMask_y',
        'caps_enabled=true',
        'capsMaskAnchor_enabledSE[0]=true', 'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=0',
      '</updateMask>',

      '<setEffect>', '</setEffect>',

      '<update>',
        'updated.line', 'updated.plug', 'updated.lineOutline', 'updated.plugOutline', 'updated.faces',
        'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask',
      '</update>'
      /* eslint-enable indent */
    ]);

    traceLog.clear();
    ll.setOptions({start: document.getElementById('iframe1').contentDocument.getElementById('elm1'),
      end: document.getElementById('iframe1').contentDocument.getElementById('elm2')});
    expect(traceLog.log).toEqual([
      /* eslint-disable indent */
      '<bindWindow>', '</bindWindow>',
      '<setOptions>',
        'needs.position', 'needs.effect', 'needs.faces', 'needs.plugOutline', 'needs.lineOutline',
        'needs.plug', 'needs.line',
      '</setOptions>',

      '<updateLine>', 'not-updated', '</updateLine>',
      '<updatePlug>', 'not-updated', '</updatePlug>',
      '<updateLineOutline>', 'not-updated', '</updateLineOutline>',
      '<updatePlugOutline>', 'not-updated', '</updatePlugOutline>',

      '<updateFaces>',
        // default stats: plug_enabledSE[0], plug_plugSE[0]
        'line_color=coral', 'line_strokeWidth=4',
        'plug_enabled=true',
        'plug_enabledSE[1]=true', 'plug_plugSE[1]=arrow1', 'plug_colorSE[1]=coral',
        'plug_markerWidthSE[1]', 'plug_markerHeightSE[1]',
      '</updateFaces>',

      '<updatePosition>',
        // default stats: position_socketGravitySE
        'position_path', 'position_lineStrokeWidth',
        'position_plugOverheadSE[0]', 'position_socketXYSE[0]',
        'position_plugOverheadSE[1]', 'position_socketXYSE[1]',
        'new-position',
      '</updatePosition>',

      '<updatePath>', 'path_pathData', '</updatePath>',
      '<updateViewBox>', 'x', 'y', 'width', 'height', '</updateViewBox>',

      '<updateMask>',
        // default stats: lineMask_outlineMode, capsMaskAnchor_enabledSE[1], capsMaskMarker_plugSE[0]
        'maskBGRect_x', 'maskBGRect_y',
        'lineMask_enabled=true', 'lineMask_x', 'lineMask_y',
        'caps_enabled=true',
        'capsMaskAnchor_enabledSE[0]=true', 'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=0',
      '</updateMask>',

      '<setEffect>', '</setEffect>',

      '<update>',
        'updated.faces', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask',
      '</update>'
      /* eslint-enable indent */
    ]);

    pageDone();
  });

});
