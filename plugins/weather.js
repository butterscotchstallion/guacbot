/**
 * weather
 *
 */
"use strict";

var weatherPlugin = { };

weatherPlugin.init = function (client) {
    client.addListener('message#', function (from, to, message) {
        // If first word in message has the bot's nick in it...
        if (message.length >= client.config.nick.length) {
            var messageWords = message.split(' ');
            
            // You talkin' to me?
            if (messageWords[0] && messageWords[0].indexOf(client.config.nick) === 0) {
                console.log(from + ' is addressing bot');
                
                if (messageWords[1] === 'weather') {
                    console.log('weather command detected');
                    
                    var query = messageWords.slice(2, messageWords.length).join(' ');
                    
                    if (query) {
                        weatherPlugin.query({
                            apiKey: client.config.plugins.weather.apiKey,
                            query: query,
                            callback: function (data) {
                                client.say(to, data);
                            },
                            debug: false
                        });
                    }
                }
            }
        }
    });
};

weatherPlugin.parseResponse = function (response) {
    var resp         = JSON.parse(response).current_observation;
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
    conditions.push('The current temperature in ' + cityAndState);
    conditions.push('is ' + resp.temperature_string);
    conditions.push('Conditions: ' + resp.weather + '.');
    conditions.push('Humidity: ' + resp.relative_humidity);
    //conditions.push('Dew Point: ' + resp.dewpoint_string);
    conditions.push('Feels like: ' + resp.feelslike_string); 
    
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