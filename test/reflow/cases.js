/* global LeaderLine:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

window.addEventListener('load', function() {
  'use strict';

  function escapeHtml(text) {
    return (text || '')
      .replace(/\&/g, '&amp;')
      .replace(/\'/g, '&#x27;')
      .replace(/\`/g, '&#x60;')
      .replace(/\"/g, '&quot;')
      .replace(/\</g, '&lt;')
      .replace(/\>/g, '&gt;');
  }

  function getCode(fnc) {
    var matches,
      lines = fnc.toString()
        .replace(/^\s*function\s*\(\)\s*\{\s*?( *\S[\s\S]*?)\s*\}\s*$/, '$1').split('\n');
    if ((matches = /^( +)/.exec(lines[0]))) {
      lines = lines.map(function(line) { return line.replace(new RegExp('^' + matches[1]), ''); });
    }
    return lines.map(function(line) {
      return escapeHtml(line).replace(/^(.*?)(\/\/.*)$/g, function(s, code, comment) {
        return code + '<span class="comment">' + comment + '</span>';
      });
    }).join('<br>').replace(/(\/\*[\s\S]*?\*\/)/g, function(s, comment) {
      return '<span class="comment">' + comment + '</span>';
    });
  }

  var list = document.getElementById('list'),
    anchor0 = document.getElementById('anchor-0'),
    anchor1 = document.getElementById('anchor-1'),
    iframeDoc = document.getElementById('iframe1').contentDocument,
    anchorC0 = iframeDoc.getElementById('anchor-c0'),
    anchorC1 = iframeDoc.getElementById('anchor-c1'),
    iCase, ll,

    testCases = [
      {
        fnc: function() {
          ll.setOptions({
            startPlug: 'arrow2',
            outline: true,
            outlineColor: 'rgba(255, 0, 0, 0.5)'
          });
          // [TRIDENT] plugsFace is not updated when lineSize is changed
          setTimeout(function() {
            ll.size += 2;
          }, 500);
        }
      },
      {
        fnc: function() {
          ll.setOptions({
            startPlug: 'square',
            endPlug: 'square'
          });
          // [BLINK] lineSize is not updated when path is not changed
          setTimeout(function() {
            ll.size += 10;
          }, 500);
        }
      },
      {
        fnc: function() {
          // [TRIDENT] lineColor is ignored
          // [TRIDENT] lineOutlineColor is ignored
          // [GECKO] plugsFace is ignored
          ll.setOptions({
            startPlug: 'arrow2',
            outline: true,
            outlineColor: 'rgba(255, 0, 0, 0.5)'
          });
        }
      },
      {
        fnc: function() {
          // [None]
          ll.setOptions({
            startPlug: 'arrow2',
            outline: true,
            outlineColor: 'rgba(255, 0, 0, 0.5)',
            endPlugOutline: true
          });
          setTimeout(function() {
            ll.setOptions({
              startPlugOutline: true,
              startPlugOutlineColor: 'rgba(0, 0,255, 0.5)',
              endPlugOutlineColor: 'rgba(0, 255, 0, 0.5)'
            });
          }, 500);
        }
      },
      {
        fnc: function() {
          // [None] plugOutlineSizeSE is ignored when exists plug is changed
          ll.setOptions({
            startPlug: 'arrow2'
          });
          setTimeout(function() {
            ll.setOptions({
              startPlugOutline: true,
              startPlugOutlineColor: 'rgba(0, 0,255, 0.5)',
              endPlugOutline: true,
              endPlugOutlineColor: 'rgba(0, 255, 0, 0.5)',
              startPlugOutlineSize: 3,
              endPlugOutlineSize: 3
            });
          }, 500);
        }
      },
      {
        fnc: function() {
          ll.setOptions({
            path: 'straight'
          });
          // [TRIDENT] markerOrient is not updated when plugSE is changed
          // [GECKO] plugsFace is not updated when plugSE is changed
          setTimeout(function() {
            ll.setOptions({
              startPlug: 'arrow1',
              endPlug: 'arrow2'
            });
          }, 500);
        }
      },
      {
        fnc: function() {
          ll.setOptions({
            startPlug: 'arrow1'
          });
          // [TRIDENT] markerOrient is not updated when path is changed
          // [TRIDENT] lineMaskCaps is ignored when path is changed
          // [GECKO] path is not updated when path is changed
          setTimeout(function() {
            ll.setOptions({
              path: 'straight'
            });
          }, 500);
        }
      },
      {
        fnc: function() {
          ll.setOptions({
            startPlug: 'arrow2',
            outline: true,
            outlineColor: 'rgba(255, 0, 0, 0.5)'
          });
          // [TRIDENT] lineMaskCaps is ignored when lineSize is changed
          // [TRIDENT] lineOutlineMaskCaps is ignored when lineSize is changed
          setTimeout(function() {
            ll.size += 2;
          }, 500);
        }
      },
      {
        fnc: function() {
          ll.setOptions({
            startPlug: 'arrow2',
            outline: true,
            outlineColor: 'rgba(255, 0, 0, 0.5)'
          });
          // [TRIDENT] alpha of outlineColor is removed when lineSize is changed
          setTimeout(function() {
            ll.size += 2;
          }, 500);
        }
      },
      {
        fnc: function() {
          ll.setOptions({
            outline: true,
            outlineColor: 'rgba(255, 0, 0, 0.5)'
          });
          // [None]
          setTimeout(function() {
            ll.setOptions({
              start: anchorC0,
              end: anchorC1
            });
          }, 500);
        }
      }
    ];

  function selectTest(i) {
    if (ll) { ll.remove(); }
    ll = new LeaderLine(anchor0, anchor1, {size: 16, color: 'rgba(255, 0, 0, 0.5)'});
    testCases[i].fnc();
    testCases[i].input.checked = true;
    iCase = i;
    window.ll = ll;
  }

  testCases.forEach(function(testCase, i) {
    var input = list.appendChild(document.createElement('input')),
      label = list.appendChild(document.createElement('label')),
      pre = label.appendChild(document.createElement('pre')),
      id = 'case-' + i;
    testCase.input = input;
    testCase.label = label;
    input.setAttribute('type', 'radio');
    input.setAttribute('name', 'case');
    input.id = id;
    label.setAttribute('for', id);
    pre.innerHTML = getCode(testCase.fnc);

    input.addEventListener('click', function() { selectTest(i); }, false);
  });

  selectTest(0);

  document.getElementById('btn-next').addEventListener('click', function() {
    var rect1, rect2;
    selectTest(iCase < testCases.length - 1 ? iCase + 1 : 0);
    rect1 = list.getBoundingClientRect();
    rect2 = testCases[iCase].label.getBoundingClientRect();
    list.scrollTop +=
      (rect2.top - parseFloat(getComputedStyle(testCases[iCase].label, '').marginTop)) - rect1.top;
  }, false);

}, false);
