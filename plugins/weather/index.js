/**
 * weather
 *
 */
"use strict";

var ignore        = require('../ignore/');
var db            = require('../db/');
var hmp           = require('../../lib/helpMessageParser');
var _             = require('underscore');
var weatherPlugin = {};

weatherPlugin.init = function (client) {
    weatherPlugin.client     = client;
    weatherPlugin.weatherCfg = client.config.plugins.weather;
    
    client.ame.on('actionableMessageAddressingBot', function (info) {
        var query                = info.words.slice(2, info.words.length).join(' ').trim();
        var templateData         = _.extend(info, {
            botNick: client.currentNick
        });
        var templateMessages = [
            'noResults', 
            'usage',
            'weatherSpyUsage'
        ];
        
        var messages = hmp.getMessages({
            messages: templateMessages,
            data    : templateData,
            plugin  : 'weather',
            config  : client.config
        });
        
        var storedCB = function (stored, err) {
            if (!err && stored && stored.location) {
                weatherPlugin.sendResponse(_.extend({
                    query : stored.location,
                    err   : err
                }, info));
            } else {
                client.say(info.channel, messages.usage);
            }
        };
        
        switch (info.command) {
            case 'weatherspy':
                if (query) {
                    weatherPlugin.getStoredLocationByNick(query, storedCB);
                } else {
                    client.say(info.channel, messages.weatherSpyUsage);
                }
            break;
            
            case 'weather':
                if (query) {
                    weatherPlugin.sendResponse(_.extend({
                        query: query
                    }, info));
                } else {
                    weatherPlugin.getStoredLocation(info.info.host,
                                                    storedCB);
                }
            break;
        }
    });
};

weatherPlugin.sendResponse = function (info) {
    // Location successfully queried, store it
    if (!info.err) {        
        console.log('querying: ', info.query);
        
        weatherPlugin.query({
            apiKey  : weatherPlugin.client.config.plugins.weather.apiKey,
            query   : info.query,
            callback: function (response, err) {
                var noResults = response.indexOf('No cities match') !== -1;
                
                if (!err && !noResults) {
                    weatherPlugin.storeLocation({
                        nick    : info.nick,
                        host    : info.info.host,
                        location: info.query,
                        callback: function (result, err) {
                            if (err) {
                                console.log('weather store location err: ', err);
                            }
                        }
                    });
                }
                
                if (noResults) {
                    response = hmp.getMessage({
                        plugin : 'weather',
                        message: 'noResults',
                        config : weatherPlugin.client.config
                    });
                }
                
                weatherPlugin.client.say(info.channel, response);
            },
            debug   : false
        });
        
    } else {
        weatherPlugin.client.say(info.channel, info.err);
    }
};

weatherPlugin.getStoredLocation = function (host, callback) {
    var query  = ' SELECT location';
        query += ' FROM weather';
        query += ' WHERE 1=1';
        query += ' AND host = ?';
    
    db.connection.query(query, [host], function (err, rows, fields) {
        callback(rows[0], err);
    });
};

weatherPlugin.getStoredLocationByNick = function (nick, callback) {
    var query  = ' SELECT location';
        query += ' FROM weather';
        query += ' WHERE 1=1';
        query += ' AND nick = ?';
        query += ' ORDER BY last_query DESC';
        query += ' LIMIT 1';
    
    db.connection.query(query, [nick], function (err, rows, fields) {
        callback(rows[0], err);
    });
};

weatherPlugin.storeLocation = function (info) {
    var query  = ' INSERT INTO weather SET ?, last_query = NOW()';
        query += ' ON DUPLICATE KEY UPDATE';
        query += ' location = ' + db.connection.escape(info.location) + ',';
        query += ' last_query = NOW(),';
        query += ' nick = ' + db.connection.escape(info.nick) + ',';
        query += ' host = ' + db.connection.escape(info.host);
    
    db.connection.query(query, info, function (err, result) {
        info.callback(result, err);
    });
};

weatherPlugin.parseResponse = function (response) {
    var res = JSON.parse(response);
    
    if (res.response.error) {
        return res.response.error.description;
    }
    
    // Unexpected response!
    if (typeof(res.current_observation) === 'undefined') {
        return hmp.getMessage({
            plugin : 'weather',
            message: 'noResults',
            config : weatherPlugin.client.config            
        });
    }
    
    var resp         = res.current_observation;
    var location     = resp.display_location;
    var conditions   = hmp.getMessage({
        plugin   : 'weather',
        message  : 'conditions',
        config   : weatherPlugin.client.config,
        data     : _.extend({
            city : location.city,
            state: location.state
        }, resp)
    });
    
    return conditions;
};

weatherPlugin.query = function (cfg) {
    var WunderNodeClient = require("wundernode", true);
    var URL              = require('url');
    var wunder           = new WunderNodeClient(cfg.apiKey, cfg.debug);
    var conditions       = '';
    
    wunder.conditions(cfg.query, function (err, response) {
        if (err) {
            conditions = err;
        } else {
            conditions = weatherPlugin.parseResponse(response);
        }
        
        cfg.callback(conditions, err);
    });
};

module.exports = weatherPlugin;