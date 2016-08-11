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

  var TOLERANCE = 0.001;

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
    }, 'attachment - ' + titles.shift());
  }

  function matchPathData(a, b) {
    return a != null && b != null && // eslint-disable-line eqeqeq
      a.length === b.length && a.every(function(aSeg, i) {
        var bSeg = b[i];
        return aSeg.type === bSeg.type &&
          aSeg.values.every(function(aSegValue, i) { return Math.abs(aSegValue - bSeg.values[i]) < TOLERANCE; });
      });
  }

  function getRect(x, y, width, height) {
    return {left: x, top: y, width: width, height: height, right: x + width, bottom: y + height};
  }

  describe('life cycle', function() {

    beforeEach(loadBefore);

    it(registerTitle('bind-unbind-remove'), function(done) {
      var props1 = window.insProps[ll._id], log,
        atc1, atc2, attachProps1, attachProps2, ll2, props2;

      atc1 = window.LeaderLine.point({element: document.getElementById('elm1')});
      atc2 = window.LeaderLine.point({element: document.getElementById('elm2')});
      attachProps1 = window.insAttachProps[atc1._id];
      attachProps2 = window.insAttachProps[atc2._id];
      expect(atc1.isRemoved).toBe(false);
      expect(atc2.isRemoved).toBe(false);
      expect(window.insAttachProps[atc1._id] != null).toBe(true); // eslint-disable-line eqeqeq
      expect(window.insAttachProps[atc2._id] != null).toBe(true); // eslint-disable-line eqeqeq

      // bind
      expect(props1.attachments.length).toBe(0);
      expect(attachProps1.lls.length).toBe(0);
      ll.start = atc1;
      expect(props1.attachments.length).toBe(1);
      expect(attachProps1.lls.length).toBe(1);
      expect(atc1.isRemoved).toBe(false);
      expect(window.insAttachProps[atc1._id] != null).toBe(true); // eslint-disable-line eqeqeq

      // unbind -> remove
      traceLog.clear();
      ll.start = document.getElementById('elm1');
      log = traceLog.getTaggedLog('removeAttachment');
      expect(log != null).toBe(true); // eslint-disable-line eqeqeq
      expect(log.length).toBe(0);
      expect(props1.attachments.length).toBe(0);
      expect(atc1.isRemoved).toBe(true);
      expect(window.insAttachProps[atc1._id] != null).toBe(false); // eslint-disable-line eqeqeq

      // 2 ll - 1 atc
      ll.start = atc2;
      ll2 = new window.LeaderLine(atc2, document.getElementById('elm4'));
      props2 = window.insProps[ll2._id];
      expect(props1.attachments.length).toBe(1);
      expect(props2.attachments.length).toBe(1);
      expect(attachProps2.lls.length).toBe(2);
      expect(atc2.isRemoved).toBe(false);
      expect(window.insAttachProps[atc2._id] != null).toBe(true); // eslint-disable-line eqeqeq

      // unbind 1
      traceLog.clear();
      ll.start = document.getElementById('elm1');
      log = traceLog.getTaggedLog('removeAttachment');
      expect(log != null).toBe(false); // eslint-disable-line eqeqeq
      expect(props1.attachments.length).toBe(0);
      expect(props2.attachments.length).toBe(1);
      expect(attachProps2.lls.length).toBe(1);
      expect(atc2.isRemoved).toBe(false);
      expect(window.insAttachProps[atc2._id] != null).toBe(true); // eslint-disable-line eqeqeq

      // unbind 2 -> remove
      traceLog.clear();
      ll2.start = document.getElementById('elm1');
      log = traceLog.getTaggedLog('removeAttachment');
      expect(log != null).toBe(true); // eslint-disable-line eqeqeq
      expect(log.length).toBe(0);
      expect(props1.attachments.length).toBe(0);
      expect(props2.attachments.length).toBe(0);
      expect(atc2.isRemoved).toBe(true);
      expect(window.insAttachProps[atc2._id] != null).toBe(false); // eslint-disable-line eqeqeq

      // remove atc -> unbind
      atc1 = window.LeaderLine.point({element: document.getElementById('elm1')});
      attachProps1 = window.insAttachProps[atc1._id];
      ll.start = atc1;
      ll2.start = atc1;
      expect(props1.attachments.length).toBe(1);
      expect(props2.attachments.length).toBe(1);
      expect(attachProps1.lls.length).toBe(2);
      expect(atc1.isRemoved).toBe(false);
      traceLog.clear();
      atc1.remove();
      log = traceLog.getTaggedLog('LeaderLineAttachment.remove');
      expect(log != null).toBe(true); // eslint-disable-line eqeqeq
      expect(log.length).toBe(0);
      log = traceLog.getTaggedLog('removeAttachment');
      expect(log != null).toBe(true); // eslint-disable-line eqeqeq
      expect(log.length).toBe(0);
      expect(props1.attachments.length).toBe(0);
      expect(props2.attachments.length).toBe(0);
      expect(atc1.isRemoved).toBe(true);
      expect(ll.start).toBe(document.getElementById('elm1'));
      expect(ll2.start).toBe(document.getElementById('elm1'));

      // remove ll -> unbind -> remove atc
      atc1 = window.LeaderLine.point({element: document.getElementById('elm1')});
      atc2 = window.LeaderLine.point({element: document.getElementById('elm2')});
      attachProps1 = window.insAttachProps[atc1._id];
      attachProps2 = window.insAttachProps[atc2._id];
      ll.setOptions({start: atc1, end: atc2});
      expect(props1.attachments.length).toBe(2);
      expect(attachProps1.lls.length).toBe(1);
      expect(attachProps2.lls.length).toBe(1);
      expect(atc1.isRemoved).toBe(false);
      expect(atc2.isRemoved).toBe(false);
      traceLog.clear();
      ll.remove();
      log = traceLog.getTaggedLog('removeAttachment');
      expect(log != null).toBe(true); // eslint-disable-line eqeqeq
      expect(log.length).toBe(0);
      expect(atc1.isRemoved).toBe(true);
      expect(atc2.isRemoved).toBe(true);

      pageDone();
      done();
    });

    it(registerTitle('flow'), function(done) {
      var props1 = window.insProps[ll._id],
        atc1, atc2, attachProps1, attachProps2, ll2, props2;

      traceLog.clear();
      atc1 = window.LeaderLine.area({element: document.getElementById('elm1')});
      expect(traceLog.log).toEqual([
        '<ATTACHMENTS.area.init>', '</ATTACHMENTS.area.init>'
      ]);
      atc2 = window.LeaderLine.area({element: document.getElementById('elm2')});
      attachProps1 = window.insAttachProps[atc1._id];
      attachProps2 = window.insAttachProps[atc2._id];

      // bind
      traceLog.clear();
      ll.start = atc1;
      expect(traceLog.log).toEqual([
        '<ATTACHMENTS.area.bind>', '</ATTACHMENTS.area.bind>',
        '<setOptions>', 'needs.position', '</setOptions>',
        '<updatePosition>',
        '<ATTACHMENTS.area.update>',
        'curStats.strokeWidth=4', 'curStats.elementWidth=100', 'curStats.elementHeight=30',
        'generate-path', 'aplStats.strokeWidth=4', 'aplStats.pathData',
        'x', 'y', 'width', 'height',
        '</ATTACHMENTS.area.update>',
        'position_socketXYSE[0]', 'new-position',
        '</updatePosition>',
        '<updatePath>', 'path_pathData', '</updatePath>',
        '<updateViewBox>', 'x', 'width', 'height', '</updateViewBox>',
        '<updateMask>',
        'maskBGRect_x', 'lineMask_x',
        'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=4',
        '</updateMask>',
        '<update>', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask', '</update>'
      ]);
      expect(props1.events.cur_line_color.length).toBe(1); // addEventHandler
      expect(props1.events.svgShow.length).toBe(1); // addEventHandler

      // unbind -> remove
      traceLog.clear();
      ll.start = document.getElementById('elm1');
      expect(traceLog.log).toEqual([
        '<ATTACHMENTS.area.unbind>', '</ATTACHMENTS.area.unbind>',
        '<removeAttachment>', '<ATTACHMENTS.area.remove>', '</ATTACHMENTS.area.remove>', '</removeAttachment>',
        '<setOptions>', 'needs.position', '</setOptions>',
        '<updatePosition>', 'position_socketXYSE[0]', 'new-position', '</updatePosition>',
        '<updatePath>', 'path_pathData', '</updatePath>',
        '<updateViewBox>', 'x', 'width', 'height', '</updateViewBox>',
        '<updateMask>',
        'maskBGRect_x', 'lineMask_x',
        'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=0',
        '</updateMask>',
        '<update>', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask', '</update>'
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
      expect(attachProps2.lls.length).toBe(2);
      expect(props1.events.cur_line_color.length).toBe(1); // addEventHandler
      expect(props1.events.svgShow.length).toBe(1); // addEventHandler
      expect(props2.events.cur_line_color.length).toBe(1); // addEventHandler
      expect(props2.events.svgShow.length).toBe(1); // addEventHandler

      // unbind 1
      traceLog.clear();
      ll.start = document.getElementById('elm1');
      expect(traceLog.log).toEqual([
        '<ATTACHMENTS.area.unbind>', '</ATTACHMENTS.area.unbind>',
        '<setOptions>', 'needs.position', '</setOptions>',
        '<updatePosition>', 'position_socketXYSE[0]', 'new-position', '</updatePosition>',
        '<updatePath>', 'path_pathData', '</updatePath>',
        '<updateViewBox>', 'x', 'y', 'width', 'height', '</updateViewBox>',
        '<updateMask>',
        'maskBGRect_x', 'maskBGRect_y', 'lineMask_x', 'lineMask_y',
        'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=0',
        '</updateMask>',
        '<update>', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask', '</update>'
      ]);
      expect(props1.attachments.length).toBe(0);
      expect(props2.attachments.length).toBe(1);
      expect(attachProps2.lls.length).toBe(1);
      expect(props1.events.cur_line_color.length).toBe(0); // removeEventHandler
      expect(props1.events.svgShow.length).toBe(0); // removeEventHandler
      expect(props2.events.cur_line_color.length).toBe(1);
      expect(props2.events.svgShow.length).toBe(1);

      // unbind 2 -> remove
      traceLog.clear();
      ll2.start = document.getElementById('elm1');
      expect(traceLog.log).toEqual([
        '<ATTACHMENTS.area.unbind>', '</ATTACHMENTS.area.unbind>',
        '<removeAttachment>', '<ATTACHMENTS.area.remove>', '</ATTACHMENTS.area.remove>', '</removeAttachment>',
        '<setOptions>', 'needs.position', '</setOptions>',
        '<updatePosition>', 'position_socketXYSE[0]', 'new-position', '</updatePosition>',
        '<updatePath>', 'path_pathData', '</updatePath>',
        '<updateViewBox>', 'x', 'y', 'width', 'height', '</updateViewBox>',
        '<updateMask>',
        'maskBGRect_x', 'maskBGRect_y', 'lineMask_x', 'lineMask_y',
        'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=0',
        '</updateMask>',
        '<update>', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask', '</update>'
      ]);
      expect(props1.attachments.length).toBe(0);
      expect(props2.attachments.length).toBe(0);
      expect(atc2.isRemoved).toBe(true);
      expect(props1.events.cur_line_color.length).toBe(0); // removeEventHandler
      expect(props1.events.svgShow.length).toBe(0); // removeEventHandler
      expect(props2.events.cur_line_color.length).toBe(0); // removeEventHandler
      expect(props2.events.svgShow.length).toBe(0); // removeEventHandler

      // remove atc -> unbind
      atc1 = window.LeaderLine.area({element: document.getElementById('elm1')});
      attachProps1 = window.insAttachProps[atc1._id];
      ll.start = atc1;
      ll2.start = atc1;
      expect(props1.attachments.length).toBe(1);
      expect(props2.attachments.length).toBe(1);
      expect(attachProps1.lls.length).toBe(2);
      expect(props1.events.cur_line_color.length).toBe(1);
      expect(props1.events.svgShow.length).toBe(1);
      expect(props2.events.cur_line_color.length).toBe(1);
      expect(props2.events.svgShow.length).toBe(1);
      traceLog.clear();
      atc1.remove();
      expect(traceLog.log).toEqual([
        '<LeaderLineAttachment.remove>',
        '<ATTACHMENTS.point.removeOption>',
        '<ATTACHMENTS.area.unbind>', '</ATTACHMENTS.area.unbind>',
        '<setOptions>', 'needs.position', '</setOptions>',
        '<updatePosition>', 'position_socketXYSE[0]', 'new-position', '</updatePosition>',
        '<updatePath>', 'path_pathData', '</updatePath>',
        '<updateViewBox>', 'x', 'width', 'height', '</updateViewBox>',
        '<updateMask>',
        'maskBGRect_x', 'lineMask_x', 'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=0',
        '</updateMask>',
        '<update>', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask', '</update>',
        '</ATTACHMENTS.point.removeOption>',
        '<ATTACHMENTS.point.removeOption>',
        '<ATTACHMENTS.area.unbind>', '</ATTACHMENTS.area.unbind>',
        '<removeAttachment>', '<ATTACHMENTS.area.remove>', '</ATTACHMENTS.area.remove>', '</removeAttachment>',
        '<setOptions>', 'needs.position', '</setOptions>',
        '<updatePosition>', 'position_socketXYSE[0]', 'new-position', '</updatePosition>',
        '<updatePath>', 'path_pathData', '</updatePath>',
        '<updateViewBox>', 'x', 'width', 'height', '</updateViewBox>',
        '<updateMask>',
        'maskBGRect_x', 'lineMask_x', 'capsMaskAnchor_pathDataSE[0]', 'capsMaskAnchor_strokeWidthSE[0]=0',
        '</updateMask>',
        '<update>', 'updated.position', 'updated.path', 'updated.viewBox', 'updated.mask', '</update>',
        '</ATTACHMENTS.point.removeOption>',
        '</LeaderLineAttachment.remove>'
      ]);
      expect(props1.attachments.length).toBe(0);
      expect(props2.attachments.length).toBe(0);
      expect(atc1.isRemoved).toBe(true);
      expect(props1.events.cur_line_color.length).toBe(0);
      expect(props1.events.svgShow.length).toBe(0);
      expect(props2.events.cur_line_color.length).toBe(0);
      expect(props2.events.svgShow.length).toBe(0);

      // remove ll -> unbind -> remove atc
      atc1 = window.LeaderLine.area({element: document.getElementById('elm1')});
      atc2 = window.LeaderLine.area({element: document.getElementById('elm2')});
      attachProps1 = window.insAttachProps[atc1._id];
      attachProps2 = window.insAttachProps[atc2._id];
      ll.setOptions({start: atc1, end: atc2});
      expect(props1.attachments.length).toBe(2);
      expect(attachProps1.lls.length).toBe(1);
      expect(attachProps2.lls.length).toBe(1);
      expect(props1.events.cur_line_color.length).toBe(2);
      expect(props1.events.svgShow.length).toBe(2);
      traceLog.clear();
      ll.remove();
      expect(traceLog.log).toEqual([
        '<ATTACHMENTS.area.unbind>', '</ATTACHMENTS.area.unbind>',
        '<removeAttachment>', '<ATTACHMENTS.area.remove>', '</ATTACHMENTS.area.remove>', '</removeAttachment>',
        '<ATTACHMENTS.area.unbind>', '</ATTACHMENTS.area.unbind>',
        '<removeAttachment>', '<ATTACHMENTS.area.remove>', '</ATTACHMENTS.area.remove>', '</removeAttachment>'
      ]);
      expect(atc1.isRemoved).toBe(true);
      expect(atc2.isRemoved).toBe(true);
      expect(props1.events.cur_line_color.length).toBe(0);
      expect(props1.events.svgShow.length).toBe(0);

      pageDone();
      done();
    });

  });

  describe('ATTACHMENTS', function() {

    beforeEach(loadBefore);

    it(registerTitle('point-attachOptions'), function(done) {
      var props = window.insProps[ll._id],
        atc;

      // values
      atc = window.LeaderLine.point({element: document.getElementById('elm1'), x: 5, y: 6});
      ll.start = atc;
      expect(props.curStats.position_socketXYSE[0].x).toBe(6);
      expect(props.curStats.position_socketXYSE[0].y).toBe(8);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        // elm1 left: 1px; top: 2px;
        {type: 'M', values: [6, 8]},
        {type: 'L', values: [6, 8]},
        {type: 'L', values: [6, 8]},
        {type: 'L', values: [6, 8]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      document.getElementById('iframe1').style.borderWidth = '0';
      // iframe1 left: 500px; top: 50px; > elm2 left: 104px; top: 108px;
      atc = window.LeaderLine.point({
        element: document.getElementById('iframe1').contentDocument.getElementById('elm2'), x: 5, y: 6});
      ll.start = atc;
      expect(props.curStats.position_socketXYSE[0].x).toBe(609);
      expect(props.curStats.position_socketXYSE[0].y).toBe(164);

      // Percent
      atc = window.LeaderLine.point({element: document.getElementById('elm1'), x: '10%', y: '80%'});
      ll.start = atc;
      expect(props.curStats.position_socketXYSE[0].x).toBe(11);
      expect(props.curStats.position_socketXYSE[0].y).toBe(26);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        // elm1 left: 1px; top: 2px;
        {type: 'M', values: [11, 26]},
        {type: 'L', values: [11, 26]},
        {type: 'L', values: [11, 26]},
        {type: 'L', values: [11, 26]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      // outside of element
      atc = window.LeaderLine.point({element: document.getElementById('elm1'), x: -1, y: -2});
      ll.start = atc;
      expect(props.curStats.position_socketXYSE[0].x).toBe(0);
      expect(props.curStats.position_socketXYSE[0].y).toBe(0);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        // elm1 left: 1px; top: 2px;
        {type: 'M', values: [0, 0]},
        {type: 'L', values: [0, 0]},
        {type: 'L', values: [0, 0]},
        {type: 'L', values: [0, 0]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      // outside of element Percent
      atc = window.LeaderLine.point({element: document.getElementById('elm1'), x: '150%', y: '180%'});
      ll.start = atc;
      expect(props.curStats.position_socketXYSE[0].x).toBe(151);
      expect(props.curStats.position_socketXYSE[0].y).toBe(56);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        // elm1 left: 1px; top: 2px;
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

    it(registerTitle('area-attachOptions'), function(done) {
      var props = window.insProps[ll._id],
        atc;

      // rect
      atc = window.LeaderLine.area({element: document.getElementById('elm1'),
        x: 5, y: 6, width: 7, height: 8, size: 0});
      ll.start = atc;
      expect(props.curStats.position_socketXYSE[0].x).toBe(9.5);
      expect(props.curStats.position_socketXYSE[0].y).toBe(16);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        // elm1 left: 1px; top: 2px;
        {type: 'M', values: [6, 8]},
        {type: 'L', values: [13, 8]},
        {type: 'L', values: [13, 16]},
        {type: 'L', values: [6, 16]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      document.getElementById('iframe1').style.borderWidth = '0';
      // iframe1 left: 500px; top: 50px; > elm2 left: 104px; top: 108px;
      atc = window.LeaderLine.area({
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
      atc = window.LeaderLine.area({element: document.getElementById('elm1'),
        x: '10%', y: '80%', width: '20%', height: '50%', size: 0});
      ll.start = atc;
      expect(props.curStats.position_socketXYSE[0].x).toBe(31);
      expect(props.curStats.position_socketXYSE[0].y).toBe(33.5);
      expect(props.curStats.capsMaskAnchor_pathDataSE[0]).toEqual([
        // elm1 left: 1px; top: 2px;
        {type: 'M', values: [11, 26]},
        {type: 'L', values: [31, 26]},
        {type: 'L', values: [31, 41]},
        {type: 'L', values: [11, 41]},
        {type: 'Z', values: []}
      ]);
      expect(props.curStats.capsMaskAnchor_strokeWidthSE[0]).toBe(0);

      pageDone();
      done();
    });

    it(registerTitle('area-event auto 1 ll'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps;

      atc = window.LeaderLine.area({element: document.getElementById('elm1'),
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

    it(registerTitle('area-event auto 2 ll'), function(done) {
      var props = window.insProps[ll._id],
        ll2, props2, atc, attachProps;

      atc = window.LeaderLine.area({element: document.getElementById('elm1')});
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

    it(registerTitle('area-event svgShow 1 ll'), function(done) {
      var props = window.insProps[ll._id],
        atc, attachProps;

      atc = window.LeaderLine.area({element: document.getElementById('elm1')});
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

    it(registerTitle('area-event svgShow 2 ll'), function(done) {
      var props = window.insProps[ll._id],
        ll2, props2, atc, attachProps;

      atc = window.LeaderLine.area({element: document.getElementById('elm1')});
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
              expect(attachProps.lls.length).toBe(1);
              expect(attachProps.isShown).toBe(false);
              expect(attachProps.svg.style.visibility).toBe('hidden');
              pageDone();
              done();
            }, 10);
          }, 100);
        }, 100);
      }, 10);
    });

    it(registerTitle('area-rect'), function(done) {
      var props = window.insProps[ll._id], atc,
        elmX = 1, elmY = 2, elmWidth = 100, elmHeight = 30, // elm1
        rect, r, offset, padding;

      // size: 0, radius: 0
      atc = window.LeaderLine.area({element: document.getElementById('elm1'),
        x: 5, y: 6, width: 7, height: 8, size: 0});
      ll.start = atc;
      rect = getRect(elmX + 5, elmY + 6, 7, 8);
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
      atc = window.LeaderLine.area({element: document.getElementById('elm1'),
        x: 5, y: 6, width: 7, height: 8, size: 2});
      ll.start = atc;
      rect = getRect(elmX + 5, elmY + 6, 7, 8);
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
      atc = window.LeaderLine.area({element: document.getElementById('elm1'),
        x: '10%', y: '80%', width: '20%', height: '50%', size: 5});
      ll.start = atc;
      rect = getRect(elmX + elmWidth * 0.1, elmY + elmHeight * 0.8, elmWidth * 0.2, elmHeight * 0.5);
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
      atc = window.LeaderLine.area({element: document.getElementById('elm1'),
        x: 0, y: 0, width: '100%', height: '100%', size: 0, radius: r});
      ll.start = atc;
      offset = r / Math.SQRT2;
      padding = r - offset;
      rect = getRect(elmX, elmY, elmWidth, elmHeight);
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
      atc = window.LeaderLine.area({element: document.getElementById('elm1'),
        x: 0, y: 0, width: '100%', height: '100%', size: 4, radius: r});
      ll.start = atc;
      offset = (r - 2) / Math.SQRT2;
      padding = r - offset;
      rect = getRect(elmX, elmY, elmWidth, elmHeight);
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
      expect(Math.abs(props.curStats.position_socketXYSE[0].y -
        (rect.top + rect.height / 2))).toBeLessThan(TOLERANCE);

      pageDone();
      done();
    });

    it(registerTitle('area-circle'), function(done) {
      var props = window.insProps[ll._id], atc,
        elmX = 1, elmY = 2, // elm1
        rect, r, offset, padding,
        rx, ry, offsetX, offsetY, paddingX, paddingY;

      // size: 0, width: 10, height: 10
      atc = window.LeaderLine.area({element: document.getElementById('elm1'), shape: 'circle',
        x: 5, y: 6, width: 10, height: 10, size: 0});
      ll.start = atc;
      r = 5 * Math.SQRT2;
      offset = 5;
      padding = r - offset;
      rect = getRect(elmX + 5, elmY + 6, 10, 10);
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
      atc = window.LeaderLine.area({element: document.getElementById('elm1'), shape: 'circle',
        x: 5, y: 6, width: 20, height: 10, size: 0});
      ll.start = atc;
      rx = 10 * Math.SQRT2;
      ry = 5 * Math.SQRT2;
      offsetX = 10;
      offsetY = 5;
      paddingX = rx - offsetX;
      paddingY = ry - offsetY;
      rect = getRect(elmX + 5, elmY + 6, 20, 10);
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
      atc = window.LeaderLine.area({element: document.getElementById('elm1'), shape: 'circle',
        x: 5, y: 6, width: 10, height: 10, size: 0});
      ll.start = atc;
      r = 5 * Math.SQRT2;
      offset = 5;
      padding = r - offset;
      rect = getRect(elmX + 5, elmY + 6, 10, 10);
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
      atc = window.LeaderLine.area({element: document.getElementById('elm1'), shape: 'circle',
        x: 5, y: 6, width: 10, height: 10, size: 4});
      ll.start = atc;
      r = 5 * Math.SQRT2 + 2;
      offset = 5;
      padding = r - offset;
      rect = getRect(elmX + 5, elmY + 6, 10, 10);
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

      pageDone();
      done();
    });

  });

});
