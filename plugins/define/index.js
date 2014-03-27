/**
 * define - uses wolfram alpha api to define things
 *
 */
"use strict";

var wa     = require('wolfram');
var when   = require('when');
var db     = require('../../lib/db');
var define = {};

define.loadConfig = function () {
    define.getConfig()
          .then(function (cfg) {
            define.pluginCfg = cfg;
            define.waClient  = wa.createClient(cfg.appID);
          })
          .catch(function (e) {
            console.log(e.stack);
          });
};

define.init = function (options) {
    var client = options.client;
    
    define.loadConfig();
    
    var pluginCfg = define.pluginCfg;
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        var cmd   = info.words[1];
        var query = info.words.slice(2).join(' ');

        if (cmd === 'define' && query && query.length > 0) {
            define.getDefinition(query, function (err, result) {
                if (!err && result && result.length > 0) {
                    var msg = define.processWaResult(result);
                    
                    if (msg) {
                        client.say(info.channel, msg);
                    }
                    
                } else {
                    client.say(info.channel, 'No results');
                    console.log('define error:', err);
                }
            });
        }
    });
};

define.getDefinitionAndProcessResult = function (query, callback) {
    define.getDefinition(query, function (err, result) {
        if (!err && result && result.length > 0) {
            var msg = define.processWaResult(result);
            
            callback(msg);
        } else {
            callback(false);
            console.log('"' + query + '"');
            console.log('error with query: ', query, ' :: ', err, ' :: result: ', result);
        }
    });
};

define.getDefinition = function (query, callback) {
    define.getWaDefinition(query, callback);
};

define.processWaResult = function (result) {
    var def;
    
    if (result) {
        for (var j = 0; j < result.length; j++) {
            if (result[j].primary) {
                def = typeof result[j].subpods !== 'undefined' ? result[j].subpods[0].value : false;
                break;
            }
        }
        
        // Sometimes queries don't have a primary definition. In that case,
        // let's take the first one
        if (result && !def) {
            def = typeof result[0].subpods !== 'undefined' ? result[0].subpods[0].value : false;
        }
        
        if (def) {
            def = define.processWaDefinition(def);
        }
    }
    
    return def;
};

define.processWaDefinition = function (input) {
    var value = input;
    var defParts;
    var limit = 1;
    
    // Definition contains newlines
    if (input && input.indexOf("\n") !== -1) {
        defParts = input.split("\n");                    
        value    = defParts.slice(0, limit);
    }
    
    return value;
};

define.getWaDefinition = function (query, callback) {
    define.waClient.query('define ' + query, callback);
};

define.getConfig = function () {
    var def  = when.defer();
    var cols = ['api_key AS appID'].join(',');
    var q = [
        'SELECT ' + cols,
        'FROM wa_config'
    ].join("\n");
    
    var qry = db.connection.query(q, function (err, result) {
        if (err) {
            def.reject(err);
        } else {
            def.resolve(result[0]);
        }
    });
    
    return def.promise;
};

module.exports = define;