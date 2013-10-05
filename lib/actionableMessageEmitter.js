/**
 * ActionableMessageEmitter - an actionable message is one that:
 *
 * - comes from a hostmask that is not ignored
 * - is addressing the bot (first word starts with bot nick)
 *
 * This special kind of event eliminates the problem of each plugin listening
 * to message events, which results in the N+1 problem. For example, each plugin
 * will listen to messages and check if the origin hostmask is ignored. By using 
 * this special event, the bot will check if the hostmask is ignored once rather
 * than once for each plugin.
 *
 * actionableMessage              - any message from a hostmask that is not ignored
 * actionableMessageAddressingBot - actionableMessage with first word containing bot's nick
 *
 *
 */
"use strict";
var parser = require('./messageParser');
var util   = require('util');
var ignore = require('../plugins/ignore');

function ActionableMessageEmitter() {
    var self = this;
    
    self.setMaxListeners(0);
    
    function isMessageActionable (info, callback) {
        var hostmask = info.user + '@' + info.host;
        
        console.log('ame checking if ' + hostmask + ' is ignored');
        
        ignore.isIgnored(hostmask, function (ignored) {
            callback(ignored);
        });
    }
    
    self.init = function (client) {
        var botNick = client.currentNick;
        
        //self.setMaxListeners(0);
        
        client.addListener('message#', function (nick, channel, message, info) {
            isMessageActionable(info, function (ignored) {
                var isAddrBot = parser.isMessageAddressingBot(message, botNick);
                var msgInfo   = {
                    'nick'   : nick,
                    'channel': channel,
                    'message': message,
                    'info'   : info
                };
                
                if (!ignored) {
                    // useful for plugins activated by addressing the bot
                    if (isAddrBot) {
                        self.emit('actionableMessageAddressingBot', msgInfo);
                    } else {
                        // plugins like the link titler use this kind of event
                        self.emit('actionableMessage', msgInfo);
                    }
                }
            });
        });
        
        /*
        self.on('actionableMessage', function (info) {
            console.log('ame!!! ', info);
        });
        */
    };
}

util.inherits(ActionableMessageEmitter, process.EventEmitter);

module.exports = new ActionableMessageEmitter();

