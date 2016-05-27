/* eslint-env jasmine */
/* global getSource:false */

describe('func-fluid', function() {
  'use strict';

  var func,
    // context
    /* eslint-disable no-unused-vars */
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    PATH_STRAIGHT = 1, PATH_ARC = 2, PATH_FLUID = 3, PATH_MAGNET = 4, PATH_GRID = 5,
    MIN_GRAVITY = 80, MIN_GRAVITY_SIZE = 4, MIN_GRAVITY_R = 5,
    MIN_OH_GRAVITY = 120, MIN_OH_GRAVITY_OH = 8, MIN_OH_GRAVITY_R = 3.75,
    MIN_ADJUST_LEN = 10, MIN_GRID_LEN = 30,
    props, options, pathSegs;
    /* eslint-enable no-unused-vars */

  beforeAll(function(done) {
    getSource('./spec/functions/fluid', function(error, source) {
      if (error) { throw error; }
      func = eval('(' + source + ')'); // eslint-disable-line no-eval
      done();
    });
  });

  it('should set offset by SocketGravity Array', function() {
    props = {
      startSocketXY: {x: 100, y: 100, socketId: SOCKET_RIGHT},
      endSocketXY: {x: 300, y: 300, socketId: SOCKET_LEFT}
    };
    options = {
      startSocketGravity: [2, 4],
      endSocketGravity: [8, 16]
    };
    pathSegs = [];
    func({start: options.startSocketGravity,
      end: options.path === PATH_MAGNET ? 0 : options.endSocketGravity});
    expect(pathSegs).toEqual([
      [props.startSocketXY,
        {x: props.startSocketXY.x + 2, y: props.startSocketXY.y + 4},
        {x: props.endSocketXY.x + 8, y: props.endSocketXY.y + 16},
        props.endSocketXY]
    ]);
  });

  it('should set offset by SOCKETs direction', function() {
    props = {
      startSocketXY: {x: 100, y: 100, socketId: SOCKET_TOP},
      endSocketXY: {x: 300, y: 300, socketId: SOCKET_RIGHT}
    };
    options = {
      startSocketGravity: 2,
      endSocketGravity: 4
    };
    pathSegs = [];
    func({start: options.startSocketGravity,
      end: options.path === PATH_MAGNET ? 0 : options.endSocketGravity});
    expect(pathSegs).toEqual([
      [props.startSocketXY,
        {x: props.startSocketXY.x, y: props.startSocketXY.y - 2},
        {x: props.endSocketXY.x + 4, y: props.endSocketXY.y},
        props.endSocketXY]
    ]);

    props.startSocketXY.socketId = SOCKET_BOTTOM;
    props.endSocketXY.socketId = SOCKET_LEFT;
    pathSegs = [];
    func({start: options.startSocketGravity,
      end: options.path === PATH_MAGNET ? 0 : options.endSocketGravity});
    expect(pathSegs).toEqual([
      [props.startSocketXY,
        {x: props.startSocketXY.x, y: props.startSocketXY.y + 2},
        {x: props.endSocketXY.x - 4, y: props.endSocketXY.y},
        props.endSocketXY]
    ]);
  });

  it('should set offset `auto` by SOCKETs position', function() {
    props = {
      startSocketXY: {x: 100, y: 100, socketId: SOCKET_RIGHT},
      endSocketXY: {x: 400, y: 400, socketId: SOCKET_LEFT},
      startPlugOverhead: 10, // minGravity: 120 + 7.5
      endPlugOverhead: 6 // minGravity: 120
    };
    options = {size: 4};
    pathSegs = [];
    func({start: options.startSocketGravity,
      end: options.path === PATH_MAGNET ? 0 : options.endSocketGravity});
    expect(pathSegs).toEqual([
      [props.startSocketXY,
        {x: props.startSocketXY.x + 150, y: props.startSocketXY.y},
        {x: props.endSocketXY.x - 150, y: props.endSocketXY.y},
        props.endSocketXY]
    ]);

    // Change direction
    props.startSocketXY.socketId = SOCKET_BOTTOM;
    props.endSocketXY.socketId = SOCKET_TOP;
    pathSegs = [];
    func({start: options.startSocketGravity,
      end: options.path === PATH_MAGNET ? 0 : options.endSocketGravity});
    expect(pathSegs).toEqual([
      [props.startSocketXY,
        {x: props.startSocketXY.x, y: props.startSocketXY.y + 150},
        {x: props.endSocketXY.x, y: props.endSocketXY.y - 150},
        props.endSocketXY]
    ]);

    // Closed position
    props.startSocketXY.socketId = SOCKET_RIGHT;
    props.endSocketXY.socketId = SOCKET_LEFT;
    props.endSocketXY.x = 300;
    pathSegs = [];
    func({start: options.startSocketGravity,
      end: options.path === PATH_MAGNET ? 0 : options.endSocketGravity});
    expect(pathSegs).toEqual([
      [props.startSocketXY,
        {x: props.startSocketXY.x + 127.5, y: props.startSocketXY.y},
        {x: props.endSocketXY.x - 120, y: props.endSocketXY.y},
        props.endSocketXY]
    ]);

    // Same as MIN_OH_GRAVITY_OH
    props.startPlugOverhead = MIN_OH_GRAVITY_OH;
    pathSegs = [];
    func({start: options.startSocketGravity,
      end: options.path === PATH_MAGNET ? 0 : options.endSocketGravity});
    expect(pathSegs).toEqual([
      [props.startSocketXY,
        {x: props.startSocketXY.x + 120, y: props.startSocketXY.y},
        {x: props.endSocketXY.x - 120, y: props.endSocketXY.y},
        props.endSocketXY]
    ]);

    // No PlugOverhead
    props.startPlugOverhead = props.endPlugOverhead = 0; // minGravity: 80
    pathSegs = [];
    func({start: options.startSocketGravity,
      end: options.path === PATH_MAGNET ? 0 : options.endSocketGravity});
    expect(pathSegs).toEqual([
      [props.startSocketXY,
        {x: props.startSocketXY.x + 100, y: props.startSocketXY.y},
        {x: props.endSocketXY.x - 100, y: props.endSocketXY.y},
        props.endSocketXY]
    ]);

    // Closed position
    props.endSocketXY.x = 200;
    pathSegs = [];
    func({start: options.startSocketGravity,
      end: options.path === PATH_MAGNET ? 0 : options.endSocketGravity});
    expect(pathSegs).toEqual([
      [props.startSocketXY,
        {x: props.startSocketXY.x + 80, y: props.startSocketXY.y},
        {x: props.endSocketXY.x - 80, y: props.endSocketXY.y},
        props.endSocketXY]
    ]);

    // Size affects
    options = {size: 6};
    pathSegs = [];
    func({start: options.startSocketGravity,
      end: options.path === PATH_MAGNET ? 0 : options.endSocketGravity});
    expect(pathSegs).toEqual([
      [props.startSocketXY,
        {x: props.startSocketXY.x + 90, y: props.startSocketXY.y},
        {x: props.endSocketXY.x - 90, y: props.endSocketXY.y},
        props.endSocketXY]
    ]);
  });

});
