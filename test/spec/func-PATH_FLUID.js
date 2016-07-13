/* eslint-env jasmine */
/* global getSource:false */

describe('func-PATH_FLUID', function() {
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
    curStats, curSocketXYSE, curSocketGravitySE, pathList;
    function socketXY2Point(socketXY) { return {x: socketXY.x, y: socketXY.y}; }
  // ================ /context
  /* eslint-enable no-unused-vars, indent */

  function initContext(socketXYSE, socketGravitySE, stats) {
    curSocketXYSE = socketXYSE;
    curSocketGravitySE = socketGravitySE;
    curStats = stats || {};
    pathList = [];
  }

  beforeAll(function(done) {
    getSource('./spec/func/PATH_FLUID', function(error, source) {
      if (error) { throw error; }
      func = eval('(' + source + ')'); // eslint-disable-line no-eval
      done();
    });
  });

  it('should set offset by SocketGravity Array', function() {
    initContext(
      [
        {x: 100, y: 100, socketId: SOCKET_RIGHT},
        {x: 300, y: 300, socketId: SOCKET_LEFT}
      ],
      [[2, 4], [8, 16]]
    );
    func([curSocketGravitySE[0],
      curStats.position_path === PATH_MAGNET ? 0 : curSocketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curSocketXYSE[0]),
        {x: curSocketXYSE[0].x + 2, y: curSocketXYSE[0].y + 4},
        {x: curSocketXYSE[1].x + 8, y: curSocketXYSE[1].y + 16},
        socketXY2Point(curSocketXYSE[1])]
    ]);
  });

  it('should set offset by SOCKETs direction', function() {
    initContext(
      [
        {x: 100, y: 100, socketId: SOCKET_TOP},
        {x: 300, y: 300, socketId: SOCKET_RIGHT}
      ],
      [2, 4]
    );
    func([curSocketGravitySE[0],
      curStats.position_path === PATH_MAGNET ? 0 : curSocketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curSocketXYSE[0]),
        {x: curSocketXYSE[0].x, y: curSocketXYSE[0].y - 2},
        {x: curSocketXYSE[1].x + 4, y: curSocketXYSE[1].y},
        socketXY2Point(curSocketXYSE[1])]
    ]);

    curSocketXYSE[0].socketId = SOCKET_BOTTOM;
    curSocketXYSE[1].socketId = SOCKET_LEFT;
    pathList = [];
    func([curSocketGravitySE[0],
      curStats.position_path === PATH_MAGNET ? 0 : curSocketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curSocketXYSE[0]),
        {x: curSocketXYSE[0].x, y: curSocketXYSE[0].y + 2},
        {x: curSocketXYSE[1].x - 4, y: curSocketXYSE[1].y},
        socketXY2Point(curSocketXYSE[1])]
    ]);
  });

  it('should set offset `auto` by SOCKETs position', function() {
    initContext(
      [
        {x: 100, y: 100, socketId: SOCKET_RIGHT},
        {x: 400, y: 400, socketId: SOCKET_LEFT}
      ],
      [],
      {
        position_plugOverheadSE: [
          10, // minGravity: 120 + 7.5
          6 // minGravity: 120
        ],
        position_lineStrokeWidth: 4
      }
    );
    func([curSocketGravitySE[0],
      curStats.position_path === PATH_MAGNET ? 0 : curSocketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curSocketXYSE[0]),
        {x: curSocketXYSE[0].x + 150, y: curSocketXYSE[0].y},
        {x: curSocketXYSE[1].x - 150, y: curSocketXYSE[1].y},
        socketXY2Point(curSocketXYSE[1])]
    ]);

    // Change direction
    curSocketXYSE[0].socketId = SOCKET_BOTTOM;
    curSocketXYSE[1].socketId = SOCKET_TOP;
    pathList = [];
    func([curSocketGravitySE[0],
      curStats.position_path === PATH_MAGNET ? 0 : curSocketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curSocketXYSE[0]),
        {x: curSocketXYSE[0].x, y: curSocketXYSE[0].y + 150},
        {x: curSocketXYSE[1].x, y: curSocketXYSE[1].y - 150},
        socketXY2Point(curSocketXYSE[1])]
    ]);

    // Closed position
    curSocketXYSE[0].socketId = SOCKET_RIGHT;
    curSocketXYSE[1].socketId = SOCKET_LEFT;
    curSocketXYSE[1].x = 300;
    pathList = [];
    func([curSocketGravitySE[0],
      curStats.position_path === PATH_MAGNET ? 0 : curSocketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curSocketXYSE[0]),
        {x: curSocketXYSE[0].x + 127.5, y: curSocketXYSE[0].y},
        {x: curSocketXYSE[1].x - 120, y: curSocketXYSE[1].y},
        socketXY2Point(curSocketXYSE[1])]
    ]);

    // Same as MIN_OH_GRAVITY_OH
    curStats.position_plugOverheadSE[0] = MIN_OH_GRAVITY_OH;
    pathList = [];
    func([curSocketGravitySE[0],
      curStats.position_path === PATH_MAGNET ? 0 : curSocketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curSocketXYSE[0]),
        {x: curSocketXYSE[0].x + 120, y: curSocketXYSE[0].y},
        {x: curSocketXYSE[1].x - 120, y: curSocketXYSE[1].y},
        socketXY2Point(curSocketXYSE[1])]
    ]);

    // No PlugOverhead
    curStats.position_plugOverheadSE = [0, 0]; // minGravity: 80
    pathList = [];
    func([curSocketGravitySE[0],
      curStats.position_path === PATH_MAGNET ? 0 : curSocketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curSocketXYSE[0]),
        {x: curSocketXYSE[0].x + 100, y: curSocketXYSE[0].y},
        {x: curSocketXYSE[1].x - 100, y: curSocketXYSE[1].y},
        socketXY2Point(curSocketXYSE[1])]
    ]);

    // Closed position
    curSocketXYSE[1].x = 200;
    pathList = [];
    func([curSocketGravitySE[0],
      curStats.position_path === PATH_MAGNET ? 0 : curSocketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curSocketXYSE[0]),
        {x: curSocketXYSE[0].x + 80, y: curSocketXYSE[0].y},
        {x: curSocketXYSE[1].x - 80, y: curSocketXYSE[1].y},
        socketXY2Point(curSocketXYSE[1])]
    ]);

    // Size affects
    curStats.position_lineStrokeWidth = 6;
    curSocketGravitySE = [];
    /*
                minGravity = overhead > 0 ?
                  MIN_OH_GRAVITY + (overhead > MIN_OH_GRAVITY_OH ?
                    (overhead - MIN_OH_GRAVITY_OH) * MIN_OH_GRAVITY_R : 0) :
                  MIN_GRAVITY + (curStats.position_lineStrokeWidth > MIN_GRAVITY_SIZE ?
                    (curStats.position_lineStrokeWidth - MIN_GRAVITY_SIZE) * MIN_GRAVITY_R : 0);

                minGravity =
                  80 + (curStats.position_lineStrokeWidth > 4 ?
                    (curStats.position_lineStrokeWidth - 4) * 5 : 0);

                minGravity = 80 + ((6 - 4) * 5) = 90
    */
    pathList = [];
    func([curSocketGravitySE[0],
      curStats.position_path === PATH_MAGNET ? 0 : curSocketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curSocketXYSE[0]),
        {x: curSocketXYSE[0].x + 90, y: curSocketXYSE[0].y},
        {x: curSocketXYSE[1].x - 90, y: curSocketXYSE[1].y},
        socketXY2Point(curSocketXYSE[1])]
    ]);
  });

});
