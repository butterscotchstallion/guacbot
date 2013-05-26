/**
 * scrambler tests
 *
 */
"use strict";

var assert    = require("assert");
var scrambler = require('../../plugins/scrambler');

describe('scrambler.descramble', function (done) {
    beforeEach(function () {
        var cfg = {
            config: {
                plugins: {
                    scrambler: {
                        wordsFile: "long-with-consonants.txt"
                    }
                }
            }
        };
        
        scrambler.pluginPath = '../plugins/scrambler/';
        scrambler.loadConfig(cfg);
    });
    
    it('should should descramble word', function () {
        var descrambled = scrambler.descramble();
        
        assert.notEqual(scrambler.words.indexOf(descrambled), -1);
    });
});

describe('scrambler.getUnscrambledWord', function (done) {
    beforeEach(function () {
        var cfg = {
            config: {
                plugins: {
                    scrambler: {
                        wordsFile: "long-with-consonants.txt"
                    }
                }
            }
        };
        
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
        /*
        var cfg = {
            config: {
                plugins: {
                    scrambler: {
                        wordsFile: "long-with-consonants.txt"
                    }
                }
            }
        };
        
        scrambler.pluginPath = '../plugins/scrambler/';
        scrambler.loadConfig(cfg);
        */
        scrambler.words = ['house', 'wire', 'cobra', 'pizza'];
    });
    
    it('should return an array of words', function (done) {
        var words = scrambler.getWords();
        assert.equal(typeof(words), 'object');
        assert.notEqual(words.length, 0);
    });
    
    it('should only contain letters', function (done) {
        var words = scrambler.getWords();
        var wlen = words.length;
        var word = '';
        
        for (var j = 0; j < wlen; j++) {
            word = words[j];
            
            console.log(word);
            
            assert.equal(/^[a-zA-Z]+$/.test(word), true);
        }            
    });
});

describe('scrambler.getScrambledWord', function () {
    it('should return a word not equal to the original word', function () {
        var input   = 'nodebot';
        var actual  = scrambler.getScrambledWord(input);
        
        assert.notEqual(input, actual);
    });
});

/*
describe('scrambler.getHint', function () {
    it('should return a hint', function () {
        var input    = 'the flamingos';
        var actual   = scrambler.getHint(input);
        var expected = 't__ _________';
        
        assert.equal(input, actual);
    });
});
*/