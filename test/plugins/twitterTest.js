/**
 * twitter plugin tests
 *
 */
"use strict";

var fs      = require('fs');
var assert  = require("assert");
var twitter = require('../../plugins/twitter/');

describe('tweet get', function () {
    var input    = fs.readFileSync('fixture/tweet.html', 'utf8');
    
    it('twitter.getTweetTemplate', function (done) {
        var expected = '@wolfpupy :: ah the ultimate prank, being a beautiful man';
        var info     = twitter.getTweetInfoFromHTML(input);
        var actual   = twitter.getTweetTemplate(info);
        
        assert.equal(expected, actual);
        done();
    });
    
    it('twitter.getTweetInfoFromHTML', function (done) {        
        var expected = '@wolfpupy :: ah the ultimate prank, being a beautiful man';
        var actual   = twitter.getTweetInfoFromHTML(input);
        
        assert.equal('wolfpupy', actual.author);
        assert.equal('wolfpupy', actual.author);
        assert.equal('ah the ultimate prank, being a beautiful man', actual.tweet);
        done();
    });
});