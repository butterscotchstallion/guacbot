/**
 * news plugin tests
 *
 */
"use strict";

var fs     = require('fs');
var assert = require("assert");
var news   = require('../../plugins/news/');

describe('parse some xml', function () {
    
    it('should parse yahoo headlines', function () {
        var xml = fs.readFileSync('fixture/yahoo.rss');
        
        news.getHeadlines(xml, 'yahoo', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(typeof headlines[j].title, 'string');
            }
        });
    });
    
    it('should parse tumblr headlines', function () {
        var xml = fs.readFileSync('fixture/tumblr.rss');
        
        news.getHeadlines(xml, 'tumblr', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(typeof headlines[j].title, 'string');
            }
        });
    });
    
    it('should parse guardian nsa headlines', function () {
        var xml = fs.readFileSync('fixture/guardian-nsa.rss');
        
        news.getHeadlines(xml, 'guardian', function (headlines) { 
            assert.notEqual(headlines.length, 0);
            
            for (var j = 0; j < headlines.length; j++) {
                assert.notEqual(headlines[j].title.length, 0);
                assert.notEqual(headlines[j].link.indexOf('http'), -1);
                
                // Make sure it wasn't parsed as an object 
                assert.equal(typeof headlines[j].title, 'string');
            }
        });
    });
    
    it('should parse fark headlines', function () {
        var xml = fs.readFileSync('fixture/fark.rss');
        
        news.getHeadlines(xml, 'fark', function (headlines) { 
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