/* eslint-env jasmine */
/* global loadPage:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('socket', function() {
  'use strict';

  var window, document, pageDone;

  /* eslint-disable no-unused-vars, indent */
  // ================ context
  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4;
  // ================ /context
  /* eslint-enable no-unused-vars, indent */

  beforeAll(function(beforeDone) {
    loadPage('spec/socket/page.html', function(frmWindow, frmDocument, body, done) {
      window = frmWindow;
      document = frmDocument;
      pageDone = done;
      beforeDone();
    }, 'socket');
  });

  afterAll(function() {
    pageDone();
  });

  it('decide both sockets', function() {
    var ll = new window.LeaderLine(document.getElementById('elm1-center'),
        document.getElementById('elm1-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.end = document.getElementById('elm1-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getElementById('elm1-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.end = document.getElementById('elm1-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });

  it('decide one side socket', function() {
    var ll = new window.LeaderLine(document.getElementById('elm2-out'),
        document.getElementById('elm2-in'), {path: 'straight'}),
      props = window.insProps[ll._id];

    ll.startSocket = 'top';
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.startSocket = 'right';
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);

    ll.startSocket = 'bottom';
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.startSocket = 'left';
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);
  });

  it('anchor width: 0', function() {
    var ll = new window.LeaderLine(document.getElementById('elm3-center'),
        document.getElementById('elm3-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.end = document.getElementById('elm3-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getElementById('elm3-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.end = document.getElementById('elm3-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });

  it('anchor height: 0', function() {
    var ll = new window.LeaderLine(document.getElementById('elm4-center'),
        document.getElementById('elm4-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.end = document.getElementById('elm4-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getElementById('elm4-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.end = document.getElementById('elm4-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });

  it('anchor width: 0, height: 0', function() {
    var ll = new window.LeaderLine(document.getElementById('elm5-center'),
        document.getElementById('elm5-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.end = document.getElementById('elm5-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getElementById('elm5-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.end = document.getElementById('elm5-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });

  it('decide both sockets anchor width: 0, height: 0', function() {
    var ll = new window.LeaderLine(document.getElementById('elm6-center'),
        document.getElementById('elm6-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.end = document.getElementById('elm6-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getElementById('elm6-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.end = document.getElementById('elm6-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });

  it('same distance X and Y', function() {
    var ll = new window.LeaderLine(document.getElementById('elm7-center'),
        document.getElementById('elm7-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    // prior X
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getElementById('elm7-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    // prior X
    ll.end = document.getElementById('elm7-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);

    ll.end = document.getElementById('elm7-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });

  it('nearly same distance X and Y', function() {
    var ll = new window.LeaderLine(document.getElementById('elm8-center'),
        document.getElementById('elm8-top'), {path: 'straight'}),
      props = window.insProps[ll._id];

    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_TOP);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_BOTTOM);

    ll.end = document.getElementById('elm8-right');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_RIGHT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_LEFT);

    ll.end = document.getElementById('elm8-bottom');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_BOTTOM);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_TOP);

    ll.end = document.getElementById('elm8-left');
    expect(props.curStats.position_socketXYSE[0].socketId).toBe(SOCKET_LEFT);
    expect(props.curStats.position_socketXYSE[1].socketId).toBe(SOCKET_RIGHT);
  });
});
