/**
 * uses ddg api to define stuff
 *
 */
"use strict";

var ddg    = require('ddg');
var define = {};

define.init = function (client) {
    client.ame.on('actionableMessageAddressingBot', function (info) {
        var cmd   = info.words[1];
        var query = info.words.slice(2);
        
        if (cmd === 'define' && query && query.length > 0) {
            define.getDefinition(query, function (def) {
                client.say(info.channel, def);
            });
        }
    });
};

define.getDefinition = function (query, callback) {
    ddg.Definition(query, function(err, data){
        if (err) {
            console.log('Define error:', err);
        } else {            
            callback(data);
        }
    });
};

module.exports = define;