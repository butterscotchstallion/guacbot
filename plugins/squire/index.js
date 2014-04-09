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
var db         = require('../../lib/db');
var when       = require('when');
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

squire.reload = function (options) {
    squire.loadConfig(options.config);
    squire.scan();
};

squire.loadConfig = function (config) {
    squire.getHostmasks()
          .then(function (hostmasks) {
            squire.cfg.friends = _.pluck(_.filter(hostmasks, function (s) {
                return s.isFriend === 1;
            }), 'hostmask');
            
            squire.cfg.foes = _.pluck(_.filter(hostmasks, function (s) {
                return s.isFriend === 0;
            }), 'hostmask');
            
            squire.cfg       = _.extend(squire.cfg, config.plugins.squire);
            squire.adminCfg  = config.plugins.admin;
          })
          .catch(function (e) {
            //console.log(e.stack);
          });
};

squire.init = function (options) {
    var client       = options.client;
    squire.client    = client;
    squire.argus     = options.argus;
    squire.loadConfig(options.config);
    
    options.ame.on('actionableMessage', function (info) {
        var targetUpgradeable = squire.isTargetUpgradeable(info);
        
        if (targetUpgradeable) {
            squire.performAction(info);
        }
    });
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        var isAdmin = admin.userIsAdmin({
            userInfo: {
                user: info.info.user,
                host: info.info.host
            }
        });
        
        if (isAdmin) {
            switch (info.command) {
                case 'af':
                    squire.processAddFriendCommand(info, options);
                break;
                
                case 'rf':
                    squire.processRemoveFriendCommand(info, options);
                break;
                
                case 'if':
                    squire.processIsFriendCommand(info, options);
                break;
            }
        }
    });
    
    aee.on('hostmaskUpdated', function (info) {
        for (var j = 0; j < info.channels.length; j++) {
            var targetUpgradeable = squire.isTargetUpgradeable(info.channels[j]);
            
            if (targetUpgradeable) {
                squire.performAction(_.extend(info, {
                    channel: info.channels[j]
                }));
            }
        }
    });
    
    aee.on('adminHostmaskBanned', function (info) {
        client.send('MODE', info.channel, '-b', info.hostmask);
    });
    
    client.addListener('join', function (nick, message) {
        squire.scan();
    });
    
    var tenSeconds = 10000;
    
    setInterval(function () {
        squire.scan();
    }, tenSeconds);
};

squire.processIsFriendCommand = function (info, options) {
    var errorCB = function (e) {
        var errMsg = 'error lol';
        var msg    = e ? [errMsg, e].join(': ') : errMsg;
        
        squire.client.say(info.channel, msg);
    };
    
    var target = info.words[2];
    var user   = squire.argus.getNick(target);
    
    if (user && user.hostmask) {
        var isFriend = squire.isFriend(user.hostmask);
        var msg      = isFriend ? 'yes' : 'no';
        
        squire.client.say(info.channel, msg);
        
    } else {
        errorCB();
    }    
};

squire.processAddFriendCommand = function (info, options) {
    var errorCB = function (e) {
        var errMsg = 'error lol';
        var msg    = e ? [errMsg, e].join(': ') : errMsg;
        
        squire.client.say(info.channel, msg);
    };
    
    var target = info.words[2];
    var user   = squire.argus.getNick(target);
    
    if (user && user.hostmask) {
        squire.addFriend(_.extend(info, {
            hostmask: user.hostmask,
            nick    : target
        }), options)
        .then(function () {
            squire.reload(options);
        })
        .catch(function (e) {
            errorCB(e);
        });
    } else {
        errorCB();
    }    
};

squire.processRemoveFriendCommand = function (info, options) {
    var errorCB = function (e) {
        var errMsg = 'error lol';
        var msg    = e ? [errMsg, e].join(': ') : errMsg;
        
        squire.client.say(info.channel, msg);
    };
    
    var target = info.words[2];
    var user   = squire.argus.getNick(target);
    
    if (user && user.hostmask) {
        squire.removeFriend(user.hostmask)
        .then(function () {
            squire.reload(options);
        })
        .catch(function (e) {
            errorCB(e);
        });
    } else {
        errorCB();
    }    
};

