/**
 * plugin-manager
 *
 */
var ame   = require('../lib/actionableMessageEmitter');
var argus = require('../lib/argus');
var fs    = require('fs');
var p     = {
    loadedPlugins    : [],
    configurationPath: './bot-config.json'
};

p.loadPlugins = function (client, callback, reloadConfig) {
    var curPlugin;
    var plugins         = p.getEnabledPlugins();
    var plen            = plugins.length;
    var pluginPath      = '';
    var config          = reloadConfig ? p.getConfigJSON() : client.config; 
    var hasLoadConfig   = false;
    var pluginName      = '';
    var loadedPlugins   = 0;
    var reloadedPlugins = 0;
    
    p.config            = config;
    
    if (plen > 0) {
        // Load AME for main listener
        ame.init(client);
        
        // Make AME available to plugins
        client.ame           = ame;     
        client.argus         = argus;
        
        argus.init(client);

        // Make PluginManager available to plugin
        client.pluginManager = p;
        p.loadedPlugins      = [];
        
        for (var j = 0; j < plen; j++) {
            pluginPath       = process.cwd() + '/plugins/' + plugins[j] + '/index.js';            
            pluginName       = plugins[j];
            curPlugin        = require(pluginPath);
            
            // If reloadConfig is true and loadConfig is an 
            // available function then reload
            hasLoadConfig    = typeof(curPlugin.loadConfig) === 'function';
            
            p.loadedPlugins.push(pluginName);
            
            if (reloadConfig) {
                if (hasLoadConfig) {
                    console.log('Reloading plugin:', pluginName);
                    reloadedPlugins++;
                    
                    curPlugin.loadConfig(config);
                }
            } else {
                var curPluginCfg = config.plugins[plugins[j]];
                var disabled     = typeof curPluginCfg.disabled !== 'undefined' ? curPluginCfg.disabled : false;
                
                if (!disabled) {
                    console.log('Loading plugin:', pluginName);
                    curPlugin.init(client);
                    loadedPlugins++;
                } else {
                    console.log('Disabled: ', pluginName);
                }
            }
        }
        
        if (reloadConfig) {
            console.log(reloadedPlugins + ' plugins reloaded');
        } else {
            console.log(loadedPlugins   + ' plugins loaded');
        }
        
        if (typeof(callback) === 'function') {
            callback(reloadedPlugins);
        }
    }
};

p.getLoadedPlugins  = function () {
    return p.loadedPlugins;
};

p.getEnabledPlugins = function () {
    var config      = p.config || p.getConfigJSON();    
    var plugins     = Object.keys(config.plugins).sort();
    
    return plugins;
};

p.isPluginEnabled = function (plugin) {
    return p.getEnabledPlugins.indexOf(plugin) !== -1;
};

p.getConfigJSON     = function () {
    return JSON.parse(fs.readFileSync(p.configurationPath, 'utf8'));
};

p.getPluginConfig   = function (plugin) {
    return p.config.plugins[plugin];
};

p.getPluginConfigChannels = function (plugin) {
    var pcfg = p.getPluginConfig(plugin);
    
    return pcfg && typeof pcfg.channels !== 'undefined' ? pcfg.channels : false;
};

p.isValidChannel = function (channel, plugin) {
    var channels = p.getPluginConfigChannels(plugin);
    
    if (channels) {
        var blacklist = typeof channels.blacklist === 'object' ? channels.blacklist : false;
        var whitelist = typeof channels.whitelist === 'object' ? channels.whitelist : false;
    
        if (whitelist && whitelist.indexOf(channel) !== -1) {
            return true;
        }
        
        if (blacklist && blacklist.indexOf(channel) !== -1) {
            return false;
        }
    }
    
    return true;
};

module.exports = p;