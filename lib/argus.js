/**
 * Argus - keeps track of users in channels and information about them
 * 
 * Listens to joins, quits, parts, modes
 *
 * https://github.com/prgmrbill/guacbot/issues/31
 *
 */
"use strict";
var _      = require('underscore');
var moment = require('moment');
var aee    = require('./argusEventEmitter');
var argus  = {
    channels: []
};

argus.init = function (client) {
    argus.client   = client;
    argus.config   = argus.client.config;
    argus.initTime = moment();
    
    client.addListener('names', function (channel, nicks) {
        for (var nick in nicks) {
            argus.addNick({
                channel: channel,
                nick   : nick,
                modes  : nicks[nick].split('')
            });
        }
    });
    
    client.addListener('join', function (channel, nick, message) {
        //console.log(message);
        
        argus.addNick({
            channel : channel,
            nick    : nick,
            modes   : [],
            hostmask: message.user + '@' + message.host
        });
    });
    
    client.addListener('part', function (channel, nick, reason, message) {
        argus.channels = argus.removeNickByChannel(nick, channel);
    });
    
    client.addListener('quit', function (nick, reason, channels, message) {
        for (var j = 0; j < channels.length; j++) {
            argus.channels = argus.removeNickByChannel(nick, channels[j]);
        }
    });
    
    client.addListener('+mode', function (channel, by, mode, argument, message) {
        /*console.log(channel);
        console.log(mode);
        console.log(argument);*/
        
        argus.addMode({
            channel: channel,
            mode   : mode,
            nick   : argument
        });
    });
    
    client.addListener('-mode', function (channel, by, mode, argument, message) {
        /*console.log(channel);
        console.log(mode);
        console.log(argument);*/
        
        argus.removeMode({
            channel: channel,
            mode   : mode,
            nick   : argument
        });
    });
    
    client.ame.on('actionableMessageAddressingBot', function (info) {
        if (info.words[1] === 'nicks') {
            var nicks          = argus.getChannelNicks(info.channel);
            var nicksWithModes = [];
            var n, modes;
            
            for (var j = 0; j < nicks.length; j++) {
                n     = nicks[j].nick;
                modes = nicks[j].modes.join('');
                
                nicksWithModes.push(modes+n);
            }
            
            var msg   = nicks ? nicksWithModes.join(', ') : false;
                msg   = msg   ? '(' + nicks.length + ') ' + msg : 'error :[';
            
            client.say(info.channel, msg);
        }
        
        if (info.words[1] === 'whois') {
            var target = info.words[2];
            var msg    = 'error :[[[';
            
            if (target.length > 0) {             
                var n = argus.getNickByChannel({
                    nick   : target,
                    channel: info.channel
                });
                
                //console.log(n);
                
                if (n) {
                    msg = n.modes.join('') + n.nick + ' is ' + n.hostmask;
                }
            }
            
            client.say(info.channel, msg);
        }
    });
    
    /**
     * Look for nicks that don't have hostmasks and update them. Stop 
     * checking once all nicks have a hostmask assigned
     *
     */
    var thirtySeconds        = 30000;
    var tenSeconds           = 10000;
    var updateHostmasksTimer = setInterval(function () {
        var nickWithoutHostmask = argus.getNickWithoutHostmask();
        
        if (typeof nickWithoutHostmask !== 'undefined') {
            console.log('looking up nick: ' + nickWithoutHostmask.nick);
            
            client.whois(nickWithoutHostmask.nick, function (info) {
                var hostmask = {
                    nick    : nickWithoutHostmask.nick,
                    hostmask: info.user + '@' + info.host
                };
                
                argus.updateHostmask(hostmask);
                
                aee.emitHostmaskUpdateEvent(_.extend(info, hostmask));
            });
        } else {
            console.log('*** Argus has eyes on all :: ' + moment(argus.initTime).fromNow() + ' ***');
            clearInterval(updateHostmasksTimer);
        }
    },
    tenSeconds);
};