squire.scan = function () {
    var channels = squire.argus.channels;
    var cur;
    
    for (var j = 0; j < channels.length; j++) {
        cur = channels[j];
        
        var targetUpgradeable = squire.isTargetUpgradeable(cur);
        
        if (targetUpgradeable) {
            squire.performAction(cur);
        }
    }
};

squire.isTargetUpgradeable = function (info) {
    var targetHasOpsAlready = false;
    var hasMask             = false;
    var botHasOps           = false;
    
    // If they don't already have ops
    targetHasOpsAlready = argus.hasMode(_.extend(info, {
        mode: '@'
    }));
    
    // And this item has a hostmask
    hasMask             = typeof info.hostmask !== 'undefined';
    
    // And the bot has ops in that channel
    botHasOps           = argus.botHasOpsInChannel(info.channel, squire.client.config.nick);
    
    //console.log('chan: ' + info.channel + ' nick: ' + info.nick + ' ops: ' + botHasOps);
    
    return hasMask && botHasOps && !targetHasOpsAlready;
};

squire.isBotInChannel = function (channel) {
    var botInChannel = squire.client.chans && Object.keys(squire.client.chans).indexOf(channel) !== -1;
    
    return botInChannel;
};

squire.performAction = function (info) {
    var command, words;
    
    if (squire.isFriend(info.hostmask)) {
        //console.log(info.hostmask + ' is friend');
        squire.client.send('MODE', info.channel, '+o', info.nick);
    }
    
    if (squire.isFoe(info.hostmask)) {
        //console.log(info.hostmask + ' is foe');
        squire.client.send('MODE', info.channel, '-o', info.nick);
    }
};

squire.isFriend = function (hostmask) { 
    var cfgFriend   = squire.match(hostmask, squire.cfg.friends);
    var isAdmin     = admin.hostmaskIsAdmin(hostmask);
    
    return cfgFriend || isAdmin;
};

squire.isFoe = function (hostmask) { 
    return squire.match(hostmask, squire.cfg.foes);
};

squire.match = function (needle, haystack) {
    var match = false;
    
    if (haystack) {
        for (var j = 0; j < haystack.length; j++) {
            if (minimatch(needle, haystack[j])) {            
                match = true;            
                break;
            }
        }
    }
    
    return match;
};

squire.getHostmasks = function () {
    var cols  = ['hostmask', 
                 'upgrade_type AS upgradeType', 
                 'is_friend AS isFriend'];
    var def   = when.defer();
    var query = [
        'SELECT ',
        cols.join(','),
        'FROM squire_hostmasks',
        'WHERE 1=1',
        'AND enabled = 1'
    ].join("\n");
    
    var qry = db.connection.query(query, function (err, result) {
        if (err && result) {
            def.reject(err);
        } else {
            def.resolve(result);
        }
    });
    
    return def.promise;
};

squire.addFriend = function (options) {
    var def   = when.defer();

    // Grant channel operator status immediately
    admin.grantChannelOperatorStatus(options, options.nick);
    
    var query = [
        "REPLACE INTO squire_hostmasks (hostmask, upgrade_type)",
        "VALUES(?, ?)"
    ].join("\n");
    
    var params = [options.hostmask, options.upgradeType || 'op'];
    
    var qry    = db.connection.query(query, params, function (err, result) {
        //console.log('squire.addFriend: ', result);
        
        if (err && result) {
            def.reject(err);
        } else {
            def.resolve(result);
        }
    });
    
    return def.promise;
};

squire.removeFriend = function (hostmask) {
    var def   = when.defer();
    var query = [
        "UPDATE squire_hostmasks SET enabled = 0 WHERE hostmask = ?"
    ].join("\n");
    
    var params = [hostmask];
    
    var qry    = db.connection.query(query, params, function (err, result) {
        //console.log('squire.removeFriend: ', result);
        
        if (err && result) {
            def.reject(err);
        } else {
            def.resolve(result);
        }
    });
    
    return def.promise;
};

module.exports = squire;