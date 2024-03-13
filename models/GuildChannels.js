const mongoose = require('mongoose');

const channels = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    guildID: String,

    channelDMID: String,
    categoryID: String,
    channelsCount: Number,
    replyChannels: Array,
    usersReply: Array,

    usersIgnored: Array,
});

module.exports = mongoose.model("GuildChannels", channels);