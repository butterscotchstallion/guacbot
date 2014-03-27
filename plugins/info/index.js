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

info.init  = function (options) {
    var client = options.client;
    
    options.ame.on('actionableMessageAddressingBot', function (msgInfo) {
        var words    = parser.splitMessageIntoWords(msgInfo.message);
        var command  = words[1];
        
        switch (command) {
            case 'uptime': 
                info.getUptime(client.connectTime, function (uptime) {
                    client.say(msgInfo.channel, uptime);
                });
            break;
            
            case 'plugins':
                info.getLoadedPlugins(function (plugins) {                            
                    var enabledPlugins = pm.getLoadedPlugins();                                
                    var msg  = 'Loaded plugins (' + plugins.length + '): ';
                        msg += enabledPlugins.join(', ');
                    
                    client.say(msgInfo.channel, msg);
                });
            break;
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
    callback(pm.getLoadedPlugins());
};

module.exports = info;