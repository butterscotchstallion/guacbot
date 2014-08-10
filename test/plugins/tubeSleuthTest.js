/**
 * tube sleuth
 *
 */
"use strict";

var fs     = require('fs');
var assert = require("assert");
var sleuth = require('../../plugins/tube-sleuth/');

describe('Bug #108 - Viewcount crash bug', function () {
    it('should be not throw errors when there is no viewcount', function () {
        var data  = JSON.parse(fs.readFileSync('fixture/youtubeJSONResponseNoViewCount.json', 'utf8'));        
        var video = sleuth.parseResponse(data);
        
        assert.equal(video.viewCount, "unavailable");
    });
});

describe('Bug #49 - failed to check response entries', function () {
    it('should be not buggy', function () {
        var expected = undefined;
        var actual   = sleuth.parseResponse('butts');
        
        assert.equal(expected, actual);
    });
});

describe('should read search API json and get stuff from it', function () {
    it('should be awesome', function () {  
        var data  = JSON.parse(fs.readFileSync('fixture/youtubeSearchResponse.json', 'utf8'));        
        var video = sleuth.parseResponse(data);
        
        assert.equal(video.title, "Clipse - When The Last Time");
        assert.equal(video.link, "https://youtu.be/d6VuYsNpYg8");
    });
});
