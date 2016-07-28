/* exported functionTest */

var functionTest = (function() {
  'use strict';

  var items, iItem, beforeEach,
    list, listBBox, listBorderTop, listBorderBottom, indexLabel;

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

  function selectItem(i) {
    var itemBBox = items[i].label.getBoundingClientRect(), hiddenH;
    if ((hiddenH = itemBBox.bottom - (listBBox.bottom - listBorderBottom)) > 0) { // bottom first
      list.scrollTop = i < items.length - 1 ? list.scrollTop + hiddenH :
        list.scrollHeight - list.clientHeight;
    }
    if ((hiddenH = (listBBox.top + listBorderTop) - itemBBox.top) > 0) {
      list.scrollTop = i > 0 ? list.scrollTop - hiddenH : 0;
    }
    items[i].input.checked = true;
    indexLabel.textContent = i + 1;

    if (beforeEach) { beforeEach(); }
    items[i].fnc();
    iItem = i;
  }

  function resetList() {
    var MIN_H = 320, listH;
    listH = document.documentElement.clientHeight -
      (list.getBoundingClientRect().top + window.pageYOffset);
    if (listH < MIN_H) { listH = MIN_H; }
    list.style.height = listH + 'px';
    listBBox = list.getBoundingClientRect(); // re-get
  }

  function functionTest() {
    var i, btnNext, caseLabel, head;
    for (i = 0; i < arguments.length; i++) {
      if (Array.isArray(arguments[i])) {
        items = arguments[i];
      } else if (typeof arguments[i] === 'function') {
        beforeEach = arguments[i];
      }
    }

    list = document.createElement('div');
    list.id = 'list';

    items.forEach(function(testCase, i) {
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

      input.addEventListener('click', function() { selectItem(i); }, false);
    });

    btnNext = document.createElement('button');
    btnNext.id = 'btn-next';
    btnNext.textContent = 'NEXT';
    btnNext.addEventListener('click', function() {
      selectItem(iItem < items.length - 1 ? iItem + 1 : 0);
    }, false);

    indexLabel = document.createElement('span');
    caseLabel = document.createElement('span');
    caseLabel.id = 'case-label';
    caseLabel.appendChild(document.createTextNode('Test Case #'));
    caseLabel.appendChild(indexLabel);
    caseLabel.appendChild(document.createTextNode(' / ' + items.length));

    head = document.createElement('div');
    head.id = 'list-head';

    head.appendChild(btnNext);
    head.appendChild(caseLabel);
    document.body.appendChild(head);
    document.body.appendChild(list);
    // `borderWidth` is empty in Gecko
    listBorderTop = parseFloat(getComputedStyle(list, '').borderTopWidth);
    listBorderBottom = parseFloat(getComputedStyle(list, '').borderBottomWidth);
    resetList();
    window.addEventListener('resize', resetList);
    selectItem(0);
  }

  return functionTest;
})();
