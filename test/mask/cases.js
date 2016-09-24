/* global LeaderLine:false, guideView:false */

window.addEventListener('load', function() {
  'use strict';

  var
    VIEW_WH = 320, // Sync to `cases.scss`
    DEFAULT_ANCHOR_SE = [
      {left: 20, top: 50, width: 50, height: 50},
      {left: VIEW_WH - 20 - 50, top: VIEW_WH - 50 - 50, width: 50, height: 50}
    ],

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

  window.ll = [];

  testCases.forEach(function(testCase) {
    var llView, head, anchorSE = [];

    testCase.anchorSE = testCase.anchorSE || [];
    testCase.options = testCase.options || {};

    head = document.body.appendChild(document.createElement('h3'));
    head.textContent = testCase.title;
    llView = document.body.appendChild(document.createElement('div'));
    llView.className = 'll-view';

    [0, 1].forEach(function(i) {
      var styles;
      anchorSE[i] = llView.appendChild(document.createElement('div'));
      anchorSE[i].className = 'anchor anchor-' + i;
      testCase.anchorSE[i] = testCase.anchorSE[i] || {};
      styles = anchorSE[i].style;
      ['left', 'top', 'width', 'height'].forEach(function(prop) {
        styles[prop] = (testCase.anchorSE[i][prop] != null ?
          testCase.anchorSE[i][prop] : DEFAULT_ANCHOR_SE[i][prop]) + 'px';
      });
    });

    window.ll.push(new LeaderLine(anchorSE[0], anchorSE[1], testCase.options));
  });

  guideView();

}, false);
