/**
 * uptime - show detailed information about how long the bot has been connected
 *
 */
"use strict";

var parser = require('../lib/messageParser');
var moment = require('moment');
var ignore = require('./ignore');
var uptime = { };

uptime.init = function (client) {
    client.addListener('message#', function (nick, channel, text, message) {
        var words           = parser.splitMessageIntoWords(text);
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        
        if (isAddressingBot && words[1] === 'uptime' && !ignore.isIgnored(message.user + '@' + message.host)) {
            uptime.getUptime(client.connectTime, function (uptime) {
                client.say(channel, uptime);
            });
        }
    });
};

uptime.getUptime = function (clientConnectTime, callback) {
    var uptimeString  = 'Connected on ';
        uptimeString += moment(clientConnectTime).format("dddd, MMMM Do YYYY, h:mm:ssa");
        
        // Passing true excludes the 'ago' suffix
        uptimeString += ' (' + moment(clientConnectTime).fromNow() + ')';
    
    callback(uptimeString);
};

module.exports = uptime;
