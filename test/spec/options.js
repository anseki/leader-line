/* eslint-env jasmine */
/* global loadPage:false, customMatchers:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

(function() {
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
      var props = window.insProps[ll._id],
        value;

      // valid ID
      traceLog.clear();
      ll.path = 'straight';
      expect(traceLog.log).toContain('<updatePath>');
      expect(props.options.path).toBe(PATH_STRAIGHT);
      expect(ll.path).toBe('straight');

      // invalid ID
      traceLog.clear();
      ll.path = 'straightx';
      expect(traceLog.log).not.toContain('<updatePath>');
      expect(props.options.path).toBe(PATH_STRAIGHT);
      expect(ll.path).toBe('straight');

      // same ID
      traceLog.clear();
      ll.path = 'straight';
      expect(traceLog.log).not.toContain('<updatePath>');
      expect(props.options.path).toBe(PATH_STRAIGHT);
      expect(ll.path).toBe('straight');

      // 'auto', getCurOption
      ll.endSocket = 'bottom';
      expect(props.options.socketSE[1]).toBe(SOCKET_BOTTOM);
      expect(ll.endSocket).toBe('bottom');
      value = window.copyTree(props.aplStats.position_socketXYSE[1]);
      traceLog.clear();
      ll.endSocket = 'auto';
      expect(traceLog.log).toContain('<updatePosition>');
      expect(traceLog.log).toContain('new-position');
      expect(props.aplStats.position_socketXYSE[1]).not.toEqual(value);
      expect(props.options.socketSE[1] == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.endSocket).toBe('auto');

      // invalid 'auto'
      traceLog.clear();
      ll.path = 'auto';
      expect(traceLog.log).not.toContain('<updatePath>');
      expect(props.options.path).toBe(PATH_STRAIGHT);
      expect(ll.path).toBe('straight');

      // invalid 'auto', getCurOption
      expect(props.options.plugSE[0]).toBe('behind');
      expect(ll.startPlug).toBe('behind');
      traceLog.clear();
      ll.startPlug = 'auto';
      expect(traceLog.log).not.toContain('<updatePlug>');
      expect(props.options.plugSE[0]).toBe('behind');
      expect(ll.startPlug).toBe('behind');

      pageDone();
    });

    it('setValidType()', function() {
      var props = window.insProps[ll._id];

      // valid value
      traceLog.clear();
      ll.startPlugColor = 'red';
      expect(traceLog.log).toContain('<updatePlug>');
      expect(props.options.plugColorSE[0]).toBe('red');
      expect(ll.startPlugColor).toBe('red');

      // invalid value
      traceLog.clear();
      ll.startPlugColor = 0;
      expect(traceLog.log).not.toContain('<updatePlug>');
      expect(props.options.plugColorSE[0]).toBe('red');
      expect(ll.startPlugColor).toBe('red');

      // valid value (additional check)
      traceLog.clear();
      ll.startPlugOutlineSize = 2;
      expect(traceLog.log).toContain('<updatePlugOutline>');
      expect(props.options.plugOutlineSizeSE[0]).toBe(2);
      expect(ll.startPlugOutlineSize).toBe(2);

      // invalid value (additional check)
      traceLog.clear();
      ll.startPlugOutlineSize = 0.5;
      expect(traceLog.log).not.toContain('<updatePlugOutline>');
      expect(props.options.plugOutlineSizeSE[0]).toBe(2);
      expect(ll.startPlugOutlineSize).toBe(2);

      // same value
      traceLog.clear();
      ll.startPlugColor = 'red';
      expect(traceLog.log).not.toContain('<updatePlug>');
      expect(props.options.plugColorSE[0]).toBe('red');
      expect(ll.startPlugColor).toBe('red');

      // trim -> same value
      traceLog.clear();
      ll.startPlugColor = '  red    ';
      expect(traceLog.log).not.toContain('<updatePlug>');
      expect(props.options.plugColorSE[0]).toBe('red');
      expect(ll.startPlugColor).toBe('red');

      // 'auto'
      traceLog.clear();
      ll.startPlugColor = 'auto';
      expect(traceLog.log).toContain('<updatePlug>');
      expect(props.options.plugColorSE[0] == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.startPlugColor).toBe('auto');

      // invalid 'auto'
      ll.size = 12;
      expect(props.options.lineSize).toBe(12);
      expect(ll.size).toBe(12);
      traceLog.clear();
      ll.size = 'auto';
      expect(traceLog.log).not.toContain('<updateLine>');
      expect(props.options.lineSize).toBe(12);
      expect(ll.size).toBe(12);

      // valid value (specified type)
      traceLog.clear();
      ll.startPlugSize = 2;
      expect(traceLog.log).toContain('<updatePlug>');
      expect(props.options.plugSizeSE[0]).toBe(2);
      expect(ll.startPlugSize).toBe(2);

      // invalid value (specified type)
      traceLog.clear();
      ll.startPlugSize = '3';
      expect(traceLog.log).not.toContain('<updatePlug>');
      expect(props.options.plugSizeSE[0]).toBe(2);
      expect(ll.startPlugSize).toBe(2);

      pageDone();
    });

    it('anchorSE are checked', function() {
      var props = window.insProps[ll._id], value;

      // no update
      value = props.options.anchorSE[0];
      traceLog.clear();
      ll.start = value;
      expect(traceLog.log).not.toContain('<updatePosition>');
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
      expect(traceLog.log).toContain('<updatePosition>');
      expect(props.baseWindow).toBe(window);

      // Change to element in iframe, `baseWindow` is changed
      value = props.baseWindow;
      traceLog.clear();
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(traceLog.log).toContain('<bindWindow>');
      expect(traceLog.log).toContain('<updatePosition>');
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
      traceLog.clear();
      ll.startSocketGravity = [1, 2];
      expect(traceLog.log).toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toEqual([1, 2]);
      expect(ll.startSocketGravity).toEqual([1, 2]);

      // same array
      traceLog.clear();
      ll.startSocketGravity = [1, 2];
      expect(traceLog.log).not.toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toEqual([1, 2]);
      expect(ll.startSocketGravity).toEqual([1, 2]);

      // invalid array
      traceLog.clear();
      ll.startSocketGravity = [1, 'a'];
      expect(traceLog.log).not.toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toEqual([1, 2]);
      expect(ll.startSocketGravity).toEqual([1, 2]);

      // array length 1
      traceLog.clear();
      ll.startSocketGravity = [1, 2, 3]; // `3` is ignored and same array
      expect(traceLog.log).not.toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toEqual([1, 2]);
      expect(ll.startSocketGravity).toEqual([1, 2]);

      // array length 2
      traceLog.clear();
      ll.startSocketGravity = [4, 2, 3]; // `3` is ignored
      expect(traceLog.log).toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toEqual([4, 2]);
      expect(ll.startSocketGravity).toEqual([4, 2]);

      // 'auto'
      traceLog.clear();
      ll.startSocketGravity = 'auto';
      expect(traceLog.log).toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0] == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.startSocketGravity).toBe('auto');

      // same 'auto'
      traceLog.clear();
      ll.startSocketGravity = 'auto';
      expect(traceLog.log).not.toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0] == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.startSocketGravity).toBe('auto');

      // invalid value
      traceLog.clear();
      ll.startSocketGravity = -1;
      expect(traceLog.log).not.toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0] == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.startSocketGravity).toBe('auto');

      // valid value
      traceLog.clear();
      ll.startSocketGravity = 0;
      expect(traceLog.log).toContain('<updatePosition>');
      expect(props.options.socketGravitySE[0]).toBe(0);
      expect(ll.startSocketGravity).toBe(0);

      // same value
      traceLog.clear();
      ll.startSocketGravity = 0;
      expect(traceLog.log).not.toContain('<updatePosition>');
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
      traceLog.clear();
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(traceLog.log).not.toContain('<bindWindow>');
      expect(traceLog.log).not.toContain('<updateLine>');

      // Change to element in iframe, `baseWindow` is changed
      traceLog.clear();
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(traceLog.log).toContain('<bindWindow>');
      expect(traceLog.log).toContain('<updateLine>');

      // lineColor
      traceLog.clear();
      ll.color = 'red';
      expect(traceLog.log).toContain('<updateLine>');

      // lineSize
      traceLog.clear();
      ll.size = 2;
      expect(traceLog.log).toContain('<updateLine>');

      // lineSize invalid
      traceLog.clear();
      ll.size = 0;
      expect(traceLog.log).not.toContain('<updateLine>');

      pageDone();
    });

    it('needs.Plug is affected by options', function() {

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      traceLog.clear();
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(traceLog.log).not.toContain('<bindWindow>');
      expect(traceLog.log).not.toContain('<updatePlug>');

      // Change to element in iframe, `baseWindow` is changed
      traceLog.clear();
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(traceLog.log).toContain('<bindWindow>');
      expect(traceLog.log).toContain('<updatePlug>');

      // plugSE
      traceLog.clear();
      ll.startPlug = 'arrow2';
      expect(traceLog.log).toContain('<updatePlug>');
      traceLog.clear();
      ll.endPlug = 'square';
      expect(traceLog.log).toContain('<updatePlug>');

      // plugColorSE
      traceLog.clear();
      ll.startPlugColor = 'red';
      expect(traceLog.log).toContain('<updatePlug>');
      traceLog.clear();
      ll.endPlugColor = 'blue';
      expect(traceLog.log).toContain('<updatePlug>');

      // plugSizeSE
      traceLog.clear();
      ll.startPlugSize = 1.5;
      expect(traceLog.log).toContain('<updatePlug>');
      traceLog.clear();
      ll.endPlugSize = 2;
      expect(traceLog.log).toContain('<updatePlug>');

      // plugSizeSE invalid
      traceLog.clear();
      ll.startPlugSize = 0;
      expect(traceLog.log).not.toContain('<updatePlug>');
      traceLog.clear();
      ll.endPlugSize = 0;
      expect(traceLog.log).not.toContain('<updatePlug>');

      pageDone();
    });

    it('needs.LineOutline is affected by options', function() {

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      traceLog.clear();
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(traceLog.log).not.toContain('<bindWindow>');
      expect(traceLog.log).not.toContain('<updateLineOutline>');

      // Change to element in iframe, `baseWindow` is changed
      traceLog.clear();
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(traceLog.log).toContain('<bindWindow>');
      expect(traceLog.log).toContain('<updateLineOutline>');

      // lineOutlineEnabled
      traceLog.clear();
      ll.outline = true;
      expect(traceLog.log).toContain('<updateLineOutline>');

      // lineOutlineColor
      traceLog.clear();
      ll.outlineColor = 'red';
      expect(traceLog.log).toContain('<updateLineOutline>');

      // lineOutlineSize
      traceLog.clear();
      ll.outlineSize = 0.1;
      expect(traceLog.log).toContain('<updateLineOutline>');

      // lineOutlineSize invalid
      traceLog.clear();
      ll.outlineSize = 0.5;
      expect(traceLog.log).not.toContain('<updateLineOutline>');

      pageDone();
    });

    it('needs.PlugOutline is affected by options', function() {

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      traceLog.clear();
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(traceLog.log).not.toContain('<bindWindow>');
      expect(traceLog.log).not.toContain('<updatePlugOutline>');

      // Change to element in iframe, `baseWindow` is changed
      traceLog.clear();
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(traceLog.log).toContain('<bindWindow>');
      expect(traceLog.log).toContain('<updatePlugOutline>');

      // plugOutlineEnabledSE
      traceLog.clear();
      ll.startPlugOutline = true;
      expect(traceLog.log).toContain('<updatePlugOutline>');
      traceLog.clear();
      ll.endPlugOutline = true;
      expect(traceLog.log).toContain('<updatePlugOutline>');

      // plugOutlineColorSE
      traceLog.clear();
      ll.startPlugOutlineColor = 'red';
      expect(traceLog.log).toContain('<updatePlugOutline>');
      traceLog.clear();
      ll.endPlugOutlineColor = 'blue';
      expect(traceLog.log).toContain('<updatePlugOutline>');

      // plugOutlineSizeSE
      traceLog.clear();
      ll.startPlugOutlineSize = 1.2;
      expect(traceLog.log).toContain('<updatePlugOutline>');

      // plugOutlineSizeSE invalid
      traceLog.clear();
      ll.endPlugOutlineSize = 0.9;
      expect(traceLog.log).not.toContain('<updatePlugOutline>');

      pageDone();
    });

    it('needs.Position is affected by options', function() {

      // anchorSE
      traceLog.clear();
      ll.start = document.getElementById('elm3');
      expect(traceLog.log).toContain('<updatePosition>');

      // path
      traceLog.clear();
      ll.path = 'straight';
      expect(traceLog.log).toContain('<updatePosition>');

      // socketSE
      traceLog.clear();
      ll.startSocket = 'bottom';
      expect(traceLog.log).toContain('<updatePosition>');
      traceLog.clear();
      ll.endSocket = 'bottom';
      expect(traceLog.log).toContain('<updatePosition>');

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

      traceLog.clear();
      ll.color = 'red';
      expect(traceLog.log).toContainAll([
        '<updateLine>', '<updatePlug>', '<updateLineOutline>', '<updatePlugOutline>', '<updatePosition>'
      ]);

      traceLog.clear();
      ll.color = 'red'; // same value
      expect(traceLog.log).toNotContainAny([
        '<updateLine>', '<updatePlug>', '<updateLineOutline>', '<updatePlugOutline>', '<updatePosition>'
      ]);

      pageDone();
    });

    it('needs.Plug affects calling update*', function() {

      traceLog.clear();
      ll.endPlugColor = 'red';
      expect(traceLog.log).toContainAll([
        '<updatePlug>', '<updatePlugOutline>', '<updatePosition>'
      ]);

      ll.color = 'red';
      traceLog.clear();
      ll.endPlugColor = 'auto'; // update option, but same value
      expect(traceLog.log).toContain('<updatePlug>');
      expect(traceLog.log).toNotContainAny([
        '<updatePlugOutline>', '<updatePosition>'
      ]);

      pageDone();
    });

    it('needs.LineOutline affects calling update*', function() {

      traceLog.clear();
      ll.outline = true;
      expect(traceLog.log).toContainAll([
        '<updateLineOutline>', '<updatePlugOutline>'
      ]);

      pageDone();
    });

    it('needs.Position affects calling update*', function() {

      traceLog.clear();
      ll.path = 'arc';
      expect(traceLog.log).toContainAll([
        '<updatePosition>', '<updatePath>'
      ]);

      traceLog.clear();
      ll.startSocket = 'right'; // update option, but same value
      expect(traceLog.log).toContain('<updatePosition>');
      expect(traceLog.log).not.toContain('<updatePath>');

      pageDone();
    });

  });

})();
