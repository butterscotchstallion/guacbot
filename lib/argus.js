/**
 * Argus - keeps track of users in channels and information about them
 * 
 * Listens to joins, quits, parts, modes
 *
 * https://github.com/prgmrbill/guacbot/issues/31
 *
 */
"use strict";
var _         = require('underscore');
var moment    = require('moment');
var aee       = require('./argusEventEmitter');
var minimatch = require('minimatch');
var admin     = require('../plugins/admin');
var argus     = {
    channels: []
};

argus.init = function (options) {
    argus.client   = options.client;
    argus.config   = options.config;
    argus.initTime = moment();

    argus.client.addListener('names', function (channel, nicks) {
        for (var nick in nicks) {
            argus.addNick({
                channel: channel,
                nick   : nick,
                modes  : nicks[nick].split('')
            });
        }
    });
    
    argus.client.addListener('join', function (channel, nick, message) {
        argus.addNick({
            channel : channel,
            nick    : nick,
            modes   : [],
            hostmask: message.user + '@' + message.host
        });
    });
    
    argus.client.addListener('part', function (channel, nick, reason, message) {
        argus.channels = argus.removeNickByChannel(nick, channel);
    });
    
    argus.client.addListener('quit', function (nick, reason, channels, message) {
        for (var j = 0; j < channels.length; j++) {
            argus.channels = argus.removeNickByChannel(nick, channels[j]);
        }
    });
    
    argus.client.addListener('nick', function (oldnick, newnick, channels, message) {
        console.log("removing " + oldnick);
        console.log("adding "   + newnick);
        
        argus.removeNick({
            nick    : oldnick,
            modes   : [],
            hostmask: message.user + '@' + message.host
        });
        
        argus.addNick({
            nick    : newnick,
            modes   : [],
            hostmask: message.user + '@' + message.host
        });
    });
    
    argus.client.addListener('+mode', function (channel, by, mode, argument, message) {
        //console.log('chan:', channel);
        //console.log('mode:', mode);
        //console.log('arg:', argument);
        
        if (argus.isBanMode(mode)) {
            var hostmask = argument;
            
            if (admin.hostmaskIsAdmin(hostmask)) {
                console.log('admin banned :(');
                
                aee.emit('adminHostmaskBanned', {
                    hostmask: hostmask,
                    channel : channel,
                    by      : by
                });
            }
        }
        
        argus.addMode({
            channel: channel,
            mode   : mode,
            nick   : argument
        });
    });
    
    argus.client.addListener('-mode', function (channel, by, mode, argument, message) {
        /*console.log(channel);
        console.log(mode);
        console.log(argument);*/
        
        argus.removeMode({
            channel: channel,
            mode   : mode,
            nick   : argument
        });
    });
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        if (info.words[1] === 'nicks') {
            var nicks          = argus.getChannelNicks(info.channel);
            var nicksWithModes = [];
            var n, modes;
            
            console.log(argus.channels);
            
            for (var j = 0; j < nicks.length; j++) {
                n     = nicks[j].nick;
                modes = nicks[j].modes.join('');
                
                nicksWithModes.push(modes+n);
            }
            
            var msg   = nicks ? nicksWithModes.join(', ')       : false;
                msg   = msg   ? '(' + nicks.length + ') ' + msg : 'error :[';
            
            argus.client.say(info.channel, msg);
        }
        
        if (info.words[1] === 'whois') {
            var target = info.words[2];
            var msg    = 'error :[[[';
            
            if (target.length > 0) {             
                var n = argus.getNickByChannel({
                    nick   : target,
                    channel: info.channel
                });
                
                if (n) {
                    msg = n.modes.join('') + n.nick + ' is ' + n.hostmask;
                }
            }
            
            argus.client.say(info.channel, msg);
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
            
            argus.client.whois(nickWithoutHostmask.nick, function (info) {
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

argus.isBanMode = function (mode) {
    return mode === 'b';
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
        return n.nick === nick;
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
    argus.channels = _.reject(argus.channels, function (n) {
        return n.nick === nick && n.channel === channel;
    });
};

// Removes nick from all channels
argus.removeNick = function (nick) {
    argus.channels = _.reject(argus.channels, function (n) {
        return n.nick === nick;
    });
};

argus.getNickWithoutHostmask = function (debug) {
    var nicks = _.filter(argus.channels, function (n) {
        return typeof n.hostmask === 'undefined';
    });
    
    if (nicks && typeof debug !== 'undefined') {
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

argus.removeMode  = function (info) {
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

argus.botHasOpsInChannel = function (channel, nick) {
    // for testing purposes
    var n = typeof nick === 'string' ? nick : argus.config.nick;
    
    return argus.hasMode({
        nick   : n,
        channel: channel,
        mode   : '@'
    });
};

module.exports = argus;