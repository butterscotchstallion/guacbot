/**
 * reminder - remind you about stuff
 * 
 * syntax: guacamole: remind 5m pizza ready
 * store reminders in array with creation time, msg, and nick
 * on channel message iterate reminders and check nick/respond
 *
 */
"use strict";

var db         = require('../../plugins/db/');
var moment     = require('moment');
var parser     = require('../../lib/messageParser');
var timeParser = require('../../lib/timeUnitParser');
var ignore     = require('../ignore/');
var reminder   = {};

reminder.init = function (client) {
    var thirtySecondsInMS = 30000;
    
    setInterval(function () {
        reminder.processPendingReminders(client);
    }, thirtySecondsInMS);
    
    client.ame.on('actionableMessageAddressingBot', function (info) {   
        var words           = parser.splitMessageIntoWords(info.message);
        var command         = words[1];
        var duration        = words[2] ? words[2] : '1m';
        var message         = words.slice(3).join(' ');
        
        if (command === 'remind') {
            if (message.length > 1) {
                var d           = timeParser.parseDuration(duration);
                var remindAt    = moment().add(d.unit, d.length);
                var fmtRemindAt = remindAt.format('YYYY-MM-DD HH:mm:ss');
                var formatted   = remindAt.format('h:m:sA M-D-YYYY');
                
                if (d.length > 0 && d.unit) {
                    client.say(info.channel, 'reminding you around \u0002' + formatted);
                    
                    reminder.add({
                        'nick'      : info.nick,
                        'channel'   : info.channel,
                        'message'   : message,
                        'host'      : info.info.user + '@' + info.info.host,
                        'remind_at' : fmtRemindAt
                    }, function (result, err) {
                        if (err) {
                            console.log('reminder error:', err);
                        }
                    });
                    
                } else {
                    client.say(info.channel, 'does not compute');
                }
                
            } else {
                client.say(info.channel, 'that reminder sucks');
            }
        }
    });
};

reminder.getPendingReminders = function (callback) {
    var cols = ['id', 'nick', 'host', 'message', 'remind_at AS remindAt', 'channel'];
    var q    = ' SELECT ' + cols.join(',');
        q   += ' FROM reminders';
        q   += ' WHERE 1=1';
        q   += ' AND remind_at <= NOW()';
        q   += ' ORDER BY remind_at DESC';
        q   += ' LIMIT 5';
    
    var qry = db.connection.query(q, function (err, rows, fields) {
        callback(rows, err);
    });
    
    //console.log(qry.sql);
};

reminder.removeMany = function (arrayOfReminderIDs, callback) {
    var query  = ' DELETE FROM reminders';
        query += ' WHERE id IN (' + arrayOfReminderIDs.join(',') + ')';
    
    db.connection.query(query, arrayOfReminderIDs, function (err, result) {
        callback(result, err);
    });
};

/**
 * Iterate all reminders and check if the current message is from
 * someone who added a reminder, and the creation time + duration is
 * >= now
 *
 */
reminder.processPendingReminders = function (client) {    
    reminder.getPendingReminders(function (rmdrs, err) {
        if (err) {
            console.log(err);
        }
        
        var rlen = rmdrs.length;
        var msg  = '';
        var ids  = [];
        
        for (var j = 0; j < rlen; j++) {
            msg  = rmdrs[j].nick + ': *REMINDER* ' + rmdrs[j].message;
            
            client.say(rmdrs[j].channel, msg);
            
            ids.push(rmdrs[j].id);
        }
        
        if (ids.length > 0) {
            reminder.removeMany(ids, function (err, result) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('reminder: removed ' + ids.length + ' reminders');
                }
            });
        }
    });
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
reminder.add = function (rmdr, callback) {
    var query = " INSERT INTO reminders SET ?, created_at = NOW()";
    
    var qry = db.connection.query(query, rmdr, function (err, result) {
        callback(result, err);
    });
    
    //console.log(qry.sql);
};

module.exports = reminder;



