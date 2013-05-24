/**
 * Titler plugin tests
 *
 */
"use strict";

var fs     = require('fs');
var assert = require("assert");
var titler = require('../../plugins/titler');

describe('reload', function () {
    it('should reload the config', function () {
        titler.init({
            "config": {
                "plugins": {
                    "titler": {
                        "ignoreDomains": [
                        
                        ]
                    }
                }
            },
            
            "addListener": function () {
            
            }
        });
        
        assert.equal(titler.isIgnoredDomain('asdf.com'), false);
        
        titler.init({
            "config": {
                "plugins": {
                    "titler": {
                        "ignoreDomains": [
                            "asdf.com"
                        ]
                    }
                }
            },
            
            "addListener": function () {
            
            }
        });
        
        assert.equal(titler.isIgnoredDomain('asdf.com'), true);
    });
});

describe('ignore domains', function () {

    it('should not return false domain is not ignored', function () {
        var input    = 'http://momentjs.com/docs';
        var expected = false;    
    
        titler.init({
            "config": {
                "plugins": {
                    "titler": {
                        "ignoreDomains": [
                        
                        ]
                    }
                }
            },
            
            "addListener": function () {
            
            }
        });
        
        var actual = titler.getPageHTML(input, function (body) {
            return body;
        });
        
        assert.notEqual(expected, actual);
    }); 
    
    it('should return false if domain is ignored', function () {
        var input    = 'http://i.imgur.com/dSTFnd3.gif';
        var expected = false;
        
        titler.init({
            "config": {
                "plugins": {
                    "titler": {
                        "ignoreDomains": [
                            "i.imgur.com"
                        ]
                    }
                }
            },
            
            "addListener": function () {
            
            }
        });
        
        var actual   = titler.getPageHTML(input);
        
        assert.equal(expected, actual);
    }); 
});

describe('Youtube Info', function () {
    it('should get the video ID given a URL', function () {
        var url     = 'http://www.youtube.com/watch?v=7B9z6VEzfDE';
        
        var videoID = titler.getYoutubeVideoID(url);
        
        assert.equal(videoID, '7B9z6VEzfDE');
    });
    
    it('should parse JSON and get correct info', function () {        
        var info = JSON.parse(fs.readFileSync('../fixture/youtubeVideoResponse.json', 'utf8'));
        var url  = 'http://www.youtube.com/watch?v=7B9z6VEzfDE';
        
        var info = titler.getYoutubeVideoInfo(url, function (data) {
            assert.equal(data.id, '7B9z6VEzfDE');
        });
    });
});

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
        
        titler.parseHTMLAndGetTitle(html, function (title) {
            assert.equal(title, 'in the moooood');
        });
        
        // now with capital title
        html      = '<html><head><TITLE>sway with me, sway with ease</TITLE></head></html>';
        
        titler.parseHTMLAndGetTitle(html, function (title) {
            assert.equal(title, 'sway with me, sway with ease');
        });
    });
});


