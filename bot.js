

var fs     = require('fs');
var config = JSON.parse(fs.readFileSync('./bot-config.json', 'utf8'));

var irc    = require('irc');

var client = new irc.Client(config.server, config.nick, {
    channels: config.channels
});

client.addListener('error', function(message) {
    console.log('error: ', message);
});

client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    
    var titler = require('./plugins/titler');
    
    if (titler.matchURL(message)) {
        var title = titler.getPageHTML(message);
        
        console.log('title: ', title);
        
        if (title) {
            client.say(to, title);
        }
    }
});