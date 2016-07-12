/* eslint-env jasmine */
/* global getSource:false, testCases:false */

describe('func-PATH_GRID', function() {
  'use strict';

  var func;

  /* eslint-disable no-unused-vars, indent */
  // ================ context
  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    PATH_STRAIGHT = 1, PATH_ARC = 2, PATH_FLUID = 3, PATH_MAGNET = 4, PATH_GRID = 5,
    MIN_GRAVITY = 80, MIN_GRAVITY_SIZE = 4, MIN_GRAVITY_R = 5,
    MIN_OH_GRAVITY = 120, MIN_OH_GRAVITY_OH = 8, MIN_OH_GRAVITY_R = 3.75,
    MIN_ADJUST_LEN = 10, MIN_GRID_LEN = 30,

    // context in updatePosition()
    curSocketXYSE, curSocketGravitySE, pathList;
    function socketXY2Point(socketXY) { return {x: socketXY.x, y: socketXY.y}; }
  // ================ /context
  /* eslint-enable no-unused-vars, indent */

  function initContext(socketXYSE, socketGravitySE) {
    curSocketXYSE = socketXYSE;
    curSocketGravitySE = socketGravitySE;
    pathList = [];
  }

  beforeAll(function(done) {
    getSource('./spec/func/PATH_GRID', function(error, source) {
      if (error) { throw error; }
      func = eval('(' + source + ')'); // eslint-disable-line no-eval
      done();
    });
  });

  testCases.forEach(function(testCase) {
    it(testCase.title, function() {
      initContext(testCase.args.socketXYSE, testCase.args.socketGravitySE);
      func();
      expect(pathList).toEqual(testCase.expected.pathList);
    });
  });

});
