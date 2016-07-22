/* eslint-env jasmine */
/* global loadPage:false */
/* eslint no-underscore-dangle: [2, {"allow": ["_isObject"]}] */

describe('funcs', function() {
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

  describe('_isObject()', function() {
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

  describe('copyTree()', function() {
    var copyTree, pageDone, obj2;

    beforeAll(function(beforeDone) {
      loadPage('spec/funcs/funcs.html', function(window, document, body, done) {
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

  describe('hasChanged()', function() {
    var hasChanged, pageDone;

    beforeAll(function(beforeDone) {
      loadPage('spec/funcs/funcs.html', function(window, document, body, done) {
        hasChanged = window.hasChanged;
        pageDone = done;
        beforeDone();
      });
    });

    afterAll(function() {
      pageDone();
    });

    it('5, 5', function() { expect(hasChanged(5, 5)).toBe(false); });
    it('5, \'5\'', function() { expect(hasChanged(5, '5')).toBe(true); });

    it('true, true', function() { expect(hasChanged(true, true)).toBe(false); });
    it('true, \'true\'', function() { expect(hasChanged(true, 'true')).toBe(true); });

    it('false, false', function() { expect(hasChanged(false, false)).toBe(false); });
    it('false, \'false\'', function() { expect(hasChanged(false, 'false')).toBe(true); });

    it('undefined, undefined', function() { expect(hasChanged(undefined, undefined)).toBe(false); });
    it('false, undefined', function() { expect(hasChanged(false, undefined)).toBe(true); });
    it('{}, []', function() { expect(hasChanged({}, [])).toBe(true); });
    it('{}, 5', function() { expect(hasChanged({}, 5)).toBe(true); });

    it('{...}, {...}', function() {
      expect(hasChanged(
        {a: 0, b: 1},
        {a: 0, b: 1}
      )).toBe(false);
      expect(hasChanged(
        {a: 0, b: 1},
        {a: 0, b: 2}
      )).toBe(true);

      expect(hasChanged(
        {a: 0, b: 1, c: 2},
        {a: 0, b: 1}
      )).toBe(true);
      expect(hasChanged(
        {a: 0, b: 1},
        {a: 0, b: 1, c: 2}
      )).toBe(true);

      expect(hasChanged(
        {a: 0, b: 1, c: {d: 2, e: 3}},
        {a: 0, b: 1, c: {d: 2, e: 3}}
      )).toBe(false);
      expect(hasChanged(
        {a: 0, b: 1, c: {d: 2, e: 3}},
        {a: 0, b: 1, c: {d: 2, e: 4}}
      )).toBe(true);

      expect(hasChanged(
        {a: 0, b: 1, c: {d: 2, e: 3, f: {g: 4, h: 5}}},
        {a: 0, b: 1, c: {d: 2, e: 3, f: {g: 4, h: 5}}}
      )).toBe(false);
      expect(hasChanged(
        {a: 0, b: 1, c: {d: 2, e: 3, f: {g: 4, h: 5}}},
        {a: 0, b: 1, c: {d: 2, e: 3, f: {g: 4, h: 6}}}
      )).toBe(true);

      expect(hasChanged(
        {a: 0, b: 1, c: [2, 3]},
        {a: 0, b: 1, c: [2, 3]}
      )).toBe(false);
      expect(hasChanged(
        {a: 0, b: 1, c: [2, 3]},
        {a: 0, b: 1, c: [2, 4]}
      )).toBe(true);

      expect(hasChanged(
        {a: 0, b: 1, c: {d: 2, e: 3, f: [4, 5]}},
        {a: 0, b: 1, c: {d: 2, e: 3, f: [4, 5]}}
      )).toBe(false);
      expect(hasChanged(
        {a: 0, b: 1, c: {d: 2, e: 3, f: [4, 5]}},
        {a: 0, b: 1, c: {d: 2, e: 3, f: [4, 6]}}
      )).toBe(true);
    });

    it('[...], [...]', function() {
      expect(hasChanged(
        [0, 1],
        [0, 1]
      )).toBe(false);
      expect(hasChanged(
        [0, 1],
        [0, 2]
      )).toBe(true);

      expect(hasChanged(
        [0, 1, 2],
        [0, 1]
      )).toBe(true);
      expect(hasChanged(
        [0, 1],
        [0, 1, 2]
      )).toBe(true);

      expect(hasChanged(
        [0, 1, [2, 3]],
        [0, 1, [2, 3]]
      )).toBe(false);
      expect(hasChanged(
        [0, 1, [2, 3]],
        [0, 1, [2, 4]]
      )).toBe(true);

      expect(hasChanged(
        [0, 1, [2, 3, [4, 5]]],
        [0, 1, [2, 3, [4, 5]]]
      )).toBe(false);
      expect(hasChanged(
        [0, 1, [2, 3, [4, 5]]],
        [0, 1, [2, 3, [4, 6]]]
      )).toBe(true);

      expect(hasChanged(
        [0, 1, {a: 2, b: 3}],
        [0, 1, {a: 2, b: 3}]
      )).toBe(false);
      expect(hasChanged(
        [0, 1, {a: 2, b: 3}],
        [0, 1, {a: 2, b: 4}]
      )).toBe(true);

      expect(hasChanged(
        [0, 1, [2, 3, {a: 4, b: 5}]],
        [0, 1, [2, 3, {a: 4, b: 5}]]
      )).toBe(false);
      expect(hasChanged(
        [0, 1, [2, 3, {a: 4, b: 5}]],
        [0, 1, [2, 3, {a: 4, b: 6}]]
      )).toBe(true);
    });
  });

  describe('getAlpha()', function() {
    var getAlpha, pageDone;

    beforeAll(function(beforeDone) {
      loadPage('spec/funcs/funcs.html', function(window, document, body, done) {
        getAlpha = window.getAlpha;
        pageDone = done;
        beforeDone();
      });
    });

    afterAll(function() {
      pageDone();
    });

    it('ignored notations', function() {
      expect(getAlpha('')).toEqual([1, '']);
      expect(getAlpha('rgba')).toEqual([1, 'rgba']);
      expect(getAlpha('rgb(10, 20, 30)')).toEqual([1, 'rgb(10, 20, 30)']);
      expect(getAlpha('#aabbcc')).toEqual([1, '#aabbcc']);
      expect(getAlpha('#abc')).toEqual([1, '#abc']);
      expect(getAlpha('aabbcc99')).toEqual([1, 'aabbcc99']);
      expect(getAlpha('abc9')).toEqual([1, 'abc9']);
      expect(getAlpha('red')).toEqual([1, 'red']);
    });

    it('rgba, hsla, hwb', function() {
      expect(getAlpha('rgba(10, 20, 30, 0.6)')).toEqual([0.6, 'rgb(10, 20, 30)']);
      expect(getAlpha('hsla(10, 20, 30, 0.6)')).toEqual([0.6, 'hsl(10, 20, 30)']);
      expect(getAlpha('hwb(10, 20, 30, 0.6)')).toEqual([0.6, 'hwb(10, 20, 30)']);
      expect(getAlpha('rgba(10, 20, 30)')).toEqual([1, 'rgba(10, 20, 30)']);

      expect(getAlpha('  rGBa  (  10  , 20  , 30  , 0.6  )  ')).toEqual([0.6, 'rgb(10, 20, 30)']);
    });

    it('gray', function() {
      expect(getAlpha('gray(10, 0.6)')).toEqual([0.6, 'gray(10)']);
      expect(getAlpha('gray(10)')).toEqual([1, 'gray(10)']);

      expect(getAlpha('  gRAy  (  10 ,  0.6  )  ')).toEqual([0.6, 'gray(10)']);
    });

    it('device-cmyk', function() {
      expect(getAlpha('device-cmyk(10%, 20%, 30%, 40%, 0.6)')).toEqual([0.6, 'device-cmyk(10%, 20%, 30%, 40%)']);
      expect(getAlpha('device-cmyk(10%, 20%, 30%, 40%, 0.6, red)')).toEqual([0.6, 'device-cmyk(10%, 20%, 30%, 40%)']);
      expect(getAlpha('device-cmyk(10%, 20%, 30%, 40%)')).toEqual([1, 'device-cmyk(10%, 20%, 30%, 40%)']);

      expect(getAlpha('  device-cMYk  (  10%  , 20%  , 30%  , 40%  , 0.6  )  '))
        .toEqual([0.6, 'device-cmyk(10%, 20%, 30%, 40%)']);
    });

    it('parseAlpha', function() {
      expect(getAlpha('rgba(10, 20, 30, 60%)')).toEqual([0.6, 'rgb(10, 20, 30)']);
      expect(getAlpha('rgba(10, 20, 30, 60.5%)')).toEqual([0.605, 'rgb(10, 20, 30)']);
      expect(getAlpha('rgba(10, 20, 30, 100%)')).toEqual([1, 'rgb(10, 20, 30)']);
      expect(getAlpha('rgba(10, 20, 30, -10%)')).toEqual([1, 'rgb(10, 20, 30)']);
      expect(getAlpha('rgba(10, 20, 30, 110%)')).toEqual([1, 'rgb(10, 20, 30)']);
      expect(getAlpha('rgba(10, 20, 30, 1)')).toEqual([1, 'rgb(10, 20, 30)']);
      expect(getAlpha('rgba(10, 20, 30, -0.1)')).toEqual([1, 'rgb(10, 20, 30)']);
      expect(getAlpha('rgba(10, 20, 30, 1.1)')).toEqual([1, 'rgb(10, 20, 30)']);

      expect(getAlpha('rgba(10, 20, 30, 60 % )')).toEqual([0.6, 'rgb(10, 20, 30)']);
      expect(getAlpha('  device-cmyk  (  10%  , 20%  , 30%  , 40%  , 60 % ,  red  )  '))
        .toEqual([0.6, 'device-cmyk(10%, 20%, 30%, 40%)']);
    });

    it('RGB-Hex', function() {
      expect(getAlpha('#aabbcc99')).toEqual([0.6, '#aabbcc']);
      expect(getAlpha('#abc9')).toEqual([0.6, '#abc']);
      expect(getAlpha('#aabbcc00')).toEqual([0, '#aabbcc']);
      expect(getAlpha('#abc0')).toEqual([0, '#abc']);
      expect(getAlpha('#aabbccff')).toEqual([1, '#aabbcc']);
      expect(getAlpha('#abcf')).toEqual([1, '#abc']);

      expect(getAlpha('  #aaBBCc99  ')).toEqual([0.6, '#aaBBCc']);
      expect(getAlpha('  #aBC9  ')).toEqual([0.6, '#aBC']);
    });

    it('transparent', function() {
      expect(getAlpha('transparent')).toEqual([0, 'transparent']);
      expect(getAlpha('  trANSPARent  ')).toEqual([0, 'trANSPARent']);
    });
  });

});
