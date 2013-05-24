/**
 * plugin-manager
 *
 */
var fs = require('fs');
var p  = {
    configurationPath: './bot-config.json'
};

// This will not work because it just stacks more event listeners
p.loadPlugins = function (client, callback, reloadConfig) {
    var plugins       = p.getEnabledPlugins();
    var plen          = plugins.length;
    var pluginPath    = '';
    var config        = p.getConfigJSON(); 
    var curPlugin;
    var hasLoadConfig = false;
    
    if (plen > 0) {
        if (reloadConfig) {
            console.log('Reloading plugins (' + plen + ')');
        } else {
            console.log('Loading plugins (' + plen + ')');
        }
        
        console.log('===========================================');
        
        for (var j = 0; j < plen; j++) {
            pluginPath    = '../plugins/' + plugins[j];
            
            curPlugin     = require(pluginPath);
            
            // If reloadConfig is true and loadConfig is an available function
            // then reload
            hasLoadConfig = typeof(curPlugin.loadConfig) === 'function';
            
            if (reloadConfig) { 
                if (hasLoadConfig) {
                    console.log('Reloading plugin:', plugins[j]);
                    
                    curPlugin.loadConfig(config);
                }
            } else {
                console.log('Loading plugin:', plugins[j]);
                curPlugin.init(client);
            }
        }
        
        if (typeof(callback) === 'function') {
            callback();
        }
    }
};

p.getEnabledPlugins = function () {
    var config  = p.getConfigJSON();    
    var plugins = Object.keys(config.plugins);
    
    return plugins;
};

p.getConfigJSON = function () {
    return JSON.parse(fs.readFileSync(p.configurationPath, 'utf8'));
};

module.exports = p;