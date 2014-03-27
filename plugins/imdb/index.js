/**
 * imdb - queries imdb
 *
 */
"use strict";
var api        = require('imdb-api');
var Handlebars = require('handlebars');
var pm         = require('../../lib/pluginManager');
var hmp        = require('../../lib/helpMessageParser');
var im         = {};

im.init = function (options) {
    var client     = options.client;    
    im.cfg         = options.config.plugins.imdb;
    im.wholeConfig = options.config;
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        if (info.command === 'imdb') {
            var query = info.words.slice(2).join(' ');
            
            if (query && query.length >= 2) {
                api.getReq({
                    name: query
                }, function (err, result) {
                    var message = im.processRequest({
                        err    : err,
                        result : result
                    });
                    
                    if (message) {
                        client.say(info.channel, message);
                    }
                });
            } else {
                client.say(info.channel, im.messages.usage);
            }
        }
    });
};

im.processRequest = function (info) {
    var messages = hmp.getMessages({
        messages: ['ok', 'error'],
        data    : info.result,
        plugin  : 'imdb',
        config  : im.wholeConfig
    });
    
    var message = messages.error;
    
    if (!info.err && info.result) {
        message = messages.ok;
    }
    
    return message;
};

module.exports = im;

