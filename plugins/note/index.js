/**
 * note - leave a note for someone special!
 *
 */
"use strict";

var db       = require('../../plugins/db/');
var moment   = require('moment');
var irc      = require('irc');
var hbs      = require('handlebars');
var _        = require('underscore');
var note     = {
    delivered: []
};

note.init = function (client) {
    client.ame.on('actionableMessageAddressingBot', function (info) {
        var words     = info.words;
        var command   = words[1] || '';
        var recipient = words[2] || '';
        var nMessage  = words.slice(3).join(' ');
        
        if (command === 'note') {
            var lowerRecipient           = recipient.toLowerCase();
            var validRecipientAndMessage = recipient && nMessage;
            var isMessageToSelf          = lowerRecipient === info.nick;
            var isMessageToBot           = lowerRecipient === client.config.nick.toLowerCase();
            
            if (validRecipientAndMessage && !isMessageToSelf && !isMessageToBot) {
                var noteAddedCB = function (result, err) {
                    if (err) {
                        console.log(err);
                    }
                    
                    client.say(info.channel, 'Message for \u0002' + recipient + '\u0002 saved!');
                };
                
                note.add({
                    dest_nick  : recipient,
                    channel    : info.channel,
                    message    : nMessage,
                    origin_nick: info.nick
                }, noteAddedCB);
                
            } else {
                var err = nMessage ? 'Invalid recipient' : 'That note sucks.';
                
                client.say(info.channel, err);
            }
        }
    });
    
    client.ame.on('actionableMessage', function (info) {
        note.get(info.nick, info.channel, function (newNote) {
            // Make sure that we haven't already delivered this note in the 
            // case of a bunch of messages arriving at once
            // Fixes #35
            var isDelivered = note.delivered.indexOf(newNote.id) !== -1;
            
            if (newNote && !isDelivered) {
                var timeAgo = moment(newNote.createdAt).fromNow();
                var msg     = note.getNoteDeliveredTemplate({
                    nick      : info.nick,
                    message   : newNote.message,
                    originNick: newNote.originNick,
                    timeAgo   : timeAgo
                });
                
                client.say(info.channel, msg);
            }
        });
    });
};

note.getNoteDeliveredTemplate = function (info) {
    var tpl       = '*ATTN* \u0002{{{nick}}}\u0002: {{{message}}}';
        tpl      += ' (\u0002{{{originNick}}}\u0002 {{timeAgo}})';
    var compileMe = hbs.compile(tpl);
    
    return compileMe(info);
};

note.removeByNickAndChannel = function (nick, channel, callback) {
    var q      = ' DELETE FROM notes';
        q     += ' WHERE 1=1';
        q     += ' AND origin_nick = ?';
        q     += ' AND channel     = ?';
    var params = [nick, channel];
    
    db.connection.query(q, params, function (err, result) {
        callback(result, err);
    });
};

note.removeByID = function (id, callback) {
    var q      = ' DELETE FROM notes';
        q     += ' WHERE 1=1';
        q     += ' AND id = ?';
    
    db.connection.query(q, [id], function (err, result) {
        if (err) {
            console.log(err);
        }
        
        if (typeof callback === 'function') {
            callback(result, err);
        }
    });
};

note.get = function (nick, channel, callback) {
    var cols   = ['id',
                  'origin_nick AS originNick', 
                  'dest_nick   AS destNick', 
                  'channel', 
                  'message', 
                  'created_at AS createdAt'];
                  
    var params = [nick, channel];
    var q      = ' SELECT ' + cols.join(',');
        q     += ' FROM notes';
        q     += ' WHERE dest_nick = ?';
        q     += ' AND channel     = ?';
        q     += ' ORDER BY created_at DESC';
    
    db.connection.query(q, params, function (err, rows, fields) {
        if (err) {
            console.log('note error in get: ' + err);
        } else {
            if (rows.length > 0) {
                for (var j = 0; j < rows.length; j++) {
                    // after note is successfully retrieved, remove it
                    note.removeByID(rows[j].id);
                    
                    callback(rows[j], err);
                    
                    // Add note to delivered - Fixes #35
                    note.delivered.push(rows[j].id);
                }
            }
        }
    });
};

note.add = function (n, callback) {
    var q = 'INSERT INTO notes SET ?, created_at = NOW()';
    
    db.connection.query(q, n, function (err, result) {
        callback(result, err);
    });
};

note.hasNotes = function (nick, channel) {
    var q  = ' SELECT COUNT(*) as noteCount';
        q += ' FROM notes';
        q += ' WHERE 1=1';
        q += ' AND nick    = ?';
        q += ' AND channel = ?';
    
    var params = [nick, channel];
    
    db.connection.query(q, params, function (err, rows, fields) {
        if (err) {
            console.log('notes error in hasNotes: ' + err);
        } else {
            callback(rows[0], err);
        }
    });
};

module.exports = note;