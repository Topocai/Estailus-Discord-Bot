const mongoose = require('mongoose');

const channels = mongoose.Schema({
    guildID: String,

    channelDMID: String,
    categoryID: String,
    channelsCount: Number,
    replyChannels: Array,
    usersReply: Array,

    usersIgnored: Array,
});

module.exports = mongoose.model("GuildChannels", channels);

