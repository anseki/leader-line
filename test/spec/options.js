/* eslint-env jasmine */
/* global loadPage:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('options', function() {
  'use strict';

  it('should run the valid flow', function(done) {

    loadPage('spec/options/options.html', function(window, document) {
      var ll = new window.LeaderLine(document.getElementById('elm1'), document.getElementById('elm2'));

      // ============================ start, end
      window.traceLog = [];
      ll.start = document.getElementById('elm1');
      expect(window.traceLog).toEqual(['<setOptions>']);

      window.traceLog = [];
      ll.start = document.getElementById('elm3');
      expect(window.traceLog).toEqual([
        '<setOptions>',
        '<position>', '[update]',
        '[setPathData]', '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height',
        '[mask] startMaskBBox'
      ]);

      window.traceLog = [];
      ll.end = document.getElementById('iframe1').contentDocument.getElementById('elm2');
      expect(window.traceLog).toEqual([
        '<setOptions>',
        '<position>', '[update]',
        '[setPathData]', '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height',
        '[mask] startMaskBBox'
      ]);

      window.traceLog = [];
      ll.start = document.getElementById('iframe1').contentDocument.getElementById('elm3');
      expect(window.traceLog).toEqual([
        '<setOptions>',
        '<bindWindow>',
        '<setStyles>', '[color] coral', '[size] 4',
        '<setPlugs>', '[startPlug] behind', '[endPlug] arrow1', '[endPlugColor] coral', '[endPlugSize] 1',
        '<position>', '[update]',
        '[setPathData]', '[viewBox] x', '[viewBox] y', '[viewBox] width', '[viewBox] height',
        '[mask] startMaskBBox'
      ]);



      window.traceLog = [];
      ll.color = 'blue';
      expect(window.traceLog).toEqual([
        '<setOptions>', '<setStyles>', '[color] blue', '<setPlugs>', '[endPlugColor] blue'
      ]);

      done();
    }, 'should run the valid flow');

  });

});
