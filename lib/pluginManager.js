/**
 * plugin-manager
 *
 */
var ame = require('../lib/actionableMessageEmitter');
var fs = require('fs');
var p  = {
    loadedPlugins: [],
    configurationPath: './bot-config.json'
};

p.loadPlugins = function (client, callback, reloadConfig) {
    var plugins         = p.getEnabledPlugins();
    var plen            = plugins.length;
    var pluginPath      = '';
    var config          = p.getConfigJSON(); 
    var curPlugin;
    var hasLoadConfig   = false;
    var pluginName      = '';
    var loadedPlugins   = 0;
    var reloadedPlugins = 0;
    
    if (plen > 0) {
        // Load AME for main listener
        ame.init(client);
        
        // Make AME available to plugins
        client.ame = ame;
        
        p.loadedPlugins = [];
        
        for (var j = 0; j < plen; j++) {
            pluginPath = process.cwd() + '/plugins/' + plugins[j] + '/index.js';         
            
            pluginName = plugins[j];
            curPlugin  = require(pluginPath);
            
            // If reloadConfig is true and loadConfig is an available function
            // then reload
            hasLoadConfig = typeof(curPlugin.loadConfig) === 'function';
            
            p.loadedPlugins.push(pluginName);
            
            if (reloadConfig) { 
                if (hasLoadConfig) {
                    console.log('Reloading plugin:', pluginName);
                    reloadedPlugins++;
                    
                    curPlugin.loadConfig(config);
                }                
            } else {
                //var disabled = typeof ;
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
            console.log(loadedPlugins + ' plugins loaded');
        }
        
        if (typeof(callback) === 'function') {
            callback(reloadedPlugins);
        }
    }
};

p.getLoadedPlugins = function () {
    return p.loadedPlugins;
};

p.getEnabledPlugins = function () {
    var config  = p.getConfigJSON();    
    var plugins = Object.keys(config.plugins).sort();
    
    return plugins;
};

p.getConfigJSON = function () {
    return JSON.parse(fs.readFileSync(p.configurationPath, 'utf8'));
};

module.exports = p;