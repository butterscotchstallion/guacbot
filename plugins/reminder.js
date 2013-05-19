/**
 * reminder - remind you about stuff
 * 
 * syntax: guacamole: remind 5m pizza ready
 * store reminders in array with creation time, msg, and nick
 * on channel message iterate reminders and check nick/respond
 *
 */
"use strict";

var moment   = require('moment');
var parser   = require('../lib/messageParser');
var ignore   = require('./ignore');
var reminder = {
    reminders: []
};

reminder.init = function (client) {
    // Check reminders every second
    setInterval(function () {
        reminder.processPendingReminders(client);
    }, 1000);
    
    client.addListener('message#', function (nick, channel, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        
        if (isAddressingBot && !ignore.isIgnored(message.user + '@' + message.host)) {
            var words           = parser.splitMessageIntoWords(text);
            var command         = words[1];
            var duration        = words[2] ? words[2] : '1m';
            var message         = words.slice(3).join(' ');
            
            if (command === 'remind') {
                if (message.length > 1) {
                    var d         = reminder.parseDuration(duration);
                    var remindAt  = moment().add(d.unit, d.length);
                    var formatted = remindAt.format('h:m:sA M-D-YYYY');
                    
                    if (d.length > 0) {
                        client.say(channel, 'reminding you at \u0002' + formatted);
                        
                        reminder.add({
                            'nick'     : nick,
                            'channel'  : channel,
                            'createdAt': moment(),
                            'message'  : message,
                            'duration' : duration,
                            'remindAt' : remindAt
                        });
                        
                    } else {
                        client.say(channel, 'does not compute');
                    }
                    
                } else {
                    client.say(channel, 'that reminder sux');
                }
            }
        }
    });
};

reminder.parseDuration = function (input) {
    var unit       = input.substring(input.length, input.length - 1);
    var length     = input.substring(0, input.length - 1);
    var validUnits = ['d', 'y', 'm', 's'];
    
    // If the unit is invalid, set it to zero and disregard
    if (validUnits.indexOf(unit) === -1) {
        unit = 0;
    }
    
    return {
        length: length,
        unit: unit
    };
};

/**
 * Iterate all reminders and check if the current message is from
 * someone who added a reminder, and the creation time + duration is
 * >= now
 *
 */
reminder.processPendingReminders = function (client) {    
    var rmdrs        = reminder.reminders;
    var rlen         = rmdrs.length;
    var now          = moment();
    var duration     = {};
    var reminderTime;
    
    for (var j = 0; j < rlen; j++) {
        if (rmdrs[j]) {
            duration     = reminder.parseDuration(rmdrs[j].duration);
            reminderTime = rmdrs[j].remindAt;
            
            if (reminderTime.isBefore(now)) {
                console.log('reminder created at ' + rmdrs[j].createdAt._d + ' expired!!!');
                
                client.say(rmdrs[j].channel, rmdrs[j].nick + ': ' + rmdrs[j].message);
                
                delete rmdrs[j];
            }
        }
    }
};

/**
 * reminder = {
 *     nick: 'billulum',
 *     channel: '#guacamole',
 *     createdAt: '2013-05-18 16:15:22'
 *     message: 'pizza is ready!!'
 * };
 *
 */
reminder.add = function (rmdr) {
    reminder.reminders.push(rmdr);
};

module.exports = reminder;



