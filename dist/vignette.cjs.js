/**
 * Helper module to generate the URL to a thumbnail of specific size from JS
 */
'use strict';
var Vignette = (function () {
    function Vignette() {
    }
    /**
     * Converts the URL of a full size image or of a thumbnail into one of a thumbnail of
     * the specified size and returns it
     *
     * @public
     *
     * @param {String} url The URL to the full size image or a thumbnail
     * @param {String} mode The thumbnailer mode, one from Vignette.mode
     * @param {Number} width The width of the thumbnail to fetch
     * @param {Number} height The height of the thumbnail to fetch
     * @param {Object|null} config Optional parameters used for special thumbnail modes
     *
     * @return {String}
     */
    Vignette.getThumbURL = function (url, mode, width, height, config) {
        var urlParameters;
        // for now we handle only legacy urls as input
        if (this.isLegacyUrl(url)) {
            if (this.isLegacyThumbnailerUrl(url)) {
                // URL points to a thumbnail, remove crop and size
                url = this.clearThumbOptions(url);
            }
            urlParameters = this.getParametersFromLegacyUrl(url);
            if (mode === Vignette.mode.windowCrop || mode === Vignette.mode.windowCropFixed) {
                if (config && config.xOffset1 && config.yOffset1 && config.xOffset2 && config.yOffset2) {
                    urlParameters['xOffset1'] = parseInt(config.xOffset1);
                    urlParameters['yOffset1'] = parseInt(config.yOffset1);
                    urlParameters['xOffset2'] = parseInt(config.xOffset2);
                    urlParameters['yOffset2'] = parseInt(config.yOffset2);
                }
                else {
                    throw 'Thumbnailer mode `' + mode + '` requires x and y offsets';
                }
            }
            url = this.createThumbnailUrl(urlParameters, mode, width, height);
        }
        return url;
    };
    /**
     * Checks if url points to thumbnailer
     *
     * @public
     *
     * @param {String} url
     *
     * @return {Boolean}
     */
    Vignette.isThumbnailerUrl = function (url) {
        return url && this.imagePathRegExp.test(url);
    };
    /**
     * Checks if url points to legacy thumbnailer
     *
     * @private
     *
     * @param {String} url
     *
     * @return {Boolean}
     */
    Vignette.isLegacyThumbnailerUrl = function (url) {
        return url && this.legacyThumbPathRegExp.test(url);
    };
    /**
     * Checks if url points to legacy image URL
     *
     * @private
     *
     * @param {String} url
     *
     * @return {Boolean}
     */
    Vignette.isLegacyUrl = function (url) {
        return url && this.legacyPathRegExp.test(url);
    };
    /**
     * Removes the thumbnail options part from a thumbnail URL
     *
     * @private
     *
     * @param {String} url The URL of a thumbnail
     *
     * @return {String} The URL without the thumbnail options
     */
    Vignette.clearThumbOptions = function (url) {
        var clearedOptionsUrl;
        if (this.isThumbnailerUrl(url)) {
            clearedOptionsUrl = url.replace(this.thumbBasePathRegExp, '$1');
        }
        else {
            //The URL of a legacy thumbnail is in the following format:
            //http://domain/image_path/image.ext/thumbnail_options.ext
            //so return the URL till the last / to remove the options
            clearedOptionsUrl = url.substring(0, url.lastIndexOf('/'));
        }
        return clearedOptionsUrl;
    };
    /**
     * Checks if a string is bucket prefix
     *
     * @param {String} segment
     * @returns {boolean}
     */
    Vignette.isPrefix = function (segment) {
        return ['images', 'avatars'].indexOf(segment) === -1;
    };
    /**
     * Parses legacy image URL and returns object with URL parameters
     *
     * @private
     *
     * @param {String} url
     *
     * @return {ImageUrlParameters}
     */
    Vignette.getParametersFromLegacyUrl = function (url) {
        var urlParsed = this.legacyPathRegExp.exec(url), hasPrefix = this.isPrefix(urlParsed[4]);
        return {
            domain: urlParsed[1],
            cacheBuster: urlParsed[2],
            wikiaBucket: hasPrefix ? urlParsed[3] : urlParsed[3] + '/' + urlParsed[4],
            pathPrefix: hasPrefix ? urlParsed[4] : '',
            imagePath: urlParsed[5]
        };
    };
    /**
     * Constructs complete thumbnailer url
     *
     * @private
     *
     * @param {ImageUrlParameters} urlParameters
     * @param {String} mode
     * @param {Number} width
     * @param {Number} height
     *
     * @return {String}
     */
    Vignette.createThumbnailUrl = function (urlParameters, mode, width, height) {
        var url, offsets;
        url = 'http://vignette.' + urlParameters.domain + '/' + urlParameters.wikiaBucket + '/' + urlParameters.imagePath + '/revision/latest' + '/' + mode;
        if (mode === Vignette.mode.scaleToWidth) {
            url += '/' + width;
        }
        else if (mode === Vignette.mode.windowCrop || mode === Vignette.mode.windowCropFixed) {
            url += '/width/' + width;
            if (mode === Vignette.mode.windowCropFixed) {
                url += '/height/' + height;
            }
            url += '/x-offset/' + urlParameters.xOffset1 + '/y-offset/' + urlParameters.yOffset1 + '/window-width/' + (urlParameters.xOffset2 - urlParameters.xOffset1) + '/window-height/' + (urlParameters.yOffset2 - urlParameters.yOffset1);
        }
        else {
            url += '/width/' + width + '/height/' + height;
        }
        url += '?cb=' + urlParameters.cacheBuster;
        if (this.hasWebPSupport) {
            url += '&format=webp';
        }
        if (urlParameters.pathPrefix) {
            url += '&path-prefix=' + urlParameters.pathPrefix;
        }
        return url;
    };
    Vignette.imagePathRegExp = /\/\/vignette\d?\.wikia/;
    Vignette.thumbBasePathRegExp = /(.*\/revision\/\w+).*/;
    Vignette.legacyThumbPathRegExp = /\/\w+\/thumb\//;
    Vignette.legacyPathRegExp = /(wikia-dev.com|wikia.nocookie.net)\/__cb([\d]+)\/(\w+)\/(\w+)\/(?:thumb\/)?(.*)$/;
    Vignette.mode = {
        fixedAspectRatio: 'fixed-aspect-ratio',
        fixedAspectRatioDown: 'fixed-aspect-ratio-down',
        scaleToWidth: 'scale-to-width',
        thumbnail: 'thumbnail',
        thumbnailDown: 'thumbnail-down',
        topCrop: 'top-crop',
        topCropDown: 'top-crop-down',
        windowCrop: 'window-crop',
        windowCropFixed: 'window-crop-fixed',
        zoomCrop: 'zoom-crop',
        zoomCropDown: 'zoom-crop-down'
    };
    Vignette.hasWebPSupport = (function () {
        // Image is not defined in node.js
        if (typeof Image === 'undefined') {
            return false;
        }
        // @see http://stackoverflow.com/a/5573422
        var webP = new Image();
        webP.src = 'data:image/webp;' + 'base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        webP.onload = webP.onerror = function () {
            Vignette.hasWebPSupport = (webP.height === 2);
        };
        return false;
    })();
    return Vignette;
})();
module.exports = Vignette;
