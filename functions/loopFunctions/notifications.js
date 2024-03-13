const mongoose = require('mongoose');
const Discord = require('discord.js');

const fetch = require('node-fetch');

const emojis = require('../../emojis.json');

const NotifierModel = require('../../models/Notifier.js');
const customFetchs = require('../customFetchs.js');
const variablesNames = require('../../variables.js');

const twitchFunctions = require('../../functions/twitchFunctions.js');

//================================================TWITCH NOTIFY================================================================//

const TwitchAPI = require('node-twitch').default;

const twitch = new TwitchAPI({
    client_id: process.env.TwitchCLIENTID, //ACTUALIZAR VALOR PARA REPLIT 
    client_secret: process.env.TwitchTOKEN //ACTUALIZAR VALOR PARA REPLIT
});

async function twitchNotify(client) 
{
    const notifier = await NotifierModel.findOne({
      guildID: process.env.GUILD_ID //ACTUALIZAR VALOR PARA REPLIT
    }, (err, tconfig) => {
      if (err) return console.error(err);
      if (!tconfig) return console.log("Sin registro de servidor en la DB.");
    });

    if (!notifier || notifier.Twitch == []) return;

    const actualTwitchObjects = await notifier.Twitch;
    const twitchChannelsLength = await notifier.Twitch.length;

    //Se obtiene el APP TOKEN ACCESS y se asigna a la instancia de TwitchAPI
    const tokenCall = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TwitchCLIENTID}&client_secret=${process.env.TwitchTOKEN}&grant_type=client_credentials`, {method: 'POST'})
    .then((response) => response.json());
    twitch.access_token = tokenCall.access_token;

    async function changeNotificationState(state, index) 
    {
      actualTwitchObjects[index].lastNotify = state;
      await notifier.updateOne({
        Twitch: actualTwitchObjects
      });
    }

    async function updateLastLiveTitle(title, index) 
    {
      actualTwitchObjects[index].lastTitle = title;
      await notifier.updateOne({
        Twitch: actualTwitchObjects
      });
    }

    for (let i = 0; i < twitchChannelsLength; i++) 
    {
      const actualTwitchObject = await notifier.Twitch[i];
      const discordChannelID = await notifier.Twitch[i].channelID;

      const discordChannelToNotify = client.channels.cache.get(discordChannelID);

      const notifyChecks = await twitchFunctions.notificationCheck({twitchAPI: twitch, twitchObject: actualTwitchObject});

      //NOTIFICACIÓN CAMBIO DE TITULO
      if(notifyChecks.newTitle.isNewTitle) 
      {
        updateLastLiveTitle(notifyChecks.newTitle.newTitle, i);

        const userData = await twitchFunctions.getUserInfo({twitchAPI: twitch, twitchUserID: actualTwitchObject.twitchUserID})

        const embed = twitchFunctions.newTitleEmbedCreator({
          userData: userData,
          newTitle: notifyChecks.newTitle.newTitle,
          isLive: notifyChecks.isLive
        });

        discordChannelToNotify.send({embeds: [embed]});
      }

      //NOTIFICACIÓN EN VIVO
      if(notifyChecks.isLive && notifyChecks.isNotified == false) 
      {
        console.log("Notificación en vivo");
        console.log(notifyChecks);
        
        changeNotificationState(true, i);
        updateLastLiveTitle(notifyChecks.streamData.title, i);

        const notifyMessages = await twitchFunctions.notificationCreator({twitchAPI: twitch, twitchObject: actualTwitchObject, streamData: notifyChecks.streamData});

        discordChannelToNotify.send({ embeds: [notifyMessages.notifyEmbed], content: notifyMessages.notifyText });
      } else if(notifyChecks.isLive == false && notifyChecks.isNotified == true) 
      {
        console.log("No esta en stream, se alterna la notificación");
        console.log(notifyChecks);
        changeNotificationState(false, i); 
      }
    }
}

//========================================================YOUTUBE NOTIFY================================================================================================//

async function youtubeNotification(client) 
{
  const notifier = await NotifierModel.findOne({
    guildID: process.env.GUILD_ID
  }, async (err, yconfig) => {
    if (err) return console.error(err);
    if (!yconfig) return;
  });

  if(notifier == null) return {}

  
  const youtubeChannelsCount = await notifier.Youtube.length;
  for (let i = 0; i < youtubeChannelsCount; i++) {

    const youtubeChannelID = await notifier.Youtube[i].youtubeUserID;
    const youtubeUserName = await notifier.Youtube[i].youtubeUserName;
    const lastVideosCount = await notifier.Youtube[i].lastVideosCount;

    const actualLastVideosCount = await customFetchs.youtubeFetchs({ fetchType: variablesNames.YOUTUBE_STRINGS.GET_VIDEOS_COUNT, channelID: youtubeChannelID })
    .catch(err => console.log("ERROR YOUTUBE NOTIFY:\n" + err));

    if(actualLastVideosCount == null || actualLastVideosCount == undefined) return {} 

    console.log(`Canal: ${i} (${youtubeChannelID}):\n Cantidad actual de videos: ${actualLastVideosCount} | Ultimo contador: ${lastVideosCount}`);

    const lastVideosCountInt = Number.parseInt(lastVideosCount);
    const actualLastVideosCountInt = Number.parseInt(actualLastVideosCount);

    //Si la cantidad de videos guardados en la DB es mayor al canal se actualiza el valor
    if(actualLastVideosCountInt < lastVideosCountInt) 
    {
      let youtubeChannels = await notifier.Youtube;
      youtubeChannels[i].lastVideosCount = actualLastVideosCount;

      await notifier.updateOne({
        Youtube: youtubeChannels
      });
    } 
    else if (actualLastVideosCountInt == lastVideosCountInt) {}

    else 
    {
      console.log("Count Passed (" + youtubeChannelID + ")");

      const lastNotify = await notifier.Youtube[i].lastVideoID;
      const lastVideoID = await customFetchs.youtubeFetchs({ fetchType: variablesNames.YOUTUBE_STRINGS.GET_LIST_OF_VIDEOS, channelID: youtubeChannelID }, variablesNames.YOUTUBE_STRINGS.OPTION_ONLY_LAST_VIDEO_ID)
      .catch(err => console.log("ERROR YOUTUBE NOTIFY:\n" + err));
      
      if(lastVideoID == null || lastVideoID == undefined) return {} 

      if (lastVideoID != lastNotify) 
      {
        console.log("Nuevo video encontrado");
        const channelID = await notifier.Youtube[i].channelID;
        const mentionID = await notifier.Youtube[i].youtubeMentionID;
        const videoURL = `https://www.youtube.com/watch?v=${lastVideoID}`;

        const channelNotify = client.channels.cache.get(`${channelID}`);

        const videoInfo = await customFetchs.youtubeFetchs({ fetchType: variablesNames.YOUTUBE_STRINGS.GET_VIDEO_INFO, videoId: lastVideoID})
        .catch(err => console.error(err));

        const channelInfo = await customFetchs.youtubeFetchs({ fetchType: variablesNames.YOUTUBE_STRINGS.GET_CHANNEL_INFO_BY_USERNAME, userName: youtubeUserName})
        .catch(err => console.error(err));

        let videoTitle = videoInfo.snippet.title;
        let videoDescription = videoInfo.snippet.description.length > 199 ? `${videoInfo.snippet.description.slice(0, 199)}..` : videoInfo.snippet.description;
        let videoDuration = videoInfo.contentDetails.duration;
        let videoThumbnail = videoInfo.snippet.thumbnails.standard.url;

        let youtubeChannelName = channelInfo.snippet.title;
        let youtubeAvatar = channelInfo.snippet.thumbnails.high.url;
        let authorURL = "https://www.youtube.com/channel/" + channelInfo.id.channelId;
        let mention = mentionID == "everyone" ? "@everyone" : `<@&${mentionID}>`;
        
        const embed = new Discord.EmbedBuilder()
        .setAuthor({ iconURL: youtubeAvatar, name: `Youtube ${youtubeChannelName}` })
        .addFields
        (
        {name: '\u200b', value: `➤ [**${videoTitle}**](${videoURL})\n${emojis.YoutubeLogo}   [${youtubeChannelName}](${authorURL})  |  :clock2: ${videoDuration}`},
        {name: '\u200b', value: `:speech_balloon: **Descripción**:\n${videoDescription}`}
        )
        .setImage(videoThumbnail)
        .setThumbnail(youtubeAvatar)
        .setColor("#FF0000")
        .setFooter({ iconURL: "https://cdn.discordapp.com/emojis/976319551174225980.png", text: "Youtube" })
        .setTimestamp();
        channelNotify.send({ embeds: [embed], content: `¡Nuevo video de ${youtubeChannelName}!\n\n||${mention}||\n\n${videoURL}` });
        
        let youtubeChannels = await notifier.Youtube;
        youtubeChannels[i].lastVideosCount = actualLastVideosCount;
        youtubeChannels[i].lastVideoID = lastVideoID;

        await notifier.updateOne({
          Youtube: youtubeChannels
        });
      }
      else 
      {
        let youtubeChannels = await notifier.Youtube;
        youtubeChannels[i].lastVideosCount = actualLastVideosCount;
        await notifier.updateOne({
          Youtube: youtubeChannels,
        }); 
      }  
    };     
  }
}

module.exports = { twitch, twitchNotify, youtubeNotification };