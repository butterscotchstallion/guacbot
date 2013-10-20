/**
 * squire - will perform different actions based on whether a hostmask
 * is in the friend/foe groups. Uses admin plugin to perform said actions
 * and uses the commands/kick messages etc from there as well.
 *
 * check for friends/foes on:
 * - join
 * - message
 *
 */
"use strict";

var parser     = require('../../lib/messageParser');
var aee        = require('../../lib/argusEventEmitter');
var admin      = require('../../plugins/admin');
var minimatch  = require('minimatch');
var _          = require('underscore');
var argus      = require('../../lib/argus');
var squire     = {
    cfg: {
        adminsAreFriends: true,
        friendAction    : 'op',
        foeAction       : 'kick',
        channels        : [],
        nicks           : {
            
        }
    }
};

squire.loadConfig = function (config) {
    squire.pluginCfg = config.plugins.squire;
    squire.adminCfg  = config.plugins.admin;
};

squire.init = function (client) {
    squire.client    = client;
    squire.loadConfig(client.config);
    
    client.ame.on('actionableMessage', function (info) {
        squire.performAction(info);
    });
    
    aee.on('hostmaskUpdated', function (info) {
        for (var j = 0; j < info.channels.length; j++) {
            // Don't try to perform actions unless we're in that channels
            var botInChannel = squire.isBotInChannel(info.channels[j]);
            
            if (botInChannel) {
                squire.performAction(_.extend(info, {
                    channel: info.channels[j]
                }));
            }
        }
    });
    
    var tenSeconds           = 10000;
    
    setInterval(function () {
        var channels            = argus.channels;
        var targetHasOpsAlready = false;
        var hasMask             = false;
        var botHasOps           = false;
        var cur;
        
        for (var j = 0; j < channels.length; j++) {
            cur = channels[j];
            
            // If they don't already have ops
            targetHasOpsAlready = argus.hasMode(_.extend(cur, {
                mode: '@'
            }));
            
            // And this item has a hostmask
            hasMask             = typeof cur.hostmask !== 'undefined';
            
            // And the bot has ops in that channel
            botHasOps           = argus.botHasOpsInChannel(cur.channel);
            
            if (hasMask && !targetHasOpsAlready && botHasOps) {
                console.log('setting modez: ', cur);
                
                squire.performAction(cur);
            }
        }
    }, tenSeconds);
};

squire.isBotInChannel = function (channel) {
    var botInChannel = squire.client.chans && Object.keys(squire.client.chans).indexOf(channel) !== -1;
    
    return botInChannel;
};

squire.performAction = function (info) {
    var command, words;
    
    if (squire.isFriend(info.hostmask)) {
        console.log(info.hostmask + ' is friend');
        squire.client.send('MODE', info.channel, '+o', info.nick);
    }
    
    if (squire.isFoe(info.hostmask)) {
        console.log(info.hostmask + ' is foe');
        squire.client.send('MODE', info.channel, '-o', info.nick);
    }    
};

squire.isFriend = function (hostmask) { 
    var cfgFriend   = squire.match(hostmask, squire.pluginCfg.friends);
    var isAdmin     = admin.hostmaskIsAdmin(hostmask);
    
    console.log(hostmask + ' is not admin');
    
    return cfgFriend || isAdmin;
};

squire.isFoe = function (hostmask) { 
    return squire.match(hostmask, squire.pluginCfg.foes);
};

squire.match = function (needle, haystack) {
    var match = false;
    
    for (var j = 0; j < haystack.length; j++) {
        if (minimatch(needle, haystack[j])) {            
            match = true;            
            break;
        }
    }
    
    return match;
};

module.exports = squire;