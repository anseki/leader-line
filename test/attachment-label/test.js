/* global LeaderLine:false, PlainDraggable:false */

window.traceLog.enabled = true;
window.addEventListener('load', function() {
  'use strict';

  var anchor1 = document.getElementById('anchor-1'),
    ll = new LeaderLine(document.getElementById('anchor-0'), anchor1, {
      color: 'rgba(255, 0, 0, 0.5)', endPlug: 'disc', endPlugSize: 4
    });

  new PlainDraggable(anchor1, { // eslint-disable-line no-new
    onMove: function() { ll.position(); },
    zIndex: false
  });

  // switcher - label
  (function() {
    var select = document.getElementById('attachment-name');

    function initLabel() {
      switch (select.value) {
        case 'captionLabel':
          ll.setOptions({
            startLabel: '[startLabel]',
            endLabel: '[endLabel]',
            // startLabel: LeaderLine.captionLabel({text: '[startLabel]', offset: [0, 0]}),
            // endLabel: LeaderLine.captionLabel({text: '[endLabel]', offset: [0, 0]}),
            middleLabel: '[middleLabel]'
          });
          break;

        case 'pathLabel':
          ll.setOptions({
            startLabel: LeaderLine.pathLabel({text: '[startLabel]'}),
            endLabel: LeaderLine.pathLabel({text: '[endLabel]'}),
            middleLabel: LeaderLine.pathLabel({text: '[middleLabel]'})
          });
          break;
        // no default
      }
    }

    select.addEventListener('change', initLabel, false);
    initLabel();
  })();

  // switcher - path
  (function() {
    var select = document.getElementById('path');
    function initPath() { ll.path = select.value; }
    select.addEventListener('change', initPath, false);
    initPath();
  })();

  window.ll = ll;
}, false);
