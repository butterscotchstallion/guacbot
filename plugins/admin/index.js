/**
 * admin - provides ability to do things like kick/ban/topic using custom commands
 *
 */
"use strict";

var identifier = require('../nickserv-auto-identify/');
var moment     = require('moment');
var minimatch  = require('minimatch');
var timeParser = require("../../lib/timeUnitParser");
var parser     = require('../../lib/messageParser');
var pluginMgr  = require('../../lib/pluginManager');
var admin      = {
    muted: []
};

admin.loadConfig = function (cfg) { 
    var pluginCfg   = cfg.plugins.admin;
    admin.pluginCfg = pluginCfg;
};

admin.init = function (client) {    
    admin.client = client;
    
    admin.loadConfig(client.config);
    
    client.addListener('message#', function (nick, to, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);

        if (isAddressingBot) {
            var words    = parser.splitMessageIntoWords(text);
            var command  = words[1];
            var triggers = admin.getTriggersFromConfig(admin.pluginCfg);
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
                        pluginCfg: admin.pluginCfg
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
            match = true;            
            break;            
        }
    }
    
    if (!match) {
        console.log(mask, 'has attempted to use an admin ability and FAILED');
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
            var targetChannel = commandArgOne.indexOf('#') === 0 ? commandArgOne : info.channel;
            var targetNick    = commandArgOne.indexOf('#') === -1 ? commandArgOne : commandArgTwo;
            
            admin.kick(targetChannel, targetNick, info.words.slice(3).join(' '));
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
        
        case 'reload':
            info.client.say(info.channel, 'reloading...');
            
            pluginMgr.loadPlugins(info.client, function (reloadedPlugins) {
                info.client.say(info.channel, reloadedPlugins + ' plugins reloaded.');
            }, true);
        break;
        
        case 'identify':
            identifier.identify(info.client, info.pluginCfg.password);
        break;
        
        case 'kickban':
            // guacamole: kb ndbt [5m] [idiot]
            //            command, nick, duration, reason
            var kb = admin.parseKickBanCommand(info.words.join(' '));
            
            if (!kb.targetChannel) {
                kb.targetChannel = info.channel;
            }
            
            admin.kick(kb.targetChannel, kb.targetNick, kb.reason);
            admin.ban(kb.targetChannel, kb.targetNick, kb.duration);            
        break;
        
        // Unknown command - this should probably never happen
        default:
            console.log('unknown command: ' + info.command);
        break;
    }
};

admin.parseKickBanCommand = function (input) {
    var words         = parser.splitMessageIntoWords(input);
    var commandArgOne = words[2] || '';
    var commandArgTwo = words[3] || '';
    var targetChannel = commandArgOne.indexOf('#') ===  0 ? commandArgOne : '';
    var targetNick    = commandArgOne.indexOf('#') === -1 ? commandArgOne : commandArgTwo;
    var kickMessage   = admin.getKickMsg(admin.pluginCfg) || 'banned';
    var reason        = kickMessage;
    var duration      = admin.pluginCfg.banDuration;
    
    // guacamole: kb ndbt 5m msg
    // 0           1 2    3  4
    if (!targetChannel && words.length >= 4) {
        var tmp = timeParser.parseDuration(commandArgTwo);
        
        if (tmp.unit != 0) {
            duration = tmp.length + tmp.unit;
        }
        
        if (words.length > 4) {
            reason   = words.slice(4).join(' ');
        }
    }
    
    // guacamole: kb #channel nick 5m msg
    if (targetChannel && words.length >= 5) {
        var tmp = timeParser.parseDuration(words[4]);
        
        if (tmp.unit !== 0) {
            duration = tmp.length + tmp.unit;
        }
        
        reason = words.slice(5).join(' ');
    }
    
    return {
        targetChannel: targetChannel,
        targetNick   : targetNick,
        reason       : reason,
        duration     : duration
    };
};

admin.kick = function (channel, nick, message) {
    admin.client.send('KICK', 
                      channel, 
                      nick, 
                      message);
};

admin.whois = function (nick, callback) {
    admin.client.whois(nick, callback);
};

admin.mute = function (channel, nick, duration) {
    admin.whois(nick, function (data) {        
        var mask = admin.getMuteMask(data.host);
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
        var mask = admin.getMuteMask(data.host);
        
        admin.client.send('MODE', channel, '-b', mask);
    });
};

admin.ban = function (channel, nick, duration) {
    admin.whois(nick, function (data) {
        var mask = admin.getBanMask(data.host);
        var ms   = 60000;
        
        admin.client.send('MODE', channel, '+b', mask);
        
        // If a duration is supplied, use it. Else, use default duration from config
        if (duration) {
            ms = admin.timeToMilliseconds(duration);            
        } else {
            var muteDurationInMinutes = admin.pluginCfg.banDuration;
            
            // If there is a mute duration set, then unmute after specified duration
            if (muteDurationInMinutes) {
                ms = muteDurationInMinutes * 60000;
            }
        }
        
        if (ms) {
            console.log('banning for: ', ms, 'ms (', ms / 60000, ')');
            
            setTimeout(function () {
                admin.unban(channel, nick);
            }, ms);
        }
    });
};

admin.unban = function (channel, nick) {
    admin.whois(nick, function (data) {
        var mask = admin.getBanMask(data.host);
        
        admin.client.send('MODE', channel, '-b', mask);
    });
};

admin.timeToMilliseconds = function (input) {
    var duration = timeParser.parseDuration(input);
    var msDiff   = duration.length * 60000;
    
    return msDiff;    
};

admin.getBanMask = function (host) {
    return '*!*@' + host;
};

admin.getMuteMask = function (host) {
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

admin.getKickMsg = function (cfg) {
    var messages = admin.getKickMessages(cfg);
    var msg      = '';
    
    if (messages) {
        msg = messages[Math.floor(Math.random() * messages.length)];
    }
    
    return msg;
};

admin.getKickMessages = function (cfg) {
    return cfg.kickMessages || [];
};

admin.getTriggersFromConfig = function (cfg) {
    return cfg.triggers;
};

module.exports = admin;