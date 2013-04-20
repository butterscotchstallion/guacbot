/**
 * bot.js - irc bot
 *
 */
"use strict";

var fs     = require('fs');
var config = JSON.parse(fs.readFileSync('./bot-config.json', 'utf8'));

var irc    = require('irc');

// Connect using config settings
var client = new irc.Client(config.server, config.nick, {
    channels: config.channels
});

// Log errors to console
client.addListener('error', function (message) {
    console.log('error: ', message);
});

// Capture incoming messages to any channel
client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    
    var titler = require('./plugins/titler');
    
    if (titler.matchURL(message)) {
        var title = titler.getTitle(message, function (title) {
            if (title) {
                client.say(to, title);
            }
        });
    }
});