/* global LeaderLine:false, functionTest:false */

window.addEventListener('load', function() {
  'use strict';

  var anchor0 = document.getElementById('anchor-0'),
    anchor1 = document.getElementById('anchor-1'),
    iframeDoc = document.getElementById('iframe1').contentDocument,
    anchorC0 = iframeDoc.getElementById('anchor-c0'),
    anchorC1 = iframeDoc.getElementById('anchor-c1'),
    ll, timer;

  functionTest(
    function() {
      if (timer) { clearTimeout(timer); }
      if (ll) { ll.remove(); }
      ll = new LeaderLine(anchor0, anchor1, {size: 16, color: 'rgba(255, 0, 0, 0.5)'});
      window.ll = ll;
    },
    [
      {
        fnc: function() {
          ll.setOptions({
            startPlug: 'arrow2',
            outline: true,
            outlineColor: 'rgba(255, 0, 0, 0.5)'
          });
          // [TRIDENT] plugsFace is not updated when lineSize is changed
          timer = setTimeout(function() {
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
          // [BLINK], [WEBKIT] lineSize is not updated when path is not changed
          timer = setTimeout(function() {
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
          // [TRIDENT] lineMaskCaps is not updated when plugOutline_colorTraSE is changed
          ll.setOptions({
            startPlug: 'arrow2',
            outline: true,
            outlineColor: 'rgba(255, 0, 0, 0.5)',
            endPlugOutline: true
          });
          timer = setTimeout(function() {
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
          timer = setTimeout(function() {
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
          timer = setTimeout(function() {
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
          timer = setTimeout(function() {
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
          timer = setTimeout(function() {
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
          timer = setTimeout(function() {
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
          timer = setTimeout(function() {
            ll.setOptions({
              start: anchorC0,
              end: anchorC1
            });
          }, 500);
        }
      },
      {
        fnc: function() {
          // [BLINK] plugColorSE is not updated when Line is not changed
          ll.setOptions({
            endPlugColor: 'rgb(255, 0, 0)'
          });
          timer = setTimeout(function() {
            ll.setOptions({
              endPlugColor: 'rgb(0, 255, 0)'
            });
          }, 500);
        }
      },
      {
        fnc: function() {
          // [BLINK], [WEBKIT], [TRIDENT] capsMaskMarkerShapeSE is not updated when line has no alpha
          ll.setOptions({
            color: 'rgb(255, 0, 0)'
          });
          timer = setTimeout(function() {
            ll.setOptions({
              endPlugColor: 'rgba(0, 255, 0, 0.5)'
            });
          }, 500);
        }
      },
      {
        fnc: function() {
          // [TRIDENT] masks is ignored when opacity of svg is changed
          timer = setTimeout(function() {
            ll.hide('fade', {duration: 2000});
          }, 500);
        }
      }
    ]);

}, false);
