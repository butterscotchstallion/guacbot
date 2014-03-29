/**
 * ActionableMessageEmitter - an actionable message is one that:
 *
 * - comes from a hostmask that is not ignored
 * - is addressing the bot (first word starts with bot nick)
 *
 * This special kind of event eliminates the need for each plugin to listen
 * to message events, which results in the N+1 problem. For example, each plugin
 * will listen to messages and check if the origin hostmask is ignored. By using 
 * this special event, the bot will check if the hostmask is ignored once rather
 * than once for each plugin.
 *
 * actionableMessage              - any message from a hostmask that is not ignored
 * actionableMessageAddressingBot - actionableMessage with first word containing bot's nick
 *
 */
"use strict";
var parser   = require('./messageParser');
var util     = require('util');
var ignore   = require('../plugins/ignore');
var p        = require('./pluginManager');
var insub    = require('../plugins/insubordination');

function ActionableMessageEmitter() {
    var self = this;
    
    self.setMaxListeners(0);
    
    self.init = function (client) {
        self.client  = client;
        self.botNick = client.currentNick;
        
        self.addListener();
    };
    
    self.removeListener = function () {
        self.client.removeListener('message#', messageListenerCallback);
    };
    
    self.addListener    = function () {
        self.client.addListener('message#', messageListenerCallback);
    };
    
    function messageListenerCallback (nick, channel, message, info) {
        isMessageActionable(info, function (ignored) {
            if (!ignored) {
                var isAddrBot = parser.isMessageAddressingBot(message, self.botNick);
                var words     = parser.splitMessageIntoWords(message);
                var hostmask  = info.user + '@' + info.host;
                var msgInfo   = {
                    // Fixes #36 - this may or may not be a bad idea. Let's see what happens.
                    'nick'    : nick.toLowerCase(),
                    'channel' : channel,
                    'message' : message,
                    'info'    : info,
                    'words'   : words,
                    'command' : typeof words[1] === 'string' ? words[1].toLowerCase() : '',
                    'hostmask': hostmask
                };
                
                /*
                var pCfg               = self.client.config.plugins.insubordination;
                var insubPluginEnabled = !pCfg.disabled;
                var insubEnabled       = typeof self.client.config.plugins.insubordination === 'object';
                var activateInsub      = false;
                
                if (insubPluginEnabled && insubEnabled) {
                    console.log('insub enabled');
                    
                    var chanceToActivate = insub.getChanceToActivate();
                    
                    if (chanceToActivate) {
                        var match = insub.matchHostmask(hostmask);
                        
                        console.log('insub chance: ' + chance);
                        console.log('insub rnd:    ' + rnd);
                        
                        if (match) {
                            activateInsub = true;
                        }
                    }
                }
                */
                
                /*
                if (activateInsub) {
                    console.log('activating insub');
                    
                    self.client.say(channel, insub.getMessage());
                    
                } else {
                */
                    // useful for plugins activated by addressing the bot
                    if (isAddrBot) {
                        self.emit('actionableMessageAddressingBot', msgInfo);
                    } else {
                        // plugins like the link titler use this kind of event
                        self.emit('actionableMessage', msgInfo);
                    }
                //}
            }
        });
    }
    
    function isMessageActionable (info, callback) {
        var hostmask = info.user + '@' + info.host;
        
        ignore.isIgnored(hostmask, function (ignored) {
            callback(ignored);
        });
    }
}

util.inherits(ActionableMessageEmitter, process.EventEmitter);

module.exports = new ActionableMessageEmitter();

