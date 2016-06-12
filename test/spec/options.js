/* eslint-env jasmine */
/* global loadPage:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('options', function() {
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
      '<position>', 'propsHasChanged:socketXYSE[1]', 'new-pathList.baseVal', // only `end`
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
      '<position>', 'propsHasChanged:socketXYSE[0]', 'new-pathList.baseVal',
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
      '<position>', 'propsHasChanged:socketXYSE[1]', 'new-pathList.baseVal',
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
      '<position>', 'propsHasChanged:socketXYSE[0]', 'new-pathList.baseVal',
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
      '<position>', 'propsHasChanged:path', 'new-pathList.baseVal',
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
      '<position>', 'propsHasChanged:path', 'new-pathList.baseVal',
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
      '<position>', 'propsHasChanged:plugOverheadSE[0]', 'new-pathList.baseVal',
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
      '<position>', 'propsHasChanged:socketXYSE[0]', 'new-pathList.baseVal',
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
      '<position>', 'propsHasChanged:socketXYSE[1]', 'new-pathList.baseVal',
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
      '<position>', 'propsHasChanged:socketGravitySE[0]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData'
    ]);

    // Change width
    window.traceLog = [];
    ll.startSocketGravity = 260;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', 'propsHasChanged:socketGravitySE[0]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.width',
      'mask.width'
    ]);

    // No change size
    window.traceLog = [];
    ll.endSocketGravity = [-160, -80];
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', 'propsHasChanged:socketGravitySE[1]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData'
    ]);

    // Change height
    window.traceLog = [];
    ll.endSocketGravity = [-160, 160];
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', 'propsHasChanged:socketGravitySE[1]', 'new-pathList.baseVal',
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
      '<position>', 'propsHasChanged:plugOverheadSE[0]', 'new-pathList.baseVal',
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
      '<position>', 'propsHasChanged:plugOverheadSE[1]', 'new-pathList.baseVal',
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
      '<position>', 'propsHasChanged:plugOverheadSE[1]', 'new-pathList.baseVal',
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

  // ======== Deeper in code

  it(registerTitle('setOptions - setValidId'), function() {
    var props = window.insProps[ll._id];

    // valid ID
    window.traceLog = [];
    ll.path = 'straight';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', 'propsHasChanged:path', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.y', 'mask.width', 'mask.height'
    ]);
    expect(props.options.path).toBe(PATH_STRAIGHT);
    expect(ll.path).toBe('straight');

    // invalid ID
    window.traceLog = [];
    ll.path = 'straightx';
    expect(window.traceLog).toEqual([
      '<setOptions>'
    ]);
    expect(props.options.path).toBe(PATH_STRAIGHT);
    expect(ll.path).toBe('straight');

    // same ID
    window.traceLog = [];
    ll.path = 'straight';
    expect(window.traceLog).toEqual([
      '<setOptions>'
    ]);
    expect(props.options.path).toBe(PATH_STRAIGHT);
    expect(ll.path).toBe('straight');

    // 'auto', getInternal
    ll.endSocket = 'bottom';
    expect(props.options.socketSE[1]).toBe(SOCKET_BOTTOM);
    expect(ll.endSocket).toBe('bottom');
    window.traceLog = [];
    ll.endSocket = 'auto';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<position>', 'propsHasChanged:socketXYSE[1]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.width', 'viewBox.height',
      'mask.width', 'mask.height'
    ]);
    expect(props.options.socketSE[1] == null).toBe(true); // eslint-disable-line eqeqeq
    expect(ll.endSocket).toBe('auto');

    // invalid 'auto'
    window.traceLog = [];
    ll.path = 'auto';
    expect(window.traceLog).toEqual([
      '<setOptions>'
    ]);
    expect(props.options.path).toBe(PATH_STRAIGHT);
    expect(ll.path).toBe('straight');

    // invalid 'auto', getInternal
    expect(props.options.plugSE[0]).toBe('behind');
    expect(ll.startPlug).toBe('behind');
    window.traceLog = [];
    ll.startPlug = 'auto';
    expect(window.traceLog).toEqual([
      '<setOptions>'
    ]);
    expect(props.options.plugSE[0]).toBe('behind');
    expect(ll.startPlug).toBe('behind');

    pageDone();
  });

  it(registerTitle('setOptions - setValidType'), function() {
    var props = window.insProps[ll._id];

    // valid value
    window.traceLog = [];
    ll.startPlugColor = 'red';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>'
    ]);
    expect(props.options.plugColorSE[0]).toBe('red');
    expect(ll.startPlugColor).toBe('red');

    // invalid value
    window.traceLog = [];
    ll.startPlugColor = 0;
    expect(window.traceLog).toEqual([
      '<setOptions>'
    ]);
    expect(props.options.plugColorSE[0]).toBe('red');
    expect(ll.startPlugColor).toBe('red');

    // valid value (additional check)
    window.traceLog = [];
    ll.startPlugOutlineSize = 2;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugOutline>'
    ]);
    expect(props.options.plugOutlineSizeSE[0]).toBe(2);
    expect(ll.startPlugOutlineSize).toBe(2);

    // invalid value (additional check)
    window.traceLog = [];
    ll.startPlugOutlineSize = 0.5;
    expect(window.traceLog).toEqual([
      '<setOptions>'
    ]);
    expect(props.options.plugOutlineSizeSE[0]).toBe(2);
    expect(ll.startPlugOutlineSize).toBe(2);

    // same value
    window.traceLog = [];
    ll.startPlugColor = 'red';
    expect(window.traceLog).toEqual([
      '<setOptions>'
    ]);
    expect(props.options.plugColorSE[0]).toBe('red');
    expect(ll.startPlugColor).toBe('red');

    // 'auto'
    window.traceLog = [];
    ll.startPlugColor = 'auto';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>'
    ]);
    expect(props.options.plugColorSE[0] == null).toBe(true); // eslint-disable-line eqeqeq
    expect(ll.startPlugColor).toBe('auto');

    // invalid 'auto'
    ll.size = 12;
    expect(props.options.lineSize).toBe(12);
    expect(ll.size).toBe(12);
    window.traceLog = [];
    ll.size = 'auto';
    expect(window.traceLog).toEqual([
      '<setOptions>'
    ]);
    expect(props.options.lineSize).toBe(12);
    expect(ll.size).toBe(12);

    // valid value (specified type)
    window.traceLog = [];
    ll.startPlugSize = 2;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>',
      '<position>'
    ]);
    expect(props.options.plugSizeSE[0]).toBe(2);
    expect(ll.startPlugSize).toBe(2);

    // invalid value (specified type)
    window.traceLog = [];
    ll.startPlugSize = '3';
    expect(window.traceLog).toEqual([
      '<setOptions>'
    ]);
    expect(props.options.plugSizeSE[0]).toBe(2);
    expect(ll.startPlugSize).toBe(2);

    pageDone();
  });

  it(registerTitle('setOptions - addPropList'), function() {
    var props = window.insProps[ll._id];

    // value 1
    window.traceLog = [];
    ll.color = 'red';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLine>', 'lineColor=red', // value 1
      '<setPlug>', 'plugColor[1]=red'
    ]);
    expect(props.options.lineColor).toBe('red');
    expect(ll.color).toBe('red');

    // value 2
    window.traceLog = [];
    ll.size = 5;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLine>', 'lineSize=5', // value 2
      '<setPlug>', // '' is added to needsPlugSE
      '<position>', 'propsHasChanged:plugOverheadSE[0]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);
    expect(props.options.lineSize).toBe(5);
    expect(ll.size).toBe(5);

    // value 1, 2
    window.traceLog = [];
    ll.setOptions({color: 'blue', size: 6});
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLine>', 'lineColor=blue', 'lineSize=6', // value 1, 2
      '<setPlug>', 'plugColor[1]=blue',
      '<position>', 'propsHasChanged:plugOverheadSE[0]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);
    expect(props.options.lineColor).toBe('blue');
    expect(props.options.lineSize).toBe(6);
    expect(ll.color).toBe('blue');
    expect(ll.size).toBe(6);

    // all
    ll.startPlugOutline = true;
    window.traceLog = [];
    ll.startPlug = 'arrow2'; // needsPlugOutlineSE = true
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>', 'plug[0]=arrow2', 'plugColor[0]=blue', 'plugSize[0]=1',
      '<setPlugOutline>',
      'plugOutlineEnabled[0]=true', 'plugOutlineColor[0]=indianred', 'plugOutlineSize[0]=1', // all
      '<position>', 'propsHasChanged:plugOverheadSE[0]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'new-plugMask[0]',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);
    expect(props.options.plugSE[0]).toBe('arrow2');
    expect(ll.startPlug).toBe('arrow2');

    pageDone();
  });

  it(registerTitle('setOptions - needsPlugOutlineSE'), function() {
    var props = window.insProps[ll._id];

    // off -> on
    window.traceLog = [];
    ll.endPlugOutline = true;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugOutline>',
      // plugOutlineColor and plugOutlineSize also
      'plugOutlineEnabled[1]=true', 'plugOutlineColor[1]=indianred', 'plugOutlineSize[1]=1'
    ]);
    expect(props.options.plugOutlineEnabledSE[1]).toBe(true);
    expect(ll.endPlugOutline).toBe(true);

    // on -> off
    window.traceLog = [];
    ll.endPlugOutline = false;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugOutline>',
      'plugOutlineEnabled[1]=false' // only plugOutlineEnabled
    ]);
    expect(props.options.plugOutlineEnabledSE[1]).toBe(false);
    expect(ll.endPlugOutline).toBe(false);

    // invalid value
    ll.setOptions({endPlugOutline: true, endPlugOutlineSize: 1});
    expect(props.options.plugOutlineSizeSE[1]).toBe(1);
    expect(ll.endPlugOutlineSize).toBe(1);
    window.traceLog = [];
    ll.endPlugOutlineSize = 0.9;
    expect(window.traceLog).toEqual([
      '<setOptions>'
    ]);
    expect(props.options.plugOutlineSizeSE[1]).toBe(1);
    expect(ll.endPlugOutlineSize).toBe(1);

    // valid value 1
    window.traceLog = [];
    ll.endPlugOutlineSize = 1.1;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugOutline>', 'plugOutlineSize[1]=1.1'
    ]);
    expect(props.options.plugOutlineSizeSE[1]).toBe(1.1);
    expect(ll.endPlugOutlineSize).toBe(1.1);

    // valid value 2
    window.traceLog = [];
    ll.endPlugOutlineSize = 1;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlugOutline>', 'plugOutlineSize[1]=1'
    ]);
    expect(props.options.plugOutlineSizeSE[1]).toBe(1);
    expect(ll.endPlugOutlineSize).toBe(1);

    pageDone();
  });

  it(registerTitle('setOptions - needsPlugSE'), function() {
    var props = window.insProps[ll._id];

    // off -> on
    ll.startPlugOutline = true;
    window.traceLog = [];
    ll.startPlug = 'arrow2';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>',
      // plugColor and plugSize also
      'plug[0]=arrow2', 'plugColor[0]=coral', 'plugSize[0]=1',
      // plugOutline* also
      '<setPlugOutline>',
      'plugOutlineEnabled[0]=true', 'plugOutlineColor[0]=indianred', 'plugOutlineSize[0]=1',
      '<position>', 'propsHasChanged:plugOverheadSE[0]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'new-plugMask[0]',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);
    expect(props.options.plugSE[0]).toBe('arrow2');
    expect(ll.startPlug).toBe('arrow2');

    // on -> on
    window.traceLog = [];
    ll.startPlug = 'arrow1';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>',
      'plug[0]=arrow1', // only plug
      // plugOutlineSize also
      '<setPlugOutline>',
      'plugOutlineSize[0]=1',
      '<position>', 'propsHasChanged:plugOverheadSE[0]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);
    expect(props.options.plugSE[0]).toBe('arrow1');
    expect(ll.startPlug).toBe('arrow1');

    // on -> off
    window.traceLog = [];
    ll.startPlug = 'behind';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>',
      'plug[0]=behind', // only plug
      // plugOutline* also (but plugOutlineEnabled only when plug is 'behind')
      '<setPlugOutline>',
      'plugOutlineEnabled[0]=true',
      '<position>', 'propsHasChanged:plugOverheadSE[0]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'new-anchorMask[0]',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);
    expect(props.options.plugSE[0]).toBe('behind');
    expect(ll.startPlug).toBe('behind');

    // invalid value
    ll.setOptions({
      startPlug: 'arrow1',
      startPlugSize: 1
    });
    expect(props.options.plugSizeSE[0]).toBe(1);
    expect(ll.startPlugSize).toBe(1);
    window.traceLog = [];
    ll.startPlugSize = 0;
    expect(window.traceLog).toEqual([
      '<setOptions>'
    ]);
    expect(props.options.plugSizeSE[0]).toBe(1);
    expect(ll.startPlugSize).toBe(1);

    // valid value
    window.traceLog = [];
    ll.startPlugSize = 0.1;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setPlug>',
      'plugSize[0]=0.1',
      '<position>', 'propsHasChanged:plugOverheadSE[0]', 'new-pathList.baseVal',
      'propsHasChanged:pathData', 'setPathData',
      'viewBox.x', 'viewBox.y', 'viewBox.width', 'viewBox.height',
      'mask.x', 'mask.y', 'mask.width', 'mask.height'
    ]);
    expect(props.options.plugSizeSE[0]).toBe(0.1);
    expect(ll.startPlugSize).toBe(0.1);

    pageDone();
  });

  it(registerTitle('setOptions - needsLineOutline'), function() {
    var props = window.insProps[ll._id];

    // off -> on
    window.traceLog = [];
    ll.outline = true;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLineOutline>',
      // lineOutlineColor and lineOutlineSize also
      'lineOutlineEnabled=true', 'lineOutlineColor=indianred', 'lineOutlineSize=0.25'
    ]);
    expect(props.options.lineOutlineEnabled).toBe(true);
    expect(ll.outline).toBe(true);

    // on -> off
    window.traceLog = [];
    ll.outline = false;
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLineOutline>',
      'lineOutlineEnabled=false' // only plug
    ]);
    expect(props.options.lineOutlineEnabled).toBe(false);
    expect(ll.outline).toBe(false);

    // plugOutlineColor with lineOutlineColor 1
    ll.setOptions({
      outline: true,
      startPlug: 'behind',
      endPlug: 'arrow1',
      startPlugOutline: true,
      endPlugOutline: true,
      startPlugOutlineColor: 'auto',
      endPlugOutlineColor: 'auto'
    });
    expect(props.options.lineOutlineEnabled).toBe(true);
    expect(props.options.plugSE[0]).toBe('behind');
    expect(props.options.plugSE[1]).toBe('arrow1');
    expect(props.options.plugOutlineEnabledSE[0]).toBe(true);
    expect(props.options.plugOutlineEnabledSE[1]).toBe(true);
    expect(props.options.plugOutlineColorSE[0] == null).toBe(true); // eslint-disable-line eqeqeq
    expect(props.options.plugOutlineColorSE[1] == null).toBe(true); // eslint-disable-line eqeqeq
    window.traceLog = [];
    ll.outlineColor = 'red';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLineOutline>',
      'lineOutlineColor=red',
      '<setPlugOutline>',
      // plugOutlineColor also
      'plugOutlineColor[1]=red'
    ]);
    expect(props.options.lineOutlineColor).toBe('red');
    expect(ll.outlineColor).toBe('red');

    // plugOutlineColor with lineOutlineColor 2
    ll.endPlug = 'behind';
    expect(props.options.plugSE[1]).toBe('behind');
    window.traceLog = [];
    ll.outlineColor = 'blue';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLineOutline>',
      'lineOutlineColor=blue' // behind plugOutlineColor is not updated
    ]);
    expect(props.options.lineOutlineColor).toBe('blue');
    expect(ll.outlineColor).toBe('blue');

    // plugOutlineColor with lineOutlineColor 3
    ll.setOptions({
      endPlug: 'arrow1',
      endPlugOutline: false
    });
    expect(props.options.plugSE[1]).toBe('arrow1');
    expect(props.options.plugOutlineEnabledSE[1]).toBe(false);
    window.traceLog = [];
    ll.outlineColor = 'green';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLineOutline>',
      'lineOutlineColor=green' // disabled plugOutlineColor is not updated
    ]);
    expect(props.options.lineOutlineColor).toBe('green');
    expect(ll.outlineColor).toBe('green');

    // plugOutlineColor with lineOutlineColor 4
    ll.setOptions({
      endPlugOutline: true,
      endPlugOutlineColor: 'yellow'
    });
    expect(props.options.plugOutlineEnabledSE[1]).toBe(true);
    expect(props.options.plugOutlineColorSE[1]).toBe('yellow');
    window.traceLog = [];
    ll.outlineColor = 'orange';
    expect(window.traceLog).toEqual([
      '<setOptions>',
      '<setLineOutline>',
      'lineOutlineColor=orange' // specified plugOutlineColor is not updated
    ]);
    expect(props.options.lineOutlineColor).toBe('orange');
    expect(ll.outlineColor).toBe('orange');

    pageDone();
  });

});
