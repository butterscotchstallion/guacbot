/**
 * news plugin tests
 *
 */
"use strict";

var fs     = require('fs');
var assert = require("assert");
var news   = require('../../plugins/news/');

describe('parse some xml', function () {
    
    it('should parse aljazeera headlines', function () {
        var xml = fs.readFileSync('fixture/fulldisclosure.xml');
        
        news.getHeadlines(xml, 'aljazeera', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(typeof headlines[j].title, 'string');
            }
        });
    });
    
    it('should parse fulldisclosure headlines', function () {
        var xml = fs.readFileSync('fixture/fulldisclosure.xml');
        
        news.getHeadlines(xml, 'fulldisclosure', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            //console.dir(headlines);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(typeof headlines[j].title, 'string');
            }
        });
    });
    
    it('should parse hacker news headlines', function () {
        var xml = fs.readFileSync('fixture/hackernews.xml');
        
        news.getHeadlines(xml, 'hackernews', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            //console.dir(headlines);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(typeof headlines[j].title, 'string');
            }
        });
    });
    
    it('should parse onion headlines', function () {
        var xml = fs.readFileSync('fixture/onion.xml');
        
        news.getHeadlines(xml, 'onion', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            //console.dir(headlines);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(typeof headlines[j].title, 'string');
            }
        });
    });
    
    it('should parse freedomsphoenix headlines', function () {
        var xml = fs.readFileSync('fixture/freedomsphoenix.xml');
        
        news.getHeadlines(xml, 'freedomsphoenix', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            //console.dir(headlines);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(typeof headlines[j].title, 'string');
            }
        });
    });
    
    it('should parse bbc headlines', function () {
        var xml = fs.readFileSync('fixture/bbc.xml');
        
        news.getHeadlines(xml, 'bbc', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(typeof headlines[j].title, 'string');
            }
        });
    });
    
    /*
    it('should parse ap top headlines', function () {
        var xml = fs.readFileSync('fixture/ap-top-headlines.xml');
        
        news.getHeadlines(xml, 'ap', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(typeof headlines[j].title, 'string');
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
                assert.equal(typeof headlines[j].title, 'string');
            }
        });
    });
    */
    
    it('should parse huffpost weird headlines', function () {
        var xml = fs.readFileSync('fixture/hp-weird.xml');
        
        news.getHeadlines(xml, 'hp', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            //console.dir(headlines);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(typeof headlines[j].title, 'string');
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
                assert.equal(typeof headlines[j].title, 'string');
            }
        });
    });
});