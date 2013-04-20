/**
 * bot.js - irc bot
 *
 */
"use strict";

var moment = require('moment');
var fs     = require('fs');
var config = JSON.parse(fs.readFileSync('./bot-config.json', 'utf8'));

var irc    = require('irc');

// Connect using config settings
var client = new irc.Client(config.server, config.nick, {
    channels: config.channels
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

// Log errors to console
client.addListener('error', function (message) {
    console.log('IRC Error: ', message);
});

// Log server connection
client.addListener('registered', function (message) {
    client.connectTime = new Date().getTime();
    console.log('Connected to ' + message.server);
    console.log(message.args[message.args.length-1]);
});

// Reply to VERSION
client.addListener('ctcp-version', function (from, to) {
    client.notice(from, 'nodebot');
});

// Show link titles
require('./plugins/titler').init(client);

// Uptime
require('./plugins/uptime').init(client);

// CLS
require('./plugins/caps-lock-saturday').init(client);

// Weather
require('./plugins/weather').init(client);