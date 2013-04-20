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

// Capture incoming messages to any channel
client.addListener('message#', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    
    // Show link titles
    var titler = require('./plugins/titler');
    
    if (titler.matchURL(message)) {
        var title = titler.getTitle(message, function (title) {
            if (title) {
                client.say(to, '^ ' + title);
            }
        });
    }
    
    // Uptime
    if (message === '!uptime') {
        var uptime = require('./plugins/uptime');
        
        uptime.getUptime(client.connectTime, function (uptime) {
            client.say(to, uptime);
        });
    } 
    
    // CLS
    if (message.toLowerCase() === '!cls') {
        var cls = require('./plugins/caps-lock-saturday');
        
        cls.init({ client: client });
        cls.capitalizeNick(config.nick);
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
                        debug: false
                    });
                }
            }
        }
    }
});