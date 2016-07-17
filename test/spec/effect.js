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

    it(registerTitle('enabled'), function() {
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
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]); // it's called
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(ll.dash).toEqual({len: 16, gap: null});

      // options -> true
      traceLog.clear();
      ll.dash = true;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]); // it's called
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

  });

});
