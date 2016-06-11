/* eslint-env jasmine */
/* global loadPage:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('options', function() {
  'use strict';

  var window, document, pageDone, ll, titles = [];

  function registerTitle(title) {
    titles.push(title);
    return title;
  }

  beforeEach(function(beforeDone) {
    loadPage('spec/options/options.html', function(frmWindow, frmDocument, body, done) {
      window = frmWindow;
      document = frmDocument;
      pageDone = done;
      ll = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm2'));
      beforeDone();
    }, 'options - ' + titles.shift());
  });

  it(registerTitle('anchorSE'), function() {
    // no update
    window.traceLog = [];
    ll.start = document.getElementById('elm1');
    expect(window.traceLog).toEqual(['<setOptions>']);

    // Change an element, socket is not changed
    ll.setOptions({
      startSocket: 'right',
      endSocket: 'top',
      path: 'straight'
    });
    window.traceLog = [];
    ll.end = document.getElementById('elm3');
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>',
      'propsHasChanged:socketXYSE[1]', // only `end`
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.width', 'viewBox.height', // only right and bottom of viewBox
      'mask.width', 'mask.height'
    ]);

    // Change an element, `auto` socket is changed
    ll.setOptions({
      startSocket: 'auto',
      endSocket: 'auto',
      end: document.getElementById('elm2')
    });
    // Now, sockets: right / top
    window.traceLog = [];
    ll.start = document.getElementById('elm3');
    // Then, sockets: left / right
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>',
      'propsHasChanged:socketXYSE[0]',
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height',
      'anchorMask[0].x', 'anchorMask[0].y'
    ]);

    // Change to element in iframe, `baseWindow` is not changed
    ll.setOptions({
      start: document.getElementById('elm2'),
      end: document.getElementById('elm3')
    });
    window.traceLog = [];
    ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>',
      'propsHasChanged:socketXYSE[1]',
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.width', 'viewBox.height',
      'mask.width', 'mask.height'
    ]);

    // Change to element in iframe, `baseWindow` is changed
    window.traceLog = [];
    ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<bindWindow>',
      '<setLine>', 'lineColor=coral', 'lineSize=4',
      '<setPlug>', 'plug[0]=behind', 'plug[1]=arrow1', 'plugColor[1]=coral', 'plugSize[1]=1',
      '<setLineOutline>', 'lineOutlineEnabled=false',
      '<setPlugOutline>', 'plugOutlineEnabled[0]=false', 'plugOutlineEnabled[1]=false',
      '<position>',
      'propsHasChanged:socketXYSE[0]',
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'new-anchorMask[0]', 'new-plugMask[1]',
      'mask.x', 'mask.y', 'mask.width', 'mask.height',
      'anchorMask[0].x', 'anchorMask[0].y', 'anchorMask[0].width', 'anchorMask[0].height'
    ]);

    pageDone();
  });

  it(registerTitle('path'), function() {
    // Change only path
    ll.setOptions({
      end: document.getElementById('elm4'),
      endPlug: 'behind' // to avoid changing padding by symbol
    });
    window.traceLog = [];
    ll.path = 'straight';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>',
      'propsHasChanged:path',
      'update',
      'propsHasChanged:pathData', 'setPathData'
    ]);

    // Change `viewBox` size
    ll.setOptions({
      startSocketGravity: [160, -60]
    });
    window.traceLog = [];
    ll.path = 'fluid';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>',
      'propsHasChanged:path',
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.y', 'viewBox.height',
      'mask.y', 'mask.height'
    ]);

    pageDone();
  });

  it(registerTitle('color'), function() {
    // Change `lineColor`, `auto` `plugColor` is changed
    window.traceLog = [];
    ll.color = 'blue';
    expect(window.traceLog).toEqual([
      '<setOptions>', '<setLine>', 'lineColor=blue',
      '<setPlug>', 'plugColor[1]=blue'
    ]);

    // `plugColor[0]` also is changed
    ll.startPlug = 'arrow2';
    window.traceLog = [];
    ll.color = 'green';
    expect(window.traceLog).toEqual([
      '<setOptions>', '<setLine>', 'lineColor=green',
      '<setPlug>', 'plugColor[0]=green', 'plugColor[1]=green'
    ]);

    // Change `lineColor`, `plugColor` is not changed
    ll.setOptions({
      startPlug: 'behind',
      endPlug: 'behind'
    });
    window.traceLog = [];
    ll.color = 'yellow';
    expect(window.traceLog).toEqual([
      '<setOptions>', '<setLine>', 'lineColor=yellow'
    ]);

    pageDone();
  });

  it(registerTitle('size'), function() {
    ll.startPlug = 'arrow1';
    window.traceLog = [];
    ll.size = 8;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLine>', 'lineSize=8',
      '<setPlug>',
      '<position>',
      'propsHasChanged:plugOverheadSE[0]',
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);

    pageDone();
  });

  it(registerTitle('socketSE'), function() {
    // `left` and `top` of `viewBox` are changed
    ll.setOptions({
      start: document.getElementById('elm2'),
      end: document.getElementById('elm4'),
      endPlug: 'behind'
    });
    window.traceLog = [];
    ll.startSocket = 'top';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>',
      'propsHasChanged:socketXYSE[0]',
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);

    // `bottom` of `viewBox` is changed
    ll.setOptions({
      path: 'straight',
      endSocket: 'top'
    });
    window.traceLog = [];
    ll.endSocket = 'bottom';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>',
      'propsHasChanged:socketXYSE[1]',
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.height',
      'mask.height'
    ]);

    pageDone();
  });

  it(registerTitle('socketGravitySE'), function() {
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
      '<position>',
      'propsHasChanged:socketGravitySE[0]',
      'update',
      'propsHasChanged:pathData', 'setPathData'
    ]);

    // Change width
    window.traceLog = [];
    ll.startSocketGravity = 260;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>',
      'propsHasChanged:socketGravitySE[0]',
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.width',
      'mask.width'
    ]);

    // No change size
    window.traceLog = [];
    ll.endSocketGravity = [-160, -80];
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>',
      'propsHasChanged:socketGravitySE[1]',
      'update',
      'propsHasChanged:pathData', 'setPathData'
    ]);

    // Change height
    window.traceLog = [];
    ll.endSocketGravity = [-160, 160];
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>',
      'propsHasChanged:socketGravitySE[1]',
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.height',
      'mask.height'
    ]);

    pageDone();
  });

  it(registerTitle('plugSE'), function() {
    ll.color = 'blue';
    window.traceLog = [];
    ll.startPlug = 'arrow2';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>', 'plug[0]=arrow2', 'plugColor[0]=blue', 'plugSize[0]=1',
      '<setPlugOutline>', 'plugOutlineEnabled[0]=false',
      '<position>',
      'propsHasChanged:plugOverheadSE[0]',
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'new-plugMask[0]',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);

    // Change size
    ll.end = document.getElementById('elm3');
    window.traceLog = [];
    ll.endPlug = 'disc';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>', 'plug[1]=disc',
      '<position>',
      'propsHasChanged:plugOverheadSE[1]',
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);

    // No change path and size
    window.traceLog = [];
    ll.endPlug = 'square';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>', 'plug[1]=square',
      '<position>'
    ]);

    pageDone();
  });

  it(registerTitle('plugColorSE'), function() {
    window.traceLog = [];
    ll.endPlugColor = 'blue';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>', 'plugColor[1]=blue'
    ]);

    // No change (hidden plug)
    window.traceLog = [];
    ll.startPlugColor = 'red';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>'
    ]);

    window.traceLog = [];
    ll.endPlugColor = 'auto';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>', 'plugColor[1]=coral'
    ]);

    pageDone();
  });

  it(registerTitle('plugSizeSE'), function() {
    window.traceLog = [];
    ll.endPlugSize = 2;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>', 'plugSize[1]=2',
      '<position>',
      'propsHasChanged:plugOverheadSE[1]',
      'update',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);

    // No change (hidden plug)
    window.traceLog = [];
    ll.startPlugSize = 3;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>',
      '<position>'
    ]);

    // No change path
    ll.endPlug = 'disc';
    window.traceLog = [];
    ll.endPlugSize = 1;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>', 'plugSize[1]=1',
      '<position>',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);

    pageDone();
  });

});
