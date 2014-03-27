/**
 * seen - tracks last message/timestamp/nick/host etc
 * about people in the channel. 
 *
 * Plugin dependencies: logger
 *
 */
"use strict";

var moment = require('moment');
var logger = require('../../plugins/logger');
var hmp    = require('../../lib/helpMessageParser');
var seen   = {};

seen.init = function (options) {
    var client = options.client;    
    seen.cfg   = options.config.plugins.seen;
    
    var notSeenMsg = hmp.getMessage({
        config  : options.config,
        plugin  : 'seen',
        message : ['error'],
        data    : {}
    });
    
    options.ame.on('actionableMessageAddressingBot', function (info) {        
        var words    = info.words;
        var command  = words[1];
        var nick     = words[2];
        var limit    = words[3];
        
        if (command === 'seen' && nick.length > 0) {
            var seenCB = function (result, err) {
                if (!err && result.length > 0) {
                    var lastSeen, message;
                    
                    for (var j = 0; j < result.length; j++) {
                        if (typeof(result[j].nick) !== 'undefined') {
                            lastSeen = moment(result[j].ts).fromNow();
                            message  = hmp.getMessage({
                                config  : options.config,
                                plugin  : 'seen',
                                message : ['ok'],
                                data    : {
                                    lastSeen: lastSeen,
                                    nick    : result[j].nick,
                                    message : result[j].message
                                }
                            });
                            
                            client.say(info.channel, message);
                        } else {
                            client.say(info.channel, notSeenMsg);
                        }
                    }
                } else {
                    client.say(info.channel, notSeenMsg);
                }
            };
            
            var seenInfo = {
                nick    : nick,
                channel : info.channel,
                message : info.message,
                callback: seenCB,
                limit   : limit
            };
            
            logger.getLastMessage(seenInfo);
        }
    });
};

module.exports = seen;