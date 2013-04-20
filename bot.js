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
                client.say(to, '^ ' + title);
            }
        });
    }
    
    // If first word in message has the bot's nick in it...
    if (message.length >= config.nick.length) {
        var messageWords = message.split(' ');
        
        // You talkin' to me?
        if (messageWords[0] && messageWords[0].indexOf(config.nick) === 0) {
            console.log(from + ' is addressing bot');
            
            if (messageWords[1] === 'weather') {
                console.log('weather command detected');
                
                var query = messageWords.slice(2, messageWords.length).join(' ');
                
                console.log('query: ' + query);
                
                if (query) {
                    var weather = require('./plugins/weather');
                    
                    weather.query({
                        apiKey: config.plugins.weather.apiKey,
                        query: query,
                        callback: function (data) {
                            client.say(to, data);
                        },
                        debug: true
                    });
                }
            }
        }
    }
});