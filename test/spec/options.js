/* eslint-env jasmine */
/* global loadPage:false, customMatchers:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('options', function() {
  'use strict';

  var window, document, traceLog, pageDone, ll;

  /* eslint-disable no-unused-vars, indent */
  // ================ context
  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    PATH_STRAIGHT = 1, PATH_ARC = 2, PATH_FLUID = 3, PATH_MAGNET = 4, PATH_GRID = 5;
  // ================ /context
  /* eslint-enable no-unused-vars, indent */

  function loadBefore(beforeDone) {
    jasmine.addMatchers(customMatchers);
    loadPage('spec/common/page.html', function(frmWindow, frmDocument, body, done) {
      window = frmWindow;
      document = frmDocument;
      traceLog = window.traceLog;
      traceLog.enabled = true;
      pageDone = done;
      ll = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm2'));
      beforeDone();
    });
  }

  describe('setOptions()', function() {

    beforeEach(loadBefore);

    it('setValidId()', function() {
      var props = window.insProps[ll._id];

      // valid ID
      traceLog.clear();
      ll.path = 'straight';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');
      expect(props.options.path).toBe(PATH_STRAIGHT);
      expect(ll.path).toBe('straight');

      // invalid ID
      traceLog.clear();
      ll.path = 'straightx';
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.position');
      expect(props.options.path).toBe(PATH_STRAIGHT);
      expect(ll.path).toBe('straight');

      // same ID
      traceLog.clear();
      ll.path = 'straight';
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.position');
      expect(props.options.path).toBe(PATH_STRAIGHT);
      expect(ll.path).toBe('straight');

      // 'auto', getCurOption
      ll.endSocket = 'bottom';
      expect(props.options.socketSE[1]).toBe(SOCKET_BOTTOM);
      expect(ll.endSocket).toBe('bottom');
      traceLog.clear();
      ll.endSocket = 'auto';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');
      expect(props.options.socketSE[1] == null).toBe(true);
      expect(ll.endSocket).toBe('auto');

      // invalid 'auto'
      traceLog.clear();
      ll.path = 'auto';
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.position');
      expect(props.options.path).toBe(PATH_STRAIGHT);
      expect(ll.path).toBe('straight');

      // invalid 'auto', getCurOption
      ll.startPlug = 'behind';
      expect(props.options.plugSE[0]).toBe('behind');
      expect(ll.startPlug).toBe('behind');
      traceLog.clear();
      ll.startPlug = 'auto';
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plug');
      expect(props.options.plugSE[0]).toBe('behind');
      expect(ll.startPlug).toBe('behind');

      pageDone();
    });

    it('setValidType()', function() {
      var props = window.insProps[ll._id];

      // valid value
      traceLog.clear();
      ll.startPlugColor = 'red';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');
      expect(props.options.plugColorSE[0]).toBe('red');
      expect(ll.startPlugColor).toBe('red');

      // invalid value
      traceLog.clear();
      ll.startPlugColor = 0;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plug');
      expect(props.options.plugColorSE[0]).toBe('red');
      expect(ll.startPlugColor).toBe('red');

      // valid value (additional check)
      traceLog.clear();
      ll.startPlugOutlineSize = 2;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plugOutline');
      expect(props.options.plugOutlineSizeSE[0]).toBe(2);
      expect(ll.startPlugOutlineSize).toBe(2);

      // invalid value (additional check)
      traceLog.clear();
      ll.startPlugOutlineSize = 0.5;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plugOutline');
      expect(props.options.plugOutlineSizeSE[0]).toBe(2);
      expect(ll.startPlugOutlineSize).toBe(2);

      // same value
      traceLog.clear();
      ll.startPlugColor = 'red';
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plug');
      expect(props.options.plugColorSE[0]).toBe('red');
      expect(ll.startPlugColor).toBe('red');

      // trim -> same value
      traceLog.clear();
      ll.startPlugColor = '  red    ';
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plug');
      expect(props.options.plugColorSE[0]).toBe('red');
      expect(ll.startPlugColor).toBe('red');

      // trim *color*
      traceLog.clear();
      ll.setOptions({
        color: '  red    ',
        endPlugColor: '  green    ',
        outlineColor: '  yellow    ',
        startPlugOutlineColor: '  pink    '
      });
      expect(props.options.lineColor).toBe('red');
      expect(props.options.plugColorSE[1]).toBe('green');
      expect(props.options.lineOutlineColor).toBe('yellow');
      expect(props.options.plugOutlineColorSE[0]).toBe('pink');
      expect(ll.color).toBe('red');
      expect(ll.endPlugColor).toBe('green');
      expect(ll.outlineColor).toBe('yellow');
      expect(ll.startPlugOutlineColor).toBe('pink');

      // 'auto'
      traceLog.clear();
      ll.startPlugColor = 'auto';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');
      expect(props.options.plugColorSE[0] == null).toBe(true);
      expect(ll.startPlugColor).toBe('auto');

      // invalid 'auto'
      ll.size = 12;
      expect(props.options.lineSize).toBe(12);
      expect(ll.size).toBe(12);
      traceLog.clear();
      ll.size = 'auto';
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.line');
      expect(props.options.lineSize).toBe(12);
      expect(ll.size).toBe(12);

      // valid value (specified type)
      traceLog.clear();
      ll.startPlugSize = 2; // number
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');
      expect(props.options.plugSizeSE[0]).toBe(2);
      expect(ll.startPlugSize).toBe(2);

      // invalid value (specified type)
      traceLog.clear();
      ll.startPlugSize = '3'; // string
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plug');
      expect(props.options.plugSizeSE[0]).toBe(2);
      expect(ll.startPlugSize).toBe(2);

      // invalid number (NaN)
      traceLog.clear();
      ll.startPlugSize = NaN;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plug');
      expect(props.options.plugSizeSE[0]).toBe(2);
      expect(ll.startPlugSize).toBe(2);

      // invalid number (Infinity)
      traceLog.clear();
      ll.startPlugSize = Infinity;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plug');
      expect(props.options.plugSizeSE[0]).toBe(2);
      expect(ll.startPlugSize).toBe(2);

      // valid value (specified type)
      traceLog.clear();
      ll.startPlugSize = 3; // number
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');
      expect(props.options.plugSizeSE[0]).toBe(3);
      expect(ll.startPlugSize).toBe(3);

      pageDone();
    });

    it('anchorSE are checked', function() {
      var props = window.insProps[ll._id], value;

      // no update
      value = props.options.anchorSE[0];
      traceLog.clear();
      ll.start = value;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.position');
      expect(props.options.anchorSE[0]).toBe(value);
      expect(ll.start).toBe(value);

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      expect(props.baseWindow).toBe(window);
      traceLog.clear();
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(traceLog.log).not.toContain('<bindWindow>');
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');
      expect(props.baseWindow).toBe(window);

      // Change to element in iframe, `baseWindow` is changed
      traceLog.clear();
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(traceLog.log).toContain('<bindWindow>');
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');
      expect(props.baseWindow).toBe(document.getElementById('iframe1').contentWindow);

      // SVG
      ll.start = document.getElementById('rect1');
      expect(props.options.anchorSE[0]).toBe(document.getElementById('rect1'));

      // invalid element
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      expect(function() {
        ll.start = ll.end;
      }).toThrow();
      expect(function() {
        ll = new window.LeaderLine(document.getElementById('elm1'));
      }).toThrow();
      expect(function() {
        ll = new window.LeaderLine(5, document.getElementById('elm2'));
      }).toThrow();

      pageDone();
    });

    it('socketGravitySE are checked', function() {
      var props = window.insProps[ll._id];

      // array
      traceLog.clear();
      ll.startSocketGravity = [1, 2];
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');
      expect(props.options.socketGravitySE[0]).toEqual([1, 2]);
      expect(ll.startSocketGravity).toEqual([1, 2]);

      // same array
      traceLog.clear();
      ll.startSocketGravity = [1, 2];
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.position');
      expect(props.options.socketGravitySE[0]).toEqual([1, 2]);
      expect(ll.startSocketGravity).toEqual([1, 2]);

      // invalid array
      traceLog.clear();
      ll.startSocketGravity = [1, 'a'];
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.position');
      expect(props.options.socketGravitySE[0]).toEqual([1, 2]);
      expect(ll.startSocketGravity).toEqual([1, 2]);

      // array length 1
      traceLog.clear();
      ll.startSocketGravity = [1, 2, 3]; // `3` is ignored and same array
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.position');
      expect(props.options.socketGravitySE[0]).toEqual([1, 2]);
      expect(ll.startSocketGravity).toEqual([1, 2]);

      // array length 2
      traceLog.clear();
      ll.startSocketGravity = [4, 2, 3]; // `3` is ignored
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');
      expect(props.options.socketGravitySE[0]).toEqual([4, 2]);
      expect(ll.startSocketGravity).toEqual([4, 2]);

      // 'auto'
      traceLog.clear();
      ll.startSocketGravity = 'auto';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');
      expect(props.options.socketGravitySE[0] == null).toBe(true);
      expect(ll.startSocketGravity).toBe('auto');

      // same 'auto'
      traceLog.clear();
      ll.startSocketGravity = 'auto';
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.position');
      expect(props.options.socketGravitySE[0] == null).toBe(true);
      expect(ll.startSocketGravity).toBe('auto');

      // invalid value
      traceLog.clear();
      ll.startSocketGravity = -1;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.position');
      expect(props.options.socketGravitySE[0] == null).toBe(true);
      expect(ll.startSocketGravity).toBe('auto');

      // valid value
      traceLog.clear();
      ll.startSocketGravity = 0;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');
      expect(props.options.socketGravitySE[0]).toBe(0);
      expect(ll.startSocketGravity).toBe(0);

      // same value
      traceLog.clear();
      ll.startSocketGravity = 0;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.position');
      expect(props.options.socketGravitySE[0]).toBe(0);
      expect(ll.startSocketGravity).toBe(0);

      pageDone();
    });

    it('needs.line is affected by options', function() {

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      traceLog.clear();
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(traceLog.log).not.toContain('<bindWindow>');
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.line');

      // Change to element in iframe, `baseWindow` is changed
      traceLog.clear();
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(traceLog.log).toContain('<bindWindow>');
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.line');

      // lineColor
      traceLog.clear();
      ll.color = 'red';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.line');

      // lineSize
      traceLog.clear();
      ll.size = 2;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.line');

      // lineSize invalid
      traceLog.clear();
      ll.size = 0;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.line');

      pageDone();
    });

    it('needs.plug is affected by options', function() {

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      traceLog.clear();
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(traceLog.log).not.toContain('<bindWindow>');
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plug');

      // Change to element in iframe, `baseWindow` is changed
      traceLog.clear();
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(traceLog.log).toContain('<bindWindow>');
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');

      // plugSE
      traceLog.clear();
      ll.startPlug = 'arrow2';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');
      traceLog.clear();
      ll.endPlug = 'square';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');

      // plugColorSE
      traceLog.clear();
      ll.startPlugColor = 'red';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');
      traceLog.clear();
      ll.endPlugColor = 'blue';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');

      // plugSizeSE
      traceLog.clear();
      ll.startPlugSize = 1.5;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');
      traceLog.clear();
      ll.endPlugSize = 2;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');

      // plugSizeSE invalid
      traceLog.clear();
      ll.startPlugSize = 0;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plug');
      traceLog.clear();
      ll.endPlugSize = 0;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plug');

      pageDone();
    });

    it('needs.lineOutline is affected by options', function() {

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      traceLog.clear();
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(traceLog.log).not.toContain('<bindWindow>');
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.lineOutline');

      // Change to element in iframe, `baseWindow` is changed
      traceLog.clear();
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(traceLog.log).toContain('<bindWindow>');
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.lineOutline');

      // lineOutlineEnabled
      traceLog.clear();
      ll.outline = true;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.lineOutline');

      // lineOutlineColor
      traceLog.clear();
      ll.outlineColor = 'red';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.lineOutline');

      // lineOutlineSize
      traceLog.clear();
      ll.outlineSize = 0.1;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.lineOutline');

      // lineOutlineSize invalid
      traceLog.clear();
      ll.outlineSize = 0.5;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.lineOutline');

      pageDone();
    });

    it('needs.plugOutline is affected by options', function() {

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      traceLog.clear();
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(traceLog.log).not.toContain('<bindWindow>');
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plugOutline');

      // Change to element in iframe, `baseWindow` is changed
      traceLog.clear();
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(traceLog.log).toContain('<bindWindow>');
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plugOutline');

      // plugOutlineEnabledSE
      traceLog.clear();
      ll.startPlugOutline = true;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plugOutline');
      traceLog.clear();
      ll.endPlugOutline = true;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plugOutline');

      // plugOutlineColorSE
      traceLog.clear();
      ll.startPlugOutlineColor = 'red';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plugOutline');
      traceLog.clear();
      ll.endPlugOutlineColor = 'blue';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plugOutline');

      // plugOutlineSizeSE
      traceLog.clear();
      ll.startPlugOutlineSize = 1.2;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plugOutline');

      // plugOutlineSizeSE invalid
      traceLog.clear();
      ll.endPlugOutlineSize = 0.9;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.plugOutline');

      pageDone();
    });

    it('needs.position is affected by options', function() {

      // anchorSE
      traceLog.clear();
      ll.start = document.getElementById('elm3');
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');

      // path
      traceLog.clear();
      ll.path = 'straight';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');

      // socketSE
      traceLog.clear();
      ll.startSocket = 'bottom';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');
      traceLog.clear();
      ll.endSocket = 'bottom';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');

      // socketGravitySE was already tested

      pageDone();
    });

  });

  describe('update()', function() {

    beforeEach(loadBefore);

    it('needs.line and updated.line affects calling update*', function() {

      traceLog.clear();
      ll.color = 'red';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.line');
      expect(traceLog.getTaggedLog('update')).toContain('updated.line');
      expect(traceLog.log).toContainAll([
        '<updateLine>',
        '<updatePlug>', '<updateLineOutline>', '<updatePlugOutline>', '<updateFaces>', '<updatePosition>'
      ]);

      traceLog.clear();
      ll.color = 'red'; // same value
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.line');
      expect(traceLog.getTaggedLog('update')).not.toContain('updated.line');
      expect(traceLog.log).toNotContainAny([
        '<updateLine>',
        '<updatePlug>', '<updateLineOutline>', '<updatePlugOutline>', '<updateFaces>', '<updatePosition>'
      ]);

      pageDone();
    });

    it('needs.plug and updated.plug affects calling update*', function() {

      traceLog.clear();
      ll.endPlugColor = 'red';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');
      expect(traceLog.getTaggedLog('update')).toContain('updated.plug');
      expect(traceLog.log).toContainAll([
        '<updatePlug>',
        '<updatePlugOutline>', '<updateFaces>', '<updatePosition>'
      ]);

      ll.color = 'red';
      traceLog.clear();
      ll.endPlugColor = 'auto'; // update option, but same stats
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plug');
      expect(traceLog.getTaggedLog('update')).not.toContain('updated.plug');
      expect(traceLog.log).toContain('<updatePlug>');
      expect(traceLog.log).toNotContainAny([
        '<updatePlugOutline>', '<updateFaces>', '<updatePosition>'
      ]);

      pageDone();
    });

    it('needs.lineOutline and updated.lineOutline affects calling update*', function() {

      traceLog.clear();
      ll.outline = true;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.lineOutline');
      expect(traceLog.getTaggedLog('update')).toContain('updated.lineOutline');
      expect(traceLog.log).toContainAll([
        '<updateLineOutline>',
        '<updatePlugOutline>', '<updateFaces>'
      ]);

      ll.outlineColor = 'rgba(255, 0, 0, 0.5)'; // to enable lineOutline_colorTra
      traceLog.clear();
      ll.setOptions({size: 10, outlineSize: 0.4}); // update option, but same stats
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.lineOutline');
      // '<updatePlugOutline>' and '<updateFaces>' are called by updated.line
      expect(traceLog.getTaggedLog('update')).not.toContain('updated.lineOutline');
      expect(traceLog.log).toContain('<updateLineOutline>');

      pageDone();
    });

    it('needs.plugOutline and updated.plugOutline affects calling update*', function() {

      traceLog.clear();
      ll.endPlugOutline = true;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plugOutline');
      expect(traceLog.getTaggedLog('update')).toContain('updated.plugOutline');
      expect(traceLog.log).toContainAll([
        '<updatePlugOutline>',
        '<updateFaces>'
      ]);

      ll.outlineColor = ll.endPlugOutlineColor = 'red';
      traceLog.clear();
      ll.endPlugOutlineColor = 'auto'; // update option, but same stats
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.plugOutline');
      expect(traceLog.getTaggedLog('update')).not.toContain('updated.plugOutline');
      expect(traceLog.log).toContain('<updatePlugOutline>');
      expect(traceLog.log).not.toContain('<updateFaces>');

      pageDone();
    });

    it('needs.position and updated.position affects calling update*', function() {

      traceLog.clear();
      ll.path = 'arc';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');
      expect(traceLog.getTaggedLog('update')).toContain('updated.position');
      expect(traceLog.log).toContainAll([
        '<updatePosition>',
        '<updatePath>'
      ]);

      traceLog.clear();
      ll.startSocket = 'right'; // update option, but same stats
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.position');
      expect(traceLog.getTaggedLog('update')).not.toContain('updated.position');
      expect(traceLog.log).toContain('<updatePosition>');
      expect(traceLog.log).not.toContain('<updatePath>');

      pageDone();
    });

  });

});
