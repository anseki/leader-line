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
      expect(ll.dash).toEqual({len: 15, gap: null, animation: false});

      // update options
      traceLog.clear();
      ll.dash = {len: 16};
      expect(traceLog.getTaggedLog('setOptions')).toContain('needs.effect');
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]); // not include dash_enabled
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(ll.dash).toEqual({len: 16, gap: null, animation: false});

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
      expect(traceLog.log).toContainAll(['<EFFECTS.dash.init>', '<EFFECTS.dash.update>']);
      expect(traceLog.log).not.toContain('<EFFECTS.dash.remove>');
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(ll.dash).toBe(true);

      // same
      value = props.curStats.dash_options; // default options
      traceLog.clear();
      ll.dash = {}; // change this, and call setEffect()
      expect(traceLog.getTaggedLog('setEffect')).toEqual([]); // not include dash_enabled
      // nothing is called because dash_enabled and dash_options is not changed
      expect(traceLog.log).toNotContainAny([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
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
      // reset
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      expect(props.curStats.dash_enabled).toBe(true);
      expect(props.aplStats.dash_enabled).toBe(true);
      expect(props.curStats.dash_options).toEqual({len: 15, gap: null, animation: false});
      expect(props.aplStats.dash_options).toEqual({len: 15, gap: null, animation: false});
      expect(props.curStats.dash_options).not.toBe(props.aplStats.dash_options); // it's copy
      expect(ll.dash).toEqual({len: 15, gap: null, animation: false});

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
      expect(props.curStats.dash_options).toEqual({len: 15, gap: null, animation: false});
      expect(props.aplStats.dash_options).toEqual({len: 15, gap: null, animation: false});
      expect(ll.dash).toEqual({len: 15, gap: null, animation: false});

      // ON -> OFF
      traceLog.clear();
      ll.dash = false;
      expect(traceLog.getTaggedLog('setEffect')).toEqual(['dash_enabled=false']);
      expect(traceLog.log).toContain('<EFFECTS.dash.remove>');
      expect(traceLog.log).toNotContainAny(['<EFFECTS.dash.init>', '<EFFECTS.dash.update>']);
      expect(props.curStats.dash_enabled).toBe(false);
      expect(props.aplStats.dash_enabled).toBe(false);
      expect(props.curStats.dash_options).toEqual({len: 15, gap: null, animation: false}); // it's not cleared
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
      expect(props.curStats.dash_options).toEqual({len: null, gap: null, animation: false});
      expect(props.aplStats.dash_options).toEqual({len: null, gap: null, animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.aplStats.dash_animOptions == null).toBe(true); // eslint-disable-line eqeqeq
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
      expect(props.curStats.dash_options).toEqual({len: null, gap: null, animation: false});
      expect(props.aplStats.dash_options).toEqual({len: null, gap: null, animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.aplStats.dash_animOptions == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.dash).toEqual({len: null, gap: null, animation: false}); // optimized

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
      expect(props.curStats.dash_options).toEqual({len: 5, gap: null, animation: false});
      expect(props.aplStats.dash_options).toEqual({len: 5, gap: null, animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.aplStats.dash_animOptions == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.dash).toEqual({len: 5, gap: null, animation: false}); // optimized

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
      expect(props.curStats.dash_options).toEqual({len: null, gap: null, animation: false});
      expect(props.aplStats.dash_options).toEqual({len: null, gap: null, animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.aplStats.dash_animOptions == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.dash).toEqual({len: null, gap: null, animation: false}); // optimized

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
      expect(props.curStats.dash_options).toEqual({len: null, gap: null, animation: true});
      expect(props.aplStats.dash_options).toEqual({len: null, gap: null, animation: true});
      // `animation` is `true`, but `dash_animOptions` has default options
      expect(props.curStats.dash_animOptions).toEqual({duration: 1000, timing: 'linear'});
      expect(props.aplStats.dash_animOptions).toEqual({duration: 1000, timing: 'linear'});
      expect(ll.dash).toEqual({len: null, gap: null, animation: true}); // optimized

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
      expect(props.curStats.dash_options).toEqual(
        {len: null, gap: null, animation: {duration: 1000, timing: 'linear'}});
      expect(props.aplStats.dash_options).toEqual(
        {len: null, gap: null, animation: {duration: 1000, timing: 'linear'}});
      expect(props.curStats.dash_animOptions).toEqual({duration: 1000, timing: 'linear'}); // optimized
      expect(props.aplStats.dash_animOptions).toEqual({duration: 1000, timing: 'linear'}); // optimized
      expect(ll.dash).toEqual(
        {len: null, gap: null, animation: {duration: 1000, timing: 'linear'}}); // optimized

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
      expect(props.curStats.dash_options).toEqual(
        {len: null, gap: null, animation: {duration: 1500, timing: 'linear'}});
      expect(props.aplStats.dash_options).toEqual(
        {len: null, gap: null, animation: {duration: 1500, timing: 'linear'}});
      expect(props.curStats.dash_animOptions).toEqual({duration: 1500, timing: 'linear'}); // optimized
      expect(props.aplStats.dash_animOptions).toEqual({duration: 1500, timing: 'linear'}); // optimized
      expect(ll.dash).toEqual(
        {len: null, gap: null, animation: {duration: 1500, timing: 'linear'}}); // optimized

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
      expect(props.curStats.dash_options).toEqual(
        {len: null, gap: null, animation: {duration: 1500, timing: 'linear'}});
      expect(props.aplStats.dash_options).toEqual(
        {len: null, gap: null, animation: {duration: 1500, timing: 'linear'}});
      expect(props.curStats.dash_animOptions).toEqual({duration: 1500, timing: 'linear'}); // optimized
      expect(props.aplStats.dash_animOptions).toEqual({duration: 1500, timing: 'linear'}); // optimized
      expect(ll.dash).toEqual(
        {len: null, gap: null, animation: {duration: 1500, timing: 'linear'}}); // optimized

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
      expect(props.curStats.dash_options).toEqual({len: null, gap: null, animation: false});
      expect(props.aplStats.dash_options).toEqual({len: null, gap: null, animation: false});
      expect(props.curStats.dash_animOptions == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.aplStats.dash_animOptions == null).toBe(true); // eslint-disable-line eqeqeq
      expect(ll.dash).toEqual({len: null, gap: null, animation: false}); // optimized

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
        'curStats.dash_len=' + len,
        'curStats.dash_gap=' + gap,
        'curStats.dash_maxOffset=' + (len + gap),
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.dash_animId == null).toBe(true); // eslint-disable-line eqeqeq

      // update() by events
      traceLog.clear();
      ll.size = 5;
      len = 10;
      gap = 5;
      expect(traceLog.log).toNotContainAny(['<EFFECTS.dash.init>', '<EFFECTS.dash.remove>']);
      expect(traceLog.getTaggedLog('updateFaces')).toContain('line_strokeWidth=5');
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        'curStats.dash_len=' + len,
        'curStats.dash_gap=' + gap,
        'curStats.dash_maxOffset=' + (len + gap),
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.dash_animId == null).toBe(true); // eslint-disable-line eqeqeq

      // update() by options
      len = 10; // same
      gap = 6;
      traceLog.clear();
      ll.dash = {len: len, gap: gap};
      expect(traceLog.log).toContainAll(['<EFFECTS.dash.remove>', '<EFFECTS.dash.init>']);
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        // curStats.dash_len are not updated (curStats* were not cleared by remove())
        'curStats.dash_gap=' + gap,
        'curStats.dash_maxOffset=' + (len + gap),
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.dash_animId == null).toBe(true); // eslint-disable-line eqeqeq

      // update() by options same dash_maxOffset
      len = 8;
      gap = 8;
      traceLog.clear();
      ll.dash = {len: len, gap: gap};
      expect(traceLog.log).toContainAll(['<EFFECTS.dash.remove>', '<EFFECTS.dash.init>']);
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        // curStats.dash_maxOffset are not updated (curStats* were not cleared by remove())
        'curStats.dash_len=' + len,
        'curStats.dash_gap=' + gap,
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.dash_animId == null).toBe(true); // eslint-disable-line eqeqeq

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
      expect(props.aplStats.dash_maxOffset == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.dash_animId == null).toBe(true); // eslint-disable-line eqeqeq

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
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.dash_animId == null).toBe(true); // eslint-disable-line eqeqeq

      // remove()
      traceLog.clear();
      ll.dash = false;
      expect(traceLog.log).toNotContainAny(['<EFFECTS.dash.init>', '<EFFECTS.dash.update>']);
      expect(traceLog.log).toContain('<EFFECTS.dash.remove>');
      expect(props.events.apl_line_strokeWidth.length).toBe(0); // removeEventHandler
      // curStats* are not cleared
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.dash_animId == null).toBe(true); // eslint-disable-line eqeqeq

      // anim - init()
      ll.size = 5;
      len = 10; // default: line_strokeWidth * 2
      gap = 5; // default: line_strokeWidth
      traceLog.clear();
      ll.dash = {animation: true};
      expect(traceLog.log).toContain('<EFFECTS.dash.init>');
      expect(props.events.apl_line_strokeWidth.length).toBe(1); // addEventHandler
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        'curStats.dash_len=' + len,
        'curStats.dash_gap=' + gap,
        'curStats.dash_maxOffset=' + (len + gap),
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap,
        'aplStats.dash_maxOffset=' + (len + gap),
        'anim.add'
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset).toBe(len + gap);
      expect(props.curStats.dash_animId != null).toBe(true); // eslint-disable-line eqeqeq

      // anim - update by AnimOptions (the effect is removed -> inited)
      traceLog.clear();
      ll.dash = {animation: {duration: 2000}};
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      // update remove -> add (already removed by EFFECTS.dash.remove when options was changed)
      expect(props.events.apl_line_strokeWidth.length).toBe(1); // addEventHandler
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap,
        'aplStats.dash_maxOffset=' + (len + gap),
        'anim.add' // anim.remove is not called
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset).toBe(len + gap);
      expect(props.curStats.dash_animId != null).toBe(true); // eslint-disable-line eqeqeq

      // anim - update by event
      traceLog.clear();
      ll.size = 6;
      len = 12;
      gap = 6;
      expect(traceLog.log).toNotContainAny(['<EFFECTS.dash.init>', '<EFFECTS.dash.remove>']);
      expect(traceLog.getTaggedLog('updateFaces')).toContain('line_strokeWidth=6');
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        'curStats.dash_len=' + len,
        'curStats.dash_gap=' + gap,
        'curStats.dash_maxOffset=' + (len + gap),
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap,
        'aplStats.dash_maxOffset=' + (len + gap),
        'anim.remove', 'anim.add'
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset).toBe(len + gap);
      expect(props.curStats.dash_animId != null).toBe(true); // eslint-disable-line eqeqeq

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
      expect(props.curStats.dash_animId != null).toBe(true); // eslint-disable-line eqeqeq

      // anim - remove
      traceLog.clear();
      ll.dash = {len: 12, gap: 6, animation: false};
      expect(traceLog.log).toContainAll([
        '<EFFECTS.dash.init>', '<EFFECTS.dash.remove>', '<EFFECTS.dash.update>'
      ]);
      expect(props.events.apl_line_strokeWidth.length).toBe(1); // addEventHandler, it's not changed
      expect(traceLog.getTaggedLog('EFFECTS.dash.update')).toEqual([
        'aplStats.dash_len=' + len,
        'aplStats.dash_gap=' + gap
      ]);
      expect(props.curStats.dash_len).toBe(len);
      expect(props.aplStats.dash_len).toBe(len);
      expect(props.curStats.dash_gap).toBe(gap);
      expect(props.aplStats.dash_gap).toBe(gap);
      expect(props.curStats.dash_maxOffset).toBe(len + gap);
      expect(props.aplStats.dash_maxOffset == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.dash_animId == null).toBe(true); // eslint-disable-line eqeqeq

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
        'curStats.gradient_colorSE[0]=' + color0,
        'curStats.gradient_colorSE[1]=' + color1,
        'aplStats.gradient_colorSE[0]=' + color0,
        'aplStats.gradient_pointSE[0].x', 'aplStats.gradient_pointSE[0].y',
        'aplStats.gradient_colorSE[1]=' + color1,
        'aplStats.gradient_pointSE[1].x', 'aplStats.gradient_pointSE[1].y'
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
      expect(traceLog.getTaggedLog('EFFECTS.gradient.update')).toEqual([
        'curStats.gradient_colorSE[0]=' + color0,
        'aplStats.gradient_colorSE[0]=' + color0
      ]);
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
      expect(traceLog.getTaggedLog('EFFECTS.gradient.update')).toEqual([
        'curStats.gradient_colorSE[1]=' + color1,
        'aplStats.gradient_colorSE[1]=' + color1
      ]);
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
      expect(traceLog.getTaggedLog('updatePath')).toContain('setPathData');
      expect(traceLog.getTaggedLog('EFFECTS.gradient.update')).toEqual([
        'aplStats.gradient_pointSE[1].x', 'aplStats.gradient_pointSE[1].y'
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
        'curStats.gradient_colorSE[1]=' + color1,
        'aplStats.gradient_colorSE[0]=' + color0,
        'aplStats.gradient_pointSE[0].x', 'aplStats.gradient_pointSE[0].y',
        'aplStats.gradient_colorSE[1]=' + color1,
        'aplStats.gradient_pointSE[1].x', 'aplStats.gradient_pointSE[1].y'
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
        'aplStats.gradient_colorSE[0]=' + color0,
        'aplStats.gradient_pointSE[0].x', 'aplStats.gradient_pointSE[0].y',
        'aplStats.gradient_colorSE[1]=' + color1,
        'aplStats.gradient_pointSE[1].x', 'aplStats.gradient_pointSE[1].y'
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
      expect(props.aplStats.gradient_colorSE[0] == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.gradient_colorSE[1]).toBe(color1);
      expect(props.aplStats.gradient_colorSE[1] == null).toBe(true); // eslint-disable-line eqeqeq
      expect(props.curStats.gradient_pointSE[0]).toEqual(point0);
      expect(props.aplStats.gradient_pointSE[0]).toEqual({});
      expect(props.curStats.gradient_pointSE[1]).toEqual(point1);
      expect(props.aplStats.gradient_pointSE[1]).toEqual({});

      pageDone();
    });

  });

});
