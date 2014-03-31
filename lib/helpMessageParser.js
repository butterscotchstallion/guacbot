/**
 * Help Message Parser - most plugins have messages for help or usage. 
 * 
 * - Messages are Handlebars templates
 *
 * - Each plugin's messages are in the plugin config in a
 *   property called "messages"
 *
 * - This property should be an array. By making it an array, we can choose randomly if we want
 *   more than one possible message to be chosen.
 *
 * - Some variables are available:
 *   - {{{botNick}}} : bot's current nick
 *   - {{{nick}}}}   : the nick addressing the bot
 *   - {{{channel}}} : current channel
 *
 *
 */
"use strict";
var hbs = require('./hbsHelpers');
var _   = require('underscore');
var hmp = {};

hmp.getMessages = function (options) {
    var msg, curPlugin;
    var messages = {};
    
    for (var j = 0; j < options.messages.length; j++) {
        curPlugin = options.messages[j];
        msg       = hmp.getMessage({
            plugin : options.plugin,
            message: curPlugin,
            data   : options.data,
            config : options.config
        });
        
        messages[curPlugin] = msg;
    }
    
    return messages;
};

/**
 * options = {
 *     plugin: 'weather',
 *     message: 'usage'
 *
 * }
 *
 */
hmp.getMessage = function (options) {
    var output      = '';
    var messages    = options.config.plugins[options.plugin].messages[options.message];
    
    if (messages) {
        try {
            var msg         = messages[Math.floor(Math.random() * messages.length)];
            var tpl         = hbs.compile(msg);
            var parsed      = tpl(options.data || {});
                // Replace bold string with unicode character
                parsed        = parsed.replace(
                      /\\u([0-9a-f]{4})/g, 
                      function (whole, group1) {
                          return String.fromCharCode(parseInt(group1, 16));
                      }
                );
                
            output          = parsed;
        } catch (e) {
            output = '';
            console.log('error parsing template: ' + options.plugin + '.' + options.message);
            console.log(e.stack);
        }
    } else {
        console.log('msg not found: ', options);
    }
    
    return output;
};

module.exports = hmp;