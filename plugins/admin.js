/**
 * admin - provides ability to do things like kick/ban/topic using custom commands
 *
 */
"use strict";

var moment     = require('moment');
var minimatch  = require('minimatch');
var timeParser = require("../lib/timeUnitParser");
var parser     = require('../lib/messageParser');
var admin      = {
    muted: []
};

admin.init = function (client) {
    var pluginCfg   = client.config.plugins.admin;
    admin.client    = client;
    admin.pluginCfg = pluginCfg;
    
    client.addListener('message#', function (nick, to, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);

        if (isAddressingBot) {
            var words    = parser.splitMessageIntoWords(text);
            var command  = words[1];
            var triggers = admin.getTriggersFromConfig(pluginCfg);
            var triglen  = triggers.length;
            
            for (var j = 0; j < triglen; j++) {
                if (triggers[j].trigger === command) { 
                    admin.executeCommand({
                        client: client,
                        command: triggers[j].command,
                        channel: to,
                        nick: nick,
                        words: words,
                        userInfo: {
                            user: message.user,
                            host: message.host
                        },
                        pluginCfg: pluginCfg
                    });
                }
            }
        }
    });
};

admin.userIsAdmin = function (info) {
    var mask   = info.userInfo.user + '@' + info.userInfo.host;
    var admins = info.pluginCfg.admins;
    var olen   = admins.length;
    var match  = false;
    
    for (var j = 0; j < olen; j++) {
        if (minimatch(mask, admins[j])) {
            console.log('admin owner match: ' + mask + ' == ' + admins[j]);
            
            match = true;
            
            break;
            
        } else {
            console.log('admin owner mismatch: ' + mask + ' != ' + admins[j]);
        }
    }
    
    return match;
};

admin.executeCommand = function (info) {
    // Check if user is authorized to use commands
    if (!admin.userIsAdmin(info)) {    
        var msg = admin.getAccessDeniedMsg(info.pluginCfg);
        
        if (msg) {
            info.client.say(info.channel, msg);
        }
        
        return false;
    }
    
    // message:
    // [0] guacamole:
    // [1] join
    // [2] #test
    var command       = info.words[1];
    var commandArgOne = info.words[2];
    var commandArgTwo = info.words[3];
    
    switch (info.command) {
        /**
         * say [#channel] hello world
         *
         */
        case 'say':
            var chanSpecified = commandArgOne.indexOf('#') === 0;
            var dest          = chanSpecified ? commandArgOne       : info.channel;
            var msg           = chanSpecified ? info.words.slice(3) : info.words.slice(2);
            
            msg               = msg.join(' ');
            
            info.client.say(dest, msg);
        break;
        
        case 'op':
            var target = commandArgOne ? commandArgOne : info.nick;
            admin.grantChannelOperatusStatus(info, target);
        break;
        
        case 'deop':
            var target = commandArgOne ? commandArgOne : info.nick;
            admin.removeChannelOperatusStatus(info, target);
        break;
        
        case 'kick':
            info.client.send('KICK', 
                             info.channel, 
                             commandArgOne, 
                             // Send everything after the second word
                             info.words.slice(3).join(' '));
        break;
        
        case 'nick':
            info.client.send('NICK',
                             commandArgOne);
        break;
        
        case 'join': 
            info.client.send('JOIN',
                             commandArgOne);
        break;
        
        case 'part':
            info.client.send('PART',
                             commandArgOne,
                             // Send everything after the second word
                             info.words.slice(3).join(' '));
        break;
        
        case 'mute':
            var muteNick = info.words[info.words.length-1];
            var duration = commandArgOne;
            
            admin.mute(info.channel, muteNick, duration);
        break;
        
        case 'unmute':
            admin.unmute(info.channel, commandArgOne);
        break;
        
        // Unknown command - this should probably never happen
        default:
            console.log('unknown command: ' + info.command);
        break;
    }
};

admin.whois = function (nick, callback) {
    admin.client.whois(nick, callback);
};

admin.mute = function (channel, nick, duration) {
    admin.whois(nick, function (data) {        
        var mask = admin.getMask(data.host);
        var ms   = 5;
        
        admin.client.send('MODE', channel, '+b', mask);
        
        // If a duration is supplied, use it. Else, use default duration from config
        if (duration !== nick) {
            ms = admin.timeToMilliseconds(duration);            
        } else {
            var muteDurationInMinutes = admin.pluginCfg.muteDuration;
            
            // If there is a mute duration set, then unmute after specified duration
            if (muteDurationInMinutes) {
                ms = muteDurationInMinutes * 60000;
            }
        }
        
        if (ms) {
            console.log('muting for: ', ms, 'ms (', ms / 60000, ')');
            
            setTimeout(function () {
                admin.unmute(channel, nick);
            }, ms);
        }
    });
};

admin.unmute = function (channel, nick) {
    admin.whois(nick, function (data) {
        var mask = admin.getMask(data.host);
        
        admin.client.send('MODE', channel, '-b', mask);
    });
};

admin.timeToMilliseconds = function (input) {
    var duration = timeParser.parseDuration(input);
    var msDiff   = duration.length * 60000;
    
    return msDiff;    
};

admin.getMask = function (host) {
    // unreal ircd format
    return '~q:*!*@' + host;
};

admin.grantChannelOperatusStatus = function (info, target) {
    if (info.pluginCfg.useChanserv) {
        info.client.say('CHANSERV', 'OP ' + info.channel + ' ' + target);
    } else {
        info.client.send('MODE', info.channel, '+o', target);
    }
};

admin.removeChannelOperatusStatus = function (info, target) {
    if (info.pluginCfg.useChanserv) {
        info.client.say('CHANSERV', 'DEOP ' + info.channel + ' ' + target);
    } else {
        info.client.send('MODE', info.channel, '-o', target);
    }
};

admin.getAccessDeniedMsg = function (cfg) {
    var messages = admin.getAccessDeniedMessages(cfg);
    var msg      = '';
    
    if (messages) {
        msg = messages[Math.floor(Math.random() * messages.length)];
    }
    
    return msg;
};

admin.getAccessDeniedMessages = function (cfg) {
    return cfg.accessDeniedMessages || [];
};

admin.getTriggersFromConfig = function (cfg) {
    return cfg.triggers;
};

module.exports = admin;