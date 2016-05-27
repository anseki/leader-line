/* exported getGrid */

function getGrid(startSocketXY, endSocketXY, startSocketGravity, endSocketGravity) {
  'use strict';

  var MIN_GRID_LEN = 30,
    props = {startSocketXY: startSocketXY, endSocketXY: endSocketXY}, options = {},
    pathSegs = [], newPathData;

  if (startSocketGravity != null) { options.startSocketGravity = startSocketGravity; } // eslint-disable-line eqeqeq
  if (endSocketGravity != null) { options.endSocketGravity = endSocketGravity; } // eslint-disable-line eqeqeq

  function grid() { // PATH_GRID
    /**
     * @typedef {Object} DirPoint
     * @property {number} dirId - DIR_UP, DIR_RIGHT, DIR_DOWN, DIR_LEFT
     * @property {number} x
     * @property {number} y
     */
    var
      DIR_UP = 1, DIR_RIGHT = 2, DIR_DOWN = 3, DIR_LEFT = 4, // Correspond with `socketId`
      dpList = {start: [], end: []}, curDirPoint = {}, scopeContains = {}, axis = {};

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
        if (dirId === reverseDir(dirPoint.dirId)) { throw new Error('Invalid dirId'); }
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

    // Must `scopeContains.start !== scopeContains.end`
    function getKeysWithScope(scopeContains) {
      return scopeContains.start ?
        {contain: 'start', notContain: 'end'} : {contain: 'end', notContain: 'start'};
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

    ['start', 'end'].forEach(function(key) {
      var socketXY = props[key + 'SocketXY'],
        dirPoint = {x: socketXY.x, y: socketXY.y},
        len = options[key + 'SocketGravity'];
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
      dpList[key].push(dirPoint);
      curDirPoint[key] = getNextDirPoint(dirPoint, len);
    });

    while (true) {
      scopeContains.start = inAxisScope(curDirPoint.end, curDirPoint.start);
      scopeContains.end = inAxisScope(curDirPoint.start, curDirPoint.end);
      axis.start = getAxis(curDirPoint.start.dirId);
      axis.end = getAxis(curDirPoint.end.dirId);

      if (axis.start === axis.end) { // Same axis
        if (scopeContains.start && scopeContains.end) {
          if (!onAxisLine(curDirPoint.end, curDirPoint.start)) {
            if (curDirPoint.start[axis.start] === curDirPoint.end[axis.end]) { // vertical
              dpList.start.push(curDirPoint.start);
              dpList.end.push(curDirPoint.end);
            } else {
              (function() {
                var center = curDirPoint.start[axis.start] +
                  (curDirPoint.end[axis.end] - curDirPoint.start[axis.start]) / 2;
                dpList.start.push(
                  getNextDirPoint(curDirPoint.start, Math.abs(center - curDirPoint.start[axis.start])));
                dpList.end.push(
                  getNextDirPoint(curDirPoint.end, Math.abs(center - curDirPoint.end[axis.end])));
              })();
            }
          }
          break;

        } else if (scopeContains.start !== scopeContains.end) { // turn notContain 90deg
          (function() {
            var axisScope = getKeysWithScope(scopeContains),
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
          })();

        } else { // turn both 90deg
          (function() {
            var distance =
              getAxisDistance(curDirPoint.start, curDirPoint.end, axis.start === 'x' ? 'y' : 'x');
            ['start', 'end'].forEach(function(target) {
              var another = target === 'start' ? 'end' : 'start';
              dpList[target].push(curDirPoint[target]);
              curDirPoint[target] = getNextDirPoint(curDirPoint[target], MIN_GRID_LEN,
                distance >= MIN_GRID_LEN * 2 ?
                  getDirIdWithAxis(curDirPoint[target], curDirPoint[another],
                    (axis[target] === 'x' ? 'y' : 'x')) :
                  (axis[target] === 'x' ? DIR_DOWN : DIR_RIGHT));
            });
          })();
        }

      } else { // Different axis
        if (scopeContains.start && scopeContains.end) {
          if (onAxisLine(curDirPoint.end, curDirPoint.start)) {
            dpList.end.push(curDirPoint.end); // Drop curDirPoint.start
          } else if (onAxisLine(curDirPoint.start, curDirPoint.end)) {
            dpList.start.push(curDirPoint.start); // Drop curDirPoint.end
          } else { // Drop curDirPoint.start and end
            dpList.start.push(axis.start === 'x' ?
              {x: curDirPoint.end.x, y: curDirPoint.start.y} :
              {x: curDirPoint.start.x, y: curDirPoint.end.y});
          }
          break;

        } else if (scopeContains.start !== scopeContains.end) { // turn notContain 90deg
          (function() {
            var axisScope = getKeysWithScope(scopeContains);
            dpList[axisScope.notContain].push(curDirPoint[axisScope.notContain]);
            curDirPoint[axisScope.notContain] =
              getNextDirPoint(curDirPoint[axisScope.notContain], MIN_GRID_LEN,
                getAxisDistance(curDirPoint[axisScope.notContain],
                    curDirPoint[axisScope.contain], axis[axisScope.contain]) >= MIN_GRID_LEN ?
                  getDirIdWithAxis(curDirPoint[axisScope.notContain], curDirPoint[axisScope.contain],
                    axis[axisScope.contain]) :
                  curDirPoint[axisScope.contain].dirId);
          })();

        } else { // turn both 90deg
          (function() {
            var points = {
              start: {x: curDirPoint.start.x, y: curDirPoint.start.y},
              end: {x: curDirPoint.end.x, y: curDirPoint.end.y}
            };
            ['start', 'end'].forEach(function(target) {
              var another = target === 'start' ? 'end' : 'start',
                distance = getAxisDistance(points[target], points[another], axis[target]);
              if (distance < MIN_GRID_LEN) {
                curDirPoint[target] = getNextDirPoint(curDirPoint[target], MIN_GRID_LEN - distance);
              }
              dpList[target].push(curDirPoint[target]);
              curDirPoint[target] = getNextDirPoint(curDirPoint[target], MIN_GRID_LEN,
                getDirIdWithAxis(curDirPoint[target], curDirPoint[another], axis[another]));
            });
          })();
        }
      }
    }

    (function() {
      var curPoint;
      dpList.end.reverse();
      dpList.start.concat(dpList.end).forEach(function(point, i) {
        if (i > 0) { pathSegs.push([curPoint, point]); }
        curPoint = point;
      });
    })();
  }

  grid();
  newPathData = [{type: 'M', values: [pathSegs[0][0].x, pathSegs[0][0].y]}];
  pathSegs.forEach(function(pathSeg) {
    newPathData.push(pathSeg.length === 2 ?
      {type: 'L', values: [pathSeg[1].x, pathSeg[1].y]} :
      {type: 'C', values: [pathSeg[1].x, pathSeg[1].y,
        pathSeg[2].x, pathSeg[2].y, pathSeg[3].x, pathSeg[3].y]});
  });
  return {pathData: newPathData, pathSegs: pathSegs};
}
