/**
 * invite - automatically join when invited
 *
 */
"use strict";

var invite = {};
var ignore = require('../ignore/');

invite.init = function (client) {
    client.addListener('invite', function (channel, from, message) {
        if (!ignore.isIgnored(message.user + '@' + message.host)) {
            client.join(channel);
        }
    });
};

module.exports = invite;