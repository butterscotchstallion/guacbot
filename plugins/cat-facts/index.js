/**
 * cat facts - displays cat facts 
 *
 */
"use strict";

var when    = require('when');
var db      = require('../../lib/db');
var fs      = require('fs');
var _       = require('underscore');
var request = require('request');
var cf = {};

cf.loadConfig = function () {
    cf.facts = JSON.parse(fs.readFileSync(__dirname + "/facts.json", 'utf8')).facts;
};

cf.init = function (options) {
    var client = options.client;
    
    cf.loadConfig();

    options.ame.on('actionableMessage', function (info) {
        var messageContainsTrigger = cf.messageContainsTrigger(info.message);
        var chance                 = Math.random() * 10;
        var chanceToActivate       = chance <= 3;
        
        console.log("chance to activate: " + chance);
        
        if (chanceToActivate && messageContainsTrigger) {
            if (Math.random < 0.5) {
                cf.emitFact(_.extend(info, {
                    client: options.client
                }));
            } else {
                cf.emitLink(_.extend(info, {
                    client: options.client
                }));
            }
        }
    });
};

cf.emitLink = function (options) {
    var httpOptions = {
        uri    : "http://edgecats.net/random",
        headers: {
            'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:25.0) Gecko/20100101 Firefox/25.0"
        }
    };
    
    request(httpOptions, function (error, response, body) {
        var isOK = response.statusCode >= 200 && response.statusCode <= 400;
        
        if (isOK) {
            console.log(body);
            
            // Expected response is a text link
            if (body.indexOf('http') !== -1) {
                options.client.say(options.channel, body);
            }
            
        } else {
            console.log("cat facts: error getting kitties: code " + response.statusCode);
        }
    });
};

cf.emitFact = function (options) {
    var fact = cf.getFact();
    
    options.client.say(options.channel, fact);
};

cf.getFact = function () {
    return cf.facts[~~(Math.random() * cf.facts.length)];
};

cf.messageContainsTrigger = function (message) {
    var found    = false;
    var triggers = [
        "meow",
        ":3",
        "awww"
    ];
    
    for (var j = 0; j < triggers.length; j++) {
        if (message === triggers[j]) {
            found = true;
            break;
        }
    }
    
    return found;
};

module.exports = cf;





