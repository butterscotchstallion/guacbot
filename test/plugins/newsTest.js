/**
 * news plugin tests
 *
 */
"use strict";

var fs     = require('fs');
var assert = require("assert");
var news   = require('../../plugins/news/');

describe('parse some xml', function () {
    it('should parse ap top headlines', function () {
        var xml = fs.readFileSync('fixture/ap-top-headlines.xml');
        
        news.getHeadlines(xml, 'ap', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            //console.dir(headlines);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(headlines[j].title.indexOf('[object Object]'), -1);
            }
        });
    });
    
    it('should parse ap weird headlines', function () {
        var xml = fs.readFileSync('fixture/ap-weird.xml');
        
        news.getHeadlines(xml, 'ap', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            //console.dir(headlines);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(headlines[j].title.indexOf('[object Object]'), -1);
            }
        });
    });
    
    it('should parse huffpost weird headlines', function () {
        var xml = fs.readFileSync('fixture/hp-weird.xml');
        
        news.getHeadlines(xml, 'hp', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            //console.dir(headlines);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(headlines[j].title.indexOf('[object Object]'), -1);
            }
        });
    });
    
    /*
    it('should parse drudge report headlines', function () {
        var xml = fs.readFileSync('fixture/drudge.xml');
        
        news.getHeadlines(xml, 'drudgereport', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            //console.dir(headlines);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);

                // Make sure it wasn't parsed as an object 
                assert.equal(headlines[j].title.indexOf('[object Object]'), -1);
            }
        });
    });
    */
    
    it('should parse npr headlines', function () {
        var xml = fs.readFileSync('fixture/npr.xml');
        
        news.getHeadlines(xml, 'npr', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            //console.dir(headlines);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);

                // Make sure it wasn't parsed as an object 
                assert.equal(headlines[j].title.indexOf('[object Object]'), -1);
            }
        });
    });
});