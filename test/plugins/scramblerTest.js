/**
 * scrambler tests
 *
 */
"use strict";

var fs        = require('fs');
var assert    = require("assert");
var scrambler = require('../../plugins/scrambler');
var cfg       = JSON.parse(fs.readFileSync('../bot-config.json', 'utf8'));
var moment    = require('moment');

describe('scrambler.startGame', function (done) {
    beforeEach(function () {
        scrambler.pluginPath = '../plugins/scrambler/';
        scrambler.loadConfig(cfg);
    });
    
    it('should detect a win if given correct answers', function () {
        var answer    = scrambler.getWord();
        var scrambled = scrambler.getScrambledWord(answer);
        
        scrambler.setGameData({
            answer       : answer,
            scrambledWord: scrambled
        });
        
        assert.equal(scrambler.isCorrectAnswer(answer), true);
        assert.equal(scrambler.isCorrectAnswer(answer + ' '), true);
        assert.equal(scrambler.isCorrectAnswer('hellooooo nurse!'), false);
    });
});

describe('scrambler.getUnscrambledWord', function (done) {
    beforeEach(function () {
        scrambler.pluginPath = '../plugins/scrambler/';
        scrambler.loadConfig(cfg);
    });
    
    it('should get a word from the words array', function () {
        var word  = scrambler.getWord();
        var words = scrambler.words;
        
        assert.notEqual(words.indexOf(word), -1);
    });
});

describe('scrambler.getWords', function (done) {
    beforeEach(function () {
        scrambler.pluginPath = '../plugins/scrambler/';
        scrambler.loadConfig(cfg);
    });
    
    it('should return an array of words', function (done) {
        var words = scrambler.getWords();
        assert.equal(typeof words, 'object');
        assert.notEqual(words.length, 0);
        
        done();
    });
    
    it('should only contain letters', function (done) {
        var words = scrambler.getWords();
        var wlen = words.length;
        var word = '';
        
        for (var j = 0; j < wlen; j++) {
            word = words[j];
            
            assert.equal(/^[a-zA-Z]+$/.test(word), true);
        }  
        
        done();
    });
});

describe('scrambler.getScrambledWord', function () {
    it('should return a word not equal to the original word', function () {
        var input   = 'nodebot';
        var actual  = scrambler.getScrambledWord(input);
        
        assert.notEqual(input, actual);
    });
});
