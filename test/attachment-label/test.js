/* global LeaderLine:false, AnimEvent:false */

window.addEventListener('load', function() {
  'use strict';

  var CLASS_DRAGGING = 'dragging',

    anchor1 = document.getElementById('anchor-1'),
    style = anchor1.style,
    ll = new LeaderLine(document.getElementById('anchor-0'), anchor1, {
      color: 'rgba(255, 0, 0, 0.5)', endPlug: 'disc', endPlugSize: 4,
      startLabel: '[startLabel]',
      endLabel: '[endLabel]',
      // startLabel: LeaderLine.caption({text: '[startLabel]', offset: [0, 0]}),
      // endLabel: LeaderLine.caption({text: '[endLabel]', offset: [0, 0]}),
      middleLabel: '[middleLabel]'
    }),

    body = document.body,
    moving = {element: anchor1, x: 0, y: 0},
    activeMoving, offset;

  anchor1.addEventListener('mousedown', function(e) {
    var rectTarget = anchor1.getBoundingClientRect();
    activeMoving = moving;
    activeMoving.offset = {x: rectTarget.left - e.pageX, y: rectTarget.top - e.pageY};
    body.className = CLASS_DRAGGING;
  }, false);

  body.addEventListener('mouseup', function() {
    activeMoving = null;
    body.className = '';
  }, false);

  offset = (function() {
    var rectView = document.getElementById('view').getBoundingClientRect(),
      rectTarget = anchor1.getBoundingClientRect();
    return {
      x: rectView.left + window.pageXOffset,
      y: rectView.top + window.pageYOffset,
      width: rectView.width - rectTarget.width,
      height: rectView.height - rectTarget.height
    };
  })();

  body.addEventListener('mousemove', AnimEvent.add(function(e) {
    if (activeMoving) {
      activeMoving.x = e.pageX - offset.x + activeMoving.offset.x;
      activeMoving.y = e.pageY - offset.y + activeMoving.offset.y;
      activeMoving.x = activeMoving.x < 0 ? 0 : activeMoving.x > offset.width ? offset.width : activeMoving.x;
      activeMoving.y = activeMoving.y < 0 ? 0 : activeMoving.y > offset.height ? offset.height : activeMoving.y;
      style.left = activeMoving.x + 'px';
      style.top = activeMoving.y + 'px';

      ll.position();
    }
  }), false);

}, false);
