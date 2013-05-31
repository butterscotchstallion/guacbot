/**
 * note - leave a note for someone special!
 *
 */
"use strict";

var db       = require('../../plugins/db/');
var moment   = require('moment');
var parser   = require('../../lib/messageParser');
var ignore   = require('../ignore/');
var irc      = require('irc');

var note     = {};

note.init = function (client) {
    client.addListener('message#', function (nick, channel, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        
        if (isAddressingBot) {
            ignore.isIgnored(message.user + '@' + message.host, function (ignored) {
                if (!ignored) {
                    var words     = parser.splitMessageIntoWords(text);
                    var command   = words[1];
                    var recipient = words[2];
                    var nMessage  = words.slice(3).join(' ');
                    
                    if (command === 'note') {
                        if (recipient && nMessage) {                    
                            if (recipient !== nick) {
                                note.add({
                                    dest_nick: recipient,
                                    channel: channel,
                                    message: nMessage,
                                    origin_nick: nick
                                }, function (result, err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    
                                    client.say(channel, 'k');
                                });
                                
                            } else {
                                var msg  = "can't send a note to yourself ";
                                    msg += irc.colors.wrap('magenta', 'friend');
                                
                                client.say(channel, msg);
                            }
                            
                        } else {
                            client.say(channel, 'does not compute');
                        }
                    }
                }
            });
        }
        
        note.get(nick, channel, function (newNote) {
            if (newNote) {
                var timeAgo = moment(newNote.createdAt).fromNow();
                var msg     = nick + ': ' + newNote.message;
                    msg    += ' (from ' + newNote.originNick + ' ' + timeAgo + ')';
                
                client.say(channel, msg);
            }
        });
    });
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
    
    var params = [id];
    
    db.connection.query(q, params, function (err, result) {
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
        q     += ' LIMIT 1';
    
    db.connection.query(q, params, function (err, rows, fields) {
        if (err) {
            console.log('note error in get: ' + err);
        } else {
            if (rows.length > 0) {
                callback(rows[0], err);
                
                // after note is successfully retrieved, remove it
                note.removeByID(rows[0].id);
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