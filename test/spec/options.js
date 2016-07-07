/* eslint-env jasmine */
/* global loadPage:false, customMatchers:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

(function() {
  'use strict';

  var window, document, pageDone, ll;

  // ================ context
  /* eslint-disable no-unused-vars, indent */
  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    PATH_STRAIGHT = 1, PATH_ARC = 2, PATH_FLUID = 3, PATH_MAGNET = 4, PATH_GRID = 5;
  /* eslint-enable no-unused-vars, indent */
  // ================ /context

  function loadBefore(beforeDone) {
    loadPage('spec/common/page.html', function(frmWindow, frmDocument, body, done) {
      window = frmWindow;
      document = frmDocument;
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
      window.traceLog = [];
      ll.path = 'straight';
      expect(window.traceLog).toContain('<updatePath>');
      expect(props.options.path).toBe(PATH_STRAIGHT);
      expect(ll.path).toBe('straight');

      // invalid ID
      window.traceLog = [];
      ll.path = 'straightx';
      expect(window.traceLog).not.toContain('<updatePath>');
      expect(props.options.path).toBe(PATH_STRAIGHT);
      expect(ll.path).toBe('straight');

      // same ID
      window.traceLog = [];
      ll.path = 'straight';
      expect(window.traceLog).not.toContain('<updatePath>');
      expect(props.options.path).toBe(PATH_STRAIGHT);
      expect(ll.path).toBe('straight');

      // 'auto', getCurOption
      ll.endSocket = 'bottom';
      expect(props.options.socketSE[1]).toBe(SOCKET_BOTTOM);
      expect(ll.endSocket).toBe('bottom');
      window.traceLog = [];
      ll.endSocket = 'auto';
      expect(window.traceLog).toContain('<updatePosition>');
      expect(window.traceLog).toContain('statsHasChanged:socketXYSE[1]');
      expect(props.options.socketSE[1] == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.endSocket).toBe('auto');

      // invalid 'auto'
      window.traceLog = [];
      ll.path = 'auto';
      expect(window.traceLog).not.toContain('<updatePath>');
      expect(props.options.path).toBe(PATH_STRAIGHT);
      expect(ll.path).toBe('straight');

      // invalid 'auto', getCurOption
      expect(props.options.plugSE[0]).toBe('behind');
      expect(ll.startPlug).toBe('behind');
      window.traceLog = [];
      ll.startPlug = 'auto';
      expect(window.traceLog).not.toContain('<updatePlug>');
      expect(props.options.plugSE[0]).toBe('behind');
      expect(ll.startPlug).toBe('behind');

      pageDone();
    });

    it('setValidType()', function() {
      var props = window.insProps[ll._id];

      // valid value
      window.traceLog = [];
      ll.startPlugColor = 'red';
      expect(window.traceLog).toContain('<updatePlug>');
      expect(props.options.plugColorSE[0]).toBe('red');
      expect(ll.startPlugColor).toBe('red');

      // invalid value
      window.traceLog = [];
      ll.startPlugColor = 0;
      expect(window.traceLog).not.toContain('<updatePlug>');
      expect(props.options.plugColorSE[0]).toBe('red');
      expect(ll.startPlugColor).toBe('red');

      // valid value (additional check)
      window.traceLog = [];
      ll.startPlugOutlineSize = 2;
      expect(window.traceLog).toContain('<updatePlugOutline>');
      expect(props.options.plugOutlineSizeSE[0]).toBe(2);
      expect(ll.startPlugOutlineSize).toBe(2);

      // invalid value (additional check)
      window.traceLog = [];
      ll.startPlugOutlineSize = 0.5;
      expect(window.traceLog).not.toContain('<updatePlugOutline>');
      expect(props.options.plugOutlineSizeSE[0]).toBe(2);
      expect(ll.startPlugOutlineSize).toBe(2);

      // same value
      window.traceLog = [];
      ll.startPlugColor = 'red';
      expect(window.traceLog).not.toContain('<updatePlug>');
      expect(props.options.plugColorSE[0]).toBe('red');
      expect(ll.startPlugColor).toBe('red');

      // trim -> same value
      window.traceLog = [];
      ll.startPlugColor = '  red    ';
      expect(window.traceLog).not.toContain('<updatePlug>');
      expect(props.options.plugColorSE[0]).toBe('red');
      expect(ll.startPlugColor).toBe('red');

      // 'auto'
      window.traceLog = [];
      ll.startPlugColor = 'auto';
      expect(window.traceLog).toContain('<updatePlug>');
      expect(props.options.plugColorSE[0] == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.startPlugColor).toBe('auto');

      // invalid 'auto'
      ll.size = 12;
      expect(props.options.lineSize).toBe(12);
      expect(ll.size).toBe(12);
      window.traceLog = [];
      ll.size = 'auto';
      expect(window.traceLog).not.toContain('<updateLine>');
      expect(props.options.lineSize).toBe(12);
      expect(ll.size).toBe(12);

      // valid value (specified type)
      window.traceLog = [];
      ll.startPlugSize = 2;
      expect(window.traceLog).toContain('<updatePlug>');
      expect(props.options.plugSizeSE[0]).toBe(2);
      expect(ll.startPlugSize).toBe(2);

      // invalid value (specified type)
      window.traceLog = [];
      ll.startPlugSize = '3';
      expect(window.traceLog).not.toContain('<updatePlug>');
      expect(props.options.plugSizeSE[0]).toBe(2);
      expect(ll.startPlugSize).toBe(2);

      pageDone();
    });

    it('anchorSE are checked', function() {
      var props = window.insProps[ll._id], value;

      // no update
      value = props.options.anchorSE[0];
      window.traceLog = [];
      ll.start = value;
      expect(window.traceLog).not.toContain('<updatePosition>');
      expect(props.options.anchorSE[0]).toBe(value);
      expect(ll.start).toBe(value);

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      expect(props.baseWindow).toBe(window);
      window.traceLog = [];
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(window.traceLog).not.toContain('<bindWindow>');
      expect(window.traceLog).toContain('<updatePosition>');
      expect(props.baseWindow).toBe(window);

      // Change to element in iframe, `baseWindow` is changed
      value = props.baseWindow;
      window.traceLog = [];
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(window.traceLog).toContain('<bindWindow>');
      expect(window.traceLog).toContain('<updatePosition>');
      expect(props.baseWindow).toBe(document.getElementById('iframe1').contentWindow);

      // invalid element
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
      window.traceLog = [];
      ll.startSocketGravity = [1, 2];
      expect(window.traceLog).toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toEqual([1, 2]);
      expect(ll.startSocketGravity).toEqual([1, 2]);

      // same array
      window.traceLog = [];
      ll.startSocketGravity = [1, 2];
      expect(window.traceLog).not.toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toEqual([1, 2]);
      expect(ll.startSocketGravity).toEqual([1, 2]);

      // invalid array
      window.traceLog = [];
      ll.startSocketGravity = [1, 'a'];
      expect(window.traceLog).not.toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toEqual([1, 2]);
      expect(ll.startSocketGravity).toEqual([1, 2]);

      // array length 1
      window.traceLog = [];
      ll.startSocketGravity = [1, 2, 3]; // `3` is ignored and same array
      expect(window.traceLog).not.toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toEqual([1, 2]);
      expect(ll.startSocketGravity).toEqual([1, 2]);

      // array length 2
      window.traceLog = [];
      ll.startSocketGravity = [4, 2, 3]; // `3` is ignored
      expect(window.traceLog).toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toEqual([4, 2]);
      expect(ll.startSocketGravity).toEqual([4, 2]);

      // 'auto'
      window.traceLog = [];
      ll.startSocketGravity = 'auto';
      expect(window.traceLog).toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0] == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.startSocketGravity).toBe('auto');

      // same 'auto'
      window.traceLog = [];
      ll.startSocketGravity = 'auto';
      expect(window.traceLog).not.toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0] == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.startSocketGravity).toBe('auto');

      // invalid value
      window.traceLog = [];
      ll.startSocketGravity = -1;
      expect(window.traceLog).not.toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0] == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.startSocketGravity).toBe('auto');

      // valid value
      window.traceLog = [];
      ll.startSocketGravity = 0;
      expect(window.traceLog).toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toBe(0);
      expect(ll.startSocketGravity).toBe(0);

      // same value
      window.traceLog = [];
      ll.startSocketGravity = 0;
      expect(window.traceLog).not.toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toBe(0);
      expect(ll.startSocketGravity).toBe(0);

      pageDone();
    });

    it('needs.Line is affected by options', function() {

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      window.traceLog = [];
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(window.traceLog).not.toContain('<bindWindow>');
      expect(window.traceLog).not.toContain('<updateLine>');

      // Change to element in iframe, `baseWindow` is changed
      window.traceLog = [];
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(window.traceLog).toContain('<bindWindow>');
      expect(window.traceLog).toContain('<updateLine>');

      // lineColor
      window.traceLog = [];
      ll.color = 'red';
      expect(window.traceLog).toContain('<updateLine>');

      // lineSize
      window.traceLog = [];
      ll.size = 2;
      expect(window.traceLog).toContain('<updateLine>');

      // lineSize invalid
      window.traceLog = [];
      ll.size = 0;
      expect(window.traceLog).not.toContain('<updateLine>');

      pageDone();
    });

    it('needs.Plug is affected by options', function() {

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      window.traceLog = [];
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(window.traceLog).not.toContain('<bindWindow>');
      expect(window.traceLog).not.toContain('<updatePlug>');

      // Change to element in iframe, `baseWindow` is changed
      window.traceLog = [];
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(window.traceLog).toContain('<bindWindow>');
      expect(window.traceLog).toContain('<updatePlug>');

      // plugSE
      window.traceLog = [];
      ll.startPlug = 'arrow2';
      expect(window.traceLog).toContain('<updatePlug>');
      window.traceLog = [];
      ll.endPlug = 'square';
      expect(window.traceLog).toContain('<updatePlug>');

      // plugColorSE
      window.traceLog = [];
      ll.startPlugColor = 'red';
      expect(window.traceLog).toContain('<updatePlug>');
      window.traceLog = [];
      ll.endPlugColor = 'blue';
      expect(window.traceLog).toContain('<updatePlug>');

      // plugSizeSE
      window.traceLog = [];
      ll.startPlugSize = 1.5;
      expect(window.traceLog).toContain('<updatePlug>');
      window.traceLog = [];
      ll.endPlugSize = 2;
      expect(window.traceLog).toContain('<updatePlug>');

      // plugSizeSE invalid
      window.traceLog = [];
      ll.startPlugSize = 0;
      expect(window.traceLog).not.toContain('<updatePlug>');
      window.traceLog = [];
      ll.endPlugSize = 0;
      expect(window.traceLog).not.toContain('<updatePlug>');

      pageDone();
    });

    it('needs.LineOutline is affected by options', function() {

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      window.traceLog = [];
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(window.traceLog).not.toContain('<bindWindow>');
      expect(window.traceLog).not.toContain('<updateLineOutline>');

      // Change to element in iframe, `baseWindow` is changed
      window.traceLog = [];
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(window.traceLog).toContain('<bindWindow>');
      expect(window.traceLog).toContain('<updateLineOutline>');

      // lineOutlineEnabled
      window.traceLog = [];
      ll.outline = true;
      expect(window.traceLog).toContain('<updateLineOutline>');

      // lineOutlineColor
      window.traceLog = [];
      ll.outlineColor = 'red';
      expect(window.traceLog).toContain('<updateLineOutline>');

      // lineOutlineSize
      window.traceLog = [];
      ll.outlineSize = 0.1;
      expect(window.traceLog).toContain('<updateLineOutline>');

      // lineOutlineSize invalid
      window.traceLog = [];
      ll.outlineSize = 0.5;
      expect(window.traceLog).not.toContain('<updateLineOutline>');

      pageDone();
    });

    it('needs.PlugOutline is affected by options', function() {

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      window.traceLog = [];
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(window.traceLog).not.toContain('<bindWindow>');
      expect(window.traceLog).not.toContain('<updatePlugOutline>');

      // Change to element in iframe, `baseWindow` is changed
      window.traceLog = [];
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(window.traceLog).toContain('<bindWindow>');
      expect(window.traceLog).toContain('<updatePlugOutline>');

      // plugOutlineEnabledSE
      window.traceLog = [];
      ll.startPlugOutline = true;
      expect(window.traceLog).toContain('<updatePlugOutline>');
      window.traceLog = [];
      ll.endPlugOutline = true;
      expect(window.traceLog).toContain('<updatePlugOutline>');

      // plugOutlineColorSE
      window.traceLog = [];
      ll.startPlugOutlineColor = 'red';
      expect(window.traceLog).toContain('<updatePlugOutline>');
      window.traceLog = [];
      ll.endPlugOutlineColor = 'blue';
      expect(window.traceLog).toContain('<updatePlugOutline>');

      // plugOutlineSizeSE
      window.traceLog = [];
      ll.startPlugOutlineSize = 1.2;
      expect(window.traceLog).toContain('<updatePlugOutline>');

      // plugOutlineSizeSE invalid
      window.traceLog = [];
      ll.endPlugOutlineSize = 0.9;
      expect(window.traceLog).not.toContain('<updatePlugOutline>');

      pageDone();
    });

    it('needs.Position is affected by options', function() {

      // anchorSE
      window.traceLog = [];
      ll.start = document.getElementById('elm3');
      expect(window.traceLog).toContain('<updatePosition>');

      // path
      window.traceLog = [];
      ll.path = 'straight';
      expect(window.traceLog).toContain('<updatePosition>');

      // socketSE
      window.traceLog = [];
      ll.startSocket = 'bottom';
      expect(window.traceLog).toContain('<updatePosition>');
      window.traceLog = [];
      ll.endSocket = 'bottom';
      expect(window.traceLog).toContain('<updatePosition>');

      // socketGravitySE was already tested

      pageDone();
    });

  });

  describe('update()', function() {

    beforeEach(function(beforeDone) {
      jasmine.addMatchers(customMatchers);
      loadBefore(beforeDone);
    });

    it('needs.Line affects calling update*', function() {

      window.traceLog = [];
      ll.color = 'red';
      expect(window.traceLog).toContainAll([
        '<updateLine>', '<updatePlug>', '<updateLineOutline>', '<updatePlugOutline>', '<updatePosition>'
      ]);

      window.traceLog = [];
      ll.color = 'red'; // same value
      expect(window.traceLog).toNotContainAny([
        '<updateLine>', '<updatePlug>', '<updateLineOutline>', '<updatePlugOutline>', '<updatePosition>'
      ]);

      pageDone();
    });

    it('needs.Plug affects calling update*', function() {

      window.traceLog = [];
      ll.endPlugColor = 'red';
      expect(window.traceLog).toContainAll([
        '<updatePlug>', '<updatePlugOutline>', '<updatePosition>'
      ]);

      window.traceLog = [];
      ll.startPlugColor = 'red'; // option of disabled plug
      expect(window.traceLog).toContain('<updatePlug>');
      expect(window.traceLog).toNotContainAny([
        '<updatePlugOutline>', '<updatePosition>'
      ]);

      ll.color = 'red';
      window.traceLog = [];
      ll.endPlugColor = 'auto'; // update option, but same value
      expect(window.traceLog).toContain('<updatePlug>');
      expect(window.traceLog).toNotContainAny([
        '<updatePlugOutline>', '<updatePosition>'
      ]);

      pageDone();
    });

    it('needs.LineOutline affects calling update*', function() {

      window.traceLog = [];
      ll.outlineColor = 'red'; // disabled now
      expect(window.traceLog).toContain('<updateLineOutline>');
      expect(window.traceLog).not.toContain('<updatePlugOutline>');

      window.traceLog = [];
      ll.outline = true;
      expect(window.traceLog).toContainAll([
        '<updateLineOutline>', '<updatePlugOutline>'
      ]);

      pageDone();
    });

    it('needs.Position affects calling update*', function() {

      window.traceLog = [];
      ll.path = 'arc';
      expect(window.traceLog).toContainAll([
        '<updatePosition>', '<updatePath>'
      ]);

      window.traceLog = [];
      ll.startSocket = 'right'; // update option, but same value
      expect(window.traceLog).toContain('<updatePosition>');
      expect(window.traceLog).not.toContain('<updatePath>');

      pageDone();
    });

  });

})();
