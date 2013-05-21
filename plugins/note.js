/**
 * note - leave a note for someone special!
 *
 */
"use strict";

var moment   = require('moment');
var parser   = require('../lib/messageParser');
var ignore   = require('./ignore');

var note     = {
    notes: []
};

note.init = function (client) {
    client.addListener('message#', function (nick, channel, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        
        if (isAddressingBot && !ignore.isIgnored(message.user + '@' + message.host)) {
            var words     = parser.splitMessageIntoWords(text);
            var command   = words[1];
            var recipient = words[2];
            var nMessage  = words.slice(3).join(' ');
            
            if (command === 'note') {
                if (recipient && nMessage) {
                
                    note.add({
                        nick: recipient,
                        channel: channel,
                        timestamp: moment(),
                        message: nMessage,
                        from: nick
                    }, 
                    function () {
                        client.say(channel, 'k');
                    },
                    function () {
                        client.say(channel, 'too many notes!!');
                    });
                    
                } else {
                    client.say(channel, 'does not compute');
                }
            }
        }
        
        var newNote = note.get(nick, channel);
        
        if (newNote) {
            client.say(channel, nick + ': ' + newNote.message + ' (' + newNote.from + ')');
            
            note.removeByNickAndChannel(nick, channel);
        }
    });
};

note.removeByNickAndChannel = function (nick, channel) {
    var nlen  = note.notes.length;
    var notes = [];
    
    for (var j = 0; j < nlen; j++) {
        if (note.notes[j].nick !== nick && note.notes[j].channel !== channel) {
            notes.push(note.notes[j]);
        }
    }
    
    note.notes = notes;
};

note.get = function (nick, channel) {
    var newNote = note.hasNotes(nick, channel);
    
    return newNote;
};

note.add = function (n, successCallback, errBack) {
    if (!note.hasNotes(n.nick, n.channel)) {
        note.notes.push(n);
        
        if (successCallback) {
            successCallback();
        }
        
    } else {
        if (errBack) {
            errBack();
        }
    }
};

note.hasNotes = function (nick, channel) {
    var nlen = note.notes.length;
    
    for (var j = 0; j < nlen; j++) {
        if (note.notes[j].nick === nick && note.notes[j].channel === channel) {
            return note.notes[j];
        }
    }
    
    return false;
};

module.exports = note;