/* global getSource:false, testCasesSvg:false */

(function() {
  'use strict';

  /* eslint-disable no-unused-vars, indent */
  // ================ context
  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    MIN_GRID_LEN = 30,

    SVG_NS = 'http://www.w3.org/2000/svg',

    // context in updatePosition()
    curSocketXYSE, curSocketGravitySE, pathList;
    function socketXY2Point(socketXY) { return {x: socketXY.x, y: socketXY.y}; }
  // ================ /context
  /* eslint-enable no-unused-vars, indent */

  var func,
    testCasesSrc = [
      {
        title: '1-1',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 200, y: 210, socketId: SOCKET_TOP}
        ]
      },
      {
        title: '1-2 on axis',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 200, y: 60 + MIN_GRID_LEN, socketId: SOCKET_TOP}
        ]
      },
      {
        title: '1-3 on axis',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50 + MIN_GRID_LEN, y: 210, socketId: SOCKET_TOP}
        ]
      },
      {
        title: '1-4 same coordinates',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50 + MIN_GRID_LEN, y: 60 + MIN_GRID_LEN, socketId: SOCKET_TOP}
        ]
      },
      {
        title: '2-1',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 210, socketId: SOCKET_RIGHT},
          {x: 200, y: 60, socketId: SOCKET_TOP}
        ]
      },
      {
        title: '2-2 on axis',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 210, socketId: SOCKET_RIGHT},
          {x: 50 + MIN_GRID_LEN, y: 60, socketId: SOCKET_TOP}
        ]
      },
      {
        title: '2-1 (close)',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 210, socketId: SOCKET_RIGHT},
          {x: 200, y: 210 + MIN_GRID_LEN - 15, socketId: SOCKET_TOP}
        ]
      },
      {
        title: '2-2 (close)',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 210, socketId: SOCKET_RIGHT},
          {x: 50 + MIN_GRID_LEN + 15, y: 210 + MIN_GRID_LEN - 15, socketId: SOCKET_TOP}
        ]
      },
      {
        title: '3',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_TOP},
          {x: 200, y: 210, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '3 (close)',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_TOP},
          {x: 50 - MIN_GRID_LEN + 15, y: 60 - MIN_GRID_LEN + 15, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '4-1',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 200, y: 210, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '4-2 on axis',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 200, y: 60, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '4-3 on cross axis',
        socketGravitySE: [],
        socketXYSE: [
          {x: 120 - MIN_GRID_LEN, y: 60, socketId: SOCKET_RIGHT},
          {x: 120 + MIN_GRID_LEN, y: 210, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '4-4 same coordinates',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50 + MIN_GRID_LEN * 2, y: 60, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '4-5 on cross axis',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 210, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '4-6 same coordinates',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 60, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '5-1',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_LEFT},
          {x: 200, y: 210, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '5-2 on axis',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_LEFT},
          {x: 200, y: 60, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '5-1 (close 1)',
        socketGravitySE: [],
        socketXYSE: [
          {x: 200 - MIN_GRID_LEN + 15, y: 60, socketId: SOCKET_LEFT},
          {x: 200, y: 210, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '5-1 (close 2)',
        socketGravitySE: [],
        socketXYSE: [
          {x: 200 - MIN_GRID_LEN + 15, y: 210 - 15, socketId: SOCKET_LEFT},
          {x: 200, y: 210, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '6-1',
        socketGravitySE: [],
        socketXYSE: [
          {x: 200, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 210, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '6-2 on axis',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_LEFT},
          {x: 200, y: 60, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '6-1 (close 1)',
        socketGravitySE: [],
        socketXYSE: [
          {x: 200, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 60 + MIN_GRID_LEN - 15, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '6-1 (close 2)',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50 - MIN_GRID_LEN + 15, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 60 + MIN_GRID_LEN - 15, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '6-1 (close 3)',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50 - MIN_GRID_LEN, y: 60, socketId: SOCKET_RIGHT},
          {x: 50 + 15, y: 60 + MIN_GRID_LEN - 15, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '6-1 (close 4)',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50 - MIN_GRID_LEN, y: 60, socketId: SOCKET_RIGHT},
          {x: 50 + 15, y: 60 - 15, socketId: SOCKET_LEFT}
        ]
      },
      {
        title: '7-1 same SocketGravity',
        socketGravitySE: [],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 75, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '7-2 SocketGravity 50',
        socketGravitySE: [50, null],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 75, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '7-3 SocketGravity -10',
        socketGravitySE: [-10, null],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 75, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '7-4 SocketGravity [50, 600]',
        socketGravitySE: [[50, 600], null],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 75, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '7-5 SocketGravity [-10, 600]',
        socketGravitySE: [[-10, 600], null],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 75, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '7-6 SocketGravity [0, 50]',
        socketGravitySE: [[0, 50], null],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 75, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '7-7 SocketGravity [0, -10]',
        socketGravitySE: [[0, -10], null],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 75, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '7-8 SocketGravity 0',
        socketGravitySE: [0, null],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 75, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '7-9 SocketGravity [0, 0]',
        socketGravitySE: [[0, 0], null],
        socketXYSE: [
          {x: 50, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 75, socketId: SOCKET_RIGHT}
        ]
      },
      {
        title: '7-10 SocketGravity 0 on axis',
        socketGravitySE: [0, null],
        socketXYSE: [
          {x: 50 + MIN_GRID_LEN, y: 60, socketId: SOCKET_RIGHT},
          {x: 50, y: 75, socketId: SOCKET_RIGHT}
        ]
      }
    ];

  function getGrid(socketXYSE, socketGravitySE) {
    var newPathData;

    // context in updatePosition()
    curSocketXYSE = socketXYSE;
    curSocketGravitySE = socketGravitySE;
    pathList = [];

    func();
    newPathData = [{type: 'M', values: [pathList[0][0].x, pathList[0][0].y]}];
    pathList.forEach(function(pathSeg) {
      newPathData.push(pathSeg.length === 2 ?
        {type: 'L', values: [pathSeg[1].x, pathSeg[1].y]} :
        {type: 'C', values: [pathSeg[1].x, pathSeg[1].y,
          pathSeg[2].x, pathSeg[2].y, pathSeg[3].x, pathSeg[3].y]});
    });
    return {pathData: newPathData, pathList: pathList};
  }

  function cases() {
    var
      testCases = [], newTestCasesSvg = [],
      serializer = new XMLSerializer(),
      parser = new DOMParser(),
      tbody = document.getElementById('cases-tbody');

    testCasesSrc.forEach(function(testCase, i) {
      var data = getGrid(testCase.socketXYSE, testCase.socketGravitySE),
        svg, path, tr, th, tdActual, tdExpected;

      svg = document.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      svg.className.baseVal = 'view';

      [0, 1].forEach(function(i) {
        var socketXY = testCase.socketXYSE[i],
          socket = svg.appendChild(document.createElementNS(SVG_NS, 'use'));
        socket.className.baseVal = 'm' + i;
        socket.href.baseVal = '#mark';
        socket.x.baseVal.value = socketXY.x;
        socket.y.baseVal.value = socketXY.y;
        socket.setAttribute('transform', 'rotate(' +
          ((socketXY.socketId - 2) * 90) + ', ' + socketXY.x + ', ' + socketXY.y + ')');
      });

      path = svg.appendChild(document.createElementNS(SVG_NS, 'path'));
      path.className.baseVal = 'll-path';
      path.setPathData(data.pathData);

      tr = tbody.appendChild(document.createElement('tr'));
      th = tr.appendChild(document.createElement('th'));
      th.textContent = testCase.title;

      tdActual = tr.appendChild(document.createElement('td'));
      tdActual.appendChild(svg);

      tdExpected = tr.appendChild(document.createElement('td'));
      tdExpected.appendChild(parser.parseFromString(testCasesSvg[i], 'image/svg+xml').documentElement);

      testCases.push({
        title: testCase.title,
        args: {socketXYSE: testCase.socketXYSE, socketGravitySE: testCase.socketGravitySE},
        expected: {pathList: data.pathList}
      });
      newTestCasesSvg.push(serializer.serializeToString(svg));
    });

    document.getElementById('testCases-json').value = JSON.stringify(testCases);
    document.getElementById('testCasesSvg-json').value = JSON.stringify(newTestCasesSvg);
  }

  window.addEventListener('load', function() {
    getSource('../spec/func/PATH_GRID', function(error, source) {
      if (error) { throw error; }
      func = eval('(' + source + ')'); // eslint-disable-line no-eval
      cases();
    });
  }, false);

})();
