/**
 * info - information about the bot including uptime, loaded plugins, etc
 *
 */
"use strict";

var parser = require('../../lib/messageParser');
var pm     = require('../../lib/pluginManager');
var moment = require('moment');
var ignore = require('../ignore/');
var info   = { };

info.init  = function (client) {
    client.addListener('message#', function (nick, channel, text, message) {
        var words           = parser.splitMessageIntoWords(text);
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        var command         = words[1];
        var isUptimeCommand = words[1] === 'uptime';
        var isNotIgnored    = !ignore.isIgnored(message.user + '@' + message.host);
        
        if (isAddressingBot && isNotIgnored) {
            switch (command) {
                case 'uptime': 
                    info.getUptime(client.connectTime, function (uptime) {
                        client.say(channel, uptime);
                    });
                break;
                
                case 'plugins': 
                    info.getLoadedPlugins(function (plugins) {
                        client.say(channel, 'Loaded plugins (' + plugins.length + '): ');
                    });
                break;
            }
        }
    });
};

info.getUptime = function (clientConnectTime, callback) {
    var uptimeString  = 'Connected on ';
        uptimeString += moment(clientConnectTime).format("dddd, MMMM Do YYYY, h:mm:ssa");
        
        // Passing true excludes the 'ago' suffix
        uptimeString += ' (' + moment(clientConnectTime).fromNow() + ')';
    
    callback(uptimeString);
};

info.getLoadedPlugins = function (callback) {
    callback(pm.getLoadedPlugins().join(', '));
};

module.exports = info;