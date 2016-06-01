/* eslint-env jasmine */
/* global getSource:false */

describe('func-PATH_GRID', function() {
  'use strict';

  var func;

  // ================ context
  /* eslint-disable no-unused-vars, indent */
  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    PATH_STRAIGHT = 1, PATH_ARC = 2, PATH_FLUID = 3, PATH_MAGNET = 4, PATH_GRID = 5,
    MIN_GRAVITY = 80, MIN_GRAVITY_SIZE = 4, MIN_GRAVITY_R = 5,
    MIN_OH_GRAVITY = 120, MIN_OH_GRAVITY_OH = 8, MIN_OH_GRAVITY_R = 3.75,
    MIN_ADJUST_LEN = 10, MIN_GRID_LEN = 30,

    props, options, pathSegs;

    function socketXY2Point(socketXY) { return {x: socketXY.x, y: socketXY.y}; }
  /* eslint-enable no-unused-vars, indent */
  // ================ /context

  beforeAll(function(done) {
    getSource('./spec/functions/PATH_GRID', function(error, source) {
      if (error) { throw error; }
      func = eval('(' + source + ')'); // eslint-disable-line no-eval
      done();
    });
  });

  it('cases by test/grid/cases.html', function() {
    options = {socketGravitySE: []};

    // 1-1
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 200, y: 210, socketId: SOCKET_TOP}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 200, y: 60}],
      [{x: 200, y: 60}, {x: 200, y: 210}]
    ]);

    // 1-2 on axis
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 200, y: 90, socketId: SOCKET_TOP}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 200, y: 60}],
      [{x: 200, y: 60}, {x: 200, y: 90}]
    ]);

    // 1-3 on axis
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 80, y: 210, socketId: SOCKET_TOP}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 80, y: 60}],
      [{x: 80, y: 60}, {x: 80, y: 210}]
    ]);

    // 1-4 same coordinates
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 80, y: 90, socketId: SOCKET_TOP}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 80, y: 60}],
      [{x: 80, y: 60}, {x: 80, y: 90}]
    ]);

    // 2-1
    props = {socketXYSE: [
      {x: 50, y: 210, socketId: SOCKET_RIGHT},
      {x: 200, y: 60, socketId: SOCKET_TOP}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 210}, {x: 125, y: 210}],
      [{x: 125, y: 210}, {x: 125, y: 30}],
      [{x: 125, y: 30}, {x: 200, y: 30}],
      [{x: 200, y: 30}, {x: 200, y: 60}]
    ]);

    // 2-2 on axis
    props = {socketXYSE: [
      {x: 50, y: 210, socketId: SOCKET_RIGHT},
      {x: 80, y: 60, socketId: SOCKET_TOP}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 210}, {x: 110, y: 210}],
      [{x: 110, y: 210}, {x: 110, y: 30}],
      [{x: 110, y: 30}, {x: 80, y: 30}],
      [{x: 80, y: 30}, {x: 80, y: 60}]
    ]);

    // 2-1 (close)
    props = {socketXYSE: [
      {x: 50, y: 210, socketId: SOCKET_RIGHT},
      {x: 200, y: 225, socketId: SOCKET_TOP}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 210}, {x: 125, y: 210}],
      [{x: 125, y: 210}, {x: 125, y: 195}],
      [{x: 125, y: 195}, {x: 200, y: 195}],
      [{x: 200, y: 195}, {x: 200, y: 225}]
    ]);

    // 2-2 (close)
    props = {socketXYSE: [
      {x: 50, y: 210, socketId: SOCKET_RIGHT},
      {x: 95, y: 225, socketId: SOCKET_TOP}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 210}, {x: 87.5, y: 210}],
      [{x: 87.5, y: 210}, {x: 87.5, y: 225}],
      [{x: 87.5, y: 225}, {x: 125, y: 225}],
      [{x: 125, y: 225}, {x: 125, y: 195}],
      [{x: 125, y: 195}, {x: 95, y: 195}],
      [{x: 95, y: 195}, {x: 95, y: 225}]
    ]);

    // 3
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_TOP},
      {x: 200, y: 210, socketId: SOCKET_RIGHT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 50, y: 30}],
      [{x: 50, y: 30}, {x: 230, y: 30}],
      [{x: 230, y: 30}, {x: 230, y: 210}],
      [{x: 230, y: 210}, {x: 200, y: 210}]
    ]);

    // 3 (close)
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_TOP},
      {x: 35, y: 45, socketId: SOCKET_RIGHT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 50, y: 15}],
      [{x: 50, y: 15}, {x: 80, y: 15}],
      [{x: 80, y: 15}, {x: 80, y: 45}],
      [{x: 80, y: 45}, {x: 35, y: 45}]
    ]);

    // 4-1
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 200, y: 210, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 125, y: 60}],
      [{x: 125, y: 60}, {x: 125, y: 210}],
      [{x: 125, y: 210}, {x: 200, y: 210}]
    ]);

    // 4-2 on axis
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 200, y: 60, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 200, y: 60}]
    ]);

    // 4-3 on cross axis
    props = {socketXYSE: [
      {x: 90, y: 60, socketId: SOCKET_RIGHT},
      {x: 150, y: 210, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 90, y: 60}, {x: 120, y: 60}],
      [{x: 120, y: 60}, {x: 120, y: 210}],
      [{x: 120, y: 210}, {x: 150, y: 210}]
    ]);

    // 4-4 same coordinates
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 110, y: 60, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 110, y: 60}]
    ]);

    // 4-5 on cross axis
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 210, socketId: SOCKET_RIGHT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 80, y: 60}],
      [{x: 80, y: 60}, {x: 80, y: 210}],
      [{x: 80, y: 210}, {x: 50, y: 210}]
    ]);

    // 4-6 same coordinates
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 60, socketId: SOCKET_RIGHT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 50, y: 60}]
    ]);

    // 5-1
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_LEFT},
      {x: 200, y: 210, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 20, y: 60}],
      [{x: 20, y: 60}, {x: 20, y: 210}],
      [{x: 20, y: 210}, {x: 200, y: 210}]
    ]);

    // 5-2 on axis
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_LEFT},
      {x: 200, y: 60, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 20, y: 60}],
      [{x: 20, y: 60}, {x: 20, y: 90}],
      [{x: 20, y: 90}, {x: 110, y: 90}],
      [{x: 110, y: 90}, {x: 110, y: 60}],
      [{x: 110, y: 60}, {x: 200, y: 60}]
    ]);

    // 5-1 (close 1)
    props = {socketXYSE: [
      {x: 185, y: 60, socketId: SOCKET_LEFT},
      {x: 200, y: 210, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 185, y: 60}, {x: 140, y: 60}],
      [{x: 140, y: 60}, {x: 140, y: 210}],
      [{x: 140, y: 210}, {x: 200, y: 210}]
    ]);

    // 5-1 (close 2)
    props = {socketXYSE: [
      {x: 185, y: 195, socketId: SOCKET_LEFT},
      {x: 200, y: 210, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 185, y: 195}, {x: 140, y: 195}],
      [{x: 140, y: 195}, {x: 140, y: 225}],
      [{x: 140, y: 225}, {x: 170, y: 225}],
      [{x: 170, y: 225}, {x: 170, y: 210}],
      [{x: 170, y: 210}, {x: 200, y: 210}]
    ]);

    // 6-1
    props = {socketXYSE: [
      {x: 200, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 210, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 200, y: 60}, {x: 230, y: 60}],
      [{x: 230, y: 60}, {x: 230, y: 135}],
      [{x: 230, y: 135}, {x: 20, y: 135}],
      [{x: 20, y: 135}, {x: 20, y: 210}],
      [{x: 20, y: 210}, {x: 50, y: 210}]
    ]);

    // 6-2 on axis
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_LEFT},
      {x: 200, y: 60, socketId: SOCKET_RIGHT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 20, y: 60}],
      [{x: 20, y: 60}, {x: 20, y: 90}],
      [{x: 20, y: 90}, {x: 230, y: 90}],
      [{x: 230, y: 90}, {x: 230, y: 60}],
      [{x: 230, y: 60}, {x: 200, y: 60}]
    ]);

    // 6-1 (close 1)
    props = {socketXYSE: [
      {x: 200, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 75, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 200, y: 60}, {x: 230, y: 60}],
      [{x: 230, y: 60}, {x: 230, y: 120}],
      [{x: 230, y: 120}, {x: 20, y: 120}],
      [{x: 20, y: 120}, {x: 20, y: 75}],
      [{x: 20, y: 75}, {x: 50, y: 75}]
    ]);

    // 6-1 (close 2)
    props = {socketXYSE: [
      {x: 35, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 75, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 35, y: 60}, {x: 65, y: 60}],
      [{x: 65, y: 60}, {x: 65, y: 120}],
      [{x: 65, y: 120}, {x: 20, y: 120}],
      [{x: 20, y: 120}, {x: 20, y: 75}],
      [{x: 20, y: 75}, {x: 50, y: 75}]
    ]);

    // 6-1 (close 3)
    props = {socketXYSE: [
      {x: 20, y: 60, socketId: SOCKET_RIGHT},
      {x: 65, y: 75, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 20, y: 60}, {x: 50, y: 60}],
      [{x: 50, y: 60}, {x: 50, y: 90}],
      [{x: 50, y: 90}, {x: 65, y: 90}],
      [{x: 65, y: 90}, {x: 65, y: 120}],
      [{x: 65, y: 120}, {x: 35, y: 120}],
      [{x: 35, y: 120}, {x: 35, y: 75}],
      [{x: 35, y: 75}, {x: 65, y: 75}]
    ]);

    // 6-1 (close 4)
    props = {socketXYSE: [
      {x: 20, y: 60, socketId: SOCKET_RIGHT},
      {x: 65, y: 45, socketId: SOCKET_LEFT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 20, y: 60}, {x: 50, y: 60}],
      [{x: 50, y: 60}, {x: 50, y: 105}],
      [{x: 50, y: 105}, {x: 20, y: 105}],
      [{x: 20, y: 105}, {x: 20, y: 75}],
      [{x: 20, y: 75}, {x: 35, y: 75}],
      [{x: 35, y: 75}, {x: 35, y: 45}],
      [{x: 35, y: 45}, {x: 65, y: 45}]
    ]);

    // 7-1 same SocketGravity
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 75, socketId: SOCKET_RIGHT}
    ]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 80, y: 60}],
      [{x: 80, y: 60}, {x: 80, y: 75}],
      [{x: 80, y: 75}, {x: 50, y: 75}]
    ]);

    // 7-2 SocketGravity 50
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 75, socketId: SOCKET_RIGHT}
    ]};
    options = {socketGravitySE: [50, null]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 110, y: 60}],
      [{x: 110, y: 60}, {x: 110, y: 90}],
      [{x: 110, y: 90}, {x: 80, y: 90}],
      [{x: 80, y: 90}, {x: 80, y: 75}],
      [{x: 80, y: 75}, {x: 50, y: 75}]
    ]);
    options = {socketGravitySE: []};

    // 7-3 SocketGravity -10
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 75, socketId: SOCKET_RIGHT}
    ]};
    options = {socketGravitySE: [-10, null]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 40, y: 60}],
      [{x: 40, y: 60}, {x: 40, y: 120}],
      [{x: 40, y: 120}, {x: 80, y: 120}],
      [{x: 80, y: 120}, {x: 80, y: 75}],
      [{x: 80, y: 75}, {x: 50, y: 75}]
    ]);
    options = {socketGravitySE: []};

    // 7-4 SocketGravity [50, 600]
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 75, socketId: SOCKET_RIGHT}
    ]};
    options = {socketGravitySE: [[50, 600], null]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 110, y: 60}],
      [{x: 110, y: 60}, {x: 110, y: 90}],
      [{x: 110, y: 90}, {x: 80, y: 90}],
      [{x: 80, y: 90}, {x: 80, y: 75}],
      [{x: 80, y: 75}, {x: 50, y: 75}]
    ]);
    options = {socketGravitySE: []};

    // 7-5 SocketGravity [-10, 600]
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 75, socketId: SOCKET_RIGHT}
    ]};
    options = {socketGravitySE: [[-10, 600], null]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 40, y: 60}],
      [{x: 40, y: 60}, {x: 40, y: 120}],
      [{x: 40, y: 120}, {x: 80, y: 120}],
      [{x: 80, y: 120}, {x: 80, y: 75}],
      [{x: 80, y: 75}, {x: 50, y: 75}]
    ]);
    options = {socketGravitySE: []};

    // 7-6 SocketGravity [0, 50]
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 75, socketId: SOCKET_RIGHT}
    ]};
    options = {socketGravitySE: [[0, 50], null]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 50, y: 110}],
      [{x: 50, y: 110}, {x: 80, y: 110}],
      [{x: 80, y: 110}, {x: 80, y: 75}],
      [{x: 80, y: 75}, {x: 50, y: 75}]
    ]);
    options = {socketGravitySE: []};

    // 7-7 SocketGravity [0, -10]
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 75, socketId: SOCKET_RIGHT}
    ]};
    options = {socketGravitySE: [[0, -10], null]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 50, y: 45}],
      [{x: 50, y: 45}, {x: 80, y: 45}],
      [{x: 80, y: 45}, {x: 80, y: 75}],
      [{x: 80, y: 75}, {x: 50, y: 75}]
    ]);
    options = {socketGravitySE: []};

    // 7-8 SocketGravity 0
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 75, socketId: SOCKET_RIGHT}
    ]};
    options = {socketGravitySE: [0, null]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 50, y: 60}],
      [{x: 50, y: 60}, {x: 50, y: 45}],
      [{x: 50, y: 45}, {x: 80, y: 45}],
      [{x: 80, y: 45}, {x: 80, y: 75}],
      [{x: 80, y: 75}, {x: 50, y: 75}]
    ]);
    options = {socketGravitySE: []};

    // 7-9 SocketGravity [0, 0]
    props = {socketXYSE: [
      {x: 50, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 75, socketId: SOCKET_RIGHT}
    ]};
    options = {socketGravitySE: [[0, 0], null]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 50, y: 60}, {x: 50, y: 60}],
      [{x: 50, y: 60}, {x: 50, y: 45}],
      [{x: 50, y: 45}, {x: 80, y: 45}],
      [{x: 80, y: 45}, {x: 80, y: 75}],
      [{x: 80, y: 75}, {x: 50, y: 75}]
    ]);
    options = {socketGravitySE: []};

    // 7-10 SocketGravity 0 on axis
    props = {socketXYSE: [
      {x: 80, y: 60, socketId: SOCKET_RIGHT},
      {x: 50, y: 75, socketId: SOCKET_RIGHT}
    ]};
    options = {socketGravitySE: [0, null]};
    pathSegs = [];
    func();
    expect(pathSegs).toEqual([
      [{x: 80, y: 60}, {x: 80, y: 60}],
      [{x: 80, y: 60}, {x: 80, y: 75}],
      [{x: 80, y: 75}, {x: 50, y: 75}]
    ]);
    options = {socketGravitySE: []};

  });

});
