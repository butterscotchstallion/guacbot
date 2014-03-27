/**
 * responds to messages with "y/n" in them
 *
 */
"use strict";

var yn = {
    trigger: 'y/n'
};

yn.init = function (options) {
    var client = options.client;
    
    yn.pluginConfig = options.config.plugins['yes-or-no'];
    
    options.ame.on('actionableMessageAddressingBot', function (info) {
        var isYesOrNoQuestion = yn.isYesOrNoQuestion(info.message);
        
        if (isYesOrNoQuestion) {
            var answer = yn.getAnswer();
            
            if (answer) {
                client.say(info.channel, answer);
            }
        }
    });
};

yn.getAnswer = function () {
    var a = typeof yn.pluginConfig.answers !== 'undefined' ? yn.pluginConfig.answers : [];

    if (a.length > 0) {
        return a[Math.floor(Math.random() * a.length)];
    }
};

yn.isYesOrNoQuestion = function (input) {
    return input.indexOf(yn.trigger) !== -1;
};

module.exports = yn;