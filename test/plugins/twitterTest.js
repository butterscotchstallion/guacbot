/**
 * twitter plugin tests
 *
 */
"use strict";

var fs      = require('fs');
var assert  = require("assert");
var twitter = require('../../plugins/twitter/');

describe('Bug #65 - newline tweets', function () {
    var input        = fs.readFileSync('fixture/newline-tweet.html', 'utf8');
    
    it('twitter.getTweetTemplate', function (done) {
        var expected = '\u0002@JODYHiGHROLLER\u0002 :: i DONT KNOW WHAT THE FUCK THEY ARE TEACHiNG KiDS AT SCHOOL THESE DAYS BUT HERE iS WHATS iMPORTANT : FUN MONEY SEX LOBSTER PUPPiES';
        var info     = twitter.getTweetInfoFromHTML(input);
        var actual   = twitter.getTweetTemplate(info);
        
        assert.equal(expected, actual);
        done();
    });
});

describe('Bug #53 - photo tweets fail', function () {
    var input        = fs.readFileSync('fixture/photoTweet.html', 'utf8');
    
    it('twitter.getTweetTemplate', function (done) {
        var expected = '\u0002@photojeskos\u0002 :: . Aerial of destruction in #WashingtonIL pic.twitter.com/hl0Rp2Y23P';
        var info     = twitter.getTweetInfoFromHTML(input);
        var actual   = twitter.getTweetTemplate(info);
        
        assert.equal(expected, actual);
        done();
    });
});

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