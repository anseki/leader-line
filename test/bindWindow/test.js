/* global LeaderLine:false */

window.addEventListener('load', function() {
  'use strict';

  var iframeDoc1 = document.getElementById('iframe-1').contentDocument,
    startTargets = document.querySelector('#view-1 .start-targets'),
    startTargetsC = iframeDoc1.querySelector('#view-1 .start-targets'),
    endTargets = document.querySelector('#view-1 .end-targets'),
    endTargetsC = iframeDoc1.querySelector('#view-1 .end-targets'),
    lastEndAnchor, lastEndAnchorC,

    // mix
    iframeDoc2 = document.getElementById('iframe-2').contentDocument,
    startTarget = document.querySelector('#view-2 .start-target'),
    startTargetC = iframeDoc2.querySelector('#view-2 .start-target'),
    endTarget = document.querySelector('#view-2 .end-target'),
    endTargetC = iframeDoc2.querySelector('#view-2 .end-target'),
    elmOptions = document.getElementById('options'),
    btnWindowMix = document.getElementById('btn-window-mix'),
    llMix, inChild, inChildSave = false,

    BASIC_OPTIONS1 = {
      color: 'rgba(255, 127, 80, 0.7)',
      startSocket: 'top'
    },

    BASIC_OPTIONS2 = {
      color: 'rgba(255, 127, 80, 0.7)',
      dash: false,
      gradient: false,
      dropShadow: false,
      startLabel: '',
      middleLabel: '',
      endLabel: ''
    },

    items = [
      {
        label: 'dash',
        mix: true,
        options: {
          dash: true
        }
      },
      {
        label: 'dash(anim)',
        mix: true,
        options: {
          dash: {animation: true}
        }
      },
      {
        label: 'gradient',
        mix: true,
        options: {
          gradient: {startColor: 'rgba(77, 157, 244, 0.7)', endColor: 'rgba(226, 244, 77, 0.7)'}
        }
      },
      {
        label: 'dropShadow',
        mix: true,
        options: {
          dropShadow: true
        }
      },
      {
        label: 'pointAnchor',
        separate: true,
        mix: true,
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
        mix: true,
        once: true,
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
        mix: true,
        options: function() {
          return {
            startLabel: LeaderLine.pathLabel({text: 'start'}),
            middleLabel: LeaderLine.pathLabel({text: 'middle'}),
            endLabel: LeaderLine.pathLabel({text: 'end'})
          };
        }
      }
    ];

  function position() {
    setTimeout(function() {
      items.forEach(function(item) { if (item.ll) { item.ll.position(); } });
    }, 0);
  }

  // Init anchors
  items.forEach(function(item, i) {
    function createAnchor(document, container, label) {
      var anchor = document.createElement('div');
      anchor.className = 'anchor';
      if (label) { anchor.textContent = label; }
      return container.appendChild(anchor);
    }

    item.start = createAnchor(document, startTargets, item.label);
    item.startC = createAnchor(iframeDoc1, startTargetsC, item.label);

    if (!lastEndAnchor || item.separate || items[i - 1].separate) {
      lastEndAnchor = createAnchor(document, endTargets);
      lastEndAnchorC = createAnchor(iframeDoc1, endTargetsC);
    }
    item.end = lastEndAnchor;
    item.endC = lastEndAnchorC;
  });

  // new without options
  document.getElementById('btn-new').addEventListener('click', function() {
    items.forEach(function(item) {
      if (item.ll) { item.ll.remove(); }
      item.ll = new LeaderLine(item.start, item.end, BASIC_OPTIONS1);
    });

    position();
  }, false);

  // setOptions
  document.getElementById('btn-options').addEventListener('click', function() {
    items.forEach(function(item) {
      if (item.ll) {
        item.ll.setOptions(
          typeof item.options === 'function' ? item.options(item.start, item.end) : item.options);
      }
    });

    position();
  }, false);

  // new with options
  document.getElementById('btn-new-options').addEventListener('click', function() {
    items.forEach(function(item) {
      var options = Object.keys(BASIC_OPTIONS1).reduce(function(options, optionName) {
          options[optionName] = BASIC_OPTIONS1[optionName];
          return options;
        }, {}),
        optionsAdd = typeof item.options === 'function' ? item.options(item.start, item.end) : item.options;

      options.start = item.start;
      options.end = item.end;
      Object.keys(optionsAdd).forEach(function(optionName) {
        options[optionName] = optionsAdd[optionName];
      });

      if (item.ll) { item.ll.remove(); }
      item.ll = new LeaderLine(options);
    });

    position();
  }, false);

  // Anchor in child window
  document.getElementById('btn-window').addEventListener('click', function() {
    items.forEach(function(item) {
      var options, optionsAdd;
      if (item.ll) {
        options = {start: item.startC, end: item.endC};
        optionsAdd = typeof item.options === 'function' ? item.options(item.startC, item.endC) : item.options;

        Object.keys(optionsAdd).forEach(function(optionName) {
          options[optionName] = optionsAdd[optionName];
        });

        item.ll.setOptions(options);
      }
    });

    position();
  }, false);

  // ======================== mixed options
  function mix() {
    var start = inChild ? startTargetC : startTarget,
      end = inChild ? endTargetC : endTarget,
      options = Object.keys(BASIC_OPTIONS2).reduce(function(options, optionName) {
        options[optionName] = BASIC_OPTIONS2[optionName];
        return options;
      }, {start: start, end: end});

    items.forEach(function(item) {
      var optionsAdd, mixOn;
      if (item.mix) {
        if ((mixOn = item.elmOpt.checked)) {
          optionsAdd = typeof item.options === 'function' ? item.options(start, end) : item.options;
          if (item.once && item.mixOn && inChild === inChildSave) { // to avoid styling the styled element again
            Object.keys(optionsAdd).forEach(function(optionName) {
              delete options[optionName];
            });
          } else {
            Object.keys(optionsAdd).forEach(function(optionName) {
              options[optionName] = optionsAdd[optionName];
            });
          }
        }
        item.mixOn = mixOn;
      }
    });
    llMix.setOptions(options);
    inChildSave = inChild;
  }

  items.forEach(function(item) {
    var option, label;
    if (item.mix) {
      label = elmOptions.insertBefore(document.createElement('label'), btnWindowMix);
      label.textContent = item.label;
      option = label.insertBefore(document.createElement('input'), label.firstChild);
      option.type = 'checkbox';
      option.addEventListener('change', mix);
      item.elmOpt = option;
      item.mixOn = false; // for checking
    }
  });

  btnWindowMix.addEventListener('click', function() {
    inChild = !inChild;
    mix();
  });
  llMix = new LeaderLine(startTarget, endTarget, BASIC_OPTIONS2);

}, false);
