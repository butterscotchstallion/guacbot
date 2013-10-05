/**
 * bot.js - irc bot
 *
 */
"use strict";

var pluginManager = require('./pluginManager');
var moment        = require('moment');
var fs            = require('fs');
var config        = pluginManager.getConfigJSON();
var irc           = require('irc');

// Connect using config settings
var client = new irc.Client(config.server, config.nick, {
    channels: config.channels,
    showErrors: true,
    userName: config.userName || 'guacbot',
    realName: config.realName || 'guacbot',
    stripColors: true,
    floodProtection: true,
    floodProtectionDelay: 1000,
    //debug: true
});

client.setMaxListeners(0);

// Track current nick
client.currentNick = config.nick;

// Pass along config
client.config      = config;

// Track nick changes
client.addListener('nick', function (oldNick, newNick, channels, message) {
    // But only the bot's nick
    if (oldNick.toLowerCase() === client.currentNick.toLowerCase()) {
        config.nick = newNick;
    }
});

// Log Ping!
client.addListener('ping', function () {
    //console.log(moment().format('MMMM Do YYYY, h:mm:ssa') + ' Ping!');
});

// Log messages from server
client.addListener('raw', function (msg) {
    //console.log('SERVER: ', msg);
    if (msg.command == 'rpl_namreply') {
        //console.dir(msg.args)
    }
});

// Log errors to console
client.addListener('error', function (message) {
    //console.log('IRC Error: ', message);
});

// Log server connection
client.addListener('registered', function (message) {
    client.connectTime = new Date().getTime();
    console.log('Connected to ' + message.server);
    console.log(message.args[message.args.length-1]);
});

// Reply to VERSION
client.addListener('ctcp-version', function (from, to) {
    client.notice(from, 'https://github.com/prgmrbill/guacbot');
});

pluginManager.loadPlugins(client);
