
window.addEventListener('load', function() {
  'use strict';

  function getGrid(socketXYSE, socketGravitySE) {

    var MIN_GRID_LEN = 30,
      options = {socketGravitySE: socketGravitySE},
      curStatsSocketXYSE = socketXYSE,
      pathList = [], newPathData,
      grid;

    function socketXY2Point(socketXY) { return {x: socketXY.x, y: socketXY.y}; }

    grid =
    /* eslint-disable indent */
// ==== Copy from `test/spec/func/PATH_GRID`
function() {
            /**
             * @typedef {Object} DirPoint
             * @property {number} dirId - DIR_UP, DIR_RIGHT, DIR_DOWN, DIR_LEFT
             * @property {number} x
             * @property {number} y
             */
            var
              DIR_UP = 1, DIR_RIGHT = 2, DIR_DOWN = 3, DIR_LEFT = 4, // Correspond with `socketId`
              dpList = [[], []], curDirPoint = [], curPoint;

            function reverseDir(dirId) {
              return dirId === DIR_UP ? DIR_DOWN :
                dirId === DIR_RIGHT ? DIR_LEFT :
                dirId === DIR_DOWN ? DIR_UP : DIR_RIGHT;
            }

            function getAxis(dirId) {
              return dirId === DIR_RIGHT || dirId === DIR_LEFT ? 'x' : 'y';
            }

            function getNextDirPoint(dirPoint, len, dirId) {
              var newDirPoint = {x: dirPoint.x, y: dirPoint.y};
              if (dirId) {
                if (dirId === reverseDir(dirPoint.dirId)) { throw new Error('Invalid dirId: ' + dirId); }
                newDirPoint.dirId = dirId;
              } else {
                newDirPoint.dirId = dirPoint.dirId;
              }

              if (newDirPoint.dirId === DIR_UP) {
                newDirPoint.y -= len;
              } else if (newDirPoint.dirId === DIR_RIGHT) {
                newDirPoint.x += len;
              } else if (newDirPoint.dirId === DIR_DOWN) {
                newDirPoint.y += len;
              } else { // DIR_LEFT
                newDirPoint.x -= len;
              }
              return newDirPoint;
            }

            function inAxisScope(point, dirPoint) {
              return dirPoint.dirId === DIR_UP ? point.y <= dirPoint.y :
                dirPoint.dirId === DIR_RIGHT ? point.x >= dirPoint.x :
                dirPoint.dirId === DIR_DOWN ? point.y >= dirPoint.y :
                  point.x <= dirPoint.x;
            }

            function onAxisLine(point, dirPoint) {
              return dirPoint.dirId === DIR_UP || dirPoint.dirId === DIR_DOWN ?
                point.x === dirPoint.x : point.y === dirPoint.y;
            }

            // Must `scopeContains[0] !== scopeContains[1]`
            function getIndexWithScope(scopeContains) {
              return scopeContains[0] ? {contain: 0, notContain: 1} : {contain: 1, notContain: 0};
            }

            function getAxisDistance(point1, point2, axis) {
              return Math.abs(point2[axis] - point1[axis]);
            }

            // Must `fromPoint.[x|y] !== toPoint.[x|y]`
            function getDirIdWithAxis(fromPoint, toPoint, axis) {
              return axis === 'x' ?
                (fromPoint.x < toPoint.x ? DIR_RIGHT : DIR_LEFT) :
                (fromPoint.y < toPoint.y ? DIR_DOWN : DIR_UP);
            }

            function joinPoints() {
              var scopeContains = [
                  inAxisScope(curDirPoint[1], curDirPoint[0]),
                  inAxisScope(curDirPoint[0], curDirPoint[1])],
                axis = [getAxis(curDirPoint[0].dirId), getAxis(curDirPoint[1].dirId)],
                center, axisScope, distance, points;

              if (axis[0] === axis[1]) { // Same axis
                if (scopeContains[0] && scopeContains[1]) {
                  if (!onAxisLine(curDirPoint[1], curDirPoint[0])) {
                    if (curDirPoint[0][axis[0]] === curDirPoint[1][axis[1]]) { // vertical
                      dpList[0].push(curDirPoint[0]);
                      dpList[1].push(curDirPoint[1]);
                    } else {
                      center = curDirPoint[0][axis[0]] +
                        (curDirPoint[1][axis[1]] - curDirPoint[0][axis[0]]) / 2;
                      dpList[0].push(
                        getNextDirPoint(curDirPoint[0], Math.abs(center - curDirPoint[0][axis[0]])));
                      dpList[1].push(
                        getNextDirPoint(curDirPoint[1], Math.abs(center - curDirPoint[1][axis[1]])));
                    }
                  }
                  return false;

                } else if (scopeContains[0] !== scopeContains[1]) { // turn notContain 90deg
                  axisScope = getIndexWithScope(scopeContains);
                  distance = getAxisDistance(curDirPoint[axisScope.notContain],
                    curDirPoint[axisScope.contain], axis[axisScope.notContain]);
                  if (distance < MIN_GRID_LEN) {
                    curDirPoint[axisScope.notContain] =
                      getNextDirPoint(curDirPoint[axisScope.notContain], MIN_GRID_LEN - distance);
                  }
                  dpList[axisScope.notContain].push(curDirPoint[axisScope.notContain]);
                  curDirPoint[axisScope.notContain] =
                    getNextDirPoint(curDirPoint[axisScope.notContain], MIN_GRID_LEN,
                      onAxisLine(curDirPoint[axisScope.contain], curDirPoint[axisScope.notContain]) ?
                        (axis[axisScope.notContain] === 'x' ? DIR_DOWN : DIR_RIGHT) :
                        getDirIdWithAxis(curDirPoint[axisScope.notContain], curDirPoint[axisScope.contain],
                          (axis[axisScope.notContain] === 'x' ? 'y' : 'x')));

                } else { // turn both 90deg
                  distance =
                    getAxisDistance(curDirPoint[0], curDirPoint[1], axis[0] === 'x' ? 'y' : 'x');
                  dpList.forEach(function(targetDpList, iTarget) {
                    var iAnother = iTarget === 0 ? 1 : 0;
                    targetDpList.push(curDirPoint[iTarget]);
                    curDirPoint[iTarget] = getNextDirPoint(curDirPoint[iTarget], MIN_GRID_LEN,
                      distance >= MIN_GRID_LEN * 2 ?
                        getDirIdWithAxis(curDirPoint[iTarget], curDirPoint[iAnother],
                          (axis[iTarget] === 'x' ? 'y' : 'x')) :
                        (axis[iTarget] === 'x' ? DIR_DOWN : DIR_RIGHT));
                  });
                }

              } else { // Different axis
                if (scopeContains[0] && scopeContains[1]) {
                  if (onAxisLine(curDirPoint[1], curDirPoint[0])) {
                    dpList[1].push(curDirPoint[1]); // Drop curDirPoint[0]
                  } else if (onAxisLine(curDirPoint[0], curDirPoint[1])) {
                    dpList[0].push(curDirPoint[0]); // Drop curDirPoint[1]
                  } else { // Drop curDirPoint[0] and end
                    dpList[0].push(axis[0] === 'x' ?
                      {x: curDirPoint[1].x, y: curDirPoint[0].y} :
                      {x: curDirPoint[0].x, y: curDirPoint[1].y});
                  }
                  return false;

                } else if (scopeContains[0] !== scopeContains[1]) { // turn notContain 90deg
                  axisScope = getIndexWithScope(scopeContains);
                  dpList[axisScope.notContain].push(curDirPoint[axisScope.notContain]);
                  curDirPoint[axisScope.notContain] =
                    getNextDirPoint(curDirPoint[axisScope.notContain], MIN_GRID_LEN,
                      getAxisDistance(curDirPoint[axisScope.notContain],
                          curDirPoint[axisScope.contain], axis[axisScope.contain]) >= MIN_GRID_LEN ?
                        getDirIdWithAxis(curDirPoint[axisScope.notContain], curDirPoint[axisScope.contain],
                          axis[axisScope.contain]) :
                        curDirPoint[axisScope.contain].dirId);

                } else { // turn both 90deg
                  points = [{x: curDirPoint[0].x, y: curDirPoint[0].y},
                    {x: curDirPoint[1].x, y: curDirPoint[1].y}];
                  dpList.forEach(function(targetDpList, iTarget) {
                    var iAnother = iTarget === 0 ? 1 : 0,
                      distance = getAxisDistance(points[iTarget], points[iAnother], axis[iTarget]);
                    if (distance < MIN_GRID_LEN) {
                      curDirPoint[iTarget] = getNextDirPoint(curDirPoint[iTarget], MIN_GRID_LEN - distance);
                    }
                    targetDpList.push(curDirPoint[iTarget]);
                    curDirPoint[iTarget] = getNextDirPoint(curDirPoint[iTarget], MIN_GRID_LEN,
                      getDirIdWithAxis(curDirPoint[iTarget], curDirPoint[iAnother], axis[iAnother]));
                  });
                }
              }
              return true;
            }

            curStatsSocketXYSE.forEach(function(socketXY, i) {
              var dirPoint = socketXY2Point(socketXY),
                len = options.socketGravitySE[i];
              (function(dirLen) {
                dirPoint.dirId = dirLen[0];
                len = dirLen[1];
              })(Array.isArray(len) ? ( // offset
                  len[0] < 0 ? [DIR_LEFT, -len[0]] : // ignore Y
                  len[0] > 0 ? [DIR_RIGHT, len[0]] : // ignore Y
                  len[1] < 0 ? [DIR_UP, -len[1]] :
                  len[1] > 0 ? [DIR_DOWN, len[1]] :
                                [socketXY.socketId, 0] // (0, 0)
                ) :
                typeof len !== 'number' ? [socketXY.socketId, MIN_GRID_LEN] : // auto
                len >= 0 ? [socketXY.socketId, len] : // distance
                            [reverseDir(socketXY.socketId), -len]);
              dpList[i].push(dirPoint);
              curDirPoint[i] = getNextDirPoint(dirPoint, len);
            });
            while (joinPoints()) { /* empty */ }

            dpList[1].reverse();
            dpList[0].concat(dpList[1]).forEach(function(dirPoint, i) {
              var point = {x: dirPoint.x, y: dirPoint.y};
              if (i > 0) { pathList.push([curPoint, point]); }
              curPoint = point;
            });
          }
// ==== /Copy from `test/spec/func/PATH_GRID`
    /* eslint-enable indent */
    ;

    grid();
    newPathData = [{type: 'M', values: [pathList[0][0].x, pathList[0][0].y]}];
    pathList.forEach(function(pathSeg) {
      newPathData.push(pathSeg.length === 2 ?
        {type: 'L', values: [pathSeg[1].x, pathSeg[1].y]} :
        {type: 'C', values: [pathSeg[1].x, pathSeg[1].y,
          pathSeg[2].x, pathSeg[2].y, pathSeg[3].x, pathSeg[3].y]});
    });
    return {pathData: newPathData, pathList: pathList};
  }

  // ================ context
  /* eslint-disable no-unused-vars, indent */
  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4,
    MIN_GRID_LEN = 30,

    SVG_NS = 'http://www.w3.org/2000/svg';
  /* eslint-enable no-unused-vars, indent */
  // ================ /context

  var
    INDENT = '    ',
    ID2VAR = {1: 'SOCKET_TOP', 2: 'SOCKET_RIGHT', 3: 'SOCKET_BOTTOM', 4: 'SOCKET_LEFT'},
    code = '',

    testCases = [
      {
        title: '1-1',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 200, y: 210, socketId: SOCKET_TOP}
      },
      {
        title: '1-2 on axis',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 200, y: 60 + MIN_GRID_LEN, socketId: SOCKET_TOP}
      },
      {
        title: '1-3 on axis',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50 + MIN_GRID_LEN, y: 210, socketId: SOCKET_TOP}
      },
      {
        title: '1-4 same coordinates',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50 + MIN_GRID_LEN, y: 60 + MIN_GRID_LEN, socketId: SOCKET_TOP}
      },
      {
        title: '2-1',
        socketXY0: {x: 50, y: 210, socketId: SOCKET_RIGHT},
        socketXY1: {x: 200, y: 60, socketId: SOCKET_TOP}
      },
      {
        title: '2-2 on axis',
        socketXY0: {x: 50, y: 210, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50 + MIN_GRID_LEN, y: 60, socketId: SOCKET_TOP}
      },
      {
        title: '2-1 (close)',
        socketXY0: {x: 50, y: 210, socketId: SOCKET_RIGHT},
        socketXY1: {x: 200, y: 210 + MIN_GRID_LEN - 15, socketId: SOCKET_TOP}
      },
      {
        title: '2-2 (close)',
        socketXY0: {x: 50, y: 210, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50 + MIN_GRID_LEN + 15, y: 210 + MIN_GRID_LEN - 15, socketId: SOCKET_TOP}
      },
      {
        title: '3',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_TOP},
        socketXY1: {x: 200, y: 210, socketId: SOCKET_RIGHT}
      },
      {
        title: '3 (close)',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_TOP},
        socketXY1: {x: 50 - MIN_GRID_LEN + 15, y: 60 - MIN_GRID_LEN + 15, socketId: SOCKET_RIGHT}
      },
      {
        title: '4-1',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 200, y: 210, socketId: SOCKET_LEFT}
      },
      {
        title: '4-2 on axis',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 200, y: 60, socketId: SOCKET_LEFT}
      },
      {
        title: '4-3 on cross axis',
        socketXY0: {x: 120 - MIN_GRID_LEN, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 120 + MIN_GRID_LEN, y: 210, socketId: SOCKET_LEFT}
      },
      {
        title: '4-4 same coordinates',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50 + MIN_GRID_LEN * 2, y: 60, socketId: SOCKET_LEFT}
      },
      {
        title: '4-5 on cross axis',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 210, socketId: SOCKET_RIGHT}
      },
      {
        title: '4-6 same coordinates',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 60, socketId: SOCKET_RIGHT}
      },
      {
        title: '5-1',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_LEFT},
        socketXY1: {x: 200, y: 210, socketId: SOCKET_LEFT}
      },
      {
        title: '5-2 on axis',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_LEFT},
        socketXY1: {x: 200, y: 60, socketId: SOCKET_LEFT}
      },
      {
        title: '5-1 (close 1)',
        socketXY0: {x: 200 - MIN_GRID_LEN + 15, y: 60, socketId: SOCKET_LEFT},
        socketXY1: {x: 200, y: 210, socketId: SOCKET_LEFT}
      },
      {
        title: '5-1 (close 2)',
        socketXY0: {x: 200 - MIN_GRID_LEN + 15, y: 210 - 15, socketId: SOCKET_LEFT},
        socketXY1: {x: 200, y: 210, socketId: SOCKET_LEFT}
      },
      {
        title: '6-1',
        socketXY0: {x: 200, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 210, socketId: SOCKET_LEFT}
      },
      {
        title: '6-2 on axis',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_LEFT},
        socketXY1: {x: 200, y: 60, socketId: SOCKET_RIGHT}
      },
      {
        title: '6-1 (close 1)',
        socketXY0: {x: 200, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 60 + MIN_GRID_LEN - 15, socketId: SOCKET_LEFT}
      },
      {
        title: '6-1 (close 2)',
        socketXY0: {x: 50 - MIN_GRID_LEN + 15, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 60 + MIN_GRID_LEN - 15, socketId: SOCKET_LEFT}
      },
      {
        title: '6-1 (close 3)',
        socketXY0: {x: 50 - MIN_GRID_LEN, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50 + 15, y: 60 + MIN_GRID_LEN - 15, socketId: SOCKET_LEFT}
      },
      {
        title: '6-1 (close 4)',
        socketXY0: {x: 50 - MIN_GRID_LEN, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50 + 15, y: 60 - 15, socketId: SOCKET_LEFT}
      },
      {
        title: '7-1 same SocketGravity',
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 75, socketId: SOCKET_RIGHT}
      },
      {
        title: '7-2 SocketGravity 50',
        socketGravity0: 50,
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 75, socketId: SOCKET_RIGHT}
      },
      {
        title: '7-3 SocketGravity -10',
        socketGravity0: -10,
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 75, socketId: SOCKET_RIGHT}
      },
      {
        title: '7-4 SocketGravity [50, 600]',
        socketGravity0: [50, 600],
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 75, socketId: SOCKET_RIGHT}
      },
      {
        title: '7-5 SocketGravity [-10, 600]',
        socketGravity0: [-10, 600],
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 75, socketId: SOCKET_RIGHT}
      },
      {
        title: '7-6 SocketGravity [0, 50]',
        socketGravity0: [0, 50],
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 75, socketId: SOCKET_RIGHT}
      },
      {
        title: '7-7 SocketGravity [0, -10]',
        socketGravity0: [0, -10],
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 75, socketId: SOCKET_RIGHT}
      },
      {
        title: '7-8 SocketGravity 0',
        socketGravity0: 0,
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 75, socketId: SOCKET_RIGHT}
      },
      {
        title: '7-9 SocketGravity [0, 0]',
        socketGravity0: [0, 0],
        socketXY0: {x: 50, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 75, socketId: SOCKET_RIGHT}
      },
      {
        title: '7-10 SocketGravity 0 on axis',
        socketGravity0: 0,
        socketXY0: {x: 50 + MIN_GRID_LEN, y: 60, socketId: SOCKET_RIGHT},
        socketXY1: {x: 50, y: 75, socketId: SOCKET_RIGHT}
      }
    ];

  testCases.forEach(function(testCase) {
    var data = getGrid([testCase.socketXY0, testCase.socketXY1],
        [testCase.socketGravity0, testCase.socketGravity1]),
      svg, grid, path, head;

    svg = document.createElementNS(SVG_NS, 'svg');
    svg.className.baseVal = 'view';
    grid = svg.appendChild(document.createElementNS(SVG_NS, 'use'));
    grid.href.baseVal = '#grid';

    [0, 1].forEach(function(i) {
      var socketXY = testCase['socketXY' + i],
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

    head = document.body.appendChild(document.createElement('h3'));
    head.textContent = testCase.title;

    document.body.appendChild(svg);

    code +=
      INDENT + '// ' + testCase.title + '\n' +
      INDENT + 'initContext(\n' +
        // props
        INDENT + '  {curPosition: {socketXYSE: [\n' +
        INDENT + '    {x: ' + testCase.socketXY0.x +
          ', y: ' + testCase.socketXY0.y + ', socketId: ' +
          ID2VAR[testCase.socketXY0.socketId] + '},\n' +
        INDENT + '    {x: ' + testCase.socketXY1.x +
          ', y: ' + testCase.socketXY1.y + ', socketId: ' +
          ID2VAR[testCase.socketXY1.socketId] + '}\n' +
        INDENT + '  ]}},\n' +
        // options
        (testCase.socketGravity0 != null || testCase.socketGravity1 != null ? // eslint-disable-line eqeqeq
          INDENT + '  {socketGravitySE: [' +
            ['socketGravity0', 'socketGravity1']
              .map(function(prop) {
                return testCase[prop] == null ? 'null' : // eslint-disable-line eqeqeq
                  Array.isArray(testCase[prop]) ? '[' + testCase[prop].join(', ') + ']' : testCase[prop];
              }).join(', ') +
            ']}\n' :
          INDENT + '  {socketGravitySE: []}\n') +
      INDENT + ');\n' +

      INDENT + 'pathList = [];\n' +
      INDENT + 'func();\n' +
      INDENT + 'expect(pathList).toEqual([\n' +
        data.pathList.map(function(pathSeg) {
          return INDENT + '  [' + pathSeg.map(function(point) {
            return '{x: ' + point.x + ', y: ' + point.y + '}';
          }).join(', ') + ']';
        }).join(',\n') +
        '\n' + INDENT + ']);\n\n';
  });

  document.getElementById('code').value = code;
}, false);
