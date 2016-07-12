/* global LeaderLine:false, forceReflow:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

window.addEventListener('load', function() {
  'use strict';

  /* eslint-disable no-unused-vars, indent */
  // ================ context
  var
    IS_TRIDENT = !!document.uniqueID,

    SVG_NS = 'http://www.w3.org/2000/svg';
  // ================ /context
  /* eslint-enable no-unused-vars, indent */

  var
    VIEW_WH = 320, // Sync to `cases.scss`
    DEFAULT_ANCHOR_SE = [
      {left: 20, top: 50, width: 50, height: 50},
      {left: VIEW_WH - 20 - 50, top: VIEW_WH - 50 - 50, width: 50, height: 50}
    ],
    // INDENT = '    ',
    // ID2VAR = {1: 'SOCKET_TOP', 2: 'SOCKET_RIGHT', 3: 'SOCKET_BOTTOM', 4: 'SOCKET_LEFT'},
    // code = '',

    testCases = [
      {
        title: '1-1'
      },
      {
        title: '1-2',
        options: {
          size: 12
        }
      },
      {
        title: '1-3',
        options: {
          outline: true
        }
      },
      {
        title: '1-4',
        options: {
          size: 12,
          outline: true,
          outlineColor: 'blue'
        }
      },
      {
        title: '1-5',
        options: {
          size: 12,
          outline: true,
          outlineColor: 'blue',
          endPlugOutline: true
        }
      }
    ];

  window.ll = {};

  testCases.forEach(function(testCase) {
    var view, llView, maskView, llSvg, maskSvg, head,
      anchorSE = [], ll, props, rect1, rect2, select, elmGs = {}, shownG;

    testCase.anchorSE = testCase.anchorSE || [];
    testCase.options = testCase.options || {};

    head = document.body.appendChild(document.createElement('h3'));
    head.textContent = testCase.title;

    view = document.body.appendChild(document.createElement('div'));
    view.className = 'view';
    llView = view.appendChild(document.createElement('div'));
    llView.className = 'll-view';
    maskView = view.appendChild(document.createElement('div'));
    maskView.className = 'mask-view';

    [0, 1].forEach(function(i) {
      var styles;
      anchorSE[i] = llView.appendChild(document.createElement('div'));
      anchorSE[i].className = 'anchor anchor-' + i;
      testCase.anchorSE[i] = testCase.anchorSE[i] || {};
      styles = anchorSE[i].style;
      ['left', 'top', 'width', 'height'].forEach(function(prop) {
        styles[prop] = (testCase.anchorSE[i][prop] != null ? // eslint-disable-line eqeqeq
          testCase.anchorSE[i][prop] : DEFAULT_ANCHOR_SE[i][prop]) + 'px';
      });
    });

    ll = new LeaderLine(anchorSE[0], anchorSE[1], testCase.options);
    props = window.insProps[ll._id];
    llSvg = props.svg;

    rect1 = llView.getBoundingClientRect();
    rect2 = llSvg.getBoundingClientRect();
    maskSvg = maskView.appendChild(document.createElementNS(SVG_NS, 'svg'));
    maskSvg.className.baseVal = 'mask-svg';
    maskSvg.style.left = rect2.left - rect1.left + 'px';
    maskSvg.style.top = rect2.top - rect1.top + 'px';
    maskSvg.style.width = llSvg.style.width;
    maskSvg.style.height = llSvg.style.height;
    maskSvg.setAttribute('viewBox', llSvg.getAttribute('viewBox'));

    select = maskView.appendChild(document.createElement('select'));
    Array.prototype.slice.call(llSvg.getElementsByTagName('mask')).forEach(function(mask, i) {
      var id = mask.id ?
          mask.id.replace((new RegExp('^leader\\-line\\-' + ll._id + '\\-')), '') : 'MASK-' + i,
        option = select.appendChild(document.createElement('option')),
        transform;
      elmGs[id] = maskSvg.appendChild(document.createElementNS(SVG_NS, 'g'));
      Array.prototype.slice.call(mask.childNodes).forEach(function(node) {
        var copiedNode = elmGs[id].appendChild(node.cloneNode());
        if (IS_TRIDENT) { forceReflow(copiedNode); }
      });
      elmGs[id].style.display = 'none';
      option.textContent = id;
      // `<mask>` for `<marker>`
      if (/^plug/.test(id)) {
        transform = maskSvg.createSVGTransform();
        transform.setTranslate(maskSvg.viewBox.baseVal.x, maskSvg.viewBox.baseVal.y);
        elmGs[id].transform.baseVal.appendItem(transform);
      }
      shownG = shownG || id;
    });
    select.addEventListener('change', function() {
      var id = select.value;
      if (id !== shownG) {
        elmGs[shownG].style.display = 'none';
        elmGs[id].style.display = 'inline';
        shownG = id;
      }
    }, false);
    if (shownG) { elmGs[shownG].style.display = 'inline'; }

    [llSvg, maskSvg].forEach(function(svg) {
      var border = svg.appendChild(document.createElementNS(SVG_NS, 'rect')),
        viewBox = svg.viewBox.baseVal;
      border.className.baseVal = 'border';
      border.x.baseVal.value = viewBox.x - 0.5;
      border.y.baseVal.value = viewBox.y - -0.5;
      border.width.baseVal.value = viewBox.width + 1;
      border.height.baseVal.value = viewBox.height + 1;
    });

    window.ll[testCase.title] = ll;

    // code +=
    //   INDENT + '// ' + testCase.title + '\n' +
    //   INDENT + 'props = {socketXYSE: [\n' +
    //   INDENT + '  {x: ' + testCase.socketXY0.x +
    //     ', y: ' + testCase.socketXY0.y + ', socketId: ' +
    //     ID2VAR[testCase.socketXY0.socketId] + '},\n' +
    //   INDENT + '  {x: ' + testCase.socketXY1.x +
    //     ', y: ' + testCase.socketXY1.y + ', socketId: ' +
    //     ID2VAR[testCase.socketXY1.socketId] + '}\n' +
    //   INDENT + ']};\n' +
    //   (testCase.socketGravity0 != null || testCase.socketGravity1 != null ? // eslint-disable-line eqeqeq
    //     INDENT + 'options = {socketGravitySE: [' +
    //       ['socketGravity0', 'socketGravity1']
    //         .map(function(prop) {
    //           return testCase[prop] == null ? 'null' : // eslint-disable-line eqeqeq
    //             Array.isArray(testCase[prop]) ? '[' + testCase[prop].join(', ') + ']' : testCase[prop];
    //         }).join(', ') +
    //       ']};\n'
    //     : '') +
    //   INDENT + 'pathSegs = [];\n' +
    //   INDENT + 'func();\n' +
    //   INDENT + 'expect(pathSegs).toEqual([\n' +
    //     data.pathSegs.map(function(pathSeg) {
    //       return INDENT + '  [' + pathSeg.map(function(point) {
    //         return '{x: ' + point.x + ', y: ' + point.y + '}';
    //       }).join(', ') + ']';
    //     }).join(',\n') +
    //     '\n' + INDENT + ']);\n' +
    //   (testCase.socketGravity0 != null || testCase.socketGravity1 != null ? // eslint-disable-line eqeqeq
    //     INDENT + 'options = {socketGravitySE: []};\n' : '') +
    //   '\n';
  });

  // document.getElementById('code').value = code;
}, false);
