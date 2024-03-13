function YoutubeOject
(
    channelID,
    youtubeMentionID,
    youtubeUserID,
    youtubeUserName,
    lastVideoID,
    lastVideosCount
) 
{
    this.enabled = true;
    this.channelID = channelID;
    this.youtubeMentionID = youtubeMentionID;
    this.youtubeUserID = youtubeUserID;
    this.youtubeUserName = youtubeUserName;

    this.lastVideoID = lastVideoID;
    this.lastVideosCount = lastVideosCount;
}

function TwitchObject
(
    channelID,
    twitchMentionID,
    twitchUser,
    twitchUserID,
    lastNotify,
    lastTitle,
)
{
    this.enabled = true;
    this.channelID = channelID;
    this.twitchMentionID = twitchMentionID;
    this.twitchUser = twitchUser;
    this.twitchUserID = twitchUserID;

    this.lastTitle = lastTitle;
    this.lastNotify = lastNotify;
}

module.exports = { TwitchObject, YoutubeOject };