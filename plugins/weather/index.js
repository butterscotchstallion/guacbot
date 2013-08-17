/**
 * weather
 *
 */
"use strict";

var ignore        = require('../ignore/');
var db            = require('../db/');
var parser        = require('../../lib/messageParser');
var weatherPlugin = { };

weatherPlugin.init = function (client) {
    weatherPlugin.weatherCfg = client.config.plugins.weather;
    
    client.addListener('message#', function (nick, to, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        var host            = message.user + '@' + message.host;
        
        if (isAddressingBot) { 
            ignore.isIgnored(host, function (ignored) {
                if (!ignored) {
                    var words = parser.splitMessageIntoWords(text);
                    
                    if (words[1] === 'weather') {
                        console.log('retrieving weather for ' + nick);
                        
                        var query = words.slice(2, words.length).join(' ').trim();                        
                        var storeLocationEnabled = weatherPlugin.weatherCfg.rememberLocation || false;
                        
                        if (storeLocationEnabled) {
                            if (query) {
                                weatherPlugin.storeLocation({
                                    nick: nick,
                                    host: host,
                                    location: query,
                                    callback: function (result, err) {
                                        //console.log(result);
                                        
                                        if (err) {
                                            console.log('weather store location err', err);
                                        }
                                    }
                                });
                            }
                            
                            // get location from db
                            weatherPlugin.getStoredLocation(host, function (stored) {
                                if (typeof stored !== 'undefined' && stored.location) {
                                    weatherPlugin.query({
                                        apiKey: client.config.plugins.weather.apiKey,
                                        query: stored.location,
                                        callback: function (data) {
                                            client.say(to, data);
                                        },
                                        debug: false
                                    });                                    
                                } else {
                                    var messages = typeof weatherPlugin.weatherCfg.rememberLocationNotFoundMessages !== 'undefined' ? weatherPlugin.weatherCfg.rememberLocationNotFoundMessages : [];
                                    var msg      = '';
                                    
                                    if (messages.length > 0) {
                                        msg = messages[Math.floor(Math.random() * messages.length)];
                                    } else {
                                        msg = "I don't remember your zip code. Perhaps you could be kind of enough to remind me.";
                                    }
                                    
                                    client.say(to, msg);
                                }
                            });
                            
                        } else {
                            if (query) {
                                weatherPlugin.query({
                                    apiKey: client.config.plugins.weather.apiKey,
                                    query: query,
                                    callback: function (data) {
                                        client.say(to, data);
                                    },
                                    debug: false
                                });
                            } else {
                                client.say(to, 'No results for that query');
                            }
                        }
                    }
                }
            });
        }
    });
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
    
    // Unexpected response!!
    if (res.response.error) {
        return res.response.error.description;
    }
    
    if (typeof(res.current_observation) === 'undefined') {
        return 'No cities match your search query!';
    }
    
    var resp         = res.current_observation;
    var conditions   = [];
    var location     = resp.display_location;
    var cityAndState = location.city + ', ' + location.state;
    
    /*
     * Example:
     *  The current temperature in River Road, Highland Park, New Jersey 
     *  is 63.3°F (11:38 PM EDT on April 19, 2013). Conditions: Drizzle. 
     *  Humidity: 95%. Dew Point: 62.6°F. Pressure: 29.67 in 1005
     *  hPa (Falling).
     *
     */
    conditions.push(cityAndState);
    conditions.push('- ' + resp.temperature_string);
    conditions.push('Conditions: ' + resp.weather + '.');
    conditions.push('Humidity: ' + resp.relative_humidity);
    conditions.push('Dew Point: ' + resp.dewpoint_string);
    conditions.push('Feels like: ' + resp.feelslike_string); 
    conditions.push('Wind: ' + resp.wind_string);
    
    return conditions.join(' ');
};

weatherPlugin.query = function (cfg) {
    var WunderNodeClient = require("wundernode", true);
    var URL              = require('url');
    var wunder           = new WunderNodeClient(cfg.apiKey,cfg.debug);
    var conditions       = '';
    
    wunder.conditions(cfg.query, function (err, response) {
        if (err) {
            conditions = err;
        } else {
            conditions = weatherPlugin.parseResponse(response);
        }
        
        cfg.callback(conditions);
    });
};

module.exports = weatherPlugin;