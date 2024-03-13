const mongoose = require('mongoose');

const decorationChannels = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    guildID: String,
    channels: Array
});

module.exports = mongoose.model("DecorationChannels", decorationChannels);