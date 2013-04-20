/**
 * weather
 *
 */
"use strict";

var weatherPlugin = { };

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
    conditions.push('Humidity:' + resp.relative_humidity);
    conditions.push('Dew Point: ' + resp.dewpoint_string);
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