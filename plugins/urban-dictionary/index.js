/**
 * urban dictionary plugin
 *
 */
"use strict";

var hmp        = require('../../lib/helpMessageParser');
var urban      = require('./urban');
var _          = require('underscore');
var ud         = {
    lastDef: null
};

ud.reload = function (options) {
    ud.loadConfig(options);
};

ud.loadConfig = function (options) {
    ud.client      = options.client;
    ud.wholeConfig = options.config;
};

ud.init = function (options) {
    ud.loadConfig(options);
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        var startsWithWhat = info.command.toLowerCase() === 'what';
        
        if (startsWithWhat) {
            var query    = info.words.slice(3).join(' ').trim();
            var hasQMark = query.charAt(query.length -1) === '?';
            
            if (hasQMark) {
                console.log('trimming');
                query = query.substring(0, query.length - 1);
            }
            
            console.log('query: ', query);
            
            var messages = hmp.getMessages({
                plugin  : 'urban-dictionary',
                messages: ['usage', 'error'],
                config  : ud.wholeConfig,
                data    : _.extend({
                    botNick: options.config.nick,
                }, info)
            });
            
            console.log('query: ', query);
            
            if (query) {
                ud.getDefinition({
                    query   : query,
                    callback: function (json) {
                        /**
                         * There seems to be some kind of bug with this plugin where it stacks results
                         * and the callback is fired multiple times with the same result. This check
                         * is a workaround for that behavior.
                         *
                         */
                        if (ud.lastDef !== json) {                        
                            ud.lastDef = json;
                            
                            if (typeof json === 'object') {
                                var msg = ud.getDefinitionTemplate(json);
                                
                                ud.client.say(info.channel, msg);
                            } else {
                                ud.client.say(info.channel, messages.error);
                            }
                        }
                    }
                });                
            } else {
                ud.client.say(info.channel, messages.usage);
            }
        } 
    });
};

ud.getDefinitionTemplate = function (def) {
    def.definition       = ud.sanitizeDefinition(def.definition);
    
    var message = hmp.getMessage({
        plugin  : 'urban-dictionary',
        message : 'ok',
        config  : ud.wholeConfig,
        data    : def
    });
    
    return message;
};

ud.getDefinition = function (info) {
    var def = urban(info.query);

    def.first(info.callback);
};

ud.sanitizeDefinition = function (input) {
    return input.replace(/\r\n/g, ' ');
};

module.exports = ud;