/* eslint-env jasmine */
/* global loadPage:false, customMatchers:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('effect', function() {
  'use strict';

  var window, document, traceLog, pageDone, ll, titles = [];

  function registerTitle(title) {
    titles.push(title);
    return title;
  }

  function loadBefore(beforeDone) {
    jasmine.addMatchers(customMatchers);
    loadPage('spec/common/page.html', function(frmWindow, frmDocument, body, done) {
      window = frmWindow;
      document = frmDocument;
      traceLog = window.traceLog;
      traceLog.enabled = true;
      pageDone = done;
      ll = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm3'));
      beforeDone();
    }, 'effect - ' + titles.shift());
  }

  describe('update', function() {

    beforeEach(loadBefore);

    it(registerTitle('setOptions()'), function() {
      var props = window.insProps[ll._id];

      // enable boolean
      expect(props.curStats.dash_enabled).toBe(false);
      expect(ll.dash).toBe(false);
      traceLog.clear();
      ll.dash = true;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=true']);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(ll.dash).toBe(true);

      // same
      traceLog.clear();
      ll.dash = true;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.effect');

      // disable
      traceLog.clear();
      ll.dash = false;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=false']);
      expect(props.curStats.dash_enabled).toBe(false);
      expect(props.aplStats.dash_enabled).toBe(false);
      expect(ll.dash).toBe(false);

      // enable options
      traceLog.clear();
      ll.dash = {len: 15};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=true']);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(ll.dash).toEqual({len: 15, gap: null});

      // update options
      traceLog.clear();
      ll.dash = {len: 16};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]); // not include dash_enabled
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(ll.dash).toEqual({len: 16, gap: null});

      // options -> true
      traceLog.clear();
      ll.dash = true;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]); // not include dash_enabled
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(ll.dash).toBe(true);

      // enable other values
      ll.dash = false;
      expect(props.curStats.dash_enabled).toBe(false);
      expect(props.aplStats.dash_enabled).toBe(false);
      expect(ll.dash).toBe(false);
      traceLog.clear();
      ll.dash = 'a';
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=true']);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(ll.dash).toBe(true);

      // Change to element in iframe, `baseWindow` is not changed
      ll.setOptions({
        start: document.getElementById('elm2'),
        end: document.getElementById('elm3')
      });
      traceLog.clear();
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(traceLog.log).not.toContain('<bindWindow>');
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.effect');

      // Change to element in iframe, `baseWindow` is changed
      traceLog.clear();
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm1');
      expect(traceLog.log).toContain('<bindWindow>');
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      // remove() in <bindWindow> -> init()
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=true']);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(ll.dash).toBe(true);

      pageDone();
    });

    it(registerTitle('setEffect()'), function() {
      var props = window.insProps[ll._id], value;

      // OFF -> ON
      expect(props.curStats.dash_enabled).toBe(false);
      expect(props.aplStats.dash_enabled).toBe(false);
      expect(ll.dash).toBe(false);
      traceLog.clear();
      ll.dash = true;
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=true']);
      expect(traceLog.log).toContain('<EFFECTS.dash.init>');
      expect(traceLog.log).not.toContain('<EFFECTS.dash.remove>');
      expect(traceLog.log).toContain('<EFFECTS.dash.update>'); // called by init
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(ll.dash).toBe(true);

      // same
      value = props.curStats.dash_options; // default options
      traceLog.clear();
      ll.dash = {}; // change this, and call setEffect()
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]); // not include dash_enabled
      // nothing is called because dash_enabled and dash_options is not changed
      expect(traceLog.log).not.toContain('<EFFECTS.dash.init>');
      expect(traceLog.log).not.toContain('<EFFECTS.dash.remove>');
      expect(traceLog.log).not.toContain('<EFFECTS.dash.update>');
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual(value);
      expect(props.aplStats.dash_options).toEqual(value);
      expect(ll.dash).toEqual(value); // it's normalized, default options

      // update options
      traceLog.clear();
      ll.dash = {len: 15};
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]); // not include dash_enabled
      // nothing is called because dash_enabled and dash_options is not changed
      expect(traceLog.log).toContain('<EFFECTS.dash.init>');
      expect(traceLog.log).toContain('<EFFECTS.dash.remove>');
      expect(traceLog.log).toContain('<EFFECTS.dash.update>'); // called by init
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({len: 15, gap: null});
      expect(props.aplStats.dash_options).toEqual({len: 15, gap: null});
      expect(props.curStats.dash_options).not.toBe(props.aplStats.dash_options); // it's copy
      expect(ll.dash).toEqual({len: 15, gap: null});

      // Change to element in iframe, `baseWindow` is changed
      traceLog.clear();
      ll.setOptions({
        start: document.getElementById('iframe1').contentDocument.getElementById('elm1'),
        end: document.getElementById('iframe1').contentDocument.getElementById('elm2')
      });
      expect(traceLog.log).toContain('<bindWindow>');
      // remove() in <bindWindow> -> init()
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=true']);
      expect(traceLog.log).toContain('<EFFECTS.dash.init>');
      expect(traceLog.log).toContain('<EFFECTS.dash.remove>');
      expect(traceLog.log).toContain('<EFFECTS.dash.update>'); // called by init
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({len: 15, gap: null});
      expect(props.aplStats.dash_options).toEqual({len: 15, gap: null});
      expect(ll.dash).toEqual({len: 15, gap: null});

      // ON -> OFF
      traceLog.clear();
      ll.dash = false;
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=false']);
      expect(traceLog.log).not.toContain('<EFFECTS.dash.init>');
      expect(traceLog.log).toContain('<EFFECTS.dash.remove>');
      expect(traceLog.log).not.toContain('<EFFECTS.dash.update>');
      expect(props.curStats.dash_enabled).toBe(false);
      expect(props.aplStats.dash_enabled).toBe(false);
      expect(props.curStats.dash_options).toEqual({len: 15, gap: null}); // it's not cleared
      expect(props.aplStats.dash_options).toEqual({});
      expect(ll.dash).toBe(false);

      pageDone();
    });

  });

  describe('EFFECTS.*', function() {

    beforeEach(loadBefore);

    it(registerTitle('dash'), function() {
      var props = window.insProps[ll._id],
        len, gap;

      // init()
      len = 8; // default: line_strokeWidth * 2
      gap = 4; // default: line_strokeWidth
      traceLog.clear();
      ll.dash = true;
      expect(traceLog.log).toContain('<EFFECTS.dash.init>');
      expect(props.events.apl_line_strokeWidth.length).toBe(1); // addEventHandler
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        'curStats.dash_len=' + len,
        'curStats.dash_gap=' + gap,
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);

      // update() by events
      traceLog.clear();
      ll.size = 5;
      len = 10;
      gap = 5;
      expect(traceLog.getTaggedLog('updateFaces')).toContain('line_strokeWidth=5');
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        'curStats.dash_len=' + len,
        'curStats.dash_gap=' + gap,
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);

      // update() by options
      len = 10; // same
      gap = 6;
      traceLog.clear();
      ll.dash = {len: len, gap: gap};
      expect(traceLog.log).toContain('<EFFECTS.dash.remove>');
      expect(traceLog.log).toContain('<EFFECTS.dash.init>');
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        // curStats.dash_len are not updated (curStats* were not cleared by remove())
        'curStats.dash_gap=' + gap,
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);

      // update() by events (ignored)
      traceLog.clear();
      ll.size = 4; // len: 8, gap: 4 when `auto`
      expect(traceLog.getTaggedLog('updateFaces')).toContain('line_strokeWidth=4');
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([]); // not updated
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);

      // update() by bindWindow()
      traceLog.clear();
      ll.setOptions({
        start: document.getElementById('iframe1').contentDocument.getElementById('elm1'),
        end: document.getElementById('iframe1').contentDocument.getElementById('elm2')
      });
      expect(traceLog.log).toContain('<bindWindow>');
      // remove() in <bindWindow> -> init()
      expect(traceLog.log).toContain('<EFFECTS.dash.remove>');
      expect(traceLog.log).toContain('<EFFECTS.dash.init>');
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        // cur* are not updated
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);

      // remove()
      traceLog.clear();
      ll.dash = false;
      expect(traceLog.log).toContain('<EFFECTS.dash.remove>');
      expect(props.events.apl_line_strokeWidth.length).toBe(0); // removeEventHandler
      // curStats* are not cleared
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap == null).toBe(true); // eslint-disable-line eqeqeq

      pageDone();
    });

  });

});
