/* eslint-env jasmine */
/* global loadPage:false, customMatchers:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('attachment', function() {
  'use strict';

  var window, document, traceLog, pageDone, ll, titles = [];

  /* eslint-disable no-unused-vars, indent */
  // ================ context
  var
    CIRCLE_CP = 0.5522847;
  // ================ /context
  /* eslint-enable no-unused-vars, indent */

  var TOLERANCE = 1, // It's changed by environment.
    IS_WEBKIT;

  function registerTitle(title) {
    titles.push(title);
    return title;
  }

  function loadBefore(beforeDone) {
    jasmine.addMatchers(customMatchers);
    loadPage('spec/common/page.html', function(frmWindow, frmDocument, body, done) {
      TOLERANCE = frmWindow.IS_WEBKIT ? 10 : frmWindow.IS_GECKO || frmWindow.IS_TRIDENT ? 5 : 1;
      IS_WEBKIT = frmWindow.IS_WEBKIT;

      window = frmWindow;
      document = frmDocument;
      traceLog = window.traceLog;
      traceLog.enabled = true;
      pageDone = done;
      ll = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm3'));
      beforeDone();
    }, 'attachment - ' + titles.shift());
  }

  function matchPathData(a, b) {
    return a != null && b != null &&
      a.length === b.length && a.every(function(aSeg, i) {
        var bSeg = b[i];
        return aSeg.type === bSeg.type &&
          aSeg.values.every(function(aSegValue, i) { return Math.abs(aSegValue - bSeg.values[i]) < TOLERANCE; });
      });
  }

  function getRectByXYWH(x, y, width, height) {
    return {left: x, top: y, width: width, height: height, right: x + width, bottom: y + height};
  }

  function getRectByXYRB(x, y, right, bottom) {
    return {left: x, top: y, right: right, bottom: bottom, width: right - x, height: bottom - y};
  }

  describe('functions', function() {

    beforeEach(loadBefore);

    it(registerTitle('pointAnchor.removeOption'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps;

      // replace to attachProps.element
      atc = window.LeaderLine.pointAnchor({element: document.getElementById('elm1')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(props.attachments.length).toBe(1);
      expect(attachProps.boundTargets.length).toBe(1);
      atc.remove();
      expect(ll.start).toBe(document.getElementById('elm1'));
      expect(ll.end).toBe(document.getElementById('elm3'));
      expect(props.attachments.length).toBe(0);

      // replace to document.body
      atc = window.LeaderLine.pointAnchor({element: document.getElementById('elm3')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(props.attachments.length).toBe(1);
      expect(attachProps.boundTargets.length).toBe(1);
      atc.remove();
      expect(ll.start).toBe(document.body);
      expect(ll.end).toBe(document.getElementById('elm3'));
      expect(props.attachments.length).toBe(0);

      // replace to LeaderLineAttachment
      atc = window.LeaderLine.pointAnchor({element: document.body});
      attachProps = window.insAttachProps[atc._id];
      ll.setOptions({start: atc, end: document.body});
      expect(props.attachments.length).toBe(1);
      expect(attachProps.boundTargets.length).toBe(1);
      atc.remove();
      expect(ll.start).not.toBe(document.body);
      expect(ll.start instanceof window.LeaderLineAttachment).toBe(true);
      expect(ll.start.isRemoved).toBe(false);
      expect(window.insAttachProps[ll.start._id].element).toBe(document.body);
      expect(ll.end).toBe(document.body);
      expect(props.attachments.length).toBe(1);

      pageDone();
      done();
    });

    it(registerTitle('pointAnchor.parsePercent'), function(done) {
      var parsePercent = window.ATTACHMENTS.pointAnchor.parsePercent;
      // -, num, false
      expect(parsePercent(-5) == null).toBe(true);
      // -, num, true
      expect(parsePercent(-5, true)).toEqual([-5, false]);
      // -, per, false
      expect(parsePercent('-5%') == null).toBe(true);
      // -, per, true
      expect(parsePercent('-5%', true)).toEqual([-0.05, true]);
      // +, num, false
      expect(parsePercent(5)).toEqual([5, false]);
      // +, num, true
      expect(parsePercent(5, true)).toEqual([5, false]);
      // +, per, false
      expect(parsePercent('5%')).toEqual([0.05, true]);
      // +, per, true
      expect(parsePercent('5%', true)).toEqual([0.05, true]);
      // zero, num, false
      expect(parsePercent(0)).toEqual([0, false]);
      // zero, num, true
      expect(parsePercent(0, true)).toEqual([0, false]);
      // zero, per, false
      expect(parsePercent('0%')).toEqual([0, false]); // The meaningless `%` is ignored.
      // zero, per, true
      expect(parsePercent('0%', true)).toEqual([0, false]); // The meaningless `%` is ignored.

      pageDone();
      done();
    });

    it(registerTitle('parse options'), function(done) {
      var atc, attachProps,
        defaultOptions = {
          element: document.getElementById('elm1'),
          showEffectName: 'draw',
          style: {dummy: 9}
        };

      // mouseHoverAnchor(element, showEffectName, options)

      atc = window.LeaderLine.mouseHoverAnchor(defaultOptions);
      attachProps = window.insAttachProps[atc._id];
      expect(attachProps.element).toBe(document.getElementById('elm1'));
      expect(attachProps.showEffectName).toBe('draw');
      expect(attachProps.style.dummy).toBe(9);

      atc = window.LeaderLine.mouseHoverAnchor(document.getElementById('elm2'));
      attachProps = window.insAttachProps[atc._id];
      expect(attachProps.element).toBe(document.getElementById('elm2'));
      expect(attachProps.showEffectName == null).toBe(true);
      expect(attachProps.style.dummy == null).toBe(true);

      atc = window.LeaderLine.mouseHoverAnchor(document.getElementById('elm2'), defaultOptions);
      attachProps = window.insAttachProps[atc._id];
      expect(attachProps.element).toBe(document.getElementById('elm2'));
      expect(attachProps.showEffectName).toBe('draw');
      expect(attachProps.style.dummy).toBe(9);

      atc = window.LeaderLine.mouseHoverAnchor(document.getElementById('elm2'), 'none');
      attachProps = window.insAttachProps[atc._id];
      expect(attachProps.element).toBe(document.getElementById('elm2'));
      expect(attachProps.showEffectName).toBe('none');
      expect(attachProps.style.dummy == null).toBe(true);

      atc = window.LeaderLine.mouseHoverAnchor(document.getElementById('elm2'), 'none', defaultOptions);
      attachProps = window.insAttachProps[atc._id];
      expect(attachProps.element).toBe(document.getElementById('elm2'));
      expect(attachProps.showEffectName).toBe('none');
      expect(attachProps.style.dummy).toBe(9);

      // invalid value

      atc = window.LeaderLine.mouseHoverAnchor(document.getElementById('elm2'), true);
      attachProps = window.insAttachProps[atc._id];
      expect(attachProps.element).toBe(document.getElementById('elm2'));
      expect(attachProps.showEffectName == null).toBe(true);
      expect(attachProps.style.dummy == null).toBe(true);

      atc = window.LeaderLine.mouseHoverAnchor(document.getElementById('elm2'), true, defaultOptions);
      attachProps = window.insAttachProps[atc._id];
      expect(attachProps.element).toBe(document.getElementById('elm2'));
      expect(attachProps.showEffectName == null).toBe(true);
      // defaultOptions also is ignored
      expect(attachProps.style.dummy == null).toBe(true);

      pageDone();
      done();
    });
  });

  describe('life cycle', function() {

    beforeEach(loadBefore);

    it(registerTitle('bind-unbind-remove'), function(done) {
      var props1 = window.insProps[ll._id], log,
        atc1, atc2, attachProps1, attachProps2, ll2, props2;

      atc1 = window.LeaderLine.pointAnchor({element: document.getElementById('elm1')});
      atc2 = window.LeaderLine.pointAnchor({element: document.getElementById('elm2')});
      attachProps1 = window.insAttachProps[atc1._id];
      attachProps2 = window.insAttachProps[atc2._id];
      expect(atc1.isRemoved).toBe(false);
      expect(atc2.isRemoved).toBe(false);
      expect(window.insAttachProps[atc1._id] != null).toBe(true);
      expect(window.insAttachProps[atc2._id] != null).toBe(true);

      // bind
      expect(props1.attachments.length).toBe(0);
      expect(attachProps1.boundTargets.length).toBe(0);
      ll.start = atc1;
      expect(props1.attachments.length).toBe(1);
      expect(attachProps1.boundTargets.length).toBe(1);
      expect(atc1.isRemoved).toBe(false);
      expect(window.insAttachProps[atc1._id] != null).toBe(true);

      // unbind -> remove
      traceLog.clear();
      ll.start = document.getElementById('elm1');
      setTimeout(function() {
        expect(traceLog.getTaggedLog('removeAttachment')).toEqual([]);
        expect(props1.attachments.length).toBe(0);
        expect(atc1.isRemoved).toBe(true);
        expect(window.insAttachProps[atc1._id] != null).toBe(false);

        // 2 ll - 1 atc
        ll.start = atc2;
        ll2 = new window.LeaderLine(atc2, document.getElementById('elm4'));
        props2 = window.insProps[ll2._id];
        expect(props1.attachments.length).toBe(1);
        expect(props2.attachments.length).toBe(1);
        expect(attachProps2.boundTargets.length).toBe(2);
        expect(atc2.isRemoved).toBe(false);
        expect(window.insAttachProps[atc2._id] != null).toBe(true);

        // unbind 1
        traceLog.clear();
        ll.start = document.getElementById('elm1');
        setTimeout(function() {
          log = traceLog.getTaggedLog('removeAttachment');
          expect(log != null).toBe(false);
          expect(props1.attachments.length).toBe(0);
          expect(props2.attachments.length).toBe(1);
          expect(attachProps2.boundTargets.length).toBe(1);
          expect(atc2.isRemoved).toBe(false);
          expect(window.insAttachProps[atc2._id] != null).toBe(true);

          // unbind 2 -> remove
          traceLog.clear();
          ll2.start = document.getElementById('elm1');
          setTimeout(function() {
            expect(traceLog.getTaggedLog('removeAttachment')).toEqual([]);
            expect(props1.attachments.length).toBe(0);
            expect(props2.attachments.length).toBe(0);
            expect(atc2.isRemoved).toBe(true);
            expect(window.insAttachProps[atc2._id] != null).toBe(false);

            // remove atc -> unbind
            atc1 = window.LeaderLine.pointAnchor({element: document.getElementById('elm1')});
            attachProps1 = window.insAttachProps[atc1._id];
            ll.start = atc1;
            ll2.start = atc1;
            expect(props1.attachments.length).toBe(1);
            expect(props2.attachments.length).toBe(1);
            expect(attachProps1.boundTargets.length).toBe(2);
            expect(atc1.isRemoved).toBe(false);
            traceLog.clear();
            atc1.remove();
            setTimeout(function() {
              expect(traceLog.getTaggedLog('LeaderLineAttachment.remove.delayedProc')).toEqual([]);
              expect(traceLog.getTaggedLog('ATTACHMENTS.pointAnchor.removeOption'))
                .toEqual(['optionName=start', 'optionName=start']);
              expect(traceLog.getTaggedLog('removeAttachment')).toEqual(['not-found']); // 2nd ll try to remove
              expect(props1.attachments.length).toBe(0);
              expect(props2.attachments.length).toBe(0);
              expect(atc1.isRemoved).toBe(true);
              expect(ll.start).toBe(document.getElementById('elm1'));
              expect(ll2.start).toBe(document.getElementById('elm1'));
              expect(ll.end).toBe(document.getElementById('elm3')); // not changed
              expect(ll2.end).toBe(document.getElementById('elm4')); // not changed

              // remove ll -> unbind -> remove atc
              atc1 = window.LeaderLine.pointAnchor({element: document.getElementById('elm1')});
              atc2 = window.LeaderLine.pointAnchor({element: document.getElementById('elm2')});
              attachProps1 = window.insAttachProps[atc1._id];
              attachProps2 = window.insAttachProps[atc2._id];
              ll.setOptions({start: atc1, end: atc2});
              expect(props1.attachments.length).toBe(2);
              expect(attachProps1.boundTargets.length).toBe(1);
              expect(attachProps2.boundTargets.length).toBe(1);
              expect(atc1.isRemoved).toBe(false);
              expect(atc2.isRemoved).toBe(false);
              traceLog.clear();
              ll.remove();
              setTimeout(function() {
                expect(traceLog.getTaggedLog('removeAttachment')).toEqual([]);
                expect(atc1.isRemoved).toBe(true);
                expect(atc2.isRemoved).toBe(true);

                pageDone();
                done();
              }, 50);
            }, 50);
          }, 50);
        }, 50);
      }, 50);
    });

    it(registerTitle('flow'), function(done) {
      var props1 = window.insProps[ll._id],
        atc1, atc2, attachProps1, attachProps2, ll2, props2;

      traceLog.clear();
      atc1 = window.LeaderLine.areaAnchor({element: document.getElementById('elm1')});
      expect(traceLog.log).toEqual([
        '<ATTACHMENTS.areaAnchor.init>', '</ATTACHMENTS.areaAnchor.init>'
      ]);
      atc2 = window.LeaderLine.areaAnchor({element: document.getElementById('elm2')});
      attachProps1 = window.insAttachProps[atc1._id];
      attachProps2 = window.insAttachProps[atc2._id];

      // bind
      traceLog.clear();
      ll.start = atc1;
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        '<ATTACHMENTS.areaAnchor.bind>', '</ATTACHMENTS.areaAnchor.bind>',
        '<setOptions>', 'needs.position', '</setOptions>',
        '<updatePosition>',
          '<ATTACHMENTS.areaAnchor.getStrokeWidth>',
            '<ATTACHMENTS.areaAnchor.update>',
              'strokeWidth=4', 'elementWidth=100', 'elementHeight=30', 'elementLeft=1', 'elementTop=2',
              'generate-path', 'strokeWidth=4', 'pathData', 'x', 'y', 'width', 'height',
            '</ATTACHMENTS.areaAnchor.update>',
          '</ATTACHMENTS.areaAnchor.getStrokeWidth>',
          'position_socketXYSE[0]', 'new-position',
        '</updatePosition>',
        '<updatePath>', 'path_pathData', '</updatePath>',
        '<updateViewBox>', 'x', 'width', 'height', '</updateViewBox>',
        '<updateMask>',
          'maskBGRect_x', 'lineMask_x',
          'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=4',
        '</updateMask>',
        '<update>', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask', '</update>'
        /* eslint-enable indent */
      ]);
      expect(props1.events.cur_line_color.length).toBe(1); // addEventHandler
      expect(props1.events.svgShow.length).toBe(1); // addEventHandler

      // unbind -> remove
      traceLog.clear();
      ll.start = document.getElementById('elm1');
      setTimeout(function() {
        expect(traceLog.log).toEqual([
          /* eslint-disable indent */
          '<ATTACHMENTS.areaAnchor.unbind>', '</ATTACHMENTS.areaAnchor.unbind>',
          '<setOptions>', 'needs.position', '</setOptions>',
          '<updatePosition>', 'position_socketXYSE[0]', 'new-position', '</updatePosition>',
          '<updatePath>', 'path_pathData', '</updatePath>',
          '<updateViewBox>', 'x', 'width', 'height', '</updateViewBox>',
          '<updateMask>',
            'maskBGRect_x', 'lineMask_x',
            'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=0',
          '</updateMask>',
          '<update>', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask', '</update>',
          '<execDelayedProcs>',
            '<ATTACHMENTS.areaAnchor.updateColor>', 'color=coral', '</ATTACHMENTS.areaAnchor.updateColor>',
            '<svgShow>', '</svgShow>',
            '<removeAttachment>',
              '<ATTACHMENTS.areaAnchor.remove>', '</ATTACHMENTS.areaAnchor.remove>',
            '</removeAttachment>',
          '</execDelayedProcs>'
          /* eslint-enable indent */
        ]);
        expect(props1.attachments.length).toBe(0);
        expect(atc1.isRemoved).toBe(true);
        expect(props1.events.cur_line_color.length).toBe(0); // removeEventHandler
        expect(props1.events.svgShow.length).toBe(0); // removeEventHandler

        // 2 ll - 1 atc
        ll.start = atc2;
        ll2 = new window.LeaderLine(atc2, document.getElementById('elm4'));
        props2 = window.insProps[ll2._id];
        expect(props1.attachments.length).toBe(1);
        expect(props2.attachments.length).toBe(1);
        expect(attachProps2.boundTargets.length).toBe(2);
        expect(props1.events.cur_line_color.length).toBe(1); // addEventHandler
        expect(props1.events.svgShow.length).toBe(1); // addEventHandler
        expect(props2.events.cur_line_color.length).toBe(1); // addEventHandler
        expect(props2.events.svgShow.length).toBe(1); // addEventHandler

        // unbind 1
        traceLog.clear();
        ll.start = document.getElementById('elm1');
        setTimeout(function() {
          expect(traceLog.log).toEqual([
            /* eslint-disable indent */
            '<ATTACHMENTS.areaAnchor.unbind>', '</ATTACHMENTS.areaAnchor.unbind>',
            '<setOptions>', 'needs.position', '</setOptions>',
            '<updatePosition>', 'position_socketXYSE[0]', 'new-position', '</updatePosition>',
            '<updatePath>', 'path_pathData', '</updatePath>',
            '<updateViewBox>', 'x', 'y', 'width', 'height', '</updateViewBox>',
            '<updateMask>',
              'maskBGRect_x', 'maskBGRect_y', 'lineMask_x', 'lineMask_y',
              'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=0',
            '</updateMask>',
            '<update>', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask', '</update>',
            '<execDelayedProcs>',
              '<ATTACHMENTS.areaAnchor.updateColor>', '</ATTACHMENTS.areaAnchor.updateColor>',
              '<svgShow>', 'on=true', '</svgShow>',
              '<ATTACHMENTS.areaAnchor.updateColor>', '</ATTACHMENTS.areaAnchor.updateColor>',
              '<svgShow>', '</svgShow>',
              '<ATTACHMENTS.areaAnchor.unbind.delayedProc>',
                '<ATTACHMENTS.areaAnchor.updateColor>', '</ATTACHMENTS.areaAnchor.updateColor>',
                '<svgShow>', '</svgShow>',
                '<ATTACHMENTS.areaAnchor.update>', '</ATTACHMENTS.areaAnchor.update>',
              '</ATTACHMENTS.areaAnchor.unbind.delayedProc>',
            '</execDelayedProcs>'
            /* eslint-enable indent */
          ]);
          expect(props1.attachments.length).toBe(0);
          expect(props2.attachments.length).toBe(1);
          expect(attachProps2.boundTargets.length).toBe(1);
          expect(props1.events.cur_line_color.length).toBe(0); // removeEventHandler
          expect(props1.events.svgShow.length).toBe(0); // removeEventHandler
          expect(props2.events.cur_line_color.length).toBe(1);
          expect(props2.events.svgShow.length).toBe(1);

          // unbind 2 -> remove
          traceLog.clear();
          ll2.start = document.getElementById('elm1');
          setTimeout(function() {
            expect(traceLog.log).toEqual([
              /* eslint-disable indent */
              '<ATTACHMENTS.areaAnchor.unbind>', '</ATTACHMENTS.areaAnchor.unbind>',
              '<setOptions>', 'needs.position', '</setOptions>',
              '<updatePosition>', 'position_socketXYSE[0]', 'new-position', '</updatePosition>',
              '<updatePath>', 'path_pathData', '</updatePath>',
              '<updateViewBox>', 'x', 'y', 'width', 'height', '</updateViewBox>',
              '<updateMask>',
                'maskBGRect_x', 'maskBGRect_y', 'lineMask_x', 'lineMask_y',
                'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=0',
              '</updateMask>',
              '<update>', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask', '</update>',
              '<execDelayedProcs>',
                '<removeAttachment>',
                  '<ATTACHMENTS.areaAnchor.remove>', '</ATTACHMENTS.areaAnchor.remove>',
                '</removeAttachment>',
              '</execDelayedProcs>'
              /* eslint-enable indent */
            ]);
            expect(props1.attachments.length).toBe(0);
            expect(props2.attachments.length).toBe(0);
            expect(atc2.isRemoved).toBe(true);
            expect(props1.events.cur_line_color.length).toBe(0); // removeEventHandler
            expect(props1.events.svgShow.length).toBe(0); // removeEventHandler
            expect(props2.events.cur_line_color.length).toBe(0); // removeEventHandler
            expect(props2.events.svgShow.length).toBe(0); // removeEventHandler

            // remove atc -> unbind
            atc1 = window.LeaderLine.areaAnchor({element: document.getElementById('elm1')});
            attachProps1 = window.insAttachProps[atc1._id];
            ll.start = atc1;
            ll2.start = atc1;
            expect(props1.attachments.length).toBe(1);
            expect(props2.attachments.length).toBe(1);
            expect(attachProps1.boundTargets.length).toBe(2);
            expect(props1.events.cur_line_color.length).toBe(1);
            expect(props1.events.svgShow.length).toBe(1);
            expect(props2.events.cur_line_color.length).toBe(1);
            expect(props2.events.svgShow.length).toBe(1);
            traceLog.clear();
            atc1.remove();
            setTimeout(function() {
              expect(traceLog.log).toEqual([
                /* eslint-disable indent */
                '<LeaderLineAttachment.remove>',
                '<ATTACHMENTS.pointAnchor.removeOption>', 'optionName=start',
                  '<ATTACHMENTS.areaAnchor.unbind>', '</ATTACHMENTS.areaAnchor.unbind>',
                  '<setOptions>', 'needs.position', '</setOptions>',
                  '<updatePosition>', 'position_socketXYSE[0]', 'new-position', '</updatePosition>',
                  '<updatePath>', 'path_pathData', '</updatePath>',
                  '<updateViewBox>', 'x', 'width', 'height', '</updateViewBox>',
                  '<updateMask>',
                    'maskBGRect_x', 'lineMask_x',
                    'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=0',
                  '</updateMask>',
                  '<update>', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask', '</update>',
                '</ATTACHMENTS.pointAnchor.removeOption>',
                '<ATTACHMENTS.pointAnchor.removeOption>', 'optionName=start',
                  '<ATTACHMENTS.areaAnchor.unbind>', '</ATTACHMENTS.areaAnchor.unbind>',
                  '<setOptions>', 'needs.position', '</setOptions>',
                  '<updatePosition>', 'position_socketXYSE[0]', 'new-position', '</updatePosition>',
                  '<updatePath>', 'path_pathData', '</updatePath>',
                  '<updateViewBox>', 'x', 'width', 'height', '</updateViewBox>',
                  '<updateMask>',
                    'maskBGRect_x', 'lineMask_x',
                    'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=0',
                  '</updateMask>',
                  '<update>', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask', '</update>',
                '</ATTACHMENTS.pointAnchor.removeOption>',
                '</LeaderLineAttachment.remove>',
                '<execDelayedProcs>',
                  '<ATTACHMENTS.areaAnchor.updateColor>', 'color=coral', '</ATTACHMENTS.areaAnchor.updateColor>',
                  '<svgShow>', '</svgShow>',
                  '<ATTACHMENTS.areaAnchor.updateColor>', '</ATTACHMENTS.areaAnchor.updateColor>',
                  '<svgShow>', '</svgShow>',
                  '<ATTACHMENTS.areaAnchor.unbind.delayedProc>',
                    '<ATTACHMENTS.areaAnchor.updateColor>', '</ATTACHMENTS.areaAnchor.updateColor>',
                    '<svgShow>', '</svgShow>',
                    '<ATTACHMENTS.areaAnchor.update>', '</ATTACHMENTS.areaAnchor.update>',
                  '</ATTACHMENTS.areaAnchor.unbind.delayedProc>',
                  '<removeAttachment>',
                    '<ATTACHMENTS.areaAnchor.remove>', '</ATTACHMENTS.areaAnchor.remove>',
                  '</removeAttachment>',
                  '<removeAttachment>', 'not-found', '</removeAttachment>',
                  '<LeaderLineAttachment.remove.delayedProc>', '</LeaderLineAttachment.remove.delayedProc>',
                '</execDelayedProcs>'
                /* eslint-enable indent */
              ]);
              expect(props1.attachments.length).toBe(0);
              expect(props2.attachments.length).toBe(0);
              expect(atc1.isRemoved).toBe(true);
              expect(props1.events.cur_line_color.length).toBe(0);
              expect(props1.events.svgShow.length).toBe(0);
              expect(props2.events.cur_line_color.length).toBe(0);
              expect(props2.events.svgShow.length).toBe(0);

              // remove ll -> unbind -> remove atc
              atc1 = window.LeaderLine.areaAnchor({element: document.getElementById('elm1')});
              atc2 = window.LeaderLine.areaAnchor({element: document.getElementById('elm2')});
              attachProps1 = window.insAttachProps[atc1._id];
              attachProps2 = window.insAttachProps[atc2._id];
              ll.setOptions({start: atc1, end: atc2});
              expect(props1.attachments.length).toBe(2);
              expect(attachProps1.boundTargets.length).toBe(1);
              expect(attachProps2.boundTargets.length).toBe(1);
              expect(props1.events.cur_line_color.length).toBe(2);
              expect(props1.events.svgShow.length).toBe(2);
              traceLog.clear();
              ll.remove();
              setTimeout(function() {
                expect(traceLog.log).toEqual([
                  /* eslint-disable indent */
                  '<ATTACHMENTS.areaAnchor.unbind>', '</ATTACHMENTS.areaAnchor.unbind>',
                  '<ATTACHMENTS.areaAnchor.unbind>', '</ATTACHMENTS.areaAnchor.unbind>',
                  '<execDelayedProcs>',
                    '<ATTACHMENTS.areaAnchor.updateColor>', 'color=coral', '</ATTACHMENTS.areaAnchor.updateColor>',
                    '<svgShow>', '</svgShow>',
                    '<ATTACHMENTS.areaAnchor.updateColor>', 'color=coral', '</ATTACHMENTS.areaAnchor.updateColor>',
                    '<svgShow>', '</svgShow>',
                    '<removeAttachment>',
                      '<ATTACHMENTS.areaAnchor.remove>', '</ATTACHMENTS.areaAnchor.remove>',
                    '</removeAttachment>',
                    '<removeAttachment>',
                      '<ATTACHMENTS.areaAnchor.remove>', '</ATTACHMENTS.areaAnchor.remove>',
                    '</removeAttachment>',
                  '</execDelayedProcs>'
                  /* eslint-enable indent */
                ]);
                expect(atc1.isRemoved).toBe(true);
                expect(atc2.isRemoved).toBe(true);
                expect(props1.events.cur_line_color.length).toBe(0);
                expect(props1.events.svgShow.length).toBe(0);

                pageDone();
                done();
              }, 50);
            }, 50);
          }, 50);
        }, 50);
      }, 50);
    });

  });

  describe('ATTACHMENTS anchor', function() {

    beforeEach(loadBefore);

    it(registerTitle('pointAnchor'), function(done) {
      var props = window.insProps[ll._id],
        atc;

      // values
      atc = window.LeaderLine.pointAnchor({element: document.getElementById('elm1'), x: 5, y: 6});
      ll.start = atc;
      // elm1 (1, 2) w:100 h:30
      expect(props.curStats.position_socketXYSE[0].x).toBe(6);
      expect(props.curStats.position_socketXYSE[0].y).toBe(8);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [6, 8]},
        {type: 'L', values: [6, 8]},
        {type: 'L', values: [6, 8]},
        {type: 'L', values: [6, 8]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      document.getElementById('iframe1').style.borderWidth = '0';
      // iframe1 left: 500px; top: 50px; > elm2 left: 104px; top: 108px;
      atc = window.LeaderLine.pointAnchor({
        element: document.getElementById('iframe1').contentDocument.getElementById('elm2'), x: 5, y: 6});
      ll.start = atc;
      expect(props.curStats.position_socketXYSE[0].x).toBe(609);
      expect(props.curStats.position_socketXYSE[0].y).toBe(164);

      // Percent
      atc = window.LeaderLine.pointAnchor({element: document.getElementById('elm1'), x: '10%', y: '80%'});
      ll.start = atc;
      // elm1 (1, 2) w:100 h:30
      expect(props.curStats.position_socketXYSE[0].x).toBe(11);
      expect(props.curStats.position_socketXYSE[0].y).toBe(26);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [11, 26]},
        {type: 'L', values: [11, 26]},
        {type: 'L', values: [11, 26]},
        {type: 'L', values: [11, 26]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      // default x, y (50%)
      atc = window.LeaderLine.pointAnchor({element: document.getElementById('elm1')});
      ll.start = atc;
      // elm1 (1, 2) w:100 h:30
      expect(props.curStats.position_socketXYSE[0].x).toBe(51);
      expect(props.curStats.position_socketXYSE[0].y).toBe(17);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [51, 17]},
        {type: 'L', values: [51, 17]},
        {type: 'L', values: [51, 17]},
        {type: 'L', values: [51, 17]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      // outside of element
      atc = window.LeaderLine.pointAnchor({element: document.getElementById('elm1'), x: -1, y: -2});
      ll.start = atc;
      // elm1 (1, 2) w:100 h:30
      expect(props.curStats.position_socketXYSE[0].x).toBe(0);
      expect(props.curStats.position_socketXYSE[0].y).toBe(0);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [0, 0]},
        {type: 'L', values: [0, 0]},
        {type: 'L', values: [0, 0]},
        {type: 'L', values: [0, 0]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      // outside of element Percent
      atc = window.LeaderLine.pointAnchor({element: document.getElementById('elm1'), x: '150%', y: '180%'});
      ll.start = atc;
      // elm1 (1, 2) w:100 h:30
      expect(props.curStats.position_socketXYSE[0].x).toBe(151);
      expect(props.curStats.position_socketXYSE[0].y).toBe(56);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [151, 56]},
        {type: 'L', values: [151, 56]},
        {type: 'L', values: [151, 56]},
        {type: 'L', values: [151, 56]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      pageDone();
      done();
    });

    it(registerTitle('areaAnchor-attachOptions'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps, len, gap;

      // rect
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'),
        x: 5, y: 6, width: 7, height: 8, size: 0});
      ll.start = atc;
      // elm1 (1, 2) w:100 h:30
      expect(props.curStats.position_socketXYSE[0].x).toBe(9.5);
      expect(props.curStats.position_socketXYSE[0].y).toBe(16);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [6, 8]},
        {type: 'L', values: [13, 8]},
        {type: 'L', values: [13, 16]},
        {type: 'L', values: [6, 16]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      document.getElementById('iframe1').style.borderWidth = '0';
      // iframe1 left: 500px; top: 50px; > elm2 left: 104px; top: 108px;
      atc = window.LeaderLine.areaAnchor({
        element: document.getElementById('iframe1').contentDocument.getElementById('elm2'),
        x: 5, y: 6, width: 7, height: 8, size: 0});
      ll.start = atc;
      expect(props.curStats.position_socketXYSE[0].x).toBe(609);
      expect(props.curStats.position_socketXYSE[0].y).toBe(168);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [609, 164]},
        {type: 'L', values: [616, 164]},
        {type: 'L', values: [616, 172]},
        {type: 'L', values: [609, 172]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      // Percent
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'),
        x: '10%', y: '80%', width: '20%', height: '50%', size: 0});
      ll.start = atc;
      // elm1 (1, 2) w:100 h:30
      expect(props.curStats.position_socketXYSE[0].x).toBe(31);
      expect(props.curStats.position_socketXYSE[0].y).toBe(33.5);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [11, 26]},
        {type: 'L', values: [31, 26]},
        {type: 'L', values: [31, 41]},
        {type: 'L', values: [11, 41]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      // default x, y (-5%), width, height (110%)
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'), size: 0});
      ll.start = atc;
      // elm1 (1, 2) w:100 h:30
      expect(Math.abs(props.curStats.position_socketXYSE[0].x - 106)).toBeLessThan(TOLERANCE);
      expect(props.curStats.position_socketXYSE[0].y).toBe(17);
      expect(matchPathData(props.curStats.capsMaskAnchor_pathDataSE[0], [
        {type: 'M', values: [-4, 0.5]}, // x: 1 - 5, y: 2 - 1.5, width: 110, height: 33
        {type: 'L', values: [106, 0.5]},
        {type: 'L', values: [106, 33.5]},
        {type: 'L', values: [-4, 33.5]},
        {type: 'Z', values: []}
      ])).toBe(true);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      // dash number
      len = 5;
      gap = 11;
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'),
        dash: {len: len, gap: gap}});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.aplStats.dashLen).toBe(len);
      expect(attachProps.aplStats.dashGap).toBe(gap);
      expect(attachProps.path.style.strokeDasharray.replace(/\s|px/g, '')).toBe(len + ',' + gap);

      // dash invalid number
      expect(attachProps.curStats.strokeWidth * 2).toBe(8); // auto
      len = 8;
      gap = 11;
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'),
        dash: {len: 0, gap: gap}});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.aplStats.dashLen).toBe(len);
      expect(attachProps.aplStats.dashGap).toBe(gap);
      expect(attachProps.path.style.strokeDasharray.replace(/\s|px/g, '')).toBe(len + ',' + gap);

      // dash auto
      expect(attachProps.curStats.strokeWidth * 2).toBe(8); // auto
      expect(attachProps.curStats.strokeWidth).toBe(4); // auto
      len = 8;
      gap = 4;
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'),
        dash: true});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.aplStats.dashLen).toBe(len);
      expect(attachProps.aplStats.dashGap).toBe(gap);
      expect(attachProps.path.style.strokeDasharray.replace(/\s|px/g, '')).toBe(len + ',' + gap);

      pageDone();
      done();
    });

    it(registerTitle('areaAnchor-event auto color'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps;

      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      setTimeout(function() { // `bind` calls setTimeout
        expect(attachProps.curStats.color).toBe('coral');
        expect(props.events.cur_line_color.length).toBe(1); // addEventHandler

        traceLog.clear();
        ll.color = 'red';
        expect(traceLog.log).toEqual([
          /* eslint-disable indent */
          '<setOptions>', 'needs.line', '</setOptions>',
          '<updateLine>', 'line_color=red',
            '<ATTACHMENTS.areaAnchor.updateColor>', 'color=red', '</ATTACHMENTS.areaAnchor.updateColor>',
          '</updateLine>',
          '<updatePlug>', 'plug_colorSE[0]=red', 'plug_colorSE[1]=red', '</updatePlug>',
          '<updateLineOutline>', 'not-updated', '</updateLineOutline>',
          '<updatePlugOutline>', 'not-updated', '</updatePlugOutline>',
          '<updateFaces>', 'line_color=red', 'plug_colorSE[1]=red', '</updateFaces>',
          '<updatePosition>',
            '<ATTACHMENTS.areaAnchor.getStrokeWidth>',
              '<ATTACHMENTS.areaAnchor.update>', '</ATTACHMENTS.areaAnchor.update>',
            '</ATTACHMENTS.areaAnchor.getStrokeWidth>',
            'not-updated',
          '</updatePosition>',
          '<updateViewBox>', 'not-updated', '</updateViewBox>',
          '<updateMask>', 'not-updated', '</updateMask>',
          '<update>', 'updated.line', 'updated.plug', 'updated.faces', '</update>'
          /* eslint-enable indent */
        ]);
        expect(attachProps.curStats.color).toBe('red');

        ll.start = document.getElementById('elm1');
        expect(props.events.cur_line_color.length).toBe(0); // removeEventHandler

        pageDone();
        done();
      }, 10);
    });

    it(registerTitle('areaAnchor-event static color'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps;

      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'), color: 'blue'});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      setTimeout(function() { // `bind` calls setTimeout
        expect(attachProps.curStats.color).toBe('blue');
        expect(props.events.cur_line_color == null).toBe(true);

        traceLog.clear();
        ll.color = 'red';
        expect(traceLog.log).toEqual([
          /* eslint-disable indent */
          '<setOptions>', 'needs.line', '</setOptions>',
          '<updateLine>', 'line_color=red',
          // ATTACHMENTS.areaAnchor.updateColor is not called
          '</updateLine>',
          '<updatePlug>', 'plug_colorSE[0]=red', 'plug_colorSE[1]=red', '</updatePlug>',
          '<updateLineOutline>', 'not-updated', '</updateLineOutline>',
          '<updatePlugOutline>', 'not-updated', '</updatePlugOutline>',
          '<updateFaces>', 'line_color=red', 'plug_colorSE[1]=red', '</updateFaces>',
          '<updatePosition>',
            '<ATTACHMENTS.areaAnchor.getStrokeWidth>',
              '<ATTACHMENTS.areaAnchor.update>', '</ATTACHMENTS.areaAnchor.update>',
            '</ATTACHMENTS.areaAnchor.getStrokeWidth>',
            'not-updated',
          '</updatePosition>',
          '<updateViewBox>', 'not-updated', '</updateViewBox>',
          '<updateMask>', 'not-updated', '</updateMask>',
          '<update>', 'updated.line', 'updated.plug', 'updated.faces', '</update>'
          /* eslint-enable indent */
        ]);
        expect(attachProps.curStats.color).toBe('blue');

        ll.start = document.getElementById('elm1');
        expect(props.events.cur_line_color == null).toBe(true);

        pageDone();
        done();
      }, 10);
    });

    it(registerTitle('areaAnchor-event auto 1 ll'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps;

      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'),
        x: 5, y: 5, width: 10, height: 10}); // (6, 7)-(16, 17)
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      setTimeout(function() { // `bind` calls setTimeout
        expect(attachProps.curStats.color).toBe('coral');
        expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(4); // strokeWidth
        expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
          {type: 'M', values: [4, 5]},
          {type: 'L', values: [18, 5]},
          {type: 'L', values: [18, 19]},
          {type: 'L', values: [4, 19]},
          {type: 'Z', values: []}
        ]);

        ll.color = 'red';
        ll.size = 8;
        expect(attachProps.curStats.color).toBe('red');
        expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(8); // strokeWidth
        expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
          {type: 'M', values: [2, 3]},
          {type: 'L', values: [20, 3]},
          {type: 'L', values: [20, 21]},
          {type: 'L', values: [2, 21]},
          {type: 'Z', values: []}
        ]);

        pageDone();
        done();
      }, 10);
    });

    it(registerTitle('areaAnchor-event auto 2 ll'), function(done) {
      var props = window.insProps[ll._id],
        ll2, props2, atc, attachProps;

      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1')});
      attachProps = window.insAttachProps[atc._id];
      ll2 = new window.LeaderLine(atc, document.getElementById('elm2'), {color: 'red', size: 8}); // #1
      props2 = window.insProps[ll2._id];
      ll.start = atc; // #2
      setTimeout(function() { // `bind` calls setTimeout
        expect(props.curStats.line_color).toBe('coral'); // check
        expect(props.curStats.line_strokeWidth).toBe(4);
        expect(props2.curStats.line_color).toBe('red');
        expect(props2.curStats.line_strokeWidth).toBe(8);

        expect(attachProps.curStats.color).toBe('red');
        expect(attachProps.curStats.strokeWidth).toBe(8);

        ll.color = 'green';
        ll.size = 10;
        expect(props.curStats.line_color).toBe('green'); // check
        expect(props.curStats.line_strokeWidth).toBe(10);
        // not affected
        expect(attachProps.curStats.color).toBe('red');
        expect(attachProps.curStats.strokeWidth).toBe(8);

        ll2.color = 'yellow';
        ll2.size = 11;
        expect(props2.curStats.line_color).toBe('yellow'); // check
        expect(props2.curStats.line_strokeWidth).toBe(11);
        // affected
        expect(attachProps.curStats.color).toBe('yellow');
        expect(attachProps.curStats.strokeWidth).toBe(11);

        ll2.start = document.getElementById('elm1');
        setTimeout(function() { // `bind` calls setTimeout
          // affected by ll
          expect(attachProps.curStats.color).toBe('green');
          expect(attachProps.curStats.strokeWidth).toBe(10);

          pageDone();
          done();
        }, 10);
      }, 10);
    });

    it(registerTitle('areaAnchor-event svgShow 1 ll'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps;

      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1')});
      attachProps = window.insAttachProps[atc._id];
      ll.hide('none');
      setTimeout(function() {
        expect(props.isShown).toBe(false); // check

        ll.start = atc;
        setTimeout(function() { // `bind` calls setTimeout
          expect(attachProps.isShown).toBe(false);
          expect(attachProps.svg.style.visibility).toBe('hidden');

          ll.show();
          setTimeout(function() {
            expect(props.isShown).toBe(true); // check

            expect(attachProps.isShown).toBe(true);
            expect(attachProps.svg.style.visibility).toBe('');

            pageDone();
            done();
          }, 100);
        }, 10);
      }, 100);
    });

    it(registerTitle('areaAnchor-event svgShow 2 ll'), function(done) {
      var props = window.insProps[ll._id],
        ll2, props2, atc, attachProps;

      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1')});
      attachProps = window.insAttachProps[atc._id];
      ll2 = new window.LeaderLine(atc, document.getElementById('elm2'), {hide: true});
      props2 = window.insProps[ll2._id];
      ll.start = atc;
      setTimeout(function() { // `bind` calls setTimeout
        expect(props.isShown).toBe(true); // check
        expect(props2.isShown).toBe(false);

        expect(attachProps.isShown).toBe(true);
        expect(attachProps.svg.style.visibility).toBe('');

        ll.hide('none');
        setTimeout(function() {
          expect(props.isShown).toBe(false); // check
          expect(props2.isShown).toBe(false);

          expect(attachProps.isShown).toBe(false);
          expect(attachProps.svg.style.visibility).toBe('hidden');

          ll2.show('none');
          setTimeout(function() {
            expect(props.isShown).toBe(false); // check
            expect(props2.isShown).toBe(true);

            expect(attachProps.isShown).toBe(true);
            expect(attachProps.svg.style.visibility).toBe('');

            ll2.start = document.getElementById('elm1');
            setTimeout(function() { // `bind` calls setTimeout
              expect(attachProps.boundTargets.length).toBe(1);
              expect(attachProps.isShown).toBe(false);
              expect(attachProps.svg.style.visibility).toBe('hidden');
              pageDone();
              done();
            }, 10);
          }, 100);
        }, 100);
      }, 10);
    });

    it(registerTitle('areaAnchor-event auto dash'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps, len, gap;

      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'),
        dash: true});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;

      expect(props.curStats.line_strokeWidth).toBe(4); // auto
      len = 8;
      gap = 4;
      expect(attachProps.aplStats.dashLen).toBe(len);
      expect(attachProps.aplStats.dashGap).toBe(gap);
      expect(attachProps.path.style.strokeDasharray.replace(/\s|px/g, '')).toBe(len + ',' + gap);

      ll.size = 5;
      len = 10;
      gap = 5;
      expect(attachProps.aplStats.dashLen).toBe(len);
      expect(attachProps.aplStats.dashGap).toBe(gap);
      expect(attachProps.path.style.strokeDasharray.replace(/\s|px/g, '')).toBe(len + ',' + gap);

      pageDone();
      done();
    });

    it(registerTitle('areaAnchor-event sync'), function(done) {
      var props = window.insProps[ll._id],
        ll2, props2, atc, rect;

      rect = document.getElementById('elm3').getBoundingClientRect();

      atc = window.LeaderLine.areaAnchor(
        {element: document.getElementById('elm3'), x: 0, y: 0, width: '100%', height: '100%'});
      ll2 = new window.LeaderLine(document.getElementById('elm4'), atc, {endSocket: 'bottom'});
      props2 = window.insProps[ll2._id];
      ll.end = atc;
      setTimeout(function() {
        expect(props.curStats.line_strokeWidth).toBe(4); // auto

        expect(props.curStats.position_socketXYSE[1].x).toBe(rect.left - 4);
        expect(props.curStats.position_socketXYSE[1].y).toBe(rect.top + rect.height / 2);
        expect(props2.curStats.position_socketXYSE[1].x).toBe(rect.left + rect.width / 2);
        expect(props2.curStats.position_socketXYSE[1].y).toBe(rect.bottom + 4);

        ll2.size = 7; // Sockets are updated by updating lineWidth of anchor. (Change line-size)
        setTimeout(function() {
          expect(props.curStats.position_socketXYSE[1].x).toBe(rect.left - 7);
          expect(props.curStats.position_socketXYSE[1].y).toBe(rect.top + rect.height / 2);
          expect(props2.curStats.position_socketXYSE[1].x).toBe(rect.left + rect.width / 2);
          expect(props2.curStats.position_socketXYSE[1].y).toBe(rect.bottom + 7);

          ll2.end = document.getElementById('elm3'); // Unbind
          setTimeout(function() {
            expect(props.curStats.position_socketXYSE[1].x).toBe(rect.left - 4);
            expect(props.curStats.position_socketXYSE[1].y).toBe(rect.top + rect.height / 2);
            expect(props2.curStats.position_socketXYSE[1].x).toBe(rect.left + rect.width / 2);
            expect(props2.curStats.position_socketXYSE[1].y).toBe(rect.bottom); // no attachment

            pageDone();
            done();
          }, 10);
        }, 10);
      }, 10);
    });

    it(registerTitle('areaAnchor-rect'), function(done) {
      var props = window.insProps[ll._id], atc,
        elmX = 1, elmY = 2, elmWidth = 100, elmHeight = 30, // elm1
        rect, r, offset, padding;

      // size: 0, radius: 0
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'),
        x: 5, y: 6, width: 7, height: 8, size: 0});
      ll.start = atc;
      rect = getRectByXYWH(elmX + 5, elmY + 6, 7, 8);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [rect.left, rect.top]},
        {type: 'L', values: [rect.right, rect.top]},
        {type: 'L', values: [rect.right, rect.bottom]},
        {type: 'L', values: [rect.left, rect.bottom]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);
      expect(props.curStats.position_socketXYSE[0].x).toBe(rect.left + rect.width / 2); // bottom
      expect(props.curStats.position_socketXYSE[0].y).toBe(rect.bottom);

      // size: 2, radius: 0
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'),
        x: 5, y: 6, width: 7, height: 8, size: 2});
      ll.start = atc;
      rect = getRectByXYWH(elmX + 5, elmY + 6, 7, 8);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [rect.left - 1, rect.top - 1]},
        {type: 'L', values: [rect.right + 1, rect.top - 1]},
        {type: 'L', values: [rect.right + 1, rect.bottom + 1]},
        {type: 'L', values: [rect.left - 1, rect.bottom + 1]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(2);
      expect(props.curStats.position_socketXYSE[0].x).toBe(rect.left + rect.width / 2); // bottom
      expect(props.curStats.position_socketXYSE[0].y).toBe(rect.bottom + 2);

      // Percent size: 5, radius: 0
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'),
        x: '10%', y: '80%', width: '20%', height: '50%', size: 5});
      ll.start = atc;
      rect = getRectByXYWH(elmX + elmWidth * 0.1, elmY + elmHeight * 0.8, elmWidth * 0.2, elmHeight * 0.5);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [rect.left - 2.5, rect.top - 2.5]},
        {type: 'L', values: [rect.right + 2.5, rect.top - 2.5]},
        {type: 'L', values: [rect.right + 2.5, rect.bottom + 2.5]},
        {type: 'L', values: [rect.left - 2.5, rect.bottom + 2.5]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(5);
      expect(props.curStats.position_socketXYSE[0].x).toBe(rect.right + 5); // right
      expect(props.curStats.position_socketXYSE[0].y).toBe(rect.top + rect.height / 2);

      // size: 0, radius: 4
      r = 4;
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'),
        x: 0, y: 0, width: '100%', height: '100%', size: 0, radius: r});
      ll.start = atc;
      offset = r / Math.SQRT2;
      padding = r - offset;
      rect = getRectByXYWH(elmX, elmY, elmWidth, elmHeight);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [rect.left - padding, rect.top + offset]},
        {type: 'C', values: [
          rect.left - padding, (rect.top + offset) - r * CIRCLE_CP,
          (rect.left + offset) - r * CIRCLE_CP, rect.top - padding,
          rect.left + offset, rect.top - padding]},
        {type: 'L', values: [rect.right - offset, rect.top - padding]},
        {type: 'C', values: [
          rect.right - offset + r * CIRCLE_CP, rect.top - padding,
          rect.right + padding, (rect.top + offset) - r * CIRCLE_CP,
          rect.right + padding, rect.top + offset]},
        {type: 'L', values: [rect.right + padding, rect.bottom - offset]},
        {type: 'C', values: [
          rect.right + padding, (rect.bottom - offset) + r * CIRCLE_CP,
          (rect.right - offset) + r * CIRCLE_CP, rect.bottom + padding,
          rect.right - offset, rect.bottom + padding]},
        {type: 'L', values: [rect.left + offset, rect.bottom + padding]},
        {type: 'C', values: [
          (rect.left + offset) - r * CIRCLE_CP, rect.bottom + padding,
          rect.left - padding, (rect.bottom - offset) + r * CIRCLE_CP,
          rect.left - padding, rect.bottom - offset]},
        {type: 'L', values: [rect.left - padding, rect.top + offset]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);
      expect(props.curStats.position_socketXYSE[0].x).toBe(rect.right + padding); // right
      expect(props.curStats.position_socketXYSE[0].y).toBe(rect.top + rect.height / 2);

      // size: 4, radius: 5
      r = 5;
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'),
        x: 0, y: 0, width: '100%', height: '100%', size: 4, radius: r});
      ll.start = atc;
      offset = (r - 2) / Math.SQRT2;
      padding = r - offset;
      rect = getRectByXYWH(elmX, elmY, elmWidth, elmHeight);
      expect(matchPathData(props.curStats.capsMaskAnchor_pathDataSE[0], [
        {type: 'M', values: [rect.left - padding, rect.top + offset]},
        {type: 'C', values: [
          rect.left - padding, (rect.top + offset) - r * CIRCLE_CP,
          (rect.left + offset) - r * CIRCLE_CP, rect.top - padding,
          rect.left + offset, rect.top - padding]},
        {type: 'L', values: [rect.right - offset, rect.top - padding]},
        {type: 'C', values: [
          (rect.right - offset) + r * CIRCLE_CP, rect.top - padding,
          rect.right + padding, (rect.top + offset) - r * CIRCLE_CP,
          rect.right + padding, rect.top + offset]},
        {type: 'L', values: [rect.right + padding, rect.bottom - offset]},
        {type: 'C', values: [
          rect.right + padding, (rect.bottom - offset) + r * CIRCLE_CP,
          (rect.right - offset) + r * CIRCLE_CP, rect.bottom + padding,
          rect.right - offset, rect.bottom + padding]},
        {type: 'L', values: [rect.left + offset, rect.bottom + padding]},
        {type: 'C', values: [
          (rect.left + offset) - r * CIRCLE_CP, rect.bottom + padding,
          rect.left - padding, (rect.bottom - offset) + r * CIRCLE_CP,
          rect.left - padding, rect.bottom - offset]},
        {type: 'L', values: [rect.left - padding, rect.top + offset]},
        {type: 'Z', values: []}
      ])).toBe(true);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(4);
      expect(props.curStats.position_socketXYSE[0].x).toBe(rect.right + padding + 2); // right
      expect(Math.abs(props.curStats.position_socketXYSE[0].y - (rect.top + rect.height / 2)))
        .toBeLessThan(TOLERANCE);

      pageDone();
      done();
    });

    it(registerTitle('areaAnchor-circle'), function(done) {
      var props = window.insProps[ll._id], atc,
        elmX = 1, elmY = 2, // elm1
        rect, r, offset, padding,
        rx, ry, offsetX, offsetY, paddingX, paddingY;

      // size: 0, width: 10, height: 10
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'), shape: 'circle',
        x: 5, y: 6, width: 10, height: 10, size: 0});
      ll.start = atc;
      r = 5 * Math.SQRT2;
      offset = 5;
      padding = r - offset;
      rect = getRectByXYWH(elmX + 5, elmY + 6, 10, 10);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [rect.left - padding, rect.top + offset]},
        {type: 'C', values: [
          rect.left - padding, (rect.top + offset) - r * CIRCLE_CP,
          (rect.left + offset) - r * CIRCLE_CP, rect.top - padding,
          rect.left + offset, rect.top - padding]},
        {type: 'C', values: [
          rect.right - offset + r * CIRCLE_CP, rect.top - padding,
          rect.right + padding, (rect.top + offset) - r * CIRCLE_CP,
          rect.right + padding, rect.top + offset]},
        {type: 'C', values: [
          rect.right + padding, (rect.bottom - offset) + r * CIRCLE_CP,
          (rect.right - offset) + r * CIRCLE_CP, rect.bottom + padding,
          rect.right - offset, rect.bottom + padding]},
        {type: 'C', values: [
          (rect.left + offset) - r * CIRCLE_CP, rect.bottom + padding,
          rect.left - padding, (rect.bottom - offset) + r * CIRCLE_CP,
          rect.left - padding, rect.bottom - offset]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);
      expect(props.curStats.position_socketXYSE[0].x).toBe(rect.left + rect.width / 2); // bottom
      expect(props.curStats.position_socketXYSE[0].y).toBe(rect.bottom + padding);

      // size: 0, width: 20, height: 10
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'), shape: 'circle',
        x: 5, y: 6, width: 20, height: 10, size: 0});
      ll.start = atc;
      rx = 10 * Math.SQRT2;
      ry = 5 * Math.SQRT2;
      offsetX = 10;
      offsetY = 5;
      paddingX = rx - offsetX;
      paddingY = ry - offsetY;
      rect = getRectByXYWH(elmX + 5, elmY + 6, 20, 10);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [rect.left - paddingX, rect.top + offsetY]},
        {type: 'C', values: [
          rect.left - paddingX, (rect.top + offsetY) - ry * CIRCLE_CP,
          (rect.left + offsetX) - rx * CIRCLE_CP, rect.top - paddingY,
          rect.left + offsetX, rect.top - paddingY]},
        {type: 'C', values: [
          rect.right - offsetX + rx * CIRCLE_CP, rect.top - paddingY,
          rect.right + paddingX, (rect.top + offsetY) - ry * CIRCLE_CP,
          rect.right + paddingX, rect.top + offsetY]},
        {type: 'C', values: [
          rect.right + paddingX, (rect.bottom - offsetY) + ry * CIRCLE_CP,
          (rect.right - offsetX) + rx * CIRCLE_CP, rect.bottom + paddingY,
          rect.right - offsetX, rect.bottom + paddingY]},
        {type: 'C', values: [
          (rect.left + offsetX) - rx * CIRCLE_CP, rect.bottom + paddingY,
          rect.left - paddingX, (rect.bottom - offsetY) + ry * CIRCLE_CP,
          rect.left - paddingX, rect.bottom - offsetY]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);
      expect(props.curStats.position_socketXYSE[0].x).toBe(rect.right + paddingX); // right
      expect(props.curStats.position_socketXYSE[0].y).toBe(rect.top + rect.height / 2);

      // size: 0, width: 0, height: 0 -> 10
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'), shape: 'circle',
        x: 5, y: 6, width: 10, height: 10, size: 0});
      ll.start = atc;
      r = 5 * Math.SQRT2;
      offset = 5;
      padding = r - offset;
      rect = getRectByXYWH(elmX + 5, elmY + 6, 10, 10);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [rect.left - padding, rect.top + offset]},
        {type: 'C', values: [
          rect.left - padding, (rect.top + offset) - r * CIRCLE_CP,
          (rect.left + offset) - r * CIRCLE_CP, rect.top - padding,
          rect.left + offset, rect.top - padding]},
        {type: 'C', values: [
          rect.right - offset + r * CIRCLE_CP, rect.top - padding,
          rect.right + padding, (rect.top + offset) - r * CIRCLE_CP,
          rect.right + padding, rect.top + offset]},
        {type: 'C', values: [
          rect.right + padding, (rect.bottom - offset) + r * CIRCLE_CP,
          (rect.right - offset) + r * CIRCLE_CP, rect.bottom + padding,
          rect.right - offset, rect.bottom + padding]},
        {type: 'C', values: [
          (rect.left + offset) - r * CIRCLE_CP, rect.bottom + padding,
          rect.left - padding, (rect.bottom - offset) + r * CIRCLE_CP,
          rect.left - padding, rect.bottom - offset]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);
      expect(props.curStats.position_socketXYSE[0].x).toBe(rect.left + rect.width / 2); // bottom
      expect(props.curStats.position_socketXYSE[0].y).toBe(rect.bottom + padding);

      // size: 4, width: 10, height: 10
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'), shape: 'circle',
        x: 5, y: 6, width: 10, height: 10, size: 4});
      ll.start = atc;
      r = 5 * Math.SQRT2 + 2;
      offset = 5;
      padding = r - offset;
      rect = getRectByXYWH(elmX + 5, elmY + 6, 10, 10);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [rect.left - padding, rect.top + offset]},
        {type: 'C', values: [
          rect.left - padding, (rect.top + offset) - r * CIRCLE_CP,
          (rect.left + offset) - r * CIRCLE_CP, rect.top - padding,
          rect.left + offset, rect.top - padding]},
        {type: 'C', values: [
          rect.right - offset + r * CIRCLE_CP, rect.top - padding,
          rect.right + padding, (rect.top + offset) - r * CIRCLE_CP,
          rect.right + padding, rect.top + offset]},
        {type: 'C', values: [
          rect.right + padding, (rect.bottom - offset) + r * CIRCLE_CP,
          (rect.right - offset) + r * CIRCLE_CP, rect.bottom + padding,
          rect.right - offset, rect.bottom + padding]},
        {type: 'C', values: [
          (rect.left + offset) - r * CIRCLE_CP, rect.bottom + padding,
          rect.left - padding, (rect.bottom - offset) + r * CIRCLE_CP,
          rect.left - padding, rect.bottom - offset]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(4);
      expect(props.curStats.position_socketXYSE[0].x).toBe(rect.left + rect.width / 2); // bottom
      expect(props.curStats.position_socketXYSE[0].y).toBe(rect.bottom + padding + 2);

      // size: 4, width: 20, height: 10
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'), shape: 'circle',
        x: 5, y: 6, width: 20, height: 10, size: 4});
      ll.start = atc;
      rx = 10 * Math.SQRT2 + 2;
      ry = 5 * Math.SQRT2 + 2;
      offsetX = 10;
      offsetY = 5;
      paddingX = rx - offsetX;
      paddingY = ry - offsetY;
      rect = getRectByXYWH(elmX + 5, elmY + 6, 20, 10);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [rect.left - paddingX, rect.top + offsetY]},
        {type: 'C', values: [
          rect.left - paddingX, (rect.top + offsetY) - ry * CIRCLE_CP,
          (rect.left + offsetX) - rx * CIRCLE_CP, rect.top - paddingY,
          rect.left + offsetX, rect.top - paddingY]},
        {type: 'C', values: [
          rect.right - offsetX + rx * CIRCLE_CP, rect.top - paddingY,
          rect.right + paddingX, (rect.top + offsetY) - ry * CIRCLE_CP,
          rect.right + paddingX, rect.top + offsetY]},
        {type: 'C', values: [
          rect.right + paddingX, (rect.bottom - offsetY) + ry * CIRCLE_CP,
          (rect.right - offsetX) + rx * CIRCLE_CP, rect.bottom + paddingY,
          rect.right - offsetX, rect.bottom + paddingY]},
        {type: 'C', values: [
          (rect.left + offsetX) - rx * CIRCLE_CP, rect.bottom + paddingY,
          rect.left - paddingX, (rect.bottom - offsetY) + ry * CIRCLE_CP,
          rect.left - paddingX, rect.bottom - offsetY]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(4);
      expect(props.curStats.position_socketXYSE[0].x).toBe(rect.right + paddingX + 2); // right
      expect(props.curStats.position_socketXYSE[0].y).toBe(rect.top + rect.height / 2);

      pageDone();
      done();
    });

    it(registerTitle('areaAnchor-polygon'), function(done) {
      var props = window.insProps[ll._id], atc,
        elmX = 1, elmY = 2, // elm1
        rect, padding;

      // size: 0
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'), shape: 'polygon',
        points: [[0, 60], [80, 10], [80, 80]], size: 0, fillColor: 'rgba(0, 0, 255, 0.5)'});
      ll.start = atc;
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [elmX + 0, elmY + 60]},
        {type: 'L', values: [elmX + 80, elmY + 10]},
        {type: 'L', values: [elmX + 80, elmY + 80]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);
      rect = getRectByXYRB(elmX + 0, elmY + 10, elmX + 80, elmY + 80);
      padding = 0;
      expect(props.curStats.position_socketXYSE[0].x).toBe(rect.left + rect.width / 2); // bottom
      expect(props.curStats.position_socketXYSE[0].y).toBe(rect.bottom + padding);

      // size: 4
      atc = window.LeaderLine.areaAnchor({element: document.getElementById('elm1'), shape: 'polygon',
        points: [[0, 60], [80, 10], [80, 80]], size: 4, fillColor: 'rgba(0, 0, 255, 0.5)'});
      ll.start = atc;
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        {type: 'M', values: [elmX + 0, elmY + 60]},
        {type: 'L', values: [elmX + 80, elmY + 10]},
        {type: 'L', values: [elmX + 80, elmY + 80]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(4);
      rect = getRectByXYRB(elmX + 0, elmY + 10, elmX + 80, elmY + 80);
      padding = 2;
      expect(props.curStats.position_socketXYSE[0].x).toBe(rect.left + rect.width / 2); // bottom
      expect(props.curStats.position_socketXYSE[0].y).toBe(rect.bottom + padding);

      pageDone();
      done();
    });

    it(registerTitle('mouseHoverAnchor'), function(done) {
      var atc, attachProps, bBox, element, called, color;

      (function(cssText) {
        var sheet;
        if (document.createStyleSheet) { // IE
          sheet = document.createStyleSheet();
          sheet.cssText = cssText;
        } else {
          sheet = document.querySelector('head').appendChild(document.createElement('style'));
          sheet.type = 'text/css';
          sheet.textContent = cssText;
        }
      })('.inline {display: inline} .block {display: block} .padding1 {padding: 60px} .padding2 {padding: 2px} #height1 {height: 1px} #height2 {height: 1px; box-sizing: border-box}');

      (function(htmlText) {
        var p = document.body.appendChild(document.createElement('p'));
        p.style.marginTop = '500px';
        p.innerHTML = htmlText;
      })('Lorem <span id="span-a">ipsum</span> dolor <span id="span-b" class="block">sit</span> amet, <span id="span-c" style="display: block">consectetur</span> adipiscing <h3 id="h3-a">elit</h3>, sed <h3 id="h3-b" class="inline">do</h3> eiusmod <h3 id="h3-c" style="display: inline">tempor</h3> incididunt <span id="span-d">ut</span> labore <span id="span-e" class="padding1">et</span> dolore <span id="span-f" style="padding: 60px">magna</span> aliqua. <span id="span-g" class="padding2">Ut</span> enim <span id="span-h" style="padding: 2px">ad</span> minim veniam, quis<div id="height1"></div><div id="height2"></div>');

      // style.display
      // inline in native
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('span-a')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.display).toBe('inline-block');
      // no-inline via class
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('span-b')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.display == null).toBe(true);
      // no-inline via attribute
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('span-c')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.display == null).toBe(true);
      // no-inline in native
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('h3-a')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.display == null).toBe(true);
      // inline via class
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('h3-b')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.display).toBe('inline-block');
      // inline via attribute
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('h3-c')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.display).toBe('inline-block');

      // style.padding
      // padding:0 in native
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('span-d')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.paddingTop).toBe(1 + 'px');
      expect(attachProps.style.paddingRight).toBe(15 + 'px');
      expect(attachProps.style.paddingBottom).toBe(1 + 'px');
      expect(attachProps.style.paddingLeft).toBe(2 + 'px');
      // padding:60 via class
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('span-e')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.paddingTop == null).toBe(true);
      expect(attachProps.style.paddingRight == null).toBe(true);
      expect(attachProps.style.paddingBottom == null).toBe(true);
      expect(attachProps.style.paddingLeft == null).toBe(true);
      // padding:60 via attribute
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('span-f')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.paddingTop == null).toBe(true);
      expect(attachProps.style.paddingRight == null).toBe(true);
      expect(attachProps.style.paddingBottom == null).toBe(true);
      expect(attachProps.style.paddingLeft == null).toBe(true);
      // padding:2 via class
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('span-g')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.paddingTop == null).toBe(true);
      expect(attachProps.style.paddingRight).toBe(15 + 'px');
      expect(attachProps.style.paddingBottom == null).toBe(true);
      expect(attachProps.style.paddingLeft == null).toBe(true);
      // padding:2 via attribute
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('span-h')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.paddingTop == null).toBe(true);
      expect(attachProps.style.paddingRight).toBe(15 + 'px');
      expect(attachProps.style.paddingBottom == null).toBe(true);
      expect(attachProps.style.paddingLeft == null).toBe(true);

      // height (min-height: 15)
      // box-sizing: content-box
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('height1')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.paddingTop).toBe(1 + 'px');
      expect(attachProps.style.paddingRight).toBe(15 + 'px');
      expect(attachProps.style.paddingBottom).toBe(1 + 'px');
      expect(attachProps.style.paddingLeft).toBe(2 + 'px');
      expect(attachProps.style.height).toBe(13 + 'px');
      // box-sizing: border-box
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('height2')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.paddingTop).toBe(1 + 'px');
      expect(attachProps.style.paddingRight).toBe(15 + 'px');
      expect(attachProps.style.paddingBottom).toBe(1 + 'px');
      expect(attachProps.style.paddingLeft).toBe(2 + 'px');
      expect(attachProps.style.height).toBe(15 + 'px');

      // style.backgroundPosition
      // IS_WEBKIT: false
      window.engineFlags({IS_WEBKIT: false});
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('span-a')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.backgroundPosition).toBe('right 2px top 2px');
      // IS_WEBKIT: true
      window.engineFlags({IS_WEBKIT: true});
      // padding:0 in native
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('span-d')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      bBox = document.getElementById('span-d').getBoundingClientRect();
      expect(attachProps.style.backgroundPosition).toBe(
        (bBox.width - 12/* backgroundSize.width */ - 2/* backgroundPosition.right */) + 'px ' +
        2/* backgroundPosition.top */ + 'px');
      // padding:60 via class
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('span-e')});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      bBox = document.getElementById('span-e').getBoundingClientRect();
      expect(attachProps.style.backgroundPosition).toBe(
        (bBox.width - 12/* backgroundSize.width */ - 2/* backgroundPosition.right */) + 'px ' +
        2/* backgroundPosition.top */ + 'px');

      // IS_WEBKIT: restore
      window.engineFlags({IS_WEBKIT: IS_WEBKIT});

      // merge
      atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('span-a'),
        style: {backgroundColor: 'red', cursor: 'pointer', backgroundImage: null}});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      expect(attachProps.style.backgroundRepeat).toBe('no-repeat'); // default
      expect(attachProps.style.backgroundColor).toBe('red');
      expect(attachProps.style.cursor).toBe('pointer');
      expect('backgroundImage' in attachProps.style).toBe(false);

      // SVG
      expect(Object.prototype.toString.apply(document.getElementById('rect1'))).toBe('[object SVGRectElement]');
      expect(function() {
        atc = window.LeaderLine.mouseHoverAnchor({element: document.getElementById('rect1')});
      }).toThrow();

      // onSwitch
      element = document.getElementById('span-a');
      ll.start = element;
      atc = window.LeaderLine.mouseHoverAnchor({element: element,
        onSwitch: function() { called = true; }, showEffectName: 'none'});
      attachProps = window.insAttachProps[atc._id];
      ll.start = atc;
      color = element.style.backgroundColor;
      expect(color === '#f8f881' || color.replace(/\s/g, '') === 'rgb(248,248,129)').toBe(true); // default
      (function() { // Event
        var evt = document.createEvent('MouseEvents');
        evt.initMouseEvent('onmouseenter' in element ? 'mouseenter' : 'mouseover', true, true, window, 1,
          0, 0, 0, 0, false, false, false, false, 0, null);
        element.dispatchEvent(evt);
      })();
      setTimeout(function() {
        expect(called).toBe(true);
        color = element.style.backgroundColor;
        expect(color === '#fadf8f' || color.replace(/\s/g, '') === 'rgb(250,223,143)').toBe(true); // hover
        (function() { // Event
          var evt = document.createEvent('MouseEvents');
          evt.initMouseEvent('onmouseleave' in element ? 'mouseleave' : 'mouseout', true, true, window, 1,
            0, 0, 0, 0, false, false, false, false, 0, null);
          element.dispatchEvent(evt);
        })();
        setTimeout(function() {
          color = element.style.backgroundColor;
          expect(color === '#f8f881' || color.replace(/\s/g, '') === 'rgb(248,248,129)').toBe(true); // default

          pageDone();
          done();
        }, 10);
      }, 10);

    });

  });

  describe('ATTACHMENTS.captionLabel', function() {

    beforeEach(loadBefore);

    it(registerTitle('attachOptions'), function(done) {
      var atc, attachProps;

      // invalid
      atc = window.LeaderLine.captionLabel({text: ' '});
      expect(atc.isRemoved).toBe(true);
      atc = window.LeaderLine.captionLabel({text: 5});
      expect(atc.isRemoved).toBe(true);

      // default
      atc = window.LeaderLine.captionLabel({text: '  label-a  '});
      attachProps = window.insAttachProps[atc._id];
      expect(attachProps.text).toBe('label-a');
      expect(attachProps.color == null).toBe(true);
      expect(attachProps.outlineColor).toBe('#fff');
      expect(attachProps.offset == null).toBe(true);
      expect(attachProps.lineOffset == null).toBe(true);

      // valid
      atc = window.LeaderLine.captionLabel({
        text: '  label-a  ',
        color: ' red ',
        outlineColor: ' blue ',
        offset: [1, 2],
        lineOffset: 3
      });
      attachProps = window.insAttachProps[atc._id];
      expect(attachProps.text).toBe('label-a');
      expect(attachProps.color).toBe('red');
      expect(attachProps.outlineColor).toBe('blue');
      expect(attachProps.offset).toEqual({x: 1, y: 2});
      expect(attachProps.lineOffset).toBe(3);

      pageDone();
      done();
    });

    it(registerTitle('event auto color'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps, ll2, props2;

      atc = window.LeaderLine.captionLabel({text: 'label-a'});
      attachProps = window.insAttachProps[atc._id];
      ll.startLabel = atc;
      expect(attachProps.curStats.color).toBe('coral');
      expect(props.events.cur_line_color.length).toBe(1); // addEventHandler
      expect(props.attachments.length).toBe(1);

      // It's changed by updating ll
      traceLog.clear();
      ll.color = 'red';
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        '<setOptions>', 'needs.line', '</setOptions>',
        '<updateLine>', 'line_color=red',
        '<ATTACHMENTS.captionLabel.updateColor>', 'color=red', '</ATTACHMENTS.captionLabel.updateColor>',
        '</updateLine>',
        '<updatePlug>', 'plug_colorSE[0]=red', 'plug_colorSE[1]=red', '</updatePlug>',
        '<updateLineOutline>', 'not-updated', '</updateLineOutline>',
        '<updatePlugOutline>', 'not-updated', '</updatePlugOutline>',
        '<updateFaces>', 'line_color=red', 'plug_colorSE[1]=red', '</updateFaces>',
        '<updatePosition>', 'not-updated', '</updatePosition>',
        '<updateViewBox>'].concat(window.IS_WEBKIT ? [
          '<ATTACHMENTS.captionLabel.adjustEdge>', '</ATTACHMENTS.captionLabel.adjustEdge>'
        ] : []).concat([
        'not-updated', '</updateViewBox>',
        '<updateMask>', 'not-updated', '</updateMask>',
        '<update>', 'updated.line', 'updated.plug', 'updated.faces', '</update>'])
        /* eslint-enable indent */
      );
      expect(attachProps.curStats.color).toBe('red');

      // It's changed by binding ll
      ll2 = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm3'), {
        color: 'blue'
      });
      props2 = window.insProps[ll2._id];
      traceLog.clear();
      ll2.endLabel = atc;
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        // option of ll1
        '<ATTACHMENTS.captionLabel.removeOption>',
          'optionName=startLabel',
          '<ATTACHMENTS.captionLabel.unbind>'].concat(window.IS_WEBKIT ? [
            '<updateViewBox>', 'y', 'height', '</updateViewBox>',
            '<updateMask>', 'maskBGRect_y', 'lineMask_y', '</updateMask>',
            '<update>', 'updated.viewBox', 'updated.mask', '</update>'
          ] : []).concat([
          '</ATTACHMENTS.captionLabel.unbind>',
          '<setOptions>', '</setOptions>',
          '<updateViewBox>', 'not-updated', '</updateViewBox>',
          '<updateMask>', 'not-updated', '</updateMask>',
          '<update>', '</update>',
        '</ATTACHMENTS.captionLabel.removeOption>',

        '<ATTACHMENTS.captionLabel.bind>',
          'optionName=endLabel',
          '<ATTACHMENTS.captionLabel.initSvg>',
            '<ATTACHMENTS.captionLabel.updateColor>', 'color=blue', '</ATTACHMENTS.captionLabel.updateColor>',
            '<ATTACHMENTS.captionLabel.updateSocketXY>', 'x', 'y', '</ATTACHMENTS.captionLabel.updateSocketXY>'
            ].concat(window.IS_WEBKIT ? [
              '<updateViewBox>',
                '<ATTACHMENTS.captionLabel.adjustEdge>', '</ATTACHMENTS.captionLabel.adjustEdge>',
                'height',
              '</updateViewBox>',
              '<updateMask>', 'not-updated', '</updateMask>',
              '<update>', 'updated.viewBox', '</update>'
            ] : []).concat([
            '<ATTACHMENTS.captionLabel.updateShow>', 'on=true', '</ATTACHMENTS.captionLabel.updateShow>',
          '</ATTACHMENTS.captionLabel.initSvg>',
        '</ATTACHMENTS.captionLabel.bind>',

        '<setOptions>', '</setOptions>',
        '<updateViewBox>'].concat(window.IS_WEBKIT ? [
          '<ATTACHMENTS.captionLabel.adjustEdge>', '</ATTACHMENTS.captionLabel.adjustEdge>',
        ] : []).concat([
        'not-updated', '</updateViewBox>',
        '<updateMask>', 'not-updated', '</updateMask>',
        '<update>', '</update>'])))
        /* eslint-enable indent */
      );
      expect(attachProps.aplStats.x - 162).toBeLessThan(TOLERANCE);
      expect(attachProps.aplStats.y - 263).toBeLessThan(TOLERANCE);
      expect(attachProps.curStats.color).toBe('blue');
      expect(props.events.cur_line_color.length).toBe(0); // removeEventHandler
      expect(props2.events.cur_line_color.length).toBe(1); // addEventHandler
      expect(props.attachments.length).toBe(0);
      expect(props2.attachments.length).toBe(1);

      traceLog.clear();
      ll2.endLabel = '';
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        '<ATTACHMENTS.captionLabel.unbind>'].concat(window.IS_WEBKIT ? [
          '<updateViewBox>', 'height', '</updateViewBox>',
          '<updateMask>', 'not-updated', '</updateMask>',
          '<update>', 'updated.viewBox', '</update>'
        ] : []).concat([
        '</ATTACHMENTS.captionLabel.unbind>',
        '<setOptions>', '</setOptions>',
        '<updateViewBox>', 'not-updated', '</updateViewBox>',
        '<updateMask>', 'not-updated', '</updateMask>',
        '<update>', '</update>'])
        /* eslint-enable indent */
      );
      expect(props2.events.cur_line_color.length).toBe(0); // removeEventHandler
      expect(props2.attachments.length).toBe(0);
      setTimeout(function() {
        expect(atc.isRemoved).toBe(true);

        pageDone();
        done();
      }, 50);
    });

    it(registerTitle('event static color'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps, ll2, props2;

      atc = window.LeaderLine.captionLabel({text: 'label-a', color: 'yellow'});
      attachProps = window.insAttachProps[atc._id];
      ll.startLabel = atc;
      expect(attachProps.curStats.color).toBe('yellow');
      expect(props.events.cur_line_color == null).toBe(true);

      // It's changed by updating ll
      traceLog.clear();
      ll.color = 'red';
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        '<setOptions>', 'needs.line', '</setOptions>',
        '<updateLine>', 'line_color=red',
        // '<ATTACHMENTS.captionLabel.updateColor>', 'color=red', '</ATTACHMENTS.captionLabel.updateColor>',
        '</updateLine>',
        '<updatePlug>', 'plug_colorSE[0]=red', 'plug_colorSE[1]=red', '</updatePlug>',
        '<updateLineOutline>', 'not-updated', '</updateLineOutline>',
        '<updatePlugOutline>', 'not-updated', '</updatePlugOutline>',
        '<updateFaces>', 'line_color=red', 'plug_colorSE[1]=red', '</updateFaces>',
        '<updatePosition>', 'not-updated', '</updatePosition>',
        '<updateViewBox>'].concat(window.IS_WEBKIT ? [
          '<ATTACHMENTS.captionLabel.adjustEdge>', '</ATTACHMENTS.captionLabel.adjustEdge>',
        ] : []).concat([
        'not-updated', '</updateViewBox>',
        '<updateMask>', 'not-updated', '</updateMask>',
        '<update>', 'updated.line', 'updated.plug', 'updated.faces', '</update>'])
        /* eslint-enable indent */
      );
      expect(attachProps.curStats.color).toBe('yellow');

      // It's changed by binding ll
      ll2 = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm3'), {
        color: 'blue'
      });
      props2 = window.insProps[ll2._id];
      traceLog.clear();
      ll2.endLabel = atc;
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        // option of ll1
        '<ATTACHMENTS.captionLabel.removeOption>',
          'optionName=startLabel',
          '<ATTACHMENTS.captionLabel.unbind>'].concat(window.IS_WEBKIT ? [
            '<updateViewBox>', 'y', 'height', '</updateViewBox>',
            '<updateMask>', 'maskBGRect_y', 'lineMask_y', '</updateMask>',
            '<update>', 'updated.viewBox', 'updated.mask', '</update>'
          ] : []).concat([
          '</ATTACHMENTS.captionLabel.unbind>',
          '<setOptions>', '</setOptions>',
          '<updateViewBox>', 'not-updated', '</updateViewBox>',
          '<updateMask>', 'not-updated', '</updateMask>',
          '<update>', '</update>',
        '</ATTACHMENTS.captionLabel.removeOption>',

        '<ATTACHMENTS.captionLabel.bind>',
          'optionName=endLabel',
          '<ATTACHMENTS.captionLabel.initSvg>',
            '<ATTACHMENTS.captionLabel.updateColor>', 'color=yellow', '</ATTACHMENTS.captionLabel.updateColor>',
            '<ATTACHMENTS.captionLabel.updateSocketXY>', 'x', 'y', '</ATTACHMENTS.captionLabel.updateSocketXY>'
            ].concat(window.IS_WEBKIT ? [
              '<updateViewBox>',
                '<ATTACHMENTS.captionLabel.adjustEdge>', '</ATTACHMENTS.captionLabel.adjustEdge>',
                'height',
              '</updateViewBox>',
              '<updateMask>', 'not-updated', '</updateMask>',
              '<update>', 'updated.viewBox', '</update>'
            ] : []).concat([
            '<ATTACHMENTS.captionLabel.updateShow>', 'on=true', '</ATTACHMENTS.captionLabel.updateShow>',
          '</ATTACHMENTS.captionLabel.initSvg>',
        '</ATTACHMENTS.captionLabel.bind>',

        '<setOptions>', '</setOptions>',
        '<updateViewBox>'].concat(window.IS_WEBKIT ? [
          '<ATTACHMENTS.captionLabel.adjustEdge>', '</ATTACHMENTS.captionLabel.adjustEdge>',
        ] : []).concat([
        'not-updated', '</updateViewBox>',
        '<updateMask>', 'not-updated', '</updateMask>',
        '<update>', '</update>'])))
        /* eslint-enable indent */
      );
      expect(attachProps.aplStats.x - 162).toBeLessThan(TOLERANCE);
      expect(attachProps.aplStats.y - 263).toBeLessThan(TOLERANCE);
      expect(attachProps.curStats.color).toBe('yellow');
      expect(props.events.cur_line_color == null).toBe(true);
      expect(props2.events.cur_line_color == null).toBe(true);
      expect(props.attachments.length).toBe(0);
      expect(props2.attachments.length).toBe(1);

      traceLog.clear();
      ll2.endLabel = '';
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        '<ATTACHMENTS.captionLabel.unbind>'].concat(window.IS_WEBKIT ? [
          '<updateViewBox>', 'height', '</updateViewBox>',
          '<updateMask>', 'not-updated', '</updateMask>',
          '<update>', 'updated.viewBox', '</update>'
        ] : []).concat([
        '</ATTACHMENTS.captionLabel.unbind>',
        '<setOptions>', '</setOptions>',
        '<updateViewBox>', 'not-updated', '</updateViewBox>',
        '<updateMask>', 'not-updated', '</updateMask>',
        '<update>', '</update>'])
        /* eslint-enable indent */
      );
      expect(props2.events.cur_line_color == null).toBe(true);
      expect(props2.attachments.length).toBe(0);
      setTimeout(function() {
        expect(atc.isRemoved).toBe(true);

        pageDone();
        done();
      }, 50);
    });

    it(registerTitle('event svgShow'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps;

      atc = window.LeaderLine.captionLabel({text: 'label-a'});
      attachProps = window.insAttachProps[atc._id];
      ll.hide('none');
      setTimeout(function() {
        expect(props.isShown).toBe(false); // check

        ll.startLabel = atc;
        expect(attachProps.isShown).toBe(false);
        expect(attachProps.styleShow.visibility).toBe('hidden');

        ll.show();
        setTimeout(function() {
          expect(props.isShown).toBe(true); // check

          expect(attachProps.isShown).toBe(true);
          expect(attachProps.styleShow.visibility).toBe('');

          pageDone();
          done();
        }, 100);
      }, 100);
    });

    it(registerTitle('updateSocketXY'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps, bBox, width, height, sideLen;

      // offset
      atc = window.LeaderLine.captionLabel({text: 'label-a', offset: [3, -4]});
      attachProps = window.insAttachProps[atc._id];
      ll.startLabel = atc;
      height = (bBox = attachProps.elmPosition.getBBox()).height;
      // elm1 (1, 2) w:100 h:30
      // socket: right (101, 17)
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value) - (101 + 3))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value) - (17 - 4 + height))
        .toBeLessThan(TOLERANCE);

      // endLabel
      expect(props.attachments.length).toBe(1);
      ll.endLabel = atc;
      // elm3 (216, 232) w:100 h:30
      // socket: left (216, 247)
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value) - (216 + 3))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value) - (247 - 4 + height))
        .toBeLessThan(TOLERANCE);
      expect(props.attachments.length).toBe(1);

      // move anchor
      document.getElementById('elm3').style.top = '15px';
      // elm3 (216, 15) w:100 h:30
      // socket: left (216, 30)
      ll.position();
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value) - (216 + 3))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value) - (30 - 4 + height))
        .toBeLessThan(TOLERANCE);

      // auto offset
      atc = window.LeaderLine.captionLabel({text: 'label-a'});
      attachProps = window.insAttachProps[atc._id];
      ll.endLabel = atc;
      width = (bBox = attachProps.elmPosition.getBBox()).width;
      height = bBox.height;
      document.getElementById('elm3').style.left = '300px';
      document.getElementById('elm3').style.top = '300px';
      sideLen = 8;

      document.getElementById('elm1').style.left = '0';
      document.getElementById('elm1').style.top = '250px';
      ll.position();
      // socket: left (300, 315)
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value) - (300 - width - height / 2))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value) - (315 + sideLen + height / 2 + height))
        .toBeLessThan(TOLERANCE);

      // updated by size
      ll.size = 8;
      sideLen = 16;
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value) - (300 - width - height / 2))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value) - (315 + sideLen + height / 2 + height))
        .toBeLessThan(TOLERANCE);

      ll.size = 4;
      sideLen = 8;
      document.getElementById('elm1').style.top = '350px';
      ll.position();
      // socket: left (300, 315)
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value) - (300 - width - height / 2))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value) - (315 - sideLen - height / 2))
        .toBeLessThan(TOLERANCE);

      document.getElementById('elm1').style.left = '600px';
      document.getElementById('elm1').style.top = '250px';
      ll.position();
      // socket: right (400, 315)
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value) - (400 + height / 2))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value) - (315 + sideLen + height / 2 + height))
        .toBeLessThan(TOLERANCE);

      document.getElementById('elm1').style.top = '350px';
      ll.position();
      // socket: right (400, 315)
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value) - (400 + height / 2))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value) - (315 - sideLen - height / 2))
        .toBeLessThan(TOLERANCE);

      document.getElementById('elm1').style.left = '250px';
      document.getElementById('elm1').style.top = '0';
      ll.position();
      // socket: top (350, 300)
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value) - (350 + sideLen + height / 2))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value) - (300 - height / 2))
        .toBeLessThan(TOLERANCE);

      document.getElementById('elm1').style.left = '350px';
      ll.position();
      // socket: top (350, 300)
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value) - (350 - sideLen - width - height / 2))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value) - (300 - height / 2))
        .toBeLessThan(TOLERANCE);

      document.getElementById('elm1').style.left = '250px';
      document.getElementById('elm1').style.top = '600px';
      ll.position();
      // socket: bottom (350, 330)
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value) - (350 + sideLen + height / 2))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value) - (330 + height / 2 + height))
        .toBeLessThan(TOLERANCE);

      document.getElementById('elm1').style.left = '350px';
      ll.position();
      // socket: bottom (350, 330)
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value) - (350 - sideLen - width - height / 2))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value) - (330 + height / 2 + height))
        .toBeLessThan(TOLERANCE);

      pageDone();
      done();
    });

    it(registerTitle('updatePath'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps, bBox, width, height, points, point, pointLen;

      atc = window.LeaderLine.captionLabel({text: 'label-a'});
      attachProps = window.insAttachProps[atc._id];
      ll.middleLabel = atc;
      width = (bBox = attachProps.elmPosition.getBBox()).width;
      height = bBox.height;
      expect(props.pathList.baseVal.length).toBe(1);
      expect(props.pathList.baseVal[0].length).toBe(4);
      points = props.pathList.baseVal[0];
      pointLen = window.getCubicLength(points[0], points[1], points[2], points[3]) / 2;
      point = window.getPointOnCubic(points[0], points[1], points[2], points[3],
        window.getCubicT(points[0], points[1], points[2], points[3], pointLen));
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value - (point.x - width / 2)))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value - (point.y - height / 2 + height)))
        .toBeLessThan(TOLERANCE);

      // move anchor
      document.getElementById('elm1').style.top = '99px';
      ll.position();
      expect(props.pathList.baseVal.length).toBe(1);
      expect(props.pathList.baseVal[0].length).toBe(4);
      points = props.pathList.baseVal[0];
      pointLen = window.getCubicLength(points[0], points[1], points[2], points[3]) / 2;
      point = window.getPointOnCubic(points[0], points[1], points[2], points[3],
        window.getCubicT(points[0], points[1], points[2], points[3], pointLen));
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value - (point.x - bBox.width / 2)))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value - (point.y - height / 2 + height)))
        .toBeLessThan(TOLERANCE);

      // lineOffset
      atc = window.LeaderLine.captionLabel({text: 'label-a', lineOffset: 33});
      attachProps = window.insAttachProps[atc._id];
      ll.middleLabel = atc;
      width = (bBox = attachProps.elmPosition.getBBox()).width;
      height = bBox.height;
      expect(props.pathList.baseVal.length).toBe(1);
      expect(props.pathList.baseVal[0].length).toBe(4);
      points = props.pathList.baseVal[0];
      pointLen = window.getCubicLength(points[0], points[1], points[2], points[3]) / 2 + 33;
      point = window.getPointOnCubic(points[0], points[1], points[2], points[3],
        window.getCubicT(points[0], points[1], points[2], points[3], pointLen));
      expect(Math.abs(attachProps.elmPosition.x.baseVal.getItem(0).value - (point.x - width / 2)))
        .toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps.elmPosition.y.baseVal.getItem(0).value - (point.y - height / 2 + height)))
        .toBeLessThan(TOLERANCE);

      pageDone();
      done();
    });

  });

  describe('ATTACHMENTS.pathLabel', function() {

    beforeEach(loadBefore);

    it(registerTitle('attachOptions'), function(done) {
      var atc, attachProps;

      // invalid
      atc = window.LeaderLine.pathLabel({text: ' '});
      expect(atc.isRemoved).toBe(true);
      atc = window.LeaderLine.pathLabel({text: 5});
      expect(atc.isRemoved).toBe(true);

      // default
      atc = window.LeaderLine.pathLabel({text: '  label-a  '});
      attachProps = window.insAttachProps[atc._id];
      expect(attachProps.text).toBe('label-a');
      expect(attachProps.color == null).toBe(true);
      expect(attachProps.outlineColor).toBe('#fff');
      expect(attachProps.lineOffset == null).toBe(true);

      // valid
      atc = window.LeaderLine.pathLabel({
        text: '  label-a  ',
        color: ' red ',
        outlineColor: ' blue ',
        lineOffset: 3
      });
      attachProps = window.insAttachProps[atc._id];
      expect(attachProps.text).toBe('label-a');
      expect(attachProps.color).toBe('red');
      expect(attachProps.outlineColor).toBe('blue');
      expect(attachProps.lineOffset).toBe(3);

      pageDone();
      done();
    });

    it(registerTitle('event auto color'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps, ll2, props2;

      atc = window.LeaderLine.pathLabel({text: 'label-a'});
      attachProps = window.insAttachProps[atc._id];
      ll.startLabel = atc;
      expect(attachProps.curStats.color).toBe('coral');
      expect(props.events.cur_line_color.length).toBe(1); // addEventHandler
      expect(props.attachments.length).toBe(1);

      // It's changed by updating ll
      traceLog.clear();
      ll.color = 'red';
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        '<setOptions>', 'needs.line', '</setOptions>',
        '<updateLine>',
          'line_color=red',
          '<ATTACHMENTS.pathLabel.updateColor>', 'color=red', '</ATTACHMENTS.pathLabel.updateColor>',
        '</updateLine>',
        '<updatePlug>', 'plug_colorSE[0]=red', 'plug_colorSE[1]=red', '</updatePlug>',
        '<updateLineOutline>', 'not-updated', '</updateLineOutline>',
        '<updatePlugOutline>', 'not-updated', '</updatePlugOutline>',
        '<updateFaces>', 'line_color=red', 'plug_colorSE[1]=red', '</updateFaces>',
        '<updatePosition>', 'not-updated', '</updatePosition>',
        '<updateViewBox>'].concat(window.IS_WEBKIT ? [
          '<ATTACHMENTS.pathLabel.adjustEdge>', '</ATTACHMENTS.pathLabel.adjustEdge>',
        ] : []).concat([
        'not-updated', '</updateViewBox>',
        '<updateMask>', 'not-updated', '</updateMask>',
        '<update>', 'updated.line', 'updated.plug', 'updated.faces', '</update>'])
        /* eslint-enable indent */
      );
      expect(attachProps.curStats.color).toBe('red');

      // It's changed by binding ll
      ll2 = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm3'), {
        color: 'blue'
      });
      props2 = window.insProps[ll2._id];
      traceLog.clear();
      ll2.endLabel = atc;
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        // option of ll1
        '<ATTACHMENTS.pathLabel.removeOption>',
          'optionName=startLabel',
          '<ATTACHMENTS.pathLabel.unbind>'].concat(window.IS_WEBKIT ? [
            '<updateViewBox>', 'y', 'height', '</updateViewBox>',
            '<updateMask>', 'maskBGRect_y', 'lineMask_y', '</updateMask>',
            '<update>', 'updated.viewBox', 'updated.mask', '</update>'
          ] : []).concat([
          '</ATTACHMENTS.pathLabel.unbind>',
          '<setOptions>', '</setOptions>',
          '<updateViewBox>', 'not-updated', '</updateViewBox>',
          '<updateMask>', 'not-updated', '</updateMask>',
          '<update>', '</update>',
        '</ATTACHMENTS.pathLabel.removeOption>',

        '<ATTACHMENTS.pathLabel.bind>',
          'optionName=endLabel',
          '<ATTACHMENTS.pathLabel.initSvg>',
            '<ATTACHMENTS.pathLabel.updateColor>', 'color=blue', '</ATTACHMENTS.pathLabel.updateColor>',
            '<ATTACHMENTS.pathLabel.updatePath>',
              'pathData',
              '<ATTACHMENTS.pathLabel.updateStartOffset>', // in updatePath
                'startOffset',
              '</ATTACHMENTS.pathLabel.updateStartOffset>',
            '</ATTACHMENTS.pathLabel.updatePath>',
            '<ATTACHMENTS.pathLabel.updateStartOffset>', '</ATTACHMENTS.pathLabel.updateStartOffset>'
            ].concat(window.IS_WEBKIT ? [
              '<updateViewBox>',
                '<ATTACHMENTS.pathLabel.adjustEdge>', '</ATTACHMENTS.pathLabel.adjustEdge>',
                'x', 'y', 'width', 'height',
              '</updateViewBox>',
              '<updateMask>', 'maskBGRect_x', 'maskBGRect_y', 'lineMask_x', 'lineMask_y', '</updateMask>',
              '<update>', 'updated.viewBox', 'updated.mask', '</update>'
            ] : []).concat([
            '<ATTACHMENTS.pathLabel.updateShow>', 'on=true', '</ATTACHMENTS.pathLabel.updateShow>',
          '</ATTACHMENTS.pathLabel.initSvg>',
        '</ATTACHMENTS.pathLabel.bind>',

        '<setOptions>', '</setOptions>',
        '<updateViewBox>'].concat(window.IS_WEBKIT ? [
          '<ATTACHMENTS.pathLabel.adjustEdge>', '</ATTACHMENTS.pathLabel.adjustEdge>',
        ] : []).concat([
        'not-updated', '</updateViewBox>',
        '<updateMask>', 'not-updated', '</updateMask>',
        '<update>', '</update>'])))
        /* eslint-enable indent */
      );
      expect(attachProps.aplStats.startOffset - 268).toBeLessThan(TOLERANCE);
      expect(attachProps.curStats.color).toBe('blue');
      expect(props.events.cur_line_color.length).toBe(0); // removeEventHandler
      expect(props2.events.cur_line_color.length).toBe(1); // addEventHandler
      expect(props.attachments.length).toBe(0);
      expect(props2.attachments.length).toBe(1);

      traceLog.clear();
      ll2.endLabel = '';
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        '<ATTACHMENTS.pathLabel.unbind>'].concat(window.IS_WEBKIT ? [
          '<updateViewBox>', 'x', 'y', 'width', 'height', '</updateViewBox>',
          '<updateMask>', 'maskBGRect_x', 'maskBGRect_y', 'lineMask_x', 'lineMask_y', '</updateMask>',
          '<update>', 'updated.viewBox', 'updated.mask', '</update>'
        ] : []).concat([
        '</ATTACHMENTS.pathLabel.unbind>',
        '<setOptions>', '</setOptions>',
        '<updateViewBox>', 'not-updated', '</updateViewBox>',
        '<updateMask>', 'not-updated', '</updateMask>',
        '<update>', '</update>'])
        /* eslint-enable indent */
      );
      expect(props2.events.cur_line_color.length).toBe(0); // removeEventHandler
      expect(props2.attachments.length).toBe(0);
      setTimeout(function() {
        expect(atc.isRemoved).toBe(true);

        pageDone();
        done();
      }, 50);
    });

    it(registerTitle('event static color'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps, ll2, props2;

      atc = window.LeaderLine.pathLabel({text: 'label-a', color: 'yellow'});
      attachProps = window.insAttachProps[atc._id];
      ll.startLabel = atc;
      expect(attachProps.curStats.color).toBe('yellow');
      expect(props.events.cur_line_color == null).toBe(true);

      // It's changed by updating ll
      traceLog.clear();
      ll.color = 'red';
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        '<setOptions>', 'needs.line', '</setOptions>',
        '<updateLine>', 'line_color=red',
        // '<ATTACHMENTS.pathLabel.updateColor>', 'color=red', '</ATTACHMENTS.pathLabel.updateColor>',
        '</updateLine>',
        '<updatePlug>', 'plug_colorSE[0]=red', 'plug_colorSE[1]=red', '</updatePlug>',
        '<updateLineOutline>', 'not-updated', '</updateLineOutline>',
        '<updatePlugOutline>', 'not-updated', '</updatePlugOutline>',
        '<updateFaces>', 'line_color=red', 'plug_colorSE[1]=red', '</updateFaces>',
        '<updatePosition>', 'not-updated', '</updatePosition>',
        '<updateViewBox>'].concat(window.IS_WEBKIT ? [
          '<ATTACHMENTS.pathLabel.adjustEdge>', '</ATTACHMENTS.pathLabel.adjustEdge>',
        ] : []).concat([
        'not-updated', '</updateViewBox>',
        '<updateMask>', 'not-updated', '</updateMask>',
        '<update>', 'updated.line', 'updated.plug', 'updated.faces', '</update>'])
        /* eslint-enable indent */
      );
      expect(attachProps.curStats.color).toBe('yellow');

      // It's changed by binding ll
      ll2 = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm3'), {
        color: 'blue'
      });
      props2 = window.insProps[ll2._id];
      traceLog.clear();
      ll2.endLabel = atc;
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        // option of ll1
        '<ATTACHMENTS.pathLabel.removeOption>',
          'optionName=startLabel',
          '<ATTACHMENTS.pathLabel.unbind>'].concat(window.IS_WEBKIT ? [
            '<updateViewBox>', 'y', 'height', '</updateViewBox>',
            '<updateMask>', 'maskBGRect_y', 'lineMask_y', '</updateMask>',
            '<update>', 'updated.viewBox', 'updated.mask', '</update>'
          ] : []).concat([
          '</ATTACHMENTS.pathLabel.unbind>',
          '<setOptions>', '</setOptions>',
          '<updateViewBox>', 'not-updated', '</updateViewBox>',
          '<updateMask>', 'not-updated', '</updateMask>',
          '<update>', '</update>',
        '</ATTACHMENTS.pathLabel.removeOption>',

        '<ATTACHMENTS.pathLabel.bind>',
          'optionName=endLabel',
          '<ATTACHMENTS.pathLabel.initSvg>',
            '<ATTACHMENTS.pathLabel.updateColor>', 'color=yellow', '</ATTACHMENTS.pathLabel.updateColor>',
            '<ATTACHMENTS.pathLabel.updatePath>',
              'pathData',
              '<ATTACHMENTS.pathLabel.updateStartOffset>', // in updatePath
                'startOffset',
              '</ATTACHMENTS.pathLabel.updateStartOffset>',
            '</ATTACHMENTS.pathLabel.updatePath>',
            '<ATTACHMENTS.pathLabel.updateStartOffset>', '</ATTACHMENTS.pathLabel.updateStartOffset>'
            ].concat(window.IS_WEBKIT ? [
              '<updateViewBox>',
                '<ATTACHMENTS.pathLabel.adjustEdge>', '</ATTACHMENTS.pathLabel.adjustEdge>',
                'x', 'y', 'width', 'height',
              '</updateViewBox>',
              '<updateMask>', 'maskBGRect_x', 'maskBGRect_y', 'lineMask_x', 'lineMask_y', '</updateMask>',
              '<update>', 'updated.viewBox', 'updated.mask', '</update>'
            ] : []).concat([
            '<ATTACHMENTS.pathLabel.updateShow>', 'on=true', '</ATTACHMENTS.pathLabel.updateShow>',
          '</ATTACHMENTS.pathLabel.initSvg>',
        '</ATTACHMENTS.pathLabel.bind>',

        '<setOptions>', '</setOptions>',
        '<updateViewBox>'].concat(window.IS_WEBKIT ? [
          '<ATTACHMENTS.pathLabel.adjustEdge>', '</ATTACHMENTS.pathLabel.adjustEdge>',
        ] : []).concat([
        'not-updated', '</updateViewBox>',
        '<updateMask>', 'not-updated', '</updateMask>',
        '<update>', '</update>'])))
        /* eslint-enable indent */
      );
      expect(attachProps.aplStats.startOffset - 268).toBeLessThan(TOLERANCE);
      expect(attachProps.curStats.color).toBe('yellow');
      expect(props.events.cur_line_color == null).toBe(true);
      expect(props2.events.cur_line_color == null).toBe(true);
      expect(props.attachments.length).toBe(0);
      expect(props2.attachments.length).toBe(1);

      traceLog.clear();
      ll2.endLabel = '';
      expect(traceLog.log).toEqual([
        /* eslint-disable indent */
        '<ATTACHMENTS.pathLabel.unbind>'].concat(window.IS_WEBKIT ? [
          '<updateViewBox>', 'x', 'y', 'width', 'height', '</updateViewBox>',
          '<updateMask>', 'maskBGRect_x', 'maskBGRect_y', 'lineMask_x', 'lineMask_y', '</updateMask>',
          '<update>', 'updated.viewBox', 'updated.mask', '</update>'
        ] : []).concat([
        '</ATTACHMENTS.pathLabel.unbind>',
        '<setOptions>', '</setOptions>',
        '<updateViewBox>', 'not-updated', '</updateViewBox>',
        '<updateMask>', 'not-updated', '</updateMask>',
        '<update>', '</update>'])
        /* eslint-enable indent */
      );
      expect(props2.events.cur_line_color == null).toBe(true);
      expect(props2.attachments.length).toBe(0);
      setTimeout(function() {
        expect(atc.isRemoved).toBe(true);

        pageDone();
        done();
      }, 50);
    });

    it(registerTitle('event svgShow'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps;

      atc = window.LeaderLine.pathLabel({text: 'label-a'});
      attachProps = window.insAttachProps[atc._id];
      ll.hide('none');
      setTimeout(function() {
        expect(props.isShown).toBe(false); // check

        ll.startLabel = atc;
        expect(attachProps.isShown).toBe(false);
        expect(attachProps.styleShow.visibility).toBe('hidden');

        ll.show();
        setTimeout(function() {
          expect(props.isShown).toBe(true); // check

          expect(attachProps.isShown).toBe(true);
          expect(attachProps.styleShow.visibility).toBe('');

          pageDone();
          done();
        }, 100);
      }, 100);
    });

    it(registerTitle('updatePath'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps, fontSize, strokeWidth;

      atc = window.LeaderLine.pathLabel({text: 'label-a'});
      attachProps = window.insAttachProps[atc._id];
      ll.middleLabel = atc;
      expect(matchPathData(attachProps.elmPath.getPathData(),
        /* eslint-disable */
        [{"type":"M","values":[99,10]},{"type":"L","values":[113.45790540711569,12.588993479995715]},{"type":"L","values":[125.00367009929991,20.052521291856852]},{"type":"L","values":[133.25392274031714,31.10649327917713]},{"type":"L","values":[138.86195583820046,44.63620486761069]},{"type":"L","values":[142.6194913389643,60.12119820877575]},{"type":"L","values":[145.11025096028396,77.19164735965228]},{"type":"L","values":[146.79443584936524,95.450767445376]},{"type":"L","values":[148.08134035790187,114.46006326276132]},{"type":"L","values":[149.3586991910288,133.7502464183206]},{"type":"L","values":[151.001808544847,152.82907696175036]},{"type":"L","values":[153.3728781429567,171.18425484673858]},{"type":"L","values":[156.81219871199187,188.28417155251176]},{"type":"L","values":[161.61856547609653,203.5845027988012]},{"type":"L","values":[168.02223388301437,216.56396932825058]},{"type":"L","values":[176.19964066022627,226.82867707972056]},{"type":"L","values":[186.45991976322395,234.2244985862475]},{"type":"L","values":[199.50078379254754,238.6383814624575]},{"type":"L","values":[208.32484360596925,239.6452753738043]}]
        /* eslint-enable */
      )).toBe(true);

      ll.size = 16;
      expect(matchPathData(attachProps.elmPath.getPathData(),
        /* eslint-disable */
        [{"type":"M","values":[93,4]},{"type":"L","values":[114.20947945953301,6.091423069232938]},{"type":"L","values":[131.4698555031056,12.698358169234679]},{"type":"L","values":[144.2742615692582,24.025871063915208]},{"type":"L","values":[151.69058015937972,38.54878855107664]},{"type":"L","values":[154.5150200830456,54.34728990721647]},{"type":"L","values":[154.23995252679438,70.8017858058205]},{"type":"L","values":[151.94761169050295,87.83353142273594]},{"type":"L","values":[148.4120312831293,105.32027984679462]},{"type":"L","values":[144.2918935965981,123.0204322875196]},{"type":"L","values":[140.20756530254704,140.6014680872292]},{"type":"L","values":[136.76022144758608,157.65978578393887]},{"type":"L","values":[134.5214672282143,173.72243037601524]},{"type":"L","values":[133.989315888415,188.2441522690337]},{"type":"L","values":[135.49386613813357,200.65598171667304]},{"type":"L","values":[139.12753673013012,210.6205843911355]},{"type":"L","values":[145.11116347950176,218.48160745957898]},{"type":"L","values":[154.5907322007727,224.91467179259445]},{"type":"L","values":[169.21196232512074,229.748974040884]},{"type":"L","values":[184.95666727010772,231.85696552796642]}]
        /* eslint-enable */
      )).toBe(true);

      ll.size = 4;
      document.getElementById('elm3').style.left = '300px';
      document.getElementById('elm3').style.top = '300px';
      ll.position();
      expect(matchPathData(attachProps.elmPath.getPathData(),
        /* eslint-disable */
        [{"type":"M","values":[99,10]},{"type":"L","values":[112.63313145373253,11.777157240055438]},{"type":"L","values":[124.96758856721615,16.883111088721456]},{"type":"L","values":[135.8701099374102,24.819455428886144]},{"type":"L","values":[145.45648368405125,35.08569167070432]},{"type":"L","values":[153.95656947272747,47.30861796828751]},{"type":"L","values":[161.5934043875896,61.20656329575481]},{"type":"L","values":[168.553025058285,76.53218509749871]},{"type":"L","values":[174.99140641337257,93.04373896691506]},{"type":"L","values":[181.0456029600108,110.49564669477604]},{"type":"L","values":[186.84148125772245,128.63667103031895]},{"type":"L","values":[192.49817850255434,147.21031450669147]},{"type":"L","values":[198.13044770894624,165.9555637180103]},{"type":"L","values":[203.84970371122546,184.60743378311733]},{"type":"L","values":[209.76417474123423,202.8972078972368]},{"type":"L","values":[215.97825997006294,220.55242160285275]},{"type":"L","values":[222.59095208694544,237.29677367411068]},{"type":"L","values":[229.69298128308986,252.85044500920839]},{"type":"L","values":[237.36230914444823,266.93205451610976]},{"type":"L","values":[245.65841939400428,279.26508260587866]},{"type":"L","values":[254.6195457123344,289.59384523931516]},{"type":"L","values":[264.276656698847,297.7124886901758]},{"type":"L","values":[274.7069317102511,303.4901311490579]},{"type":"L","values":[286.11458837386164,306.8350179222061]},{"type":"L","values":[292.41249442024827,307.55488354172775]}]
        /* eslint-enable */
      )).toBe(true);

      ll.path = 'straight';
      expect(matchPathData(attachProps.elmPath.getPathData(),
        /* eslint-disable */
        [{"type":"M","values":[104.80329494912615,13.085697030958533]},{"type":"L","values":[301.32980584165017,304.4533599462429]}]
        /* eslint-enable */
      )).toBe(true);

      ll.path = 'grid';
      expect(matchPathData(attachProps.elmPath.getPathData(),
        /* eslint-disable */
        [{"type":"M","values":[99,10]},{"type":"L","values":[207.5,10]},{"type":"L","values":[207.5,308]},{"type":"M","values":[227.5,308]},{"type":"L","values":[292,308]}]
        /* eslint-enable */
      )).toBe(true);

      // offset: strokeWidth / 2 + attachProps.strokeWidth / 2 + attachProps.height / 4
      fontSize = 16;
      strokeWidth = 4;
      expect(Math.abs(attachProps.elmPath.getPathData()[0].values[1]) - // y of start point
        (props.linePath.getPathData()[0].values[1] - (
          strokeWidth / 2 + attachProps.strokeWidth / 2 + fontSize / 4
        ))).toBeLessThan(TOLERANCE);

      ll.size = 16;
      expect(matchPathData(attachProps.elmPath.getPathData(),
        /* eslint-disable */
        [{"type":"M","values":[93,4]},{"type":"L","values":[213.5,4]},{"type":"L","values":[213.5,302]},{"type":"M","values":[233.5,302]},{"type":"L","values":[268,302]}]
        /* eslint-enable */
      )).toBe(true);

      // offset: strokeWidth / 2 + attachProps.strokeWidth / 2 + attachProps.height / 4
      fontSize = 16;
      strokeWidth = 16;
      expect(Math.abs(attachProps.elmPath.getPathData()[0].values[1]) - // y of start point
        (props.linePath.getPathData()[0].values[1] - (
          strokeWidth / 2 + attachProps.strokeWidth / 2 + fontSize / 4
        ))).toBeLessThan(TOLERANCE);

      atc = window.LeaderLine.pathLabel({text: 'label-a', fontSize: '10px'});
      attachProps = window.insAttachProps[atc._id];
      ll.middleLabel = atc;
      expect(matchPathData(attachProps.elmPath.getPathData(),
        /* eslint-disable */
        [{"type":"M","values":[93,5.5]},{"type":"L","values":[212,5.5]},{"type":"L","values":[212,303.5]},{"type":"M","values":[224.5,303.5]},{"type":"L","values":[268,303.5]}]
        /* eslint-enable */
      )).toBe(true);

      // offset: strokeWidth / 2 + attachProps.strokeWidth / 2 + attachProps.height / 4
      fontSize = 10;
      strokeWidth = 16;
      expect(Math.abs(attachProps.elmPath.getPathData()[0].values[1]) - // y of start point
        (props.linePath.getPathData()[0].values[1] - (
          strokeWidth / 2 + attachProps.strokeWidth / 2 + fontSize / 4
        ))).toBeLessThan(TOLERANCE);

      pageDone();
      done();
    });

    it(registerTitle('startOffset'), function(done) {
      var atc0, atc1, atc2, attachProps0, attachProps1, attachProps2,
        lenAll, fontSize, strokeWidth;

      atc0 = window.LeaderLine.pathLabel({text: 'label-0'});
      atc1 = window.LeaderLine.pathLabel({text: 'label-1'});
      atc2 = window.LeaderLine.pathLabel({text: 'label-2'});
      attachProps0 = window.insAttachProps[atc0._id];
      attachProps1 = window.insAttachProps[atc1._id];
      attachProps2 = window.insAttachProps[atc2._id];
      ll.startLabel = atc0;
      ll.endLabel = atc1;
      ll.middleLabel = atc2;
      lenAll = window.getAllPathDataLen(attachProps0.elmPath.getPathData());

      expect(attachProps0.elmPosition.style.textAnchor).toBe('start');
      expect(attachProps1.elmPosition.style.textAnchor).toBe('end');
      expect(attachProps2.elmPosition.style.textAnchor).toBe('middle');
      fontSize = 16;
      strokeWidth = 4;
      expect(Math.abs(attachProps0.elmOffset.startOffset.baseVal.value - (
        // no-plug: strokeWidth / 2 + attachProps.strokeWidth / 2 + fontSize / 4
        strokeWidth / 2 + attachProps0.strokeWidth / 2 + fontSize / 4
        ))).toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps1.elmOffset.startOffset.baseVal.value - (
        // plug: plugBackLen + attachProps.strokeWidth / 2 + fontSize / 4
        lenAll - (8 + attachProps1.strokeWidth / 2 + fontSize / 4)
        ))).toBeLessThan(TOLERANCE);
      // 50%
      expect(Math.abs(attachProps2.elmOffset.startOffset.baseVal.unitType)).toBe(SVGLength.SVG_LENGTHTYPE_PERCENTAGE);
      expect(Math.abs(attachProps2.elmOffset.startOffset.baseVal.valueInSpecifiedUnits)).toBe(50);

      // backLen
      window.SYMBOLS.square.backLen = 24;
      ll.startPlug = 'disc'; // backLen": 5
      ll.endPlug = 'square'; // backLen": 24
      lenAll = window.getAllPathDataLen(attachProps0.elmPath.getPathData());
      expect(Math.abs(attachProps0.elmOffset.startOffset.baseVal.value - (
        // plug: plugBackLen + attachProps.strokeWidth / 2 + fontSize / 4
        5 + attachProps0.strokeWidth / 2 + fontSize / 4
        ))).toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps1.elmOffset.startOffset.baseVal.value - (
        // plug: plugBackLen + attachProps.strokeWidth / 2 + fontSize / 4
        lenAll - (24 + attachProps1.strokeWidth / 2 + fontSize / 4)
        ))).toBeLessThan(TOLERANCE);

      // lineOffset
      ll.setOptions({startPlug: 'behind', size: 8});
      atc0 = window.LeaderLine.pathLabel({text: 'label-0', fontSize: '10px', lineOffset: -4});
      atc1 = window.LeaderLine.pathLabel({text: 'label-1', fontSize: '10px', lineOffset: 8});
      atc2 = window.LeaderLine.pathLabel({text: 'label-2', fontSize: '10px', lineOffset: 16});
      attachProps0 = window.insAttachProps[atc0._id];
      attachProps1 = window.insAttachProps[atc1._id];
      attachProps2 = window.insAttachProps[atc2._id];
      ll.startLabel = atc0;
      ll.endLabel = atc1;
      ll.middleLabel = atc2;
      lenAll = window.getAllPathDataLen(attachProps0.elmPath.getPathData());
      fontSize = 10;
      strokeWidth = 8;
      expect(Math.abs(attachProps0.elmOffset.startOffset.baseVal.value - (
        // no-plug: strokeWidth / 2 + attachProps.strokeWidth / 2 + fontSize / 4
        strokeWidth / 2 + attachProps0.strokeWidth / 2 + fontSize / 4 + (-4)
        ))).toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps1.elmOffset.startOffset.baseVal.value - (
        // plug: plugBackLen + attachProps.strokeWidth / 2 + fontSize / 4
        lenAll - ((24 * 8 / 4 /* DEFAULT_OPTIONS.lineSize */) + attachProps1.strokeWidth / 2 + fontSize / 4) + 8
        ))).toBeLessThan(TOLERANCE);
      expect(Math.abs(attachProps2.elmOffset.startOffset.baseVal.value - (
        // half
        lenAll / 2 + 16
        ))).toBeLessThan(TOLERANCE);

      pageDone();
      done();
    });

  });

});
