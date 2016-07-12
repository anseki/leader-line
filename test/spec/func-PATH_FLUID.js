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
    props, options, curStats, curStatsSocketXYSE, pathList;
    function socketXY2Point(socketXY) { return {x: socketXY.x, y: socketXY.y}; }
  // ================ /context
  /* eslint-enable no-unused-vars, indent */

  function initContext(newProps, newOptions) {
    props = newProps;
    options = newOptions;
    curStats = props.curPosition;
    curStatsSocketXYSE = curStats.socketXYSE;
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
      {
        curPosition: {
          socketXYSE: [
            {x: 100, y: 100, socketId: SOCKET_RIGHT},
            {x: 300, y: 300, socketId: SOCKET_LEFT}
          ]
        }
      },
      {
        socketGravitySE: [[2, 4], [8, 16]]
      }
    );
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curStatsSocketXYSE[0]),
        {x: curStatsSocketXYSE[0].x + 2, y: curStatsSocketXYSE[0].y + 4},
        {x: curStatsSocketXYSE[1].x + 8, y: curStatsSocketXYSE[1].y + 16},
        socketXY2Point(curStatsSocketXYSE[1])]
    ]);
  });

  it('should set offset by SOCKETs direction', function() {
    initContext(
      {
        curPosition: {
          socketXYSE: [
            {x: 100, y: 100, socketId: SOCKET_TOP},
            {x: 300, y: 300, socketId: SOCKET_RIGHT}
          ]
        }
      },
      {
        socketGravitySE: [2, 4]
      }
    );
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curStatsSocketXYSE[0]),
        {x: curStatsSocketXYSE[0].x, y: curStatsSocketXYSE[0].y - 2},
        {x: curStatsSocketXYSE[1].x + 4, y: curStatsSocketXYSE[1].y},
        socketXY2Point(curStatsSocketXYSE[1])]
    ]);

    curStatsSocketXYSE[0].socketId = SOCKET_BOTTOM;
    curStatsSocketXYSE[1].socketId = SOCKET_LEFT;
    pathList = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curStatsSocketXYSE[0]),
        {x: curStatsSocketXYSE[0].x, y: curStatsSocketXYSE[0].y + 2},
        {x: curStatsSocketXYSE[1].x - 4, y: curStatsSocketXYSE[1].y},
        socketXY2Point(curStatsSocketXYSE[1])]
    ]);
  });

  it('should set offset `auto` by SOCKETs position', function() {
    initContext(
      {
        curPosition: {
          socketXYSE: [
            {x: 100, y: 100, socketId: SOCKET_RIGHT},
            {x: 400, y: 400, socketId: SOCKET_LEFT}
          ],
          plugOverheadSE: [
            10, // minGravity: 120 + 7.5
            6 // minGravity: 120
          ]
        }
      },
      {lineSize: 4, socketGravitySE: []}
    );
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curStatsSocketXYSE[0]),
        {x: curStatsSocketXYSE[0].x + 150, y: curStatsSocketXYSE[0].y},
        {x: curStatsSocketXYSE[1].x - 150, y: curStatsSocketXYSE[1].y},
        socketXY2Point(curStatsSocketXYSE[1])]
    ]);

    // Change direction
    curStatsSocketXYSE[0].socketId = SOCKET_BOTTOM;
    curStatsSocketXYSE[1].socketId = SOCKET_TOP;
    pathList = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curStatsSocketXYSE[0]),
        {x: curStatsSocketXYSE[0].x, y: curStatsSocketXYSE[0].y + 150},
        {x: curStatsSocketXYSE[1].x, y: curStatsSocketXYSE[1].y - 150},
        socketXY2Point(curStatsSocketXYSE[1])]
    ]);

    // Closed position
    curStatsSocketXYSE[0].socketId = SOCKET_RIGHT;
    curStatsSocketXYSE[1].socketId = SOCKET_LEFT;
    curStatsSocketXYSE[1].x = 300;
    pathList = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curStatsSocketXYSE[0]),
        {x: curStatsSocketXYSE[0].x + 127.5, y: curStatsSocketXYSE[0].y},
        {x: curStatsSocketXYSE[1].x - 120, y: curStatsSocketXYSE[1].y},
        socketXY2Point(curStatsSocketXYSE[1])]
    ]);

    // Same as MIN_OH_GRAVITY_OH
    curStats.plugOverheadSE[0] = MIN_OH_GRAVITY_OH;
    pathList = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curStatsSocketXYSE[0]),
        {x: curStatsSocketXYSE[0].x + 120, y: curStatsSocketXYSE[0].y},
        {x: curStatsSocketXYSE[1].x - 120, y: curStatsSocketXYSE[1].y},
        socketXY2Point(curStatsSocketXYSE[1])]
    ]);

    // No PlugOverhead
    curStats.plugOverheadSE = [0, 0]; // minGravity: 80
    pathList = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curStatsSocketXYSE[0]),
        {x: curStatsSocketXYSE[0].x + 100, y: curStatsSocketXYSE[0].y},
        {x: curStatsSocketXYSE[1].x - 100, y: curStatsSocketXYSE[1].y},
        socketXY2Point(curStatsSocketXYSE[1])]
    ]);

    // Closed position
    curStatsSocketXYSE[1].x = 200;
    pathList = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curStatsSocketXYSE[0]),
        {x: curStatsSocketXYSE[0].x + 80, y: curStatsSocketXYSE[0].y},
        {x: curStatsSocketXYSE[1].x - 80, y: curStatsSocketXYSE[1].y},
        socketXY2Point(curStatsSocketXYSE[1])]
    ]);

    // Size affects
    options = {lineSize: 6, socketGravitySE: []};
    /*
                minGravity = overhead > 0 ?
                  MIN_OH_GRAVITY + (overhead > MIN_OH_GRAVITY_OH ?
                    (overhead - MIN_OH_GRAVITY_OH) * MIN_OH_GRAVITY_R : 0) :
                  MIN_GRAVITY + (options.lineSize > MIN_GRAVITY_SIZE ?
                    (options.lineSize - MIN_GRAVITY_SIZE) * MIN_GRAVITY_R : 0);

                minGravity =
                  80 + (options.lineSize > 4 ?
                    (options.lineSize - 4) * 5 : 0);

                minGravity = 80 + ((6 - 4) * 5) = 90
    */
    pathList = [];
    func([options.socketGravitySE[0],
      options.path === PATH_MAGNET ? 0 : options.socketGravitySE[1]]);
    expect(pathList).toEqual([
      [socketXY2Point(curStatsSocketXYSE[0]),
        {x: curStatsSocketXYSE[0].x + 90, y: curStatsSocketXYSE[0].y},
        {x: curStatsSocketXYSE[1].x - 90, y: curStatsSocketXYSE[1].y},
        socketXY2Point(curStatsSocketXYSE[1])]
    ]);
    console.log(props);
  });

});
