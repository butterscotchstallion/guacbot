/**
 * uptime - show detailed information about how long the bot has been connected
 *
 */
"use strict";

var moment = require('moment');
var uptime = { };

uptime.init = function (client) {
    client.addListener('message#', function (from, to, message) {
        if (message === '!uptime') {
            uptime.getUptime(client.connectTime, function (uptime) {
                client.say(to, uptime);
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
