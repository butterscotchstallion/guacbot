/**
 * invite - automatically join when invited
 *
 */
"use strict";

var invite = {};
var ignore = require('../ignore/');

invite.init = function (client) {
    client.addListener('invite', function (channel, from, message) {
        ignore.isIgnored(message.user + '@' + message.host, function (ignored) {
            if (!ignored) {
                client.join(channel);
            }
        });
    });
};

module.exports = invite;