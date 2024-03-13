const mongoose = require('mongoose');

const notifier = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    guildID: String,
    Youtube: Array,
    Twitch: Array
});

module.exports = mongoose.model("notifier", notifier);