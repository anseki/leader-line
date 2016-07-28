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
          // hide and show with same effect and options
          ll.hide('fade', {duration: 2000});
          timer = setTimeout(function() {
            ll.show();
          }, 3000);
        }
      },
      {
        fnc: function() {
          // hide and show when it is running
          ll.hide('draw', {duration: 2000});
          timer = setTimeout(function() {
            ll.show();
          }, 1000);
        }
      },
      {
        fnc: function() {
          // change effect when it is running
          ll.hide('fade', {duration: 2000});
          timer = setTimeout(function() {
            ll.hide('draw', {duration: 2000, timing: 'linear'});
          }, 1000);
        }
      },
      {
        fnc: function() {
          // change options when it is running
          ll.hide('draw', {duration: 2000, timing: 'linear'});
          timer = setTimeout(function() {
            ll.hide('draw', {duration: 8000, timing: 'linear'});
          }, 1000);
        }
      },
      {
        fnc: function() {
          // change effect and options when it is running
          ll.hide('fade', {duration: 2000, timing: 'linear'});
          timer = setTimeout(function() {
            ll.show('draw', {duration: 8000, timing: 'linear'});
          }, 1000);
        }
      },
      {
        fnc: function() {
          ll.hide('none');
          // change base-window when it is running
          ll.show('draw', {duration: 2000});
          timer = setTimeout(function() {
            ll.setOptions({
              start: anchorC0,
              end: anchorC1
            });
          }, 1000);
        }
      }
    ]);

}, false);