argus.addNick = function (info) {
    if (!argus.nickExists(info)) {
        argus.channels.push(info);
    }
};

argus.getNicksFromCollection = function (c) {
    return _.pluck(c, 'nick');
};

argus.nickExists = function (info) {
    var c     = argus.getChannelNicks(info.channel);
    var nicks = argus.getNicksFromCollection(c);
    
    return _.contains(nicks, info.nick);
};

argus.getNick = function (nick) {
    return _.find(argus.channels, function (n) {
        return n === nick;
    });
};

argus.getNickByChannel = function (info) {
    return _.find(argus.channels, function (n) {
        return n.nick === info.nick && n.channel === info.channel;
    });
};

argus.getChannelNicks = function (channel) {
    return _.filter(argus.channels, function (n) {
        return n.channel === channel;
    });
};

argus.removeNickByChannel = function (nick, channel) {
    return _.reject(argus.channels, function (n) {
        return n.nick === nick && n.channel === channel;
    });
};

argus.getNickWithoutHostmask = function () {
    var nicks = _.filter(argus.channels, function (n) {
        return typeof n.hostmask === 'undefined';
    });
    
    if (nicks) {
        console.log(nicks.length + ' nicks without hostmasks left');
    }
    
    return typeof nicks !== 'undefined' ? _.first(nicks) : [];
};

argus.hasMode = function (info) {
    var c;
    var hasMode   = false;
    var chanMatch = false;
    var nickMatch = false;
    var modeMatch = false;
    
    for (var j = 0; j < argus.channels.length; j++) {
        c         = argus.channels[j];
        chanMatch = c.channel === info.channel;
        nickMatch = c.nick    === info.nick;        
        modeMatch = c.modes.indexOf(info.mode) !== -1;
        
        if (chanMatch && nickMatch && modeMatch) {
            hasMode = true;
            break;
        }
    }
    
    return hasMode;
};

argus.addMode = function (info) {
    // channel modes will have an undefined nick
    if (typeof info.nick === 'undefined') {
        return false;
    }
    
    var c;
    var chanMatch = false;
    var nickMatch = false;
    var hasMode   = false;
    
    info.mode     = argus.translateMode(info.mode);
    
    for (var j = 0; j < argus.channels.length; j++) {
        c         = argus.channels[j];
        chanMatch = c.channel === info.channel;
        nickMatch = c.nick    === info.nick;
        hasMode   = c.modes.indexOf(info.mode) !== -1;
        
        if (chanMatch && nickMatch && !hasMode) {
            argus.channels[j].modes.push(info.mode);
            break;
        }
    }
};

argus.removeMode = function (info) {
    var c;
    var chanMatch = false;
    var nickMatch = false;
    var hasMode   = false;
    
    info.mode     = argus.translateMode(info.mode);
    
    for (var j = 0; j < argus.channels.length; j++) {
        c         = argus.channels[j];
        chanMatch = c.channel === info.channel;
        nickMatch = c.nick    === info.nick;
        hasMode   = c.modes.indexOf(info.mode) !== -1;
        
        if (chanMatch && nickMatch && hasMode) {
            argus.channels[j].modes = _.reject(argus.channels[j].modes, function (m) {
                return m === info.mode;
            });
            
            break;
        }
    }
};

argus.translateMode = function (mode) {
    var translated = mode;
    
    switch (mode) {
        case 'o': 
            translated = '@';
        break;
        
        case 'v': 
            translated = '+';
        break;
        
        case 'h': 
            translated = '%';
        break;
    }
    
    return translated;
};

argus.updateHostmask = function (info) {
    for (var j = 0; j < argus.channels.length; j++) {
        if (argus.channels[j].nick === info.nick) {
            argus.channels[j].hostmask = info.hostmask;
        }
    }
};

argus.botHasOpsInChannel = function (channel) {
    return argus.hasMode({
        nick   : argus.config.nick,
        channel: channel,
        mode   : '@'
    });
};

module.exports = argus;