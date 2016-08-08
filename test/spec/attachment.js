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

  });

});
