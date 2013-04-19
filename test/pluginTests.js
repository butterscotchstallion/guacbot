/**
 * Plugin tests
 *
 */
"use strict";

var assert = require("assert");
var titler = require('../plugins/titler');

describe('URL Matcher', function() {
    it('should match valid URLs', function () {
        var validURLs = [
            'http://google.com',
            'https://www.youtube.com/watch?v=mqFLXayD6e8',
            'http://www.youtube.com/watch?v=7B9z6VEzfDE'
        ];
        
        var validURLsLen = validURLs.length;
        
        for (var j = 0; j < validURLsLen; j++) {
            assert.equal(titler.matchURL(validURLs[j]), true);
        }
    });
    
    it('should not match invalid URLs', function () {
        var invalidURLs = [
            'http://google',
            'cheddarwurst',
            'httpl://lol.com'
        ];
        
        var invalidURLsLen = invalidURLs.length;
        
        for (var j = 0; j < invalidURLsLen; j++) {
            assert.equal(titler.matchURL(invalidURLs[j]), false);
        }
    });
    
    it('should find the title tag in html', function () {
        var html  = '<html><head><title>in the moooood</title></head></html>';
        var title = titler.getTitle(html);
        
        assert.equal(title, 'in the moooood');
        
        // now with capital title
        html  = '<html><head><TITLE>sway with me, sway with ease</TITLE></head></html>';
        title = titler.getTitle(html);
        
        assert.equal(title, 'sway with me, sway with ease');
    });
});


