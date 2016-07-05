/* exported guideView */

var guideView = (function() {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg',
    PATH_C_SIZE = 5,
    guideElements = [];

  function addXMarker(point, pathSegs) {
    pathSegs.push(
      {type: 'M', values: [point.x - PATH_C_SIZE, point.y - PATH_C_SIZE]},
      {type: 'l', values: [PATH_C_SIZE * 2, PATH_C_SIZE * 2]},
      {type: 'm', values: [0, -PATH_C_SIZE * 2]},
      {type: 'l', values: [-PATH_C_SIZE * 2, PATH_C_SIZE * 2]}
    );
    return pathSegs;
  }

  function guideView() {
    guideElements.forEach(function(element) { element.parentNode.removeChild(element); });
    guideElements = [];

    Object.keys(window.insProps).forEach(function(id) {
      var props = window.insProps[id], options = props.options,
        llSvg = props.svg,
        baseDocument = props.baseWindow.document,
        guideSvg = baseDocument.body.appendChild(document.createElementNS(SVG_NS, 'svg'));

      guideSvg.className.baseVal = 'guide-svg';
      guideSvg.setAttribute('viewBox', llSvg.getAttribute('viewBox'));
      (function(guideStyles, llStyles) {
        ['left', 'top', 'width', 'height'].forEach(function(prop) { guideStyles[prop] = llStyles[prop]; });
      })(guideSvg.style, llSvg.style);

      // ======== path C
      (function() {
        var pathSegs = [], curPoint;
        props.linePath.getPathData().forEach(function(pathSeg) {
          var values = pathSeg.values;
          if (pathSeg.type === 'C') {
            pathSegs.push([curPoint,
              {x: values[0], y: values[1]},
              {x: values[2], y: values[3]},
              {x: values[4], y: values[5]}]);
          }
          curPoint = {x: values[values.length - 2], y: values[values.length - 1]};
        });
        pathSegs.forEach(function(pathSeg) {
          var path = guideSvg.appendChild(baseDocument.createElementNS(SVG_NS, 'path'));
          path.className.baseVal = 'guide-c';
          path.setPathData(
            addXMarker(pathSeg[2],
              addXMarker(pathSeg[1], [
                // line 1
                {type: 'M', values: [pathSeg[0].x, pathSeg[0].y]},
                {type: 'L', values: [pathSeg[1].x, pathSeg[1].y]},
                // line 2
                {type: 'M', values: [pathSeg[3].x, pathSeg[3].y]},
                {type: 'L', values: [pathSeg[2].x, pathSeg[2].y]}
              ])
            )
          );
        });
      })();

      // ======== BBox
      (function() {
        var path = guideSvg.appendChild(baseDocument.createElementNS(SVG_NS, 'path')),
          padding = Math.max(options.lineSize / 2,
            props.curViewBBox.plugBCircleSE[0] || 0, props.curViewBBox.plugBCircleSE[1] || 0),
          pathSegs = [], corners = {};
        props.linePath.getPathData().forEach(function(pathSeg) {
          var values = pathSeg.values, point, i, iLen = values.length;
          for (i = 0; i < iLen; i += 2) {
            // relative commands (e.g. `h`) are not supported.
            if (values[i + 1] == null) { break; } // eslint-disable-line eqeqeq
            point = {x: values[i], y: values[i + 1]};
            /* eslint-disable eqeqeq */
            if (corners.x1 == null || point.x < corners.x1) { corners.x1 = point.x; }
            if (corners.x2 == null || point.x > corners.x2) { corners.x2 = point.x; }
            if (corners.y1 == null || point.y < corners.y1) { corners.y1 = point.y; }
            if (corners.y2 == null || point.y > corners.y2) { corners.y2 = point.y; }
            /* eslint-enable eqeqeq */
          }
        });
        [['x1', 'y1', -1, -1], ['x2', 'y1', 1, -1], ['x1', 'y2', -1, 1], ['x2', 'y2', 1, 1]]
          .forEach(function(corner) {
            var xKey = corner[0], yKey = corner[1], xDir = corner[2], yDir = corner[3];
            pathSegs.push(
              {type: 'M', values: [corners[xKey] + padding * xDir, corners[yKey]]},
              {type: 'L', values: [corners[xKey], corners[yKey]]},
              {type: 'L', values: [corners[xKey], corners[yKey] + padding * yDir]}
            );
          });
        path.className.baseVal = 'guide-bbox';
        path.setPathData(pathSegs);
      })();

      // ======== socket
      (function() {
        var path = guideSvg.appendChild(baseDocument.createElementNS(SVG_NS, 'path')),
          pathSegs = [];
        options.anchorSE.forEach(function(anchor) {
          var bBox = window.getBBoxNest(anchor, props.baseWindow);
          [
            {x: bBox.left + bBox.width / 2, y: bBox.top},
            {x: bBox.right, y: bBox.top + bBox.height / 2},
            {x: bBox.left + bBox.width / 2, y: bBox.bottom},
            {x: bBox.left, y: bBox.top + bBox.height / 2}
          ].forEach(function(point) { addXMarker(point, pathSegs); });
        });
        path.className.baseVal = 'guide-socket';
        path.setPathData(pathSegs);
      })();

      guideElements.push(guideSvg);
    });

  }

  return guideView;
})();
