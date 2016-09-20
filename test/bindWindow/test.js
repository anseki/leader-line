/* global LeaderLine:false */

window.addEventListener('load', function() {
  'use strict';

  var iframeDoc = document.getElementById('iframe').contentDocument,
    endTargets = document.querySelector('#view-1 .end-targets'),
    endTargetsC = iframeDoc.querySelector('#view-1 .end-targets'),
    startTargets = document.querySelector('#view-1 .start-targets'),
    startTargetsC = iframeDoc.querySelector('#view-1 .start-targets'),
    lastEndAnchor, lastEndAnchorC,

    BASIC_OPTIONS = {
      color: 'rgba(255, 127, 80, 0.7)',
      startSocket: 'top'
    },

    items = [
      {
        label: 'dash',
        options: {
          dash: true
        }
      },
      {
        label: 'dash(anim)',
        options: {
          dash: {animation: true}
        }
      },
      {
        label: 'gradient',
        options: {
          gradient: {startColor: 'rgba(77, 157, 244, 0.7)', endColor: 'rgba(226, 244, 77, 0.7)'}
        }
      },
      {
        label: 'dropShadow',
        options: {
          dropShadow: true
        }
      },
      {
        label: 'pointAnchor',
        separate: true,
        options: function(start, end) {
          return {end: LeaderLine.pointAnchor({element: end})};
        }
      },
      {
        label: 'areaAnchor',
        separate: true,
        options: function(start, end) {
          return {end: LeaderLine.areaAnchor({element: end})};
        }
      },
      {
        label: 'pointAnchor(share)',
        options: function(start, end) {
          return {end: LeaderLine.pointAnchor({element: end})};
        }
      },
      {
        label: 'areaAnchor(share)',
        options: function(start, end) {
          return {end: LeaderLine.areaAnchor({element: end})};
        }
      },
      {
        label: 'mouseHoverAnchor',
        separate: true,
        options: function(start) {
          return {start: LeaderLine.mouseHoverAnchor({element: start})};
        }
      },
      {
        label: 'captionLabel',
        separate: true,
        options: {
          startLabel: 'start',
          middleLabel: 'middle',
          endLabel: 'end'
        }
      },
      {
        label: 'pathLabel',
        separate: true,
        options: {
          startLabel: LeaderLine.pathLabel({text: 'start'}),
          middleLabel: LeaderLine.pathLabel({text: 'middle'}),
          endLabel: LeaderLine.pathLabel({text: 'end'})
        }
      }
    ];

  // Init anchors
  items.forEach(function(item, i) {
    function createAnchor(document, container, label) {
      var anchor = document.createElement('div');
      anchor.className = 'anchor';
      if (label) { anchor.textContent = label; }
      return container.appendChild(anchor);
    }

    item.start = createAnchor(document, startTargets, item.label);
    item.startC = createAnchor(iframeDoc, startTargetsC, item.label);

    if (!lastEndAnchor || item.separate || items[i - 1].separate) {
      lastEndAnchor = createAnchor(document, endTargets);
      lastEndAnchorC = createAnchor(iframeDoc, endTargetsC);
    }
    item.end = lastEndAnchor;
    item.endC = lastEndAnchorC;
  });

  // new without options
  document.getElementById('btn-new').addEventListener('click', function() {
    items.forEach(function(item) {
      var options = Object.keys(BASIC_OPTIONS).reduce(function(options, optionName) {
        options[optionName] = BASIC_OPTIONS[optionName];
        return options;
      }, {});

      if (item.ll) { item.ll.remove(); }
      item.ll = new LeaderLine(item.start, item.end, options);
    });
  }, false);

  // setOptions
  document.getElementById('btn-options').addEventListener('click', function() {
    items.forEach(function(item) {
      if (item.ll) {
        item.ll.setOptions(
          typeof item.options === 'function' ? item.options(item.start, item.end) : item.options);
      }
    });
  }, false);

  // new with options
  document.getElementById('btn-new-options').addEventListener('click', function() {
    items.forEach(function(item) {
      var options = Object.keys(BASIC_OPTIONS).reduce(function(options, optionName) {
          options[optionName] = BASIC_OPTIONS[optionName];
          return options;
        }, {}),
        optionsAdd =
          typeof item.options === 'function' ? item.options(item.start, item.end) : item.options;

      options.start = item.start;
      options.end = item.end;
      Object.keys(optionsAdd).forEach(function(optionName) {
        options[optionName] = optionsAdd[optionName];
      });

      if (item.ll) { item.ll.remove(); }
      item.ll = new LeaderLine(options);
    });
  }, false);

  // Anchor in child window
  document.getElementById('btn-window').addEventListener('click', function() {
  }, false);

}, false);
