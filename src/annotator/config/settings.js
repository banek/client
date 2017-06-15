'use strict';

var configFuncSettingsFrom = require('./config-func-settings-from');
var isBrowserExtension = require('./is-browser-extension');
var sharedSettings = require('../../shared/settings');

function settingsFrom(window_) {

  var jsonConfigs = sharedSettings.jsonConfigsFrom(window_.document);
  var configFuncSettings = configFuncSettingsFrom(window_);

  /**
   * Return the href URL of the first annotator link in the given document.
   *
   * Return the value of the href attribute of the first
   * `<link type="application/annotator+html">` element in the given document.
   *
   * This URL is used as the src of the sidebar's iframe.
   *
   * @return {string} - The URL to use for the sidebar's iframe.
   *
   * @throws {Error} - If there's no annotator link or the first annotator has
   *   no href.
   *
   */
  function app() {
    var link = window_.document.querySelector('link[type="application/annotator+html"]');

    if (!link) {
      throw new Error('No application/annotator+html link in the document');
    }

    if (!link.href) {
      throw new Error('application/annotator+html link has no href');
    }

    return link.href;
  }

  /**
   * Return the `#annotations:*` ID from the given URL's fragment.
   *
   * If the URL contains a `#annotations:<ANNOTATION_ID>` fragment then return
   * the annotation ID extracted from the fragment. Otherwise return `null`.
   *
   * @return {string|null} - The extracted ID, or null.
   */
  function annotations() {

    /** Return the annotations from the URL, or null. */
    function annotationsFromURL() {
      // Annotation IDs are url-safe-base64 identifiers
      // See https://tools.ietf.org/html/rfc4648#page-7
      var annotFragmentMatch = window_.location.href.match(/#annotations:([A-Za-z0-9_-]+)$/);
      if (annotFragmentMatch) {
        return annotFragmentMatch[1];
      }
      return null;
    }

    return jsonConfigs.annotations || annotationsFromURL();
  }

  /**
   * Return the config.query setting from the host page or from the URL.
   *
   * If the host page contains a js-hypothesis-config script containing a
   * query setting then return that.
   *
   * Otherwise if the host page's URL has a `#annotations:query:*` (or
   * `#annotations:q:*`) fragment then return the query value from that.
   *
   * Otherwise return null.
   *
   * @return {string|null} - The config.query setting, or null.
   */
  function query() {

    /** Return the query from the URL, or null. */
    function queryFromURL() {
      var queryFragmentMatch = window_.location.href.match(/#annotations:(query|q):(.+)$/i);
      if (queryFragmentMatch) {
        try {
          return decodeURI(queryFragmentMatch[2]);
        } catch (err) {
          // URI Error should return the page unfiltered.
        }
      }
      return null;
    }

    return jsonConfigs.query || queryFromURL();
  }

  function hostPageSetting(name, options) {
    options = options || {};
    var allowInBrowserExt = options.allowInBrowserExt || false;

    if (!allowInBrowserExt && isBrowserExtension(app())) {
      return null;
    }

    if (configFuncSettings.hasOwnProperty(name)) {
      return configFuncSettings[name];
    }

    return jsonConfigs[name];
  }

  return {
    get app() { return app(); },
    get annotations() { return annotations(); },
    get query() { return query(); },
    hostPageSetting: hostPageSetting,
  };
}

module.exports = settingsFrom;
