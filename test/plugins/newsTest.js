/**
 * news plugin tests
 *
 */
"use strict";

var fs     = require('fs');
var assert = require("assert");
var news   = require('../../plugins/news/');

describe('parse some xml', function () {
    it('news.getHeadlines', function () {
        var xml = fs.readFileSync('fixture/ap.xml');
        
        news.getHeadlines(xml, function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
            }
        });
    });
});