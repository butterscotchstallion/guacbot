/**
 * gfycat - provides additional information about gfycat links. Used in the Titler plugin
 *
 */
"use strict";
var gfycat       = require('../../lib/gfycat');
var hmp          = require('../../lib/helpMessageParser');
var _            = require('underscore');
var gfy          = {};

gfy.reload       = function (options) {
    gfy.loadConfig(options);
};

gfy.loadConfig      = function (options) {
    gfy.client      = options.client;
    gfy.wholeConfig = options.config;
};

gfy.init = function (options) {
    gfy.loadConfig(options);
};

gfy.onInfoRetrievalFailure = function (error) {
    console.log('gfycat error: ');
    console.log(error);
};

gfy.getMessage = function (data) {
    return hmp.getMessage({
        plugin : 'gfycat',
        config : gfy.wholeConfig,
        message: 'ok',
        data   : data
    });
};

gfy.getFirstURLInString = function (input) {
    var words = input.split(' ');
    var url;
    
    _.each(words, function (w) {
        if (w.indexOf('http') !== -1) {
            url = w;
            
            return;
        }
    });
    
    return url;
};

gfy.isGfycatURL = gfycat.isGfycatURL;
gfy.getInfo     = gfycat.getInfo;

module.exports  = gfy;







