const mongoose = require('mongoose');

const decorationChannels = mongoose.Schema({
    guildID: String,
    channels: Array
});

module.exports = mongoose.model("DecorationChannels", decorationChannels);