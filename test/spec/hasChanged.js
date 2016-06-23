/* eslint-env jasmine */
/* global loadPage:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_isObject"]}] */

describe('hasChanged', function() {
  'use strict';

  // dismantled `isObject()`
  function _isObject(obj) {
    var toString = {}.toString, fnToString = {}.hasOwnProperty.toString,
      objFnString = fnToString.call(Object);
    var proto, cstrtr;

    var log = [], isObj, isPlain;
    log.push('0:' + !!obj);
    if (obj) {
      log.push('1:' + (isObj = toString.call(obj) === '[object Object]'));
      if (isObj) {
        log.push('2:' + (isPlain = !(proto = Object.getPrototypeOf(obj))));
        if (!isPlain) {
          log.push('3:' + (!!(cstrtr = proto.hasOwnProperty('constructor') && proto.constructor)));
          if (cstrtr) {
            log.push('4:' + (isPlain = typeof cstrtr === 'function' && fnToString.call(cstrtr) === objFnString));
          }
        }
      }
    }
    if (obj && !isPlain) {
      log.push('5:' + Array.isArray(obj));
    }
    return log.join(',');
  }

  var obj1 = {
    k0: 5,
    k1: [0, 1, 2],
    k2: {k2k0: 0, k2k1: 1, k2k2: 2},
    k3: [
      {k3k0: 0, k3k1: 1, k3k2: 2},
      [3, 4, 5]
    ],
    k4: {
      k4k0: {k4k0k0: 0, k4k0k1: 1, k4k0k2: 2},
      k4k1: [3, 4, 5]
    }
  };

  describe('_isObject', function() {
    it('5', function() { expect(_isObject(5)).toBe('0:true,1:false,5:false'); });
    it('\'a\'', function() { expect(_isObject('a')).toBe('0:true,1:false,5:false'); });
    it('true', function() { expect(_isObject(true)).toBe('0:true,1:false,5:false'); });
    it('false', function() { expect(_isObject(false)).toBe('0:false'); });
    it('undefined', function() { expect(_isObject()).toBe('0:false'); });

    it('{}', function() { expect(_isObject({})).toBe('0:true,1:true,2:false,3:true,4:true'); });
    it('Object.create(null)', function() { expect(_isObject(Object.create(null))).toBe('0:true,1:true,2:true'); });
    // eslint-disable-next-line no-new-object
    it('new Object()', function() { expect(_isObject(new Object())).toBe('0:true,1:true,2:false,3:true,4:true'); });

    it('[]', function() { expect(_isObject([])).toBe('0:true,1:false,5:true'); });
    it('document.body', function() { expect(_isObject(document.body)).toBe('0:true,1:false,5:false'); });
  });

  describe('copyTree', function() {
    var copyTree, pageDone, obj2;

    beforeAll(function(beforeDone) {
      loadPage('spec/hasChanged/hasChanged.html', function(window, document, body, done) {
        try { // To export `copyTree`
          new window.LeaderLine(); // eslint-disable-line no-new
        } catch (error) { /* ignore */ }

        copyTree = window.copyTree;
        obj2 = copyTree(obj1);

        pageDone = done;
        beforeDone();
      });
    });

    afterAll(function() {
      pageDone();
    });

    it('5', function() { expect(copyTree(5)).toBe(5); });
    it('\'a\'', function() { expect(copyTree('a')).toBe('a'); });
    it('true', function() { expect(copyTree(true)).toBe(true); });
    it('false', function() { expect(copyTree(false)).toBe(false); });
    it('undefined', function() { expect(copyTree(undefined)).toBe(undefined); });

    it('copied object', function() { expect(obj2).not.toBe(obj1); });
    it('copied nested object', function() {
      expect(obj2.k1).not.toBe(obj1.k1);
      expect(obj2.k2).not.toBe(obj1.k2);
      expect(obj2.k3).not.toBe(obj1.k3);
      expect(obj2.k3[0]).not.toBe(obj1.k3[0]);
      expect(obj2.k3[1]).not.toBe(obj1.k3[1]);
      expect(obj2.k4).not.toBe(obj1.k4);
      expect(obj2.k4.k4k0).not.toBe(obj1.k4.k4k0);
      expect(obj2.k4.k4k1).not.toBe(obj1.k4.k4k1);
    });
    it('same value', function() {
      expect(obj2.k0).toBe(obj1.k0);
      expect(obj2.k1[0]).toBe(obj1.k1[0]);
      expect(obj2.k1[1]).toBe(obj1.k1[1]);
      expect(obj2.k1[2]).toBe(obj1.k1[2]);
      expect(obj2.k2.k2k0).toBe(obj1.k2.k2k0);
      expect(obj2.k2.k2k1).toBe(obj1.k2.k2k1);
      expect(obj2.k2.k2k2).toBe(obj1.k2.k2k2);
      expect(obj2.k3[0].k3k0).toBe(obj1.k3[0].k3k0);
      expect(obj2.k3[0].k3k1).toBe(obj1.k3[0].k3k1);
      expect(obj2.k3[0].k3k2).toBe(obj1.k3[0].k3k2);
      expect(obj2.k3[1][0]).toBe(obj1.k3[1][0]);
      expect(obj2.k3[1][1]).toBe(obj1.k3[1][1]);
      expect(obj2.k3[1][2]).toBe(obj1.k3[1][2]);
      expect(obj2.k4.k4k0.k4k0k0).toBe(obj1.k4.k4k0.k4k0k0);
      expect(obj2.k4.k4k0.k4k0k1).toBe(obj1.k4.k4k0.k4k0k1);
      expect(obj2.k4.k4k0.k4k0k2).toBe(obj1.k4.k4k0.k4k0k2);
      expect(obj2.k4.k4k1[0]).toBe(obj1.k4.k4k1[0]);
      expect(obj2.k4.k4k1[1]).toBe(obj1.k4.k4k1[1]);
      expect(obj2.k4.k4k1[2]).toBe(obj1.k4.k4k1[2]);
    });
  });

});
