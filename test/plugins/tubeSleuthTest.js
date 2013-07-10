/**
 * tube sleuth
 *
 */
"use strict";

var fs     = require('fs');
var assert = require("assert");
var sleuth = require('../../plugins/tube-sleuth/');

describe('should read search API json and get stuff from it', function () {
    it('should be awesome', function () {  
        var data  = JSON.parse(fs.readFileSync('fixture/youtubeSearchResponse.json', 'utf8'));        
        var video = sleuth.parseResponse(data);
        
        assert.equal(video.title, "Clipse - When The Last Time");
        assert.equal(video.link, "https://www.youtube.com/v/d6VuYsNpYg8?version=3&f=videos&app=youtube_gdata");
    });
});

describe('should parse query', function () {
    it('should parse a basic question', function () {
        var input    = 'guacamole: clipse wamp wamp?';
        var expected = 'clipse wamp wamp';
        var actual   = sleuth.parseInputIntoQuery(input);
        
        assert.equal(expected, actual);
    });
});

describe('should detect questions', function () {
    it('should parse a basic question', function () {
        var input    = 'guacamole: clipse wamp wamp?';
        var expected = true;
        var actual   = sleuth.isQuestion(input);
        
        assert.equal(expected, actual);
    });
});