/* eslint-env jasmine */
/* global loadPage:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_id"]}] */

describe('BBox', function() {
  'use strict';

  var LEN = {
      'html-margin': 2,
      'html-border': 4,
      'html-padding': 8,
      'body-margin': 16,
      'body-border': 32,
      'body-padding': 64,
      'left-top': 128
    },
    staticWidth = 100,
    staticHeight = 50,
    absoluteWidth = 101,
    absoluteHeight = 51;


  describe('coordinates', function() {

    function setUpDocument(props, document, body) {
      var targets = {html: document.documentElement, body: body};
      props.forEach(function(prop) {
        var targetProp = prop.split('-', 2),
          target = targets[targetProp[0]], propName = targetProp[1];
        if (propName === 'relative') {
          target.style.position = propName;
        } else {
          if (propName === 'border') { propName += 'Width'; }
          target.style[propName] = LEN[prop] + 'px';
        }
      });
    }

    function reduceBBox(bBox) {
      return ['left', 'top', 'width', 'height']
        .reduce(function(rBBox, prop) { rBBox[prop] = bBox[prop]; return rBBox; }, {});
    }

    [
      {
        props: ['html-margin', 'html-border', 'html-padding'],
        expected: {
          static: ['html-margin', 'html-border', 'html-padding'],
          absolute: ['left-top']
        }
      },
      {
        props: ['body-margin', 'body-border', 'body-padding'],
        expected: {
          static: ['body-margin', 'body-border', 'body-padding'],
          absolute: ['left-top']
        }
      },
      {
        props: ['html-padding', 'body-margin', 'body-border'],
        expected: {
          static: ['html-padding', 'body-margin', 'body-border'],
          absolute: ['left-top']
        }
      },
      {
        props: ['html-margin', 'body-padding'],
        expected: {
          static: ['html-margin', 'body-padding'],
          absolute: ['left-top']
        }
      },
      {
        props: ['html-margin', 'html-border', 'html-padding', 'body-margin', 'body-border', 'body-padding'],
        expected: {
          static: ['html-margin', 'html-border', 'html-padding', 'body-margin', 'body-border', 'body-padding'],
          absolute: ['left-top']
        }
      },
      {
        props: [],
        expected: {
          static: [],
          absolute: ['left-top']
        }
      },
      {
        props: ['html-border', 'body-margin', 'body-border', 'html-relative'],
        expected: {
          static: ['html-border', 'body-margin', 'body-border'],
          absolute: ['html-border', 'left-top']
        }
      },
      {
        props: ['html-padding', 'body-margin', 'body-border', 'body-padding', 'body-relative'],
        expected: {
          static: ['html-padding', 'body-margin', 'body-border', 'body-padding'],
          absolute: ['html-padding', 'body-margin', 'body-border', 'left-top']
        }
      }
    ].forEach(function(condition) {
      var title = 'enabled properties: ' + condition.props.join(', ');
      it('should be got when: ' + title, function(done) {

        loadPage('spec/bbox/coordinates.html', function(window, document, body) {
          var ll, len;

          setUpDocument(condition.props, document, body);
          ll = new window.LeaderLine(
            document.getElementById('static'),
            document.getElementById('absolute'),
            {endPlug: 'behind'}); // Make it have endMaskBBox

          len = condition.expected.static.reduce(function(sum, prop) { return (sum += LEN[prop]); }, 0);
          expect(reduceBBox(window.insProps[ll._id].startMaskBBox))
            .toEqual({left: len, top: len, width: staticWidth, height: staticHeight});

          len = condition.expected.absolute.reduce(function(sum, prop) { return (sum += LEN[prop]); }, 0);
          expect(reduceBBox(window.insProps[ll._id].endMaskBBox))
            .toEqual({left: len, top: len, width: absoluteWidth, height: absoluteHeight});

          done();
        }, title);

      });
    });
  });

});
