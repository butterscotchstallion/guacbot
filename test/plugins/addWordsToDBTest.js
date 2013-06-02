

"use strict";

var assert = require("assert");
var p      = require('../../plugins/scrambler/addWordsToDB');

describe('p.readWordsFile', function () {
    beforeEach(function () {
        scrambler.init();
    });
    
    it('should read the file', function (done) {
        p.readWordsFile('../plugins/scrambler/long-with-consonants.txt', function (words) {
            console.log(words);
            
            assert.equal(typeof words, 'object');
            
            done();
        });
    });
});