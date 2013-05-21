/**
 * note tests
 *
 */
"use strict";

var moment    = require('moment');
var assert    = require("assert");
var note      = require('../../plugins/note');

describe('note.get', function () {
    beforeEach(function () {
        note.notes = [];
    });
    
    it('should delete the note after retrieving it', function () {
        var input = {
            nick: 'sarahvaughan',
            message: 'One mint julip was the start of it all',
            channel: '#guacamole',
            timestamp: moment()
        };
        
        note.add(input);
    
        assert.equal(note.notes.length, 1);
        
        note.get(input.nick, input.channel);
        
        assert.equal(note.notes.length, 0);
    });
    
    it('should get a note after adding it', function () {
        var input = {
            nick: 'biggie',
            message: 'I live for the funk, I die for the funk',
            channel: '#guacamole',
            timestamp: moment()
        };
        
        note.add(input);
        
        var actual = note.get(input.nick, input.channel);
        
        assert.deepEqual(input, actual);
    });
});

describe('note.add', function () {
    beforeEach(function () {
        note.notes = [];
    });
    
    it('should add a note', function () {
        var n = {
            nick: 'billulum',
            message: 'biggie small is the illest',
            timestamp: moment(),
            channel: '#guacamole'
        };
        
        note.add(n);
        
        assert.equal(note.notes.length, 1);
        assert.deepEqual(note.notes[0], n);
    });
    
    it('should add at most one from the same channel/nick', function () {
        var n = {
            nick: 'billulum',
            message: 'biggie small is the illest',
            timestamp: moment(),
            channel: '#guacamole'
        };
        
        note.add(n);
        note.add(n);
        
        assert.equal(note.notes.length, 1);
        assert.deepEqual(note.notes[0], n);
    });
});
