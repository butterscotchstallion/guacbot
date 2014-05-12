/**
 * gfycat - provides additional information about gfycat links. Used in the Titler plugin
 *
 */
"use strict";
var gfycat       = require('../../lib/gfycat');
var hmp          = require('../../lib/helpMessageParser');
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
    // Make sure nsfw is always a number
    data.gfyItem.nsfw = data.gfyItem.nsfw === null ? 0 : data.gfyItem.nsfw;
    
    return hmp.getMessage({
        plugin : 'gfycat',
        config : gfy.wholeConfig,
        message: 'ok',
        data   : data
    });
};

/**
 * Used in Titler plugin to detect gfycat URLs and get 
 * information about them
 *
 */
gfy.isGfycatURL = gfycat.isGfycatURL;
gfy.getInfo     = gfycat.getInfo;

module.exports  = gfy;







