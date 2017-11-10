/* exported polygon2PathList */

var polygon2PathList = (function() {
  'use strict';

  /**
   * @typedef {Object} PointObject
   * @property {number} x
   * @property {number} y
   * @property {boolean} [isAbs]
   */

  /**
   * @typedef {[x, y, isAbs]} PointArray
   */

  /** @typedef {(PointObject|PointArray)} VPoint */

  function getPointObject(vPoint) {
    return Array.isArray(vPoint) ? {x: vPoint[0], y: vPoint[1], isAbs: vPoint[2]} : vPoint;
  }

  /**
   * @param {VPoint[]} vPoints - All points of polygon.
   * @returns {Array} pathList
   */
  function polygon2PathList(vPoints) {
    var isAbs;
    polygon2PathList.currentPoint = null;
    return vPoints.reduce(function(pathList, vPoint) {
      var point = getPointObject(vPoint), points;

      if (!polygon2PathList.currentPoint) {
        polygon2PathList.currentPoint = {x: point.x, y: point.y}; // abs
        isAbs = false; // default

      } else {
        if (point.isAbs != null) {
          isAbs = point.isAbs;
        }
        points = [polygon2PathList.currentPoint];
        points.push((polygon2PathList.currentPoint = {
          x: point.x + (isAbs ? 0 : polygon2PathList.currentPoint.x),
          y: point.y + (isAbs ? 0 : polygon2PathList.currentPoint.y)
        }));
        pathList.push(points);
      }

      return pathList;
    }, []);
  }

  return polygon2PathList;
})();
