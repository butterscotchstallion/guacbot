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
        
        ignore.isIgnored(hostmask, function (ignored) {
            callback(ignored);
        });
    }
    
    self.init = function (client) {
        var botNick = client.currentNick;
        
        client.addListener('message#', function (nick, channel, message, info) {
            isMessageActionable(info, function (ignored) {
                if (!ignored) {
                    var isAddrBot = parser.isMessageAddressingBot(message, botNick);
                    var words     = parser.splitMessageIntoWords(message);
                    var hostmask  = info.user + '@' + info.host;
                    
                    var msgInfo   = {
                        'nick'    : nick,
                        'channel' : channel,
                        'message' : message,
                        'info'    : info,
                        'words'   : words,
                        'command' : words[1],
                        'hostmask': hostmask
                    };
                    
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
    };
}

util.inherits(ActionableMessageEmitter, process.EventEmitter);

module.exports = new ActionableMessageEmitter();

