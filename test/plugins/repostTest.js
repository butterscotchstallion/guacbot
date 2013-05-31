/**
 * repost tests
 *
 */
"use strict";

var assert = require("assert");
var repost = require('../../plugins/repost');

describe('repost.getFirstURLInString', function () {
    it('should get the whole URL and not just the host', function () {
        var input    = 'omg sim ants http://www.youtube.com/watch?v=1ucLyqEboGM';
        var expected = 'http://www.youtube.com/watch?v=1ucLyqEboGM';
        var actual   = repost.getFirstURLInString(input);
        
        assert.equal(expected, actual);
    });
    
    it('should find the first URL in a string', function () {
        var input    = 'Bender? Have you seen my http://sombrero.com here is another url http://google.com?';
        var expected = 'http://sombrero.com';
        var actual   = repost.getFirstURLInString(input);
        
        assert.equal(expected, actual);
    });
    
    it('should not find any URLs in a string with no URLs', function () {
        var input    = "I'll save you nibbler!";
        var expected = false;
        var actual   = repost.getFirstURLInString(input);
        
        assert.equal(expected, actual);
    });
});