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
      'iframe1-top': 216,
      'iframe2-left': 32,
      'iframe2-top': 664
    },
    DIV_WIDTH = {static: 100, absolute: 101},
    DIV_HEIGHT = {static: 50, absolute: 51};

  function setUpDocument(props, document, body) {
    var targets = {html: document.documentElement};
    targets.body = body || document.body;
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

  function reduceBBox(bBox) {
    return ['left', 'top', 'width', 'height']
      .reduce(function(rBBox, prop) { rBBox[prop] = bBox[prop]; return rBBox; }, {});
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
          var ll;

          setUpDocument(condition.props, document, body);
          ll = new window.LeaderLine(
            document.getElementById('static'),
            document.getElementById('absolute'),
            {endPlug: 'behind'}); // Make it have endMaskBBox

          [['static', 'startMaskBBox'], ['absolute', 'endMaskBBox']].forEach(function(divProp) {
            var div = divProp[0], prop = divProp[1],
              len = condition.expected[div].reduce(function(sum, prop) { return (sum += DOC_LEN[prop]); }, 0);
            expect(reduceBBox(window.insProps[ll._id][prop]))
              .toEqual({left: len, top: len, width: DIV_WIDTH[div], height: DIV_HEIGHT[div]});
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
      [':html-margin', ':html-border', ':html-padding',
        'iframe1:body-margin', 'iframe1:body-border', 'iframe1:body-padding',
        'iframe2_iframe2:body-margin', 'iframe2_iframe2:body-border', 'iframe2_iframe2:body-padding'],
    ].forEach(function(condition) {
      var title = 'enabled: ' + condition.join(', ');
      it(title, function(done) {

        loadPage('spec/bbox/nested-window.html', function(window, document) {
          var elms = {}, docProps = {};

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
          elms.iframe2_iframe1 = elms.iframe2.getElementById('iframe1').contentDocument;
          elms.iframe2_iframe1Win = elms.iframe2.getElementById('iframe1').contentWindow;
          elms.iframe2_iframe2 = elms.iframe2.getElementById('iframe2').contentDocument;
          elms.iframe2_iframe2Win = elms.iframe2.getElementById('iframe2').contentWindow;
          elms.iframe2_iframe1_static = elms.iframe2_iframe1.getElementById('static');
          elms.iframe2_iframe1_absolute = elms.iframe2_iframe1.getElementById('absolute');
          elms.iframe2_iframe2_static = elms.iframe2_iframe2.getElementById('static');
          elms.iframe2_iframe2_absolute = elms.iframe2_iframe2.getElementById('absolute');

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
          ].forEach(function(item, i) {
            var ll = new window.LeaderLine(item.start, item.end, {endPlug: 'behind'});

            expect(window.insProps[ll._id].baseWindow).toBe(item.baseWindow);

            ['start', 'end'].forEach(function(key) {

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
                  if (i < frames.length - 1) {
                    addAbsolute(frame);
                    names = frames[i + 1].split('_');
                    name = names[names.length - 1];
                    props.push(':' + name + '-left', ':' + name + '-top', ':iframe-border', ':iframe-padding');
                  } else {
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

              var bBox = expandProps(item[key + 'WinPath'], item[key + 'Div']).reduce(function(bBox, prop) {
                  var targetProp = prop.split(':', 2)[1],
                    leftTop = (/\-(left|top)$/.exec(targetProp) || [])[1];
                  if (condition.indexOf(prop) > -1 ||
                      leftTop || targetProp === 'iframe-border' || targetProp === 'iframe-padding' ||
                      targetProp === 'div-leftTop') {
                    if (!leftTop || leftTop === 'left') { bBox.left += DOC_LEN[targetProp]; }
                    if (!leftTop || leftTop === 'top') { bBox.top += DOC_LEN[targetProp]; }
                  }
                  return bBox;
                }, {left: 0, top: 0, width: DIV_WIDTH[item[key + 'Div']], height: DIV_HEIGHT[item[key + 'Div']]}),
                expected = reduceBBox(window.insProps[ll._id][key + 'MaskBBox']);

              expected.index = bBox.index = i; // for error information
              expected.key = bBox.key = key; // for error information
              expect(expected).toEqual(bBox);
            });
          });

          done();
        }, title);

      });
    });
  });

});
