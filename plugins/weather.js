/**
 * weather
 *
 */
"use strict";

var ignore        = require('./ignore');
var parser        = require('../lib/messageParser');
var weatherPlugin = { };

weatherPlugin.init = function (client) {
    client.addListener('message#', function (nick, to, text, message) {
        var isAddressingBot = parser.isMessageAddressingBot(text, client.config.nick);
        
        if (isAddressingBot && !ignore.isIgnored(message.user + '@' + message.host)) {
            var words = parser.splitMessageIntoWords(text);
            
            if (words[1] === 'weather') {
                console.log('retrieving weather for ' + nick);
                
                var query = messageWords.slice(2, messageWords.length).join(' ');
                
                if (query) {
                    weatherPlugin.query({
                        apiKey: client.config.plugins.weather.apiKey,
                        query: query,
                        callback: function (data) {
                            client.say(to, data);
                        },
                        debug: true
                    });
                }
            }            
        }
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