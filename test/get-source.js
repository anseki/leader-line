/* exported getSource */

var getSource = (function() {
  'use strict';

  function getSource(url, cb) {
    var httpRequest;
    if (window.XMLHttpRequest) {
      httpRequest = new XMLHttpRequest();
      if (httpRequest.overrideMimeType) {
        httpRequest.overrideMimeType('text/plain');
      }
    } else if (window.ActiveXObject) {
      try {
        httpRequest = new ActiveXObject('Msxml2.XMLHTTP'); // eslint-disable-line no-undef
      } catch (e) {
        try {
          httpRequest = new ActiveXObject('Microsoft.XMLHTTP'); // eslint-disable-line no-undef
        } catch (e) { /* ignore */ }
      }
    }
    if (!httpRequest) { throw new Error('XMLHTTP'); }

    httpRequest.onreadystatechange = function() {
      if (httpRequest.readyState === 4) {
        return void (httpRequest.status === 200 ? cb(null, httpRequest.responseText) :
          cb(new Error(httpRequest.status)));
      }
    };
    httpRequest.open('GET', url, true);
    httpRequest.send('');
  }

  return getSource;
})();
