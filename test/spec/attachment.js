/* eslint-env jasmine */
/* global loadPage:false, customMatchers:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('attachment', function() {
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
    }, 'attachment - ' + titles.shift());
  }

  describe('life cycle', function() {

    beforeEach(loadBefore);

    it(registerTitle('bind-unbind-remove'), function() {
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
    });

    it(registerTitle('flow'), function() {
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
    });

  });

  describe('ATTACHMENTS', function() {

    beforeEach(loadBefore);

    it(registerTitle('point-attachOptions'), function() {
      var props = window.insProps[ll._id],
        atc;

      // elm1 left: 1px; top: 2px;
      atc = window.LeaderLine.point({element: document.getElementById('elm1'), x: 5, y: 6});
      ll.start = atc;
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
      atc = window.LeaderLine.point({
        element: document.getElementById('iframe1').contentDocument.getElementById('elm2'), x: 5, y: 6});
      ll.start = atc;
      expect(props.curStats.position_socketXYSE[0].x).toBe(609);
      expect(props.curStats.position_socketXYSE[0].y).toBe(164);

      // Percent
      // elm1 left: 1px; top: 2px;
      atc = window.LeaderLine.point({element: document.getElementById('elm1'), x: '10%', y: '80%'});
      ll.start = atc;
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

      // outside of element
      // elm1 left: 1px; top: 2px;
      atc = window.LeaderLine.point({element: document.getElementById('elm1'), x: -1, y: -2});
      ll.start = atc;
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
      // elm1 left: 1px; top: 2px;
      atc = window.LeaderLine.point({element: document.getElementById('elm1'), x: '150%', y: '180%'});
      ll.start = atc;
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
    });

    it(registerTitle('area-attachOptions'), function() {
      var props = window.insProps[ll._id],
        atc;

      // elm1 left: 1px; top: 2px;
      atc = window.LeaderLine.area({element: document.getElementById('elm1'),
        x: 5, y: 6, width: 7, height: 8, size: 0});
      ll.start = atc;
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
      // elm1 left: 1px; top: 2px;
      atc = window.LeaderLine.area({element: document.getElementById('elm1'),
        x: '10%', y: '80%', width: '20%', height: '50%', size: 0});
      ll.start = atc;
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

      pageDone();
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

  });

});
