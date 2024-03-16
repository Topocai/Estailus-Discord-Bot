const mongoose = require('mongoose');

const notifier = mongoose.Schema({
    guildID: String,
    Youtube: Array,
    Twitch: Array
});

const NotifierModel = mongoose.model("notifier", notifier);

module.exports = NotifierModel