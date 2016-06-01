/* eslint-env jasmine */
/* global getSource:false */

describe('func-PATH_FLUID', function() {
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
    getSource('./spec/functions/PATH_FLUID', function(error, source) {
      if (error) { throw error; }
      func = eval('(' + source + ')'); // eslint-disable-line no-eval
      done();
    });
  });

  it('should set offset by SocketGravity Array', function() {
    props = {
      socketXYSE: [
        {x: 100, y: 100, socketId: SOCKET_RIGHT},
        {x: 300, y: 300, socketId: SOCKET_LEFT}
      ]
    };
    options = {
      socketGravitySE: [[2, 4], [8, 16]]
    };
    pathSegs = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathSegs).toEqual([
      [socketXY2Point(props.socketXYSE[0]),
        {x: props.socketXYSE[0].x + 2, y: props.socketXYSE[0].y + 4},
        {x: props.socketXYSE[1].x + 8, y: props.socketXYSE[1].y + 16},
        socketXY2Point(props.socketXYSE[1])]
    ]);
  });

  it('should set offset by SOCKETs direction', function() {
    props = {
      socketXYSE: [
        {x: 100, y: 100, socketId: SOCKET_TOP},
        {x: 300, y: 300, socketId: SOCKET_RIGHT}
      ]
    };
    options = {
      socketGravitySE: [2, 4]
    };
    pathSegs = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathSegs).toEqual([
      [socketXY2Point(props.socketXYSE[0]),
        {x: props.socketXYSE[0].x, y: props.socketXYSE[0].y - 2},
        {x: props.socketXYSE[1].x + 4, y: props.socketXYSE[1].y},
        socketXY2Point(props.socketXYSE[1])]
    ]);

    props.socketXYSE[0].socketId = SOCKET_BOTTOM;
    props.socketXYSE[1].socketId = SOCKET_LEFT;
    pathSegs = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathSegs).toEqual([
      [socketXY2Point(props.socketXYSE[0]),
        {x: props.socketXYSE[0].x, y: props.socketXYSE[0].y + 2},
        {x: props.socketXYSE[1].x - 4, y: props.socketXYSE[1].y},
        socketXY2Point(props.socketXYSE[1])]
    ]);
  });

  it('should set offset `auto` by SOCKETs position', function() {
    props = {
      socketXYSE: [
        {x: 100, y: 100, socketId: SOCKET_RIGHT},
        {x: 400, y: 400, socketId: SOCKET_LEFT}
      ],
      plugOverheadSE: [
        10, // minGravity: 120 + 7.5
        6 // minGravity: 120
      ]
    };
    options = {size: 4, socketGravitySE: []};
    pathSegs = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathSegs).toEqual([
      [socketXY2Point(props.socketXYSE[0]),
        {x: props.socketXYSE[0].x + 150, y: props.socketXYSE[0].y},
        {x: props.socketXYSE[1].x - 150, y: props.socketXYSE[1].y},
        socketXY2Point(props.socketXYSE[1])]
    ]);

    // Change direction
    props.socketXYSE[0].socketId = SOCKET_BOTTOM;
    props.socketXYSE[1].socketId = SOCKET_TOP;
    pathSegs = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathSegs).toEqual([
      [socketXY2Point(props.socketXYSE[0]),
        {x: props.socketXYSE[0].x, y: props.socketXYSE[0].y + 150},
        {x: props.socketXYSE[1].x, y: props.socketXYSE[1].y - 150},
        socketXY2Point(props.socketXYSE[1])]
    ]);

    // Closed position
    props.socketXYSE[0].socketId = SOCKET_RIGHT;
    props.socketXYSE[1].socketId = SOCKET_LEFT;
    props.socketXYSE[1].x = 300;
    pathSegs = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathSegs).toEqual([
      [socketXY2Point(props.socketXYSE[0]),
        {x: props.socketXYSE[0].x + 127.5, y: props.socketXYSE[0].y},
        {x: props.socketXYSE[1].x - 120, y: props.socketXYSE[1].y},
        socketXY2Point(props.socketXYSE[1])]
    ]);

    // Same as MIN_OH_GRAVITY_OH
    props.plugOverheadSE[0] = MIN_OH_GRAVITY_OH;
    pathSegs = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathSegs).toEqual([
      [socketXY2Point(props.socketXYSE[0]),
        {x: props.socketXYSE[0].x + 120, y: props.socketXYSE[0].y},
        {x: props.socketXYSE[1].x - 120, y: props.socketXYSE[1].y},
        socketXY2Point(props.socketXYSE[1])]
    ]);

    // No PlugOverhead
    props.plugOverheadSE = [0, 0]; // minGravity: 80
    pathSegs = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathSegs).toEqual([
      [socketXY2Point(props.socketXYSE[0]),
        {x: props.socketXYSE[0].x + 100, y: props.socketXYSE[0].y},
        {x: props.socketXYSE[1].x - 100, y: props.socketXYSE[1].y},
        socketXY2Point(props.socketXYSE[1])]
    ]);

    // Closed position
    props.socketXYSE[1].x = 200;
    pathSegs = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathSegs).toEqual([
      [socketXY2Point(props.socketXYSE[0]),
        {x: props.socketXYSE[0].x + 80, y: props.socketXYSE[0].y},
        {x: props.socketXYSE[1].x - 80, y: props.socketXYSE[1].y},
        socketXY2Point(props.socketXYSE[1])]
    ]);

    // Size affects
    options = {size: 6, socketGravitySE: []};
    pathSegs = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathSegs).toEqual([
      [socketXY2Point(props.socketXYSE[0]),
        {x: props.socketXYSE[0].x + 90, y: props.socketXYSE[0].y},
        {x: props.socketXYSE[1].x - 90, y: props.socketXYSE[1].y},
        socketXY2Point(props.socketXYSE[1])]
    ]);
  });

});
