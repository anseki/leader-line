/* eslint-env jasmine */
/* global loadPage:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('BBox', function() {
  'use strict';

  var DOC_LEN = {
      'html-margin': 2,
      'html-border': 4,
      'html-padding': 8,
      'body-margin': 16,
      'body-border': 32,
      'body-padding': 64,
      'div-leftTop': 128,
      'iframe-border': 2,
      'iframe-padding': 4,
      'iframe1-left': 8,
      'iframe1-top': 316,
      'iframe2-left': 32,
      'iframe2-top': 764,
      'overflow-border': 2,
      'overflow-padding': 4,
      'overflow1-left': 308,
      'overflow1-top': 16,
      'overflow2-left': 132,
      'overflow2-top': 64
    },
    DIV_WIDTH = {static: 100, absolute: 101},
    DIV_HEIGHT = {static: 50, absolute: 51},
    SHOW_LOG = false;

  /* eslint-disable no-unused-vars, indent */
  // ================ context
  var
    SOCKET_TOP = 1, SOCKET_RIGHT = 2, SOCKET_BOTTOM = 3, SOCKET_LEFT = 4;

    function getSocketXY(bBox, socketId) {
      var socketXY = (
        socketId === SOCKET_TOP ? {x: bBox.left + bBox.width / 2, y: bBox.top} :
        socketId === SOCKET_RIGHT ? {x: bBox.right, y: bBox.top + bBox.height / 2} :
        socketId === SOCKET_BOTTOM ? {x: bBox.left + bBox.width / 2, y: bBox.bottom} :
                    /* SOCKET_LEFT */ {x: bBox.left, y: bBox.top + bBox.height / 2});
      socketXY.socketId = socketId;
      return socketXY;
    }
  // ================ /context
  /* eslint-enable no-unused-vars, indent */

  function setUpDocument(props, document, body) {
    var targets = {html: document.documentElement, body: body || document.body};
    props.forEach(function(prop) {
      var targetProp = prop.split('-', 2),
        target = targets[targetProp[0]], propName = targetProp[1];
      if (propName === 'relative') {
        target.style.position = propName;
      } else {
        if (propName === 'border') { propName += 'Width'; }
        target.style[propName] = DOC_LEN[prop] + 'px';
      }
    });
  }

  // props: {{left, top, width, height}}
  function createBBox(props) {
    return {left: props.left, top: props.top, width: props.width, height: props.height,
      right: props.left + props.width, bottom: props.top + props.height};
  }

  describe('coordinates should be got when:', function() {
    [
      {
        props: ['html-margin', 'html-border', 'html-padding'],
        expected: {
          static: ['html-margin', 'html-border', 'html-padding'],
          absolute: ['div-leftTop']
        }
      },
      {
        props: ['body-margin', 'body-border', 'body-padding'],
        expected: {
          static: ['body-margin', 'body-border', 'body-padding'],
          absolute: ['div-leftTop']
        }
      },
      {
        props: ['html-padding', 'body-margin', 'body-border'],
        expected: {
          static: ['html-padding', 'body-margin', 'body-border'],
          absolute: ['div-leftTop']
        }
      },
      {
        props: ['html-margin', 'body-padding'],
        expected: {
          static: ['html-margin', 'body-padding'],
          absolute: ['div-leftTop']
        }
      },
      {
        props: ['html-margin', 'html-border', 'html-padding', 'body-margin', 'body-border', 'body-padding'],
        expected: {
          static: ['html-margin', 'html-border', 'html-padding', 'body-margin', 'body-border', 'body-padding'],
          absolute: ['div-leftTop']
        }
      },
      {
        props: [],
        expected: {
          static: [],
          absolute: ['div-leftTop']
        }
      },
      {
        props: ['html-border', 'body-margin', 'body-border', 'html-relative'],
        expected: {
          static: ['html-border', 'body-margin', 'body-border'],
          absolute: ['html-border', 'div-leftTop']
        }
      },
      {
        props: ['html-padding', 'body-margin', 'body-border', 'body-padding', 'body-relative'],
        expected: {
          static: ['html-padding', 'body-margin', 'body-border', 'body-padding'],
          absolute: ['html-padding', 'body-margin', 'body-border', 'div-leftTop']
        }
      }
    ].forEach(function(condition) {
      var title = 'enabled: ' + condition.props.join(', ');
      it(title, function(done) {

        loadPage('spec/bbox/coordinates.html', function(window, document, body) {
          var ll, props;

          setUpDocument(condition.props, document, body);
          ll = new window.LeaderLine(
            document.getElementById('static'),
            document.getElementById('absolute'),
            {endPlug: 'behind'}); // Make it have anchorBBoxSE[1]
          props = window.insProps[ll._id];

          ['static', 'absolute'].forEach(function(div, i) {
            var len = condition.expected[div].reduce(function(sum, prop) { return (sum += DOC_LEN[prop]); }, 0);
            expect(window.pathData2BBox(props.aplStats.capsMaskAnchor_pathDataSE[i]))
              .toEqual(createBBox({left: len, top: len, width: DIV_WIDTH[div], height: DIV_HEIGHT[div]}));
          });

          done();
        }, title);

      });
    });
  });

  describe('coordinates and `baseWindow` should be got with nested windows:', function() {
    /*
      #static, #absolute
      #iframe1
        #static, #absolute
      #iframe2
        #static, #absolute
        #iframe1
          #static, #absolute
        #iframe2
          #static, #absolute
    */
    [
      [':html-margin', ':html-border', ':html-padding', ':body-margin', ':body-border', ':body-padding',
        'iframe1:html-margin', 'iframe1:html-border', 'iframe1:html-padding',
          'iframe1:body-margin', 'iframe1:body-border', 'iframe1:body-padding',
        'iframe2:html-margin', 'iframe2:html-border', 'iframe2:html-padding',
          'iframe2:body-margin', 'iframe2:body-border', 'iframe2:body-padding',
        'iframe2_iframe1:html-margin', 'iframe2_iframe1:html-border', 'iframe2_iframe1:html-padding',
          'iframe2_iframe1:body-margin', 'iframe2_iframe1:body-border', 'iframe2_iframe1:body-padding',
        'iframe2_iframe2:html-margin', 'iframe2_iframe2:html-border', 'iframe2_iframe2:html-padding',
          'iframe2_iframe2:body-margin', 'iframe2_iframe2:body-border', 'iframe2_iframe2:body-padding'],
      [':body-margin', ':body-border', ':body-padding',
        'iframe1:body-margin', 'iframe1:body-border', 'iframe1:body-padding',
        'iframe2:body-margin', 'iframe2:body-border', 'iframe2:body-padding',
        'iframe2_iframe1:body-margin', 'iframe2_iframe1:body-border', 'iframe2_iframe1:body-padding',
        'iframe2_iframe2:body-margin', 'iframe2_iframe2:body-border', 'iframe2_iframe2:body-padding'],
      [':body-margin', ':body-border',
        'iframe1:body-margin', 'iframe1:body-border',
        'iframe2:body-margin', 'iframe2:body-border',
        'iframe2_iframe1:body-margin', 'iframe2_iframe1:body-border',
        'iframe2_iframe2:body-margin', 'iframe2_iframe2:body-border'],
      ['iframe1:body-margin', 'iframe1:body-border', 'iframe1:body-padding',
        'iframe2_iframe1:body-margin', 'iframe2_iframe1:body-border', 'iframe2_iframe1:body-padding',
        'iframe2_iframe2:body-margin', 'iframe2_iframe2:body-border', 'iframe2_iframe2:body-padding'],
      [],
      [':body-margin', ':body-border', ':body-padding', ':body-relative',
        'iframe1:body-margin', 'iframe1:body-border', 'iframe1:body-padding',
        'iframe2:body-margin', 'iframe2:body-border', 'iframe2:body-padding', 'iframe2:body-relative',
        'iframe2_iframe1:body-margin', 'iframe2_iframe1:body-border', 'iframe2_iframe1:body-padding',
        'iframe2_iframe2:body-margin', 'iframe2_iframe2:body-border', 'iframe2_iframe2:body-padding'],
      [':body-border', ':body-relative',
        'iframe1:body-border', 'iframe1:body-relative',
        'iframe2:body-border', 'iframe2:body-relative',
        'iframe2_iframe1:body-border', 'iframe2_iframe1:body-relative',
        'iframe2_iframe2:body-border', 'iframe2_iframe2:body-relative']
    ].forEach(function(condition) {
      var title = 'enabled: ' + condition.join(', ');
      it(title, function(done) {

        loadPage('spec/bbox/nested-window.html', function(window, document) {
          var elms = {}, docProps = {}, show = SHOW_LOG && !!document.title;
          if (show) { console.log('---- ' + title); }

          elms.static = document.getElementById('static');
          elms.absolute = document.getElementById('absolute');
          elms.iframe1Win = document.getElementById('iframe1').contentWindow;
          elms.iframe1 = document.getElementById('iframe1').contentDocument;
          elms.iframe2Win = document.getElementById('iframe2').contentWindow;
          elms.iframe2 = document.getElementById('iframe2').contentDocument;
          elms.iframe1_static = elms.iframe1.getElementById('static');
          elms.iframe1_absolute = elms.iframe1.getElementById('absolute');
          elms.iframe2_static = elms.iframe2.getElementById('static');
          elms.iframe2_absolute = elms.iframe2.getElementById('absolute');
          elms.iframe2_iframe1Win = elms.iframe2.getElementById('iframe1').contentWindow;
          elms.iframe2_iframe1 = elms.iframe2.getElementById('iframe1').contentDocument;
          elms.iframe2_iframe2Win = elms.iframe2.getElementById('iframe2').contentWindow;
          elms.iframe2_iframe2 = elms.iframe2.getElementById('iframe2').contentDocument;
          elms.iframe2_iframe1_static = elms.iframe2_iframe1.getElementById('static');
          elms.iframe2_iframe1_absolute = elms.iframe2_iframe1.getElementById('absolute');
          elms.iframe2_iframe2_static = elms.iframe2_iframe2.getElementById('static');
          elms.iframe2_iframe2_absolute = elms.iframe2_iframe2.getElementById('absolute');

          ['iframe1_static', 'iframe1_absolute', 'iframe2_static', 'iframe2_absolute',
            'iframe2_iframe1_static', 'iframe2_iframe1_absolute', 'iframe2_iframe2_static',
            'iframe2_iframe2_absolute'].forEach(function(key) {
              elms[key].textContent = key;
            });

          condition.forEach(function(prop) {
            var docTargetProp = prop.split(':', 2),
              doc = docTargetProp[0], targetProp = docTargetProp[1];
            (docProps[doc] = docProps[doc] || []).push(targetProp);
          });
          Object.keys(docProps).forEach(function(doc) {
            setUpDocument(docProps[doc], doc ? elms[doc] : document);
          });

          [
            {
              start: elms.iframe1_static,
              end: elms.iframe1_absolute,
              startDiv: 'static',
              endDiv: 'absolute',
              baseWindow: elms.iframe1Win,
              startWinPath: ['iframe1'],
              endWinPath: ['iframe1']
            },
            {
              start: elms.iframe2_iframe1_static,
              end: elms.iframe2_iframe2_absolute,
              startDiv: 'static',
              endDiv: 'absolute',
              baseWindow: elms.iframe2Win,
              startWinPath: ['iframe2', 'iframe2_iframe1'],
              endWinPath: ['iframe2', 'iframe2_iframe2']
            },
            {
              start: elms.iframe2_static,
              end: elms.iframe2_iframe2_absolute,
              startDiv: 'static',
              endDiv: 'absolute',
              baseWindow: elms.iframe2Win,
              startWinPath: ['iframe2'],
              endWinPath: ['iframe2', 'iframe2_iframe2']
            },
            {
              start: elms.iframe1_absolute,
              end: elms.iframe2_iframe2_absolute,
              startDiv: 'absolute',
              endDiv: 'absolute',
              baseWindow: window,
              startWinPath: ['', 'iframe1'],
              endWinPath: ['', 'iframe2', 'iframe2_iframe2']
            },
            {
              start: elms.static,
              end: elms.iframe2_iframe2_static,
              startDiv: 'static',
              endDiv: 'static',
              baseWindow: window,
              startWinPath: [''],
              endWinPath: ['', 'iframe2', 'iframe2_iframe2']
            },
            {
              start: elms.iframe1_absolute,
              end: elms.iframe2_absolute,
              startDiv: 'absolute',
              endDiv: 'absolute',
              baseWindow: window,
              startWinPath: ['', 'iframe1'],
              endWinPath: ['', 'iframe2']
            },
            {
              start: elms.iframe2_iframe2_static,
              end: elms.iframe2_iframe2_absolute,
              startDiv: 'static',
              endDiv: 'absolute',
              baseWindow: elms.iframe2_iframe2Win,
              startWinPath: ['iframe2_iframe2'],
              endWinPath: ['iframe2_iframe2']
            }
          ].forEach(function(item, iCase) {
            var ll = new window.LeaderLine(item.start, item.end, {endPlug: 'behind'}),
              props = window.insProps[ll._id];

            expect(props.baseWindow).toBe(item.baseWindow);

            ['start', 'end'].forEach(function(key, i) {

              function expandProps(frames, div) {
                var REL_HTML = ['html-margin', 'html-border'],
                  REL_BODY = REL_HTML.concat(['html-padding', 'body-margin', 'body-border']),
                  props = [];

                function addAbsolute(win) {
                  if (condition.indexOf(win + ':body-relative') > -1) {
                    props = props.concat(REL_BODY.map(function(prop) { return win + ':' + prop; }));
                  } else if (condition.indexOf(win + ':html-relative') > -1) {
                    props = props.concat(REL_HTML.map(function(prop) { return win + ':' + prop; }));
                  }
                }

                frames.forEach(function(frame, i) {
                  var names, name;
                  if (i < frames.length - 1) { // iframe coordinates
                    addAbsolute(frame);
                    names = frames[i + 1].split('_');
                    name = names[names.length - 1];
                    props.push(':' + name + '-left', ':' + name + '-top', ':iframe-border', ':iframe-padding');
                  } else { // div coordinates
                    if (div === 'static') {
                      props = props.concat(
                        REL_BODY.concat(['body-padding']).map(function(prop) { return frame + ':' + prop; }));
                    } else {
                      addAbsolute(frame);
                      props.push(':div-leftTop');
                    }
                  }
                });
                return props;
              }

              var bBox = createBBox(
                expandProps(item[key + 'WinPath'], item[key + 'Div'])
                  .reduce(function(bBox, prop) {
                    var targetProp = prop.split(':', 2)[1],
                      leftTop = (/\-(left|top)$/.exec(targetProp) || [])[1];
                    if (condition.indexOf(prop) > -1 ||
                        leftTop || targetProp === 'iframe-border' || targetProp === 'iframe-padding' ||
                        targetProp === 'div-leftTop') {
                      if (!leftTop || leftTop === 'left') { bBox.left += DOC_LEN[targetProp]; }
                      if (!leftTop || leftTop === 'top') { bBox.top += DOC_LEN[targetProp]; }
                    }
                    return bBox;
                  },
                  {left: 0, top: 0,
                    width: DIV_WIDTH[item[key + 'Div']], height: DIV_HEIGHT[item[key + 'Div']]})),

                expected = window.pathData2BBox(props.aplStats.capsMaskAnchor_pathDataSE[i]);

              expected.index = bBox.index = iCase; // for error information
              expected.key = bBox.key = key; // for error information
              expect(expected).toEqual(bBox);

              expect(props.aplStats.position_socketXYSE[i])
                .toEqual(getSocketXY(bBox, props.aplStats.position_socketXYSE[i].socketId));
            });

            if (show) {
              console.log('---- start:');
              console.log(item.start);
              console.log('---- end:');
              console.log(item.end);
              console.log('---- document:');
              console.log(item.baseWindow.document);
              console.log('---- svg:');
              console.log(props.svg);
              console.log('---- path:');
              console.log(props.path);
            }
          });

          done();
        }, title);

      });
    });
  });

  describe('coordinates with scroll', function() {
    /*
      #static
      #overflow1
        #overflow1-static
        #overflow2
          #overflow2-absolute
      #iframe1
        #static
        #overflow1
          #overflow1-static
          #overflow2
            #overflow2-absolute
    */
    var scrollLen = 10,
      condition = [':body-border', ':body-padding', ':body-relative', 'iframe1:html-border', 'iframe1:html-padding'];
    [condition, condition.concat('scroll')].forEach(function(condition) {
      var scroll = condition.indexOf('scroll') > -1 ? scrollLen : 0,
        title = 'scroll: ' + scroll;
      it(title, function(done) {

        loadPage('spec/bbox/scroll.html', function(window, document) {
          var elms = {};

          elms.static = document.getElementById('static');
          elms.overflow1 = document.getElementById('overflow1');
          elms.overflow1_static = document.getElementById('overflow1-static');
          elms.overflow1_overflow2 = document.getElementById('overflow2');
          elms.overflow1_overflow2_absolute = document.getElementById('overflow2-absolute');
          elms.iframe1Win = document.getElementById('iframe1').contentWindow;
          elms.iframe1 = document.getElementById('iframe1').contentDocument;
          elms.iframe1_static = elms.iframe1.getElementById('static');
          elms.iframe1_overflow1 = elms.iframe1.getElementById('overflow1');
          elms.iframe1_overflow1_static = elms.iframe1.getElementById('overflow1-static');
          elms.iframe1_overflow1_overflow2 = elms.iframe1.getElementById('overflow2');
          elms.iframe1_overflow1_overflow2_absolute = elms.iframe1.getElementById('overflow2-absolute');

          if (scroll) {
            window.scroll(scroll, scroll);
            elms.iframe1Win.scroll(scroll, scroll);
            ['overflow1', 'overflow1_overflow2', 'iframe1_overflow1', 'iframe1_overflow1_overflow2']
              .forEach(function(overflow) { elms[overflow].scrollLeft = elms[overflow].scrollTop = scroll; });
          }

          [
            {
              start: elms.static,
              end: elms.overflow1_static,
              startDiv: 'static',
              endDiv: 'static',
              baseWindow: window,
              startWinPath: [''],
              endWinPath: ['', 'overflow1']
            },
            {
              start: elms.static,
              end: elms.overflow1_overflow2_absolute,
              startDiv: 'static',
              endDiv: 'absolute',
              baseWindow: window,
              startWinPath: [''],
              endWinPath: ['', 'overflow1', 'overflow1_overflow2']
            },
            {
              start: elms.static,
              end: elms.iframe1_static,
              startDiv: 'static',
              endDiv: 'static',
              baseWindow: window,
              startWinPath: [''],
              endWinPath: ['', 'iframe1']
            },
            {
              start: elms.static,
              end: elms.iframe1_overflow1_static,
              startDiv: 'static',
              endDiv: 'static',
              baseWindow: window,
              startWinPath: [''],
              endWinPath: ['', 'iframe1', 'iframe1_overflow1']
            },
            {
              start: elms.static,
              end: elms.iframe1_overflow1_overflow2_absolute,
              startDiv: 'static',
              endDiv: 'absolute',
              baseWindow: window,
              startWinPath: [''],
              endWinPath: ['', 'iframe1', 'iframe1_overflow1', 'iframe1_overflow1_overflow2']
            },
            {
              start: elms.iframe1_static,
              end: elms.iframe1_overflow1_static,
              startDiv: 'static',
              endDiv: 'static',
              baseWindow: elms.iframe1Win,
              startWinPath: ['iframe1'],
              endWinPath: ['iframe1', 'iframe1_overflow1']
            },
            {
              start: elms.iframe1_static,
              end: elms.iframe1_overflow1_overflow2_absolute,
              startDiv: 'static',
              endDiv: 'absolute',
              baseWindow: elms.iframe1Win,
              startWinPath: ['iframe1'],
              endWinPath: ['iframe1', 'iframe1_overflow1', 'iframe1_overflow1_overflow2']
            }
          ].forEach(function(item, iCase) {
            var ll = new window.LeaderLine(item.start, item.end, {endPlug: 'behind'}),
              props = window.insProps[ll._id];

            expect(props.baseWindow).toBe(item.baseWindow);

            ['start', 'end'].forEach(function(key, i) {

              function expandProps(frames, div) {
                var REL_HTML = ['html-margin', 'html-border'],
                  REL_BODY = REL_HTML.concat(['html-padding', 'body-margin', 'body-border']),
                  props = [];

                function addAbsolute(win) {
                  if (condition.indexOf(win + ':body-relative') > -1) {
                    props = props.concat(REL_BODY.map(function(prop) { return win + ':' + prop; }));
                  } else if (condition.indexOf(win + ':html-relative') > -1) {
                    props = props.concat(REL_HTML.map(function(prop) { return win + ':' + prop; }));
                  }
                }

                frames.forEach(function(frame, i) {
                  var names, name, frmClass;
                  if (i < frames.length - 1) { // iframe coordinates
                    if (!/(?:^|_)overflow/.test(frame)) { addAbsolute(frame); }
                    names = frames[i + 1].split('_');
                    name = names[names.length - 1];
                    frmClass = (/^(.+?)\d*$/.exec(name) || [])[1];
                    props.push(':' + name + '-left', ':' + name + '-top', ':' + frmClass + '-border');
                    if (frmClass !== 'overflow') { props.push(':' + frmClass + '-padding'); }
                  } else { // div coordinates
                    names = frame.split('_');
                    name = names[names.length - 1];
                    frmClass = (/^(.+?)\d?$/.exec(name) || [])[1];
                    if (frmClass !== 'overflow') {
                      if (div === 'static') {
                        props = props.concat(
                          REL_BODY.concat(['body-padding']).map(function(prop) { return frame + ':' + prop; }));
                      } else {
                        addAbsolute(frame);
                        props.push(':div-leftTop');
                      }
                    } else {
                      if (div === 'static') {
                        props.push(':' + frmClass + '-padding');
                      } else {
                        props.push(':div-leftTop');
                      }
                    }
                  }

                  if (scroll && i > 0 &&
                      (!frame || /iframe\d*$/.test(frame) || /overflow\d*$/.test(frame))) {
                    props.push(':scroll');
                  }
                });
                return props;
              }

              var bBox = createBBox(
                expandProps(item[key + 'WinPath'], item[key + 'Div'])
                  .reduce(function(bBox, prop) {
                    var targetProp = prop.split(':', 2)[1],
                      leftTop = (/\-(left|top)$/.exec(targetProp) || [])[1];
                    if (targetProp === 'scroll') {
                      bBox.left -= scroll;
                      bBox.top -= scroll;
                    } else if (condition.indexOf(prop) > -1 ||
                        leftTop ||
                        targetProp === 'iframe-border' || targetProp === 'iframe-padding' ||
                        targetProp === 'overflow-border' || targetProp === 'overflow-padding' ||
                        targetProp === 'div-leftTop') {
                      if (!leftTop || leftTop === 'left') { bBox.left += DOC_LEN[targetProp]; }
                      if (!leftTop || leftTop === 'top') { bBox.top += DOC_LEN[targetProp]; }
                    }
                    return bBox;
                  },
                  {left: 0, top: 0,
                    width: DIV_WIDTH[item[key + 'Div']], height: DIV_HEIGHT[item[key + 'Div']]})),

                expected = window.pathData2BBox(props.aplStats.capsMaskAnchor_pathDataSE[i]);

              expected.index = bBox.index = iCase; // for error information
              expected.key = bBox.key = key; // for error information
              expect(expected).toEqual(bBox);

              expect(props.aplStats.position_socketXYSE[i])
                .toEqual(getSocketXY(bBox, props.aplStats.position_socketXYSE[i].socketId));
            });
          });

          done();
        }, title);

      });
    });
  });

  describe('SVG anchor', function() {
    it('bBox works as same as HTMLElement', function(done) {

      loadPage('spec/common/page.html', function(window, document) {
        var ll = new window.LeaderLine(
            document.getElementById('elm1'),
            document.getElementById('rect1')),
          aplStats = window.insProps[ll._id].aplStats,
          bBox = document.getElementById('rect1').getBoundingClientRect(),
          TOLERANCE = window.IS_TRIDENT ? 3 : 0.1;

        // {x: 205, y: 216, width: 20, height: 20}
        expect(bBox.left - 205).toBeLessThan(TOLERANCE);
        expect(bBox.top - 216).toBeLessThan(TOLERANCE);
        expect(bBox.width - 20).toBeLessThan(TOLERANCE);
        expect(bBox.height - 20).toBeLessThan(TOLERANCE);
        expect(bBox.right - (205 + 20)).toBeLessThan(TOLERANCE);
        expect(bBox.bottom - (216 + 20)).toBeLessThan(TOLERANCE);

        ll.endSocket = 'top';
        expect(aplStats.position_socketXYSE[1].x).toBe(bBox.left + bBox.width / 2);
        expect(aplStats.position_socketXYSE[1].y).toBe(bBox.top);
        ll.endSocket = 'right';
        expect(aplStats.position_socketXYSE[1].x).toBe(bBox.right);
        expect(aplStats.position_socketXYSE[1].y).toBe(bBox.top + bBox.height / 2);
        ll.endSocket = 'bottom';
        expect(aplStats.position_socketXYSE[1].x).toBe(bBox.left + bBox.width / 2);
        expect(aplStats.position_socketXYSE[1].y).toBe(bBox.bottom);
        ll.endSocket = 'left';
        expect(aplStats.position_socketXYSE[1].x).toBe(bBox.left);
        expect(aplStats.position_socketXYSE[1].y).toBe(bBox.top + bBox.height / 2);

        done();
      }, 'SVG');

    });
  });

});
