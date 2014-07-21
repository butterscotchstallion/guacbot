/**
 * weather
 *
 */
"use strict";

var ignore        = require('../ignore/');
var db            = require('../../lib/db');
var hmp           = require('../../lib/helpMessageParser');
var _             = require('underscore');
var weatherPlugin = {};
var when          = require('when');

weatherPlugin.reload = function (options) {
    weatherPlugin.loadConfig(options.config.plugins.weather);
};

weatherPlugin.loadConfig = function (config) {
    weatherPlugin.getConfig(function (wConfig, err) {
        weatherPlugin.config = _.extend(weatherPlugin.config, wConfig);
    });
};

weatherPlugin.init = function (options) {
    weatherPlugin.wholeConfig = options.config;
    weatherPlugin.config     = options.config.plugins.weather;
    weatherPlugin.loadConfig(options.config);
    
    var client               = options.client;
    weatherPlugin.client     = client;
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        var query                = info.words.slice(2, info.words.length).join(' ').trim();
        
        var templateData         = _.extend(info, {
            botNick: client.currentNick
        });
        
        var templateMessages     = [
            'noResults', 
            'usage',
            'weatherSpyUsage',
            'noStoredLocation'
        ];
        
        var messages = hmp.getMessages({
            messages: templateMessages,
            data    : templateData,
            plugin  : 'weather',
            config  : options.config
        });
        
        var storedCB = function (stored, err, isWeatherSpy, type) {
            if (!err && stored && stored.location) {
                weatherPlugin.sendResponse(_.extend({
                    query : stored.location,
                    err   : err,
                    stored: stored,
                    type  : type
                }, info));
            } else {
                var msg = messages.usage;
                
                if (isWeatherSpy) {
                    msg = messages.noStoredLocation;
                }
                
                client.say(info.channel, msg);
            }
        };
        
        switch (info.command) {
            case 'weatherspy':
            case 'weathercreep':
                if (query) {
                    /** 
                     * We want to let the callback know that this is weatherspy
                     * because if there are no results, we want to let them know
                     * instead of printing the usage message
                     *
                     */
                    weatherPlugin.getStoredLocationByNick(query, function (stored, err) {
                        storedCB(stored, err, true);
                    });
                } else {
                    client.say(info.channel, messages.weatherSpyUsage);
                }
            break;
            
            case 'forecast':
            case 'fc':
            case 'f':
                if (query) {
                    weatherPlugin.sendResponse(_.extend({
                        query : query,
                        stored: { rememberMe: true },
                        type  : 'forecast'
                    }, info));
                } else {
                    weatherPlugin.getStoredLocation(info.info.host,
                                                    function (stored, err) {
                                                        storedCB(stored, err, false, 'forecast');
                                                    });
                }
            break;
            
            case 'w':
            case 'weather':
            case 'dubs':
                if (query) {
                    weatherPlugin.sendResponse(_.extend({
                        query : query,
                        stored: { rememberMe: true }
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
    if (!info.err) {
        weatherPlugin.query({
            apiKey  : weatherPlugin.config.apiKey,
            query   : info.query,
            type    : info.type,
            callback: function (response, err) {
                var noResults = response ? response.indexOf('No cities match') !== -1 : false;
                
                // Location successfully queried, store it
                if (!err && !noResults && info.stored.rememberMe) {
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
                
                if (!response || err || noResults) {
                    response = hmp.getMessage({
                        plugin : 'weather',
                        message: 'noResults',
                        config : weatherPlugin.wholeConfig
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
    var query  = ' SELECT location,';
        query += ' 1 AS rememberMe';
        query += ' FROM weather';
        query += ' WHERE 1=1';
        query += ' AND host = ?';
    
    db.connection.query(query, [host], function (err, rows, fields) {
        callback(rows[0], err);
    });
};

weatherPlugin.getStoredLocationByNick = function (nick, callback) {
    var query  = ' SELECT location,';
        query += ' 0 AS rememberMe';
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

weatherPlugin.getConfig = function (callback) {
    var query  = [
        'SELECT api_key AS apiKey',
        'FROM weather_config'
    ].join("\n");
    
    db.connection.query(query, function (err, result) {
        callback(result[0], err);
    });
};

weatherPlugin.getForecastTemplate = function (data) {
    var msg = '';
    
    if (data) {
        var cfg = weatherPlugin.wholeConfig;
            msg = hmp.getMessage({
                config : cfg,
                plugin : 'weather',
                message: 'forecast',
                data   : data
            });        
    } 
    
    return msg;
};

weatherPlugin.parseForecastResponse = function (response) {
    try {
        var res    = JSON.parse(response);
        var result = '';
        
        if (res && res.response) {
            if (typeof res.response.error === 'string') {
                result     = res.response.error.description;
            } else {     
                var fcResp = res.forecast.txt_forecast.forecastday;
                result     = fcResp && fcResp.length > 0 ? fcResp[1] : '';
            }
        }
        
    } catch (e) {
        console.log(e.stack);
    }
    
    return result;
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
            config : weatherPlugin.wholeConfig            
        });
    }
    
    var resp         = res.current_observation;
    var location     = resp.display_location;
    var conditions   = hmp.getMessage({
        plugin   : 'weather',
        message  : 'conditions',
        config   : weatherPlugin.wholeConfig,
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
    var result           = '';
    
    switch (cfg.type) {
        case 'forecast':
            wunder.forecast(cfg.query, function (err, response) {
                if (err) {
                    result = err;
                } else {
                    var parsed = weatherPlugin.parseForecastResponse(response);
                    var msg    = weatherPlugin.getForecastTemplate(parsed);
                    
                    result     = msg;
                }
                
                cfg.callback(result, err);
            });
        break;
        
        default:
        case 'conditions':   
            wunder.conditions(cfg.query, function (err, response) {
                if (err) {
                    result = err;
                } else {
                    result = weatherPlugin.parseResponse(response);
                }
                
                cfg.callback(result, err);
            });
        break;
    }
};

module.exports = weatherPlugin;