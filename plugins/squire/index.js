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

squire.init = function (client) {
    squire.client    = client;
    squire.pluginCfg = client.config.plugins.squire;
    squire.adminCfg  = client.config.plugins.admin;

    client.ame.on('actionableMessage', function (info) {
        squire.performAction(info);
    });
    
    aee.on('hostmaskUpdated', function (info) {
        for (var j = 0; j < info.channels.length; j++) {
            squire.performAction(_.extend(info, {
                channel: info.channels[j]
            }));
        }
    });
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