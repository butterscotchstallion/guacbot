/**
 * imdb - queries imdb
 *
 */
"use strict";
var api        = require('imdb-api');
var Handlebars = require('handlebars');
var pm         = require('../../lib/pluginManager');
var im         = {
    messages: {
        defaultError: "No results for that query",
        defaultOK   : "{{{title}}} ({{{_year_data}}}) - {{{imdburl}}}",
        defaultUsage: "Usage: imdb superbad"
    }
};

im.init = function (client) {
    im.cfg = pm.getPluginConfig('imdb');
    
    client.ame.on('actionableMessageAddressingBot', function (info) {
        if (info.command === 'imdb') {
            var query = info.words.slice(2).join(' ');
            
            if (query && query.length >= 2) {
                console.log('querying for "' + query + '"');
                
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
                client.say(info.channel, im.messages.usage || im.messages.defaultUsage);
            }
        }
    });
};

im.processRequest = function (info) {
    var tpl     = Handlebars.compile(im.cfg.messages.error || im.messages.defaultError);
    var message = tpl(info.result);
    
    //console.log(info.result);
    
    if (!info.err && info.result) {
        tpl     = Handlebars.compile(im.cfg.messages.ok || im.messages.defaultOK);
        message = tpl(info.result);
    }
    
    return message;
};

module.exports = im;

