/**
 * bot.js - irc bot
 *
 */
"use strict";

var moment = require('moment');
var fs     = require('fs');
var config = JSON.parse(fs.readFileSync('bot-config.json', 'utf8'));

var irc    = require('irc');

// Connect using config settings
var client = new irc.Client(config.server, config.nick, {
    channels: config.channels,
    showErrors: true
});

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
    console.log(moment().format('MMMM Do YYYY, h:mm:ssa') + ' Ping!');
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
    client.notice(from, 'https://github.com/prgmrbill/nodebot');
});

// Initialize plugins
var enabledPlugins = config.plugins.enabled;
var epLen          = enabledPlugins.length;

for (var j = 0; j < epLen; j++) {
    require('../plugins/' + enabledPlugins[j]).init(client);
}
