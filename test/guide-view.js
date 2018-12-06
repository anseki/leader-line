/* global forceReflow:false */
/* exported guideView, pathData2BBox */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

var pathData2BBox = (function() {
  'use strict';

  // corners: {{x1, y1, x2, y2}}
  function createBBox(corners) {
    return {left: corners.x1, top: corners.y1, right: corners.x2, bottom: corners.y2,
      width: corners.x2 - corners.x1, height: corners.y2 - corners.y1};
  }

  // relative commands (e.g. `c`, `h`) are not supported.
  function pathData2BBox(pathData) {
    return createBBox(pathData.reduce(function(corners, pathSeg) {
      var values = pathSeg.values, x, y, i, iLen = values.length;
      for (i = 0; i < iLen; i += 2) {
        if (values[i + 1] == null) { break; }
        x = values[i];
        y = values[i + 1];
        if (corners.x1 == null || x < corners.x1) { corners.x1 = x; }
        if (corners.x2 == null || x > corners.x2) { corners.x2 = x; }
        if (corners.y1 == null || y < corners.y1) { corners.y1 = y; }
        if (corners.y2 == null || y > corners.y2) { corners.y2 = y; }
      }
      return corners;
    }, {}));
  }

  return pathData2BBox;
})();

var guideView = (function() {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg',
    PATH_C_SIZE = 5,
    IS_EDGE = '-ms-scroll-limit' in document.documentElement.style &&
      '-ms-ime-align' in document.documentElement.style && !window.navigator.msPointerEnabled,
    IS_TRIDENT = !IS_EDGE && !!document.uniqueID, // Future Edge might support `document.uniqueID`.
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
      var props = window.insProps[id], curStats = props.curStats,
        llSvg = props.svg, llBBox = {},
        baseDocument = props.baseWindow.document,
        guideSvg = baseDocument.body.appendChild(baseDocument.createElementNS(SVG_NS, 'svg')),
        edgeLeft, edgeRight;

      guideSvg.className.baseVal = 'guide-svg';
      guideSvg.setAttribute('viewBox', llSvg.getAttribute('viewBox'));
      (function(guideStyles, llStyles) {
        ['left', 'top', 'width', 'height'].forEach(function(prop) {
          llBBox[prop] = parseFloat(guideStyles[prop] = llStyles[prop]);
        });
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
          padding = Math.max(curStats.line_strokeWidth / 2,
            curStats.viewBox_plugBCircleSE[0] || 0, curStats.viewBox_plugBCircleSE[1] || 0),
          pathSegs = [],
          bBox = pathData2BBox(props.linePath.getPathData());
        [['left', 'top', -1, -1], ['right', 'top', 1, -1], ['left', 'bottom', -1, 1], ['right', 'bottom', 1, 1]]
          .forEach(function(corner) {
            var xKey = corner[0], yKey = corner[1], xDir = corner[2], yDir = corner[3];
            pathSegs.push(
              {type: 'M', values: [bBox[xKey] + padding * xDir, bBox[yKey]]},
              {type: 'L', values: [bBox[xKey], bBox[yKey]]},
              {type: 'L', values: [bBox[xKey], bBox[yKey] + padding * yDir]}
            );
          });
        path.className.baseVal = 'guide-bbox';
        path.setPathData(pathSegs);
      })();

      edgeLeft = llBBox.left;
      edgeRight = llBBox.left + llBBox.width;

      // ======== socket
      (function() {
        var path = guideSvg.appendChild(baseDocument.createElementNS(SVG_NS, 'path')),
          pathSegs = [];
        [0, 1].forEach(function(i) {
          var anchor = props.options.anchorSE[i], isAttach = props.optionIsAttach.anchorSE[i],
            attachProps = isAttach !== false ? window.insAttachProps[anchor._id] : null,
            bBox = isAttach !== false && attachProps.conf.getBBoxNest ?
              attachProps.conf.getBBoxNest(attachProps, props,
                attachProps.conf.getStrokeWidth ? attachProps.conf.getStrokeWidth(attachProps, props) : 0) :
              window.getBBoxNest(anchor, props.baseWindow);
          if (bBox.left < edgeLeft) { edgeLeft = bBox.left; }
          if (bBox.right > edgeRight) { edgeRight = bBox.right; }
          [
            {x: bBox.left + bBox.width / 2, y: bBox.top}, // TOP
            {x: bBox.right, y: bBox.top + bBox.height / 2}, // RIGHT
            {x: bBox.left + bBox.width / 2, y: bBox.bottom}, // BOTTOM
            {x: bBox.left, y: bBox.top + bBox.height / 2} // LEFT
          ].forEach(function(point) { addXMarker(point, pathSegs); });
        });
        path.className.baseVal = 'guide-socket';
        path.setPathData(pathSegs);
      })();

      // ======== pathLabel
      (function() {
        var elmPath, usePath;
        props.attachments.forEach(function(attachProps) {
          if (attachProps.conf === window.ATTACHMENTS.pathLabel && (elmPath = attachProps.elmPath)) {
            usePath = guideSvg.appendChild(baseDocument.createElementNS(SVG_NS, 'use'));
            usePath.href.baseVal = '#' + elmPath.id;
            usePath.className.baseVal = 'guide-pathLabel';
          }
        });
      })();

      guideElements.push(guideSvg);

      (function() {
        var maskSvg = baseDocument.body.appendChild(baseDocument.createElementNS(SVG_NS, 'svg')),
          select = baseDocument.body.appendChild(baseDocument.createElement('select')),
          elmGs = {}, shownG;

        maskSvg.className.baseVal = 'guide-mask-svg';
        maskSvg.setAttribute('viewBox', llSvg.getAttribute('viewBox'));
        maskSvg.style.left = edgeRight + (llBBox.left - edgeLeft) + 'px';
        (function(guideStyles, llStyles) {
          ['top', 'width', 'height'].forEach(function(prop) { guideStyles[prop] = llStyles[prop]; });
        })(maskSvg.style, llSvg.style);

        Array.prototype.slice.call(llSvg.getElementsByTagName('mask')).forEach(function(mask, i) {
          var maskId = mask.id ?
              mask.id.replace((new RegExp('^leader\\-line\\-' + id + '\\-')), '') : 'MASK-' + i,
            option = select.appendChild(baseDocument.createElement('option')),
            transform;

          // Copy elements in <mask> to <g>
          elmGs[maskId] = maskSvg.appendChild(baseDocument.createElementNS(SVG_NS, 'g'));
          Array.prototype.slice.call(mask.childNodes).forEach(function(node) {
            var copiedNode = elmGs[maskId].appendChild(node.cloneNode());
            if (IS_TRIDENT) { forceReflow(copiedNode); }
          });

          elmGs[maskId].style.display = 'none';
          option.textContent = maskId;
          // `<mask>` for `<marker>`
          if (/^plug/.test(maskId)) {
            transform = maskSvg.createSVGTransform();
            transform.setTranslate(maskSvg.viewBox.baseVal.x, maskSvg.viewBox.baseVal.y);
            elmGs[maskId].transform.baseVal.appendItem(transform);
          }
          shownG = shownG || maskId;
        });

        select.addEventListener('change', function() {
          var id = select.value;
          if (id !== shownG) {
            if (shownG) { elmGs[shownG].style.display = 'none'; }
            elmGs[id].style.display = 'inline';
            shownG = id;
          }
        }, false);
        if (shownG) { elmGs[shownG].style.display = 'inline'; }

        select.className = 'guide-mask-select';
        select.style.left = edgeRight + (llBBox.left - edgeLeft) + 'px'; // maskSvg#left
        select.style.top = llBBox.top + llBBox.height + 'px'; // maskSvg#bottom

        [llSvg, maskSvg].forEach(function(svg) {
          var border = svg.appendChild(baseDocument.createElementNS(SVG_NS, 'rect')),
            viewBox = svg.viewBox.baseVal;
          border.className.baseVal = 'border';
          border.x.baseVal.value = viewBox.x - 0.5;
          border.y.baseVal.value = viewBox.y - 0.5;
          border.width.baseVal.value = viewBox.width + 1;
          border.height.baseVal.value = viewBox.height + 1;
          guideElements.push(border);
        });

        guideElements.push(maskSvg, select);
      })();
    });

  }

  return guideView;
})();
