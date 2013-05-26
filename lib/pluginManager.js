/**
 * plugin-manager
 *
 */
var fs = require('fs');
var p  = {
    loadedPlugins: [],
    configurationPath: './bot-config.json'
};

// This will not work because it just stacks more event listeners
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
                console.log('Loading plugin:', pluginName);
                curPlugin.init(client);
                loadedPlugins++;
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