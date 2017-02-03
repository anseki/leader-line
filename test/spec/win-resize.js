/* eslint-env jasmine */
/* global loadPage:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('window resize', function() {
  'use strict';

  var window, document, traceLog, pageDone, frame, orgWidth, orgHeight, pathDataHasChanged,
    iframeDoc, ll1, ll2, ll3, ll4;

  beforeAll(function(beforeDone) {
    loadPage('spec/win-resize/page.html', function(frmWindow, frmDocument, body, done) {
      window = frmWindow;
      document = frmDocument;
      frame = window.frameElement;
      orgWidth = frame.style.width;
      orgHeight = frame.style.height;

      iframeDoc = document.getElementById('iframe1').contentDocument;
      ll1 = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm2'));
      ll2 = new window.LeaderLine(document.getElementById('elm3'), document.getElementById('elm4'));
      ll3 = new window.LeaderLine(iframeDoc.getElementById('elm1'), iframeDoc.getElementById('elm2'));
      ll4 = new window.LeaderLine(iframeDoc.getElementById('elm3'), iframeDoc.getElementById('elm4'));

      traceLog = window.traceLog;
      traceLog.enabled = true;
      pathDataHasChanged = window.pathDataHasChanged;
      pageDone = done;
      if (window.IS_TRIDENT) { // Trident fires first `resize` event when a page was loaded.
        setTimeout(beforeDone, 1000 / 60);
      } else {
        beforeDone();
      }
    }, 'window resize');
  });

  afterAll(function() {
    frame.style.width = orgWidth;
    frame.style.height = orgHeight;
    pageDone();
  });

  it('update position when window is resized', function(done) {
    var pathData1, pathData2, pathData3, pathData4, frameBBox;

    pathData1 = window.insProps[ll1._id].linePath.getPathData();
    pathData2 = window.insProps[ll2._id].linePath.getPathData();
    pathData3 = window.insProps[ll3._id].linePath.getPathData();
    pathData4 = window.insProps[ll4._id].linePath.getPathData();

    frameBBox = frame.getBoundingClientRect();
    traceLog.clear();
    frame.style.width = (frameBBox.width - 50) + 'px';
    setTimeout(function() {
      expect(traceLog.getTaggedLog('positionByWindowResize')).toEqual(['id=1', 'id=2', 'id=3', 'id=4']);
      expect(pathDataHasChanged(pathData1, window.insProps[ll1._id].linePath.getPathData())).toBe(true);
      expect(pathDataHasChanged(pathData2, window.insProps[ll2._id].linePath.getPathData())).toBe(true);
      expect(pathDataHasChanged(pathData3, window.insProps[ll3._id].linePath.getPathData())).toBe(true);
      expect(pathDataHasChanged(pathData4, window.insProps[ll4._id].linePath.getPathData())).toBe(true);
      done();
    }, 100);
  });

  it('no-update position when sub window is resized', function(done) {
    var pathData1, pathData2, pathData3, pathData4;

    pathData1 = window.insProps[ll1._id].linePath.getPathData();
    pathData2 = window.insProps[ll2._id].linePath.getPathData();
    pathData3 = window.insProps[ll3._id].linePath.getPathData();
    pathData4 = window.insProps[ll4._id].linePath.getPathData();

    traceLog.clear();
    document.getElementById('iframe1').style.width = '50%';
    setTimeout(function() {
      expect(traceLog.getTaggedLog('positionByWindowResize') == null).toBe(true);
      expect(pathDataHasChanged(pathData1, window.insProps[ll1._id].linePath.getPathData())).toBe(false);
      expect(pathDataHasChanged(pathData2, window.insProps[ll2._id].linePath.getPathData())).toBe(false);
      expect(pathDataHasChanged(pathData3, window.insProps[ll3._id].linePath.getPathData())).toBe(false);
      expect(pathDataHasChanged(pathData4, window.insProps[ll4._id].linePath.getPathData())).toBe(false);
      done();
    }, 100);
  });

  it('update position all even if it is not changed when window is resized', function(done) {
    var pathData1, pathData2, pathData3, pathData4, frameBBox,
      iframeStyle = document.getElementById('iframe1').style;

    iframeStyle.width = '400px';
    iframeStyle.height = '500px';
    ll3.position();
    ll4.position();
    // The elements in iframe are not moved.

    pathData1 = window.insProps[ll1._id].linePath.getPathData();
    pathData2 = window.insProps[ll2._id].linePath.getPathData();
    pathData3 = window.insProps[ll3._id].linePath.getPathData();
    pathData4 = window.insProps[ll4._id].linePath.getPathData();

    frameBBox = frame.getBoundingClientRect();
    traceLog.clear();
    frame.style.width = (frameBBox.width - 50) + 'px';
    setTimeout(function() {
      expect(traceLog.getTaggedLog('positionByWindowResize')).toEqual(['id=1', 'id=2', 'id=3', 'id=4']);
      expect(traceLog.getTaggedLog('updatePosition')).toEqual([
        'position_socketXYSE[0]', 'position_socketXYSE[1]', 'new-position', // ll1
        'position_socketXYSE[0]', 'position_socketXYSE[1]', 'new-position', // ll2
        'not-updated', 'not-updated' // ll3, ll4
      ]);
      expect(pathDataHasChanged(pathData1, window.insProps[ll1._id].linePath.getPathData())).toBe(true);
      expect(pathDataHasChanged(pathData2, window.insProps[ll2._id].linePath.getPathData())).toBe(true);
      expect(pathDataHasChanged(pathData3, window.insProps[ll3._id].linePath.getPathData())).toBe(false); // No change
      expect(pathDataHasChanged(pathData4, window.insProps[ll4._id].linePath.getPathData())).toBe(false); // No change
      done();
    }, 100);
  });

  it('disabled positionByWindowResize', function(done) {
    var pathData1, pathData2, pathData3, pathData4, frameBBox,
      elm1 = document.getElementById('elm1'), elm2 = document.getElementById('elm2'), elm1Left, elm2Left;

    pathData1 = window.insProps[ll1._id].linePath.getPathData();
    pathData2 = window.insProps[ll2._id].linePath.getPathData();
    pathData3 = window.insProps[ll3._id].linePath.getPathData();
    pathData4 = window.insProps[ll4._id].linePath.getPathData();
    elm1Left = elm1.getBoundingClientRect().left;
    elm2Left = elm2.getBoundingClientRect().left;

    frameBBox = frame.getBoundingClientRect();
    traceLog.clear();
    window.LeaderLine.positionByWindowResize = false;
    frame.style.width = (frameBBox.width + 70) + 'px';
    setTimeout(function() {
      expect(elm1.getBoundingClientRect().left).not.toBe(elm1Left);
      expect(elm2.getBoundingClientRect().left).not.toBe(elm2Left);
      expect(traceLog.getTaggedLog('positionByWindowResize')).toEqual([]);
      expect(pathDataHasChanged(pathData1, window.insProps[ll1._id].linePath.getPathData())).toBe(false);
      expect(pathDataHasChanged(pathData2, window.insProps[ll2._id].linePath.getPathData())).toBe(false);
      expect(pathDataHasChanged(pathData3, window.insProps[ll3._id].linePath.getPathData())).toBe(false);
      expect(pathDataHasChanged(pathData4, window.insProps[ll4._id].linePath.getPathData())).toBe(false);
      done();
    }, 100);
  });
});
