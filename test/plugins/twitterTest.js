/**
 * twitter plugin tests
 *
 */
"use strict";

var fs      = require('fs');
var assert  = require("assert");
var twitter = require('../../plugins/twitter/');

describe('Bug #40 - tweets wrong in conversation', function () {
    var input        = fs.readFileSync('fixture/tweet-convo.html', 'utf8');
    
    it('twitter.getTweetTemplate', function (done) {
        var expected = '\u0002@porkbelt\u0002 :: . @Amtrak_CA With all due respect, this is terrible advice for trains';
        var info     = twitter.getTweetInfoFromHTML(input);
        var actual   = twitter.getTweetTemplate(info);
        
        assert.equal(expected, actual);
        done();
    });
});

describe('blank tweet bug', function () {
    var input        = fs.readFileSync('fixture/twitterBlankInfo.html', 'utf8');
    
    it('twitter.getTweetTemplate', function (done) {
        var expected = '\u0002@Horse_ebooks\u0002 :: How do objects and images move? How can animals';
        var info     = twitter.getTweetInfoFromHTML(input);
        var actual   = twitter.getTweetTemplate(info);
        
        assert.equal(expected, actual);
        done();
    });
});

describe('tweet get', function () {
    var input        = fs.readFileSync('fixture/tweet.html', 'utf8');
    
    it('twitter.getTweetTemplate', function (done) {
        var expected = '\u0002@wolfpupy\u0002 :: ah the ultimate prank, being a beautiful man';
        var info     = twitter.getTweetInfoFromHTML(input);
        var actual   = twitter.getTweetTemplate(info);
        
        assert.equal(expected, actual);
        done();
    });
});