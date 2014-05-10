/**
 * gfycat - queries gfycat API provided a link
 *
 */
"use strict";

var request = require('request');
var _       = require('underscore');
var u       = require('url');
var gfycat  = {
    defaultConfig: {
        host   : "gfycat.com",
        baseURL: "http://gfycat.com/cajax/get/"
    }
};

gfycat.setConfig  = function (config) {
    gfycat.config = _.extend(config, gfycat.defaultConfig);
};

gfycat.getInfo = function (options) {
    if (!options.url) {
        throw new Error('Error: options.url is a required argument.');
    }
    
    gfycat.setConfig(options);
    
    var url = gfycat.getAPIURL(options.url);
    
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            options.done({
                response: response,
                body    : body,
                parsed  : JSON.parse(body)
            });           
        } else {
            options.fail({
                response: response,
                body    : body,
                error   : error
            });
        }
    });
};

gfycat.getAPIURL    = function (url) {
    var id          = gfycat.getID(url);
    
    return [gfycat.config.baseURL, id].join('');
};

gfycat.getID        = function (url) {
    var urlInfo     = gfycat.parseURL(url);
    var id          = null;
    
    if (urlInfo) {
        // Don't include the forward slash prefix
        id = urlInfo.path.substring(1);
    }
    
    return id;
};

gfycat.isGfycatURL  = function (url) {
    var isGfycatURL = false;
    var urlInfo     = gfycat.parseURL(url);
    var gfyHost     = gfycat.config ? gfycat.config.host : gfycat.defaultConfig.host;
    
    if (urlInfo) {
        isGfycatURL = urlInfo.host === gfyHost;
    }
    
    return isGfycatURL;
};

gfycat.parseURL = function (url) {
    return u.parse(url);
};


module.exports = gfycat;

