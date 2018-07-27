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

  describe('effectOptions', function() {

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
      expect(ll.dash).toEqual({len: 15, gap: 'auto', animation: false});

      // update options
      traceLog.clear();
      ll.dash = {len: 16};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]); // not include dash_enabled
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(ll.dash).toEqual({len: 16, gap: 'auto', animation: false});

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
      var props = window.insProps[ll._id];

      // OFF -> ON
      expect(props.curStats.dash_enabled).toBe(false);
      expect(props.aplStats.dash_enabled).toBe(false);
      expect(ll.dash).toBe(false);
      traceLog.clear();
      ll.dash = true;
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=true']);
      expect(traceLog.log).toContainAll(['<EFFECTS.dash.init>', '<EFFECTS.dash.update>']);
      expect(traceLog.log).not.toContain('<EFFECTS.dash.remove>');
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({animation: false}); // default options
      expect(props.aplStats.dash_options).toEqual({animation: false}); // default options
      expect(ll.dash).toBe(true);

      // same
      traceLog.clear();
      ll.dash = {}; // change this, and call setEffect()
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]); // not include dash_enabled
      // nothing is called because dash_enabled and dash_options is not changed
      expect(traceLog.log).toNotContainAny([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({animation: false}); // default options
      expect(props.aplStats.dash_options).toEqual({animation: false}); // default options
      expect(ll.dash).toEqual({len: 'auto', gap: 'auto', animation: false}); // default options

      // update options
      traceLog.clear();
      ll.dash = {len: 15};
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]); // not include dash_enabled
      // nothing is called because dash_enabled and dash_options is not changed
      // reset
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({len: 15, animation: false});
      expect(props.aplStats.dash_options).toEqual({len: 15, animation: false});
      expect(props.curStats.dash_options).not.toBe(props.aplStats.dash_options); // it's copy
      expect(ll.dash).toEqual({len: 15, gap: 'auto', animation: false});

      // Change to element in iframe, `baseWindow` is changed
      traceLog.clear();
      ll.setOptions({
        start: document.getElementById('iframe1').contentDocument.getElementById('elm1'),
        end: document.getElementById('iframe1').contentDocument.getElementById('elm2')
      });
      // remove() in <bindWindow> -> init()
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=true']);
      expect(traceLog.log).toContainAll([
        '<bindWindow>', '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({len: 15, animation: false});
      expect(props.aplStats.dash_options).toEqual({len: 15, animation: false});
      expect(ll.dash).toEqual({len: 15, gap: 'auto', animation: false});

      // ON -> OFF
      traceLog.clear();
      ll.dash = false;
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=false']);
      expect(traceLog.log).toContain('<EFFECTS.dash.remove>');
      expect(traceLog.log).toNotContainAny(['<EFFECTS.dash.init>', '<EFFECTS.dash.update>']);
      expect(props.curStats.dash_enabled).toBe(false);
      expect(props.aplStats.dash_enabled).toBe(false);
      expect(props.curStats.dash_options).toEqual({len: 15, animation: false}); // it's not cleared
      expect(props.aplStats.dash_options).toEqual({});
      expect(ll.dash).toBe(false);

      pageDone();
    });

    it(registerTitle('optimize effectOptions'), function() {
      var props = window.insProps[ll._id], log;

      // default stats
      expect(props.curStats.dash_enabled).toBe(false);
      expect(props.aplStats.dash_enabled).toBe(false);
      // other dash_* stats are ignored (unknown values) when it is disabled
      expect(ll.dash).toBe(false);

      // option true
      traceLog.clear();
      ll.dash = true;
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=true']);
      expect(traceLog.log).toContainAll(['<EFFECTS.dash.init>', '<EFFECTS.dash.update>']);
      expect(traceLog.log).not.toContain('<EFFECTS.dash.remove>');
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toNotContainAny(['anim.add', 'anim.remove']);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({animation: false});
      expect(props.aplStats.dash_options).toEqual({animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true);
      expect(props.aplStats.dash_animOptions == null).toBe(true);
      expect(ll.dash).toBe(true);

      // option object, animation: null
      traceLog.clear();
      ll.dash = {};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]);
      expect(traceLog.log).toNotContainAny([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      // it's not updated.
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({animation: false});
      expect(props.aplStats.dash_options).toEqual({animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true);
      expect(props.aplStats.dash_animOptions == null).toBe(true);
      expect(ll.dash).toEqual({len: 'auto', gap: 'auto', animation: false}); // optimized

      // option object update, animation: null
      traceLog.clear();
      ll.dash = {len: 5};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]);
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toNotContainAny(['anim.add', 'anim.remove']);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({len: 5, animation: false});
      expect(props.aplStats.dash_options).toEqual({len: 5, animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true);
      expect(props.aplStats.dash_animOptions == null).toBe(true);
      expect(ll.dash).toEqual({len: 5, gap: 'auto', animation: false}); // optimized

      // option object, animation: false
      ll.dash = true;
      expect(ll.dash).toBe(true);
      traceLog.clear();
      ll.dash = {animation: false};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]);
      expect(traceLog.log).toNotContainAny([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      // it's not updated.
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({animation: false});
      expect(props.aplStats.dash_options).toEqual({animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true);
      expect(props.aplStats.dash_animOptions == null).toBe(true);
      expect(ll.dash).toEqual({len: 'auto', gap: 'auto', animation: false}); // optimized

      // option object, animation: true
      traceLog.clear();
      ll.dash = {animation: true};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]);
      // reset
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      log = traceLog.getTaggedLog('EFFECTS.dash.update');
      expect(log).toContain('anim.add');
      expect(log).not.toContain('anim.remove');
      // it's not updated.
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({animation: true});
      expect(props.aplStats.dash_options).toEqual({animation: true});
      // `animation` is `true`, but `dash_animOptions` has default options
      expect(props.curStats.dash_animOptions).toEqual({duration: 1000, timing: 'linear'});
      expect(props.aplStats.dash_animOptions).toEqual({duration: 1000, timing: 'linear'});
      expect(ll.dash).toEqual({len: 'auto', gap: 'auto', animation: true}); // optimized

      // option object, animation: object
      traceLog.clear();
      ll.dash = {animation: {}};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]);
      // reset
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      // update remove -> add (already removed by EFFECTS.dash.remove when options was changed)
      log = traceLog.getTaggedLog('EFFECTS.dash.update');
      expect(log).toContain('anim.add');
      expect(log).not.toContain('anim.remove');
      // it's not updated.
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      // `animation` is `dash_animOptions`
      expect(props.curStats.dash_options).toEqual({animation: {duration: 1000, timing: 'linear'}});
      expect(props.aplStats.dash_options).toEqual({animation: {duration: 1000, timing: 'linear'}});
      expect(props.curStats.dash_animOptions).toEqual({duration: 1000, timing: 'linear'}); // optimized
      expect(props.aplStats.dash_animOptions).toEqual({duration: 1000, timing: 'linear'}); // optimized
      expect(ll.dash).toEqual(
        {len: 'auto', gap: 'auto', animation: {duration: 1000, timing: 'linear'}}); // optimized

      // option object, animation: object update
      traceLog.clear();
      ll.dash = {animation: {duration: 1500}};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]);
      // reset
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      // update remove -> add (already removed by EFFECTS.dash.remove when options was changed)
      log = traceLog.getTaggedLog('EFFECTS.dash.update');
      expect(log).toContain('anim.add');
      expect(log).not.toContain('anim.remove');
      // it's not updated.
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      // `animation` is `dash_animOptions`
      expect(props.curStats.dash_options).toEqual({animation: {duration: 1500, timing: 'linear'}});
      expect(props.aplStats.dash_options).toEqual({animation: {duration: 1500, timing: 'linear'}});
      expect(props.curStats.dash_animOptions).toEqual({duration: 1500, timing: 'linear'}); // optimized
      expect(props.aplStats.dash_animOptions).toEqual({duration: 1500, timing: 'linear'}); // optimized
      expect(ll.dash).toEqual(
        {len: 'auto', gap: 'auto', animation: {duration: 1500, timing: 'linear'}}); // optimized

      // updated by event
      traceLog.clear();
      ll.size = 5;
      expect(traceLog.getTaggedLog('setOptions')).not.toContain('needs.effect');
      // reset
      expect(traceLog.log).toNotContainAny(['<EFFECTS.dash.init>', '<EFFECTS.dash.remove>']);
      expect(traceLog.log).toContain('<EFFECTS.dash.update>');
      // update remove -> add
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toContainAll([
        'anim.add', 'anim.remove'
      ]);
      // it's not updated.
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      // `animation` is `dash_animOptions`
      expect(props.curStats.dash_options).toEqual({animation: {duration: 1500, timing: 'linear'}});
      expect(props.aplStats.dash_options).toEqual({animation: {duration: 1500, timing: 'linear'}});
      expect(props.curStats.dash_animOptions).toEqual({duration: 1500, timing: 'linear'}); // optimized
      expect(props.aplStats.dash_animOptions).toEqual({duration: 1500, timing: 'linear'}); // optimized
      expect(ll.dash).toEqual(
        {len: 'auto', gap: 'auto', animation: {duration: 1500, timing: 'linear'}}); // optimized

      // option object, animation: false
      traceLog.clear();
      ll.dash = {animation: false};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]);
      // reset
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      // remove (already removed by EFFECTS.dash.remove when options was changed)
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toNotContainAny([
        'anim.add', 'anim.remove'
      ]);
      // it's not updated.
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({animation: false});
      expect(props.aplStats.dash_options).toEqual({animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true);
      expect(props.aplStats.dash_animOptions == null).toBe(true);
      expect(ll.dash).toEqual({len: 'auto', gap: 'auto', animation: false}); // optimized

      // valid value
      traceLog.clear();
      ll.dash = {len: 5, gap: 10};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]);
      // reset
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({len: 5, gap: 10, animation: false});
      expect(props.aplStats.dash_options).toEqual({len: 5, gap: 10, animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true);
      expect(props.aplStats.dash_animOptions == null).toBe(true);
      expect(ll.dash).toEqual({len: 5, gap: 10, animation: false}); // optimized

      // invalid value
      traceLog.clear();
      ll.dash = {len: 'a', gap: 0}; // these are ignored
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]);
      // reset
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({animation: false});
      expect(props.aplStats.dash_options).toEqual({animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true);
      expect(props.aplStats.dash_animOptions == null).toBe(true);
      expect(ll.dash).toEqual({len: 'auto', gap: 'auto', animation: false}); // optimized

      // valid auto
      traceLog.clear();
      ll.dash = {len: 'auto', gap: 10};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]);
      // reset
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({gap: 10, animation: false});
      expect(props.aplStats.dash_options).toEqual({gap: 10, animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true);
      expect(props.aplStats.dash_animOptions == null).toBe(true);
      expect(ll.dash).toEqual({len: 'auto', gap: 10, animation: false}); // optimized

      // invalid auto
      traceLog.clear();
      ll.dropShadow = {dx: 'auto', dy: 10}; // default dx: 2
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dropShadow_enabled=true']);
      // reset
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dropShadow.init>'
      ]);
      expect(props.curStats.dropShadow_enabled).toBe(true);
      expect(props.aplStats.dropShadow_enabled).toBe(true);
      expect(props.curStats.dropShadow_options).toEqual({dx: 2, dy: 10, blur: 3, color: '#000', opacity: 0.8});
      expect(props.aplStats.dropShadow_options).toEqual({dx: 2, dy: 10, blur: 3, color: '#000', opacity: 0.8});
      expect(props.curStats.dropShadow_animOptions == null).toBe(true);
      expect(props.aplStats.dropShadow_animOptions == null).toBe(true);
      expect(ll.dropShadow).toEqual({dx: 2, dy: 10, blur: 3, color: '#000', opacity: 0.8}); // optimized

      pageDone();
    });

  });

  describe('EFFECTS', function() {

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
        'dash_len=' + len, 'dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true);
      expect(props.curStats.dash_animId == null).toBe(true);

      // update() by events
      traceLog.clear();
      ll.size = 5;
      len = 10;
      gap = 5;
      expect(traceLog.log).toNotContainAny(['<EFFECTS.dash.init>', '<EFFECTS.dash.remove>']);
      expect(traceLog.getTaggedLog('updateFaces')).toContain('line_strokeWidth=5');
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        'dash_len=' + len, 'dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true);
      expect(props.curStats.dash_animId == null).toBe(true);

      // update() by options
      len = 10; // same
      gap = 6;
      traceLog.clear();
      ll.dash = {len: len, gap: gap};
      expect(traceLog.log).toContainAll(['<EFFECTS.dash.remove>', '<EFFECTS.dash.init>']);
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        // curStats.dash_len are not updated (curStats* were not cleared by remove())
        'dash_len=' + len, 'dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true);
      expect(props.curStats.dash_animId == null).toBe(true);

      // update() by options same dash_maxOffset
      len = 8;
      gap = 8;
      traceLog.clear();
      ll.dash = {len: len, gap: gap};
      expect(traceLog.log).toContainAll(['<EFFECTS.dash.remove>', '<EFFECTS.dash.init>']);
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        // curStats.dash_maxOffset are not updated (curStats* were not cleared by remove())
        'dash_len=' + len, 'dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true);
      expect(props.curStats.dash_animId == null).toBe(true);

      // update() by events (ignored)
      traceLog.clear();
      ll.size = 4; // len: 8, gap: 4 when `auto`
      expect(traceLog.log).toNotContainAny(['<EFFECTS.dash.init>', '<EFFECTS.dash.remove>']);
      expect(traceLog.getTaggedLog('updateFaces')).toContain('line_strokeWidth=4');
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([]); // not updated
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true);
      expect(props.curStats.dash_animId == null).toBe(true);

      // update() by bindWindow()
      traceLog.clear();
      ll.setOptions({
        start: document.getElementById('iframe1').contentDocument.getElementById('elm1'),
        end: document.getElementById('iframe1').contentDocument.getElementById('elm2')
      });
      // remove() in <bindWindow> -> init()
      expect(traceLog.log).toContainAll(['<bindWindow>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.init>']);
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        // cur* are not updated
        'dash_len=' + len, 'dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true);
      expect(props.curStats.dash_animId == null).toBe(true);

      // remove()
      traceLog.clear();
      ll.dash = false;
      expect(traceLog.log).toNotContainAny(['<EFFECTS.dash.init>', '<EFFECTS.dash.update>']);
      expect(traceLog.log).toContain('<EFFECTS.dash.remove>');
      expect(props.events.apl_line_strokeWidth.length).toBe(0); // removeEventHandler
      // curStats* are not cleared
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len == null).toBe(true);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap == null).toBe(true);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true);
      expect(props.curStats.dash_animId == null).toBe(true);

      // anim - init()
      ll.size = 5;
      len = 10; // default: line_strokeWidth * 2
      gap = 5; // default: line_strokeWidth
      traceLog.clear();
      ll.dash = {animation: true};
      expect(traceLog.log).toContain('<EFFECTS.dash.init>');
      expect(props.events.apl_line_strokeWidth.length).toBe(1); // addEventHandler
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        'dash_len=' + len, 'dash_gap=' + gap, 'dash_maxOffset=' + (len + gap),
        'anim.add'
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset).toBe(len + gap);
      expect(props.curStats.dash_animId != null).toBe(true);

      // anim - update by AnimOptions (the effect is removed -> inited)
      traceLog.clear();
      ll.dash = {animation: {duration: 2000}};
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      // update remove -> add (already removed by EFFECTS.dash.remove when options was changed)
      expect(props.events.apl_line_strokeWidth.length).toBe(1); // addEventHandler
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        'dash_len=' + len, 'dash_gap=' + gap, 'dash_maxOffset=' + (len + gap),
        'anim.add' // anim.remove is not called
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset).toBe(len + gap);
      expect(props.curStats.dash_animId != null).toBe(true);

      // anim - update by event
      traceLog.clear();
      ll.size = 6;
      len = 12;
      gap = 6;
      expect(traceLog.log).toNotContainAny(['<EFFECTS.dash.init>', '<EFFECTS.dash.remove>']);
      expect(traceLog.getTaggedLog('updateFaces')).toContain('line_strokeWidth=6');
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        'dash_len=' + len, 'dash_gap=' + gap, 'dash_maxOffset=' + (len + gap),
        'anim.remove', 'anim.add'
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset).toBe(len + gap);
      expect(props.curStats.dash_animId != null).toBe(true);

      // anim - update by event same
      ll.dash = {len: 12, gap: 6, animation: true};
      traceLog.clear();
      ll.size = 8;
      len = 12;
      gap = 6;
      expect(traceLog.log).toNotContainAny(['<EFFECTS.dash.init>', '<EFFECTS.dash.remove>']);
      expect(traceLog.getTaggedLog('updateFaces')).toContain('line_strokeWidth=8');
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset).toBe(len + gap);
      expect(props.curStats.dash_animId != null).toBe(true);

      // anim - remove
      traceLog.clear();
      ll.dash = {len: 12, gap: 6, animation: false};
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      expect(props.events.apl_line_strokeWidth.length).toBe(1); // addEventHandler, it's not changed
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        'dash_len=' + len, 'dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true);
      expect(props.curStats.dash_animId == null).toBe(true);

      pageDone();
    });

    it(registerTitle('gradient'), function() {
      var props = window.insProps[ll._id],
        color0, color1, point0, point1;

      ll.startPlug = ll.endPlug = 'square'; // to disable overhead

      // init()
      ll.setOptions({
        startPlugColor: (color0 = 'red'), // default: plug_colorSE[0]
        endPlugColor: (color1 = 'blue') // default: plug_colorSE[1]
      });
      point0 = {x: props.aplStats.position_socketXYSE[0].x, y: props.aplStats.position_socketXYSE[0].y};
      point1 = {x: props.aplStats.position_socketXYSE[1].x, y: props.aplStats.position_socketXYSE[1].y};
      traceLog.clear();
      ll.gradient = true;
      expect(traceLog.log).toContain('<EFFECTS.gradient.init>');
      expect(props.events.cur_plug_colorSE.length).toBe(1); // addEventHandler
      expect(props.events.apl_path.length).toBe(1); // addEventHandler
      expect(traceLog.getTaggedLog('EFFECTS.gradient.update')).toEqual([
        'gradient_colorSE[0]=' + color0,
        'gradient_pointSE[0].x', 'gradient_pointSE[0].y',
        'gradient_colorSE[1]=' + color1,
        'gradient_pointSE[1].x', 'gradient_pointSE[1].y'
      ]);
      expect(props.curStats.gradient_colorSE[0]).toBe(color0);
      expect(props.aplStats.gradient_colorSE[0]).toBe(color0);
      expect(props.curStats.gradient_colorSE[1]).toBe(color1);
      expect(props.aplStats.gradient_colorSE[1]).toBe(color1);
      expect(props.curStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.aplStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.curStats.gradient_pointSE[1]).toEqual(point1);
      expect(props.aplStats.gradient_pointSE[1]).toEqual(point1);

      // update() by events cur_plug_colorSE
      traceLog.clear();
      ll.startPlugColor = (color0 = 'green');
      expect(traceLog.log).toNotContainAny(['<EFFECTS.gradient.init>', '<EFFECTS.gradient.remove>']);
      expect(traceLog.getTaggedLog('updatePlug')).toContain('plug_colorSE[0]=green');
      expect(traceLog.getTaggedLog('EFFECTS.gradient.update')).toEqual(['gradient_colorSE[0]=' + color0]);
      expect(props.curStats.gradient_colorSE[0]).toBe(color0);
      expect(props.aplStats.gradient_colorSE[0]).toBe(color0);
      expect(props.curStats.gradient_colorSE[1]).toBe(color1);
      expect(props.aplStats.gradient_colorSE[1]).toBe(color1);
      expect(props.curStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.aplStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.curStats.gradient_pointSE[1]).toEqual(point1);
      expect(props.aplStats.gradient_pointSE[1]).toEqual(point1);

      // update() by events cur_line_color -> cur_plug_colorSE
      ll.endPlugColor = 'auto';
      traceLog.clear();
      ll.color = (color1 = 'lime');
      expect(traceLog.log).toNotContainAny(['<EFFECTS.gradient.init>', '<EFFECTS.gradient.remove>']);
      expect(traceLog.getTaggedLog('updateLine')).toContain('line_color=lime');
      expect(traceLog.getTaggedLog('updatePlug')).toContain('plug_colorSE[1]=lime');
      expect(traceLog.getTaggedLog('EFFECTS.gradient.update')).toEqual(['gradient_colorSE[1]=' + color1]);
      expect(props.curStats.gradient_colorSE[0]).toBe(color0);
      expect(props.aplStats.gradient_colorSE[0]).toBe(color0);
      expect(props.curStats.gradient_colorSE[1]).toBe(color1);
      expect(props.aplStats.gradient_colorSE[1]).toBe(color1);
      expect(props.curStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.aplStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.curStats.gradient_pointSE[1]).toEqual(point1);
      expect(props.aplStats.gradient_pointSE[1]).toEqual(point1);

      // update() by events apl_path
      traceLog.clear();
      ll.end = document.getElementById('elm2');
      point1 = {x: props.aplStats.position_socketXYSE[1].x, y: props.aplStats.position_socketXYSE[1].y};
      expect(traceLog.log).toNotContainAny(['<EFFECTS.gradient.init>', '<EFFECTS.gradient.remove>']);
      expect(traceLog.getTaggedLog('updatePath')).toContain('path_pathData');
      expect(traceLog.getTaggedLog('EFFECTS.gradient.update')).toEqual([
        'gradient_pointSE[1].x', 'gradient_pointSE[1].y'
      ]);
      expect(props.curStats.gradient_colorSE[0]).toBe(color0);
      expect(props.aplStats.gradient_colorSE[0]).toBe(color0);
      expect(props.curStats.gradient_colorSE[1]).toBe(color1);
      expect(props.aplStats.gradient_colorSE[1]).toBe(color1);
      expect(props.curStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.aplStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.curStats.gradient_pointSE[1]).toEqual(point1);
      expect(props.aplStats.gradient_pointSE[1]).toEqual(point1);

      // update() by options
      color0 = 'green'; // same
      color1 = 'yellow';
      traceLog.clear();
      ll.gradient = {startColor: color0, endColor: color1};
      expect(traceLog.log).toContainAll(['<EFFECTS.gradient.remove>', '<EFFECTS.gradient.init>']);
      expect(traceLog.getTaggedLog('EFFECTS.gradient.update')).toEqual([
        // curStats.gradient_colorSE[0] are not updated (curStats* were not cleared by remove())
        'gradient_colorSE[0]=' + color0,
        'gradient_pointSE[0].x', 'gradient_pointSE[0].y',
        'gradient_colorSE[1]=' + color1,
        'gradient_pointSE[1].x', 'gradient_pointSE[1].y'
      ]);
      expect(props.curStats.gradient_colorSE[0]).toBe(color0);
      expect(props.aplStats.gradient_colorSE[0]).toBe(color0);
      expect(props.curStats.gradient_colorSE[1]).toBe(color1);
      expect(props.aplStats.gradient_colorSE[1]).toBe(color1);
      expect(props.curStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.aplStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.curStats.gradient_pointSE[1]).toEqual(point1);
      expect(props.aplStats.gradient_pointSE[1]).toEqual(point1);

      // update() by events (ignored)
      traceLog.clear();
      ll.endPlugColor = 'pink';
      expect(traceLog.log).toNotContainAny(['<EFFECTS.gradient.init>', '<EFFECTS.gradient.remove>']);
      expect(traceLog.getTaggedLog('updatePlug')).toContain('plug_colorSE[1]=pink');
      expect(traceLog.getTaggedLog('EFFECTS.gradient.update')).toEqual([]); // not updated
      expect(props.curStats.gradient_colorSE[0]).toBe(color0);
      expect(props.aplStats.gradient_colorSE[0]).toBe(color0);
      expect(props.curStats.gradient_colorSE[1]).toBe(color1);
      expect(props.aplStats.gradient_colorSE[1]).toBe(color1);
      expect(props.curStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.aplStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.curStats.gradient_pointSE[1]).toEqual(point1);
      expect(props.aplStats.gradient_pointSE[1]).toEqual(point1);

      // update() by bindWindow()
      traceLog.clear();
      ll.setOptions({
        start: document.getElementById('iframe1').contentDocument.getElementById('elm1'),
        end: document.getElementById('iframe1').contentDocument.getElementById('elm2')
      });
      point0 = {x: props.aplStats.position_socketXYSE[0].x, y: props.aplStats.position_socketXYSE[0].y};
      point1 = {x: props.aplStats.position_socketXYSE[1].x, y: props.aplStats.position_socketXYSE[1].y};
      // remove() in <bindWindow> -> init()
      expect(traceLog.log).toContainAll(['<bindWindow>', '<EFFECTS.gradient.remove>', '<EFFECTS.gradient.init>']);
      expect(traceLog.getTaggedLog('EFFECTS.gradient.update')).toEqual([
        // cur* are not updated
        'gradient_colorSE[0]=' + color0,
        'gradient_pointSE[0].x', 'gradient_pointSE[0].y',
        'gradient_colorSE[1]=' + color1,
        'gradient_pointSE[1].x', 'gradient_pointSE[1].y'
      ]);
      expect(props.curStats.gradient_colorSE[0]).toBe(color0);
      expect(props.aplStats.gradient_colorSE[0]).toBe(color0);
      expect(props.curStats.gradient_colorSE[1]).toBe(color1);
      expect(props.aplStats.gradient_colorSE[1]).toBe(color1);
      expect(props.curStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.aplStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.curStats.gradient_pointSE[1]).toEqual(point1);
      expect(props.aplStats.gradient_pointSE[1]).toEqual(point1);

      // remove()
      traceLog.clear();
      ll.gradient = false;
      expect(traceLog.log).toNotContainAny(['<EFFECTS.gradient.init>', '<EFFECTS.gradient.update>']);
      expect(traceLog.log).toContain('<EFFECTS.gradient.remove>');
      expect(props.events.cur_plug_colorSE.length).toBe(0); // removeEventHandler
      expect(props.events.apl_path.length).toBe(0); // removeEventHandler
      // curStats* are not cleared
      expect(props.curStats.gradient_colorSE[0]).toBe(color0);
      expect(props.aplStats.gradient_colorSE[0] == null).toBe(true);
      expect(props.curStats.gradient_colorSE[1]).toBe(color1);
      expect(props.aplStats.gradient_colorSE[1] == null).toBe(true);
      expect(props.curStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.aplStats.gradient_pointSE[0]).toEqual({});
      expect(props.curStats.gradient_pointSE[1]).toEqual(point1);
      expect(props.aplStats.gradient_pointSE[1]).toEqual({});

      pageDone();
    });

    it(registerTitle('dropShadow'), function() {
      var props = window.insProps[ll._id],
        dx, dy, blur, color, opacity, edge, lineWidth, plugOverhead, margin, elmEnd;

      ll.startPlug = ll.endPlug = 'behind'; // to disable expanding viewBox

      // init()
      dx = 2;
      dy = 4;
      blur = 3;
      color = '#000';
      opacity = 0.8;
      traceLog.clear();
      ll.dropShadow = true;
      expect(traceLog.log).toContain('<EFFECTS.dropShadow.init>');
      expect(props.events.new_edge4viewBox.length).toBe(1); // addEventHandler
      expect(traceLog.getTaggedLog('EFFECTS.dropShadow.update')).toEqual([
        'dropShadow_dx=' + dx,
        'dropShadow_dy=' + dy,
        'dropShadow_blur=' + blur,
        'dropShadow_color=' + color,
        'dropShadow_opacity=' + opacity
      ]);
      expect(props.curStats.dropShadow_dx).toBe(dx);
      expect(props.aplStats.dropShadow_dx).toBe(dx);
      expect(props.curStats.dropShadow_dy).toBe(dy);
      expect(props.aplStats.dropShadow_dy).toBe(dy);
      expect(props.curStats.dropShadow_blur).toBe(blur);
      expect(props.aplStats.dropShadow_blur).toBe(blur);
      expect(props.curStats.dropShadow_color).toBe(color);
      expect(props.aplStats.dropShadow_color).toBe(color);
      expect(props.curStats.dropShadow_opacity).toBe(opacity);
      expect(props.aplStats.dropShadow_opacity).toBe(opacity);

      // viewBox
      lineWidth = 4;
      plugOverhead = lineWidth / 2;
      margin = blur * 3; // nearly standard deviation
      edge = {
        x1: props.aplStats.position_socketXYSE[0].x - lineWidth / 2 - margin + dx - plugOverhead,
        y1: props.aplStats.position_socketXYSE[0].y - lineWidth / 2 - margin + dy,
        x2: props.aplStats.position_socketXYSE[1].x + lineWidth / 2 + margin + dx + plugOverhead,
        y2: props.aplStats.position_socketXYSE[1].y + lineWidth / 2 + margin + dy};
      expect(props.aplStats.viewBox_bBox.x).toBe(edge.x1);
      expect(props.aplStats.viewBox_bBox.y).toBe(edge.y1);
      expect(props.aplStats.viewBox_bBox.width).toBe(edge.x2 - edge.x1);
      expect(props.aplStats.viewBox_bBox.height).toBe(edge.y2 - edge.y1);

      // update() by events new_edge4viewBox
      traceLog.clear();
      elmEnd = document.getElementById('elm3');
      elmEnd.style.left = '200px';
      elmEnd.style.top = '200px';
      ll.position();
      expect(traceLog.log).toNotContainAny([
        '<EFFECTS.dropShadow.init>', '<EFFECTS.dropShadow.remove>', '<EFFECTS.dropShadow.update>']);
      edge = {
        x1: props.aplStats.position_socketXYSE[0].x - lineWidth / 2 - margin + dx - plugOverhead,
        y1: props.aplStats.position_socketXYSE[0].y - lineWidth / 2 - margin + dy,
        x2: props.aplStats.position_socketXYSE[1].x + lineWidth / 2 + margin + dx + plugOverhead,
        y2: props.aplStats.position_socketXYSE[1].y + lineWidth / 2 + margin + dy};
      expect(props.aplStats.viewBox_bBox.x).toBe(edge.x1);
      expect(props.aplStats.viewBox_bBox.y).toBe(edge.y1);
      expect(props.aplStats.viewBox_bBox.width).toBe(edge.x2 - edge.x1);
      expect(props.aplStats.viewBox_bBox.height).toBe(edge.y2 - edge.y1);

      // update() by options
      ll.dropShadow = {dx: 5, dy: 6};
      traceLog.clear();
      ll.dropShadow = {opacity: (opacity = 0.5)}; // dx and dy are reset to default
      expect(traceLog.log).toContainAll(['<EFFECTS.dropShadow.remove>', '<EFFECTS.dropShadow.init>']);
      expect(traceLog.getTaggedLog('EFFECTS.dropShadow.update')).toEqual([
        'dropShadow_dx=' + dx,
        'dropShadow_dy=' + dy,
        'dropShadow_blur=' + blur,
        'dropShadow_color=' + color,
        'dropShadow_opacity=' + opacity
      ]);
      expect(props.curStats.dropShadow_dx).toBe(dx);
      expect(props.aplStats.dropShadow_dx).toBe(dx);
      expect(props.curStats.dropShadow_dy).toBe(dy);
      expect(props.aplStats.dropShadow_dy).toBe(dy);
      expect(props.curStats.dropShadow_blur).toBe(blur);
      expect(props.aplStats.dropShadow_blur).toBe(blur);
      expect(props.curStats.dropShadow_color).toBe(color);
      expect(props.aplStats.dropShadow_color).toBe(color);
      expect(props.curStats.dropShadow_opacity).toBe(opacity);
      expect(props.aplStats.dropShadow_opacity).toBe(opacity);

      // update() by bindWindow()
      traceLog.clear();
      ll.setOptions({
        start: document.getElementById('iframe1').contentDocument.getElementById('elm1'),
        end: document.getElementById('iframe1').contentDocument.getElementById('elm2')
      });
      // remove() in <bindWindow> -> init()
      expect(traceLog.log).toContainAll(['<bindWindow>', '<EFFECTS.dropShadow.remove>', '<EFFECTS.dropShadow.init>']);
      expect(traceLog.getTaggedLog('EFFECTS.dropShadow.update')).toEqual([
        'dropShadow_dx=' + dx,
        'dropShadow_dy=' + dy,
        'dropShadow_blur=' + blur,
        'dropShadow_color=' + color,
        'dropShadow_opacity=' + opacity
      ]);
      expect(props.curStats.dropShadow_dx).toBe(dx);
      expect(props.aplStats.dropShadow_dx).toBe(dx);
      expect(props.curStats.dropShadow_dy).toBe(dy);
      expect(props.aplStats.dropShadow_dy).toBe(dy);
      expect(props.curStats.dropShadow_blur).toBe(blur);
      expect(props.aplStats.dropShadow_blur).toBe(blur);
      expect(props.curStats.dropShadow_color).toBe(color);
      expect(props.aplStats.dropShadow_color).toBe(color);
      expect(props.curStats.dropShadow_opacity).toBe(opacity);
      expect(props.aplStats.dropShadow_opacity).toBe(opacity);

      // remove()
      traceLog.clear();
      ll.dropShadow = false;
      expect(traceLog.log).toNotContainAny(['<EFFECTS.dropShadow.init>', '<EFFECTS.dropShadow.update>']);
      expect(traceLog.log).toContain('<EFFECTS.dropShadow.remove>');
      expect(props.events.new_edge4viewBox.length).toBe(0); // removeEventHandler
      // curStats* are not cleared
      expect(props.curStats.dropShadow_dx).toBe(dx);
      expect(props.aplStats.dropShadow_dx == null).toBe(true);
      expect(props.curStats.dropShadow_dy).toBe(dy);
      expect(props.aplStats.dropShadow_dy == null).toBe(true);
      expect(props.curStats.dropShadow_blur).toBe(blur);
      expect(props.aplStats.dropShadow_blur == null).toBe(true);
      expect(props.curStats.dropShadow_color).toBe(color);
      expect(props.aplStats.dropShadow_color == null).toBe(true);
      expect(props.curStats.dropShadow_opacity).toBe(opacity);
      expect(props.aplStats.dropShadow_opacity == null).toBe(true);

      pageDone();
    });

  });

});
