/* eslint-env jasmine */
/* global loadPage:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('options', function() {
  'use strict';

  var window, document, pageDone, ll;

  beforeEach(function(beforeDone) {
    loadPage('spec/options/options.html', function(frmWindow, frmDocument, body, done) {
      window = frmWindow;
      document = frmDocument;
      pageDone = done;
      ll = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm2'));
      beforeDone();
    }, 'options');
  });

  it('start, end', function() {
    // no update
    window.traceLog = [];
    ll.start = document.getElementById('elm1');
    expect(window.traceLog).toEqual(['<setOptions>']);

    window.traceLog = [];
    ll.start = document.getElementById('elm3');
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height',
      '[mask] startMaskBBox'
    ]);

    // Change to element in iframe, baseWindow is not changed
    window.traceLog = [];
    ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height',
      '[mask] startMaskBBox'
    ]);

    // Change to element in iframe, baseWindow not changed
    window.traceLog = [];
    ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm3');
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<bindWindow>',
      '<setStyles>', '[color] coral', '[size] 4',
      '<setPlugs>', '[startPlug] behind', '[endPlug] arrow1', '[endPlugColor] coral', '[endPlugSize] 1',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height',
      '[mask] startMaskBBox'
    ]);

    // Change right and bottom
    ll.setOptions({
      start: document.getElementById('elm1'),
      end: document.getElementById('elm2'),
      path: 'straight'
    });
    window.traceLog = [];
    ll.end = document.getElementById('elm3');
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] width', '[viewBox] height',
      '[mask] startMaskBBox'
    ]);

    pageDone();
  });

  it('path', function() {
    window.traceLog = [];
    ll.path = 'straight';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] y', '[viewBox] width', '[viewBox] height',
      '[mask] startMaskBBox'
    ]);

    // Change path
    ll.setOptions({
      start: document.getElementById('elm1'),
      end: document.getElementById('elm3'),
      path: 'fluid',
      endPlug: 'behind'
    });
    window.traceLog = [];
    ll.path = 'straight';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', '[update]',
      '[setPathData]'
    ]);

    // Change size
    ll.setOptions({
      startSocketGravity: [160, -60]
    });
    window.traceLog = [];
    ll.path = 'fluid';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] y', '[viewBox] width', '[viewBox] height',
      '[mask] startMaskBBox', '[mask] endMaskBBox'
    ]);

    pageDone();
  });

  it('color', function() {
    window.traceLog = [];
    ll.color = 'blue';
    expect(window.traceLog).toEqual([
      '<setOptions>', '<setStyles>', '[color] blue',
      '<setPlugs>', '[endPlugColor] blue'
    ]);

    // Change `startPlugColor` also
    ll.startPlug = 'arrow2';
    window.traceLog = [];
    ll.color = 'green';
    expect(window.traceLog).toEqual([
      '<setOptions>', '<setStyles>', '[color] green',
      '<setPlugs>', '[startPlugColor] green', '[endPlugColor] green'
    ]);

    // Change no `*PlugColor`
    ll.setOptions({
      startPlug: 'behind',
      endPlug: 'behind'
    });
    window.traceLog = [];
    ll.color = 'yellow';
    expect(window.traceLog).toEqual([
      '<setOptions>', '<setStyles>', '[color] yellow',
      '<setPlugs>'
    ]);

    pageDone();
  });

  it('size', function() {
    ll.startPlug = 'arrow1';
    window.traceLog = [];
    ll.size = 8;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setStyles>', '[size] 8',
      '<setPlugs>',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height'
    ]);

    // Change size with overhead
    ll.setOptions({
      end: document.getElementById('elm3'),
      path: 'straight',
      startPlug: 'behind'
    });
    window.traceLog = [];
    ll.size = 4;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setStyles>', '[size] 4',
      '<setPlugs>',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height',
      '[mask] startMaskBBox'
    ]);

    pageDone();
  });

  it('startSocket, endSocket', function() {
    ll.setOptions({
      start: document.getElementById('elm2'),
      end: document.getElementById('elm4'),
      endPlug: 'behind'
    });
    window.traceLog = [];
    ll.startSocket = 'top';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height',
      '[mask] startMaskBBox', '[mask] endMaskBBox'
    ]);

    // Change bottom
    ll.setOptions({
      path: 'straight',
      endSocket: 'top'
    });
    window.traceLog = [];
    ll.endSocket = 'bottom';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] height',
      '[mask] startMaskBBox', '[mask] endMaskBBox'
    ]);

    pageDone();
  });

  it('startSocketGravity, endSocketGravity', function() {
    // No change size
    ll.setOptions({
      start: document.getElementById('elm2'),
      end: document.getElementById('elm4'),
      endPlug: 'behind'
    });
    window.traceLog = [];
    ll.startSocketGravity = 160;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', '[update]',
      '[setPathData]'
    ]);

    // Change width
    window.traceLog = [];
    ll.startSocketGravity = 260;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] width',
      '[mask] startMaskBBox', '[mask] endMaskBBox'
    ]);

    // No change size
    window.traceLog = [];
    ll.endSocketGravity = [-160, -80];
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', '[update]',
      '[setPathData]'
    ]);

    // Change height
    window.traceLog = [];
    ll.endSocketGravity = [-160, 160];
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] height',
      '[mask] startMaskBBox', '[mask] endMaskBBox'
    ]);

    pageDone();
  });

  it('startPlug, endPlug', function() {
    ll.color = 'blue';
    window.traceLog = [];
    ll.startPlug = 'arrow2';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugs>', '[startPlug] arrow2', '[startPlugColor] blue', '[startPlugSize] 1',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height',
      '[mask] none'
    ]);

    // Change size
    ll.end = document.getElementById('elm3');
    window.traceLog = [];
    ll.endPlug = 'disc';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugs>', '[endPlug] disc', '[endPlugColor] blue', '[endPlugSize] 1',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height'
    ]);

    // No change path and size
    window.traceLog = [];
    ll.endPlug = 'square';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugs>', '[endPlug] square', '[endPlugColor] blue', '[endPlugSize] 1',
      '<position>'
    ]);

    pageDone();
  });

  it('startPlugColor, endPlugColor', function() {
    window.traceLog = [];
    ll.endPlugColor = 'blue';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugs>', '[endPlugColor] blue'
    ]);

    // No change (hidden plug)
    window.traceLog = [];
    ll.startPlugColor = 'red';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugs>'
    ]);

    window.traceLog = [];
    ll.endPlugColor = 'auto';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugs>', '[endPlugColor] coral'
    ]);

    pageDone();
  });

  it('startPlugSize, endPlugSize', function() {
    window.traceLog = [];
    ll.endPlugSize = 2;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugs>', '[endPlugSize] 2',
      '<position>', '[update]',
      '[setPathData]', '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height',
      '[mask] startMaskBBox'
    ]);

    // No change (hidden plug)
    window.traceLog = [];
    ll.startPlugSize = 3;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugs>',
      '<position>', '[update]'
    ]);

    // No change path
    ll.endPlug = 'disc';
    window.traceLog = [];
    ll.endPlugSize = 1;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugs>', '[endPlugSize] 1',
      '<position>', '[update]',
      '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height',
      '[mask] startMaskBBox'
    ]);

    pageDone();
  });

});
