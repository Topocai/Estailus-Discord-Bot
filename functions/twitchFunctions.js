const fetch = require('node-fetch');

const Discord = require('discord.js');

const twitchFunctionsCaller = async ({...args}, twitchFunction) => {
  const TwitchAPI = require('node-twitch').default;

  const twitch = new TwitchAPI({
      client_id: process.env.TwitchCLIENTID,  
      client_secret: process.env.TwitchTOKEN 
  });

  const tokenCall = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TwitchCLIENTID}&client_secret=${process.env.TwitchTOKEN}&grant_type=client_credentials`, {method: 'POST'})
    .then((response) => response.json());
    twitch.access_token = tokenCall.access_token;

    return twitchFunction({twitchAPI: twitch, ...args});
}

/**
 * 
 * @param {string} twitchUserID ID de usuario de Twitch 
 * @returns {object} Objeto con la información del canal de Twitch
 */
const getBroadcasterInfo = async function({ twitchAPI, twitchUserID }) 
{
    const broadcasterData = await fetch(`https://api.twitch.tv/helix/channels?broadcaster_id=${twitchUserID}`, 
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${twitchAPI.access_token}`,
        'Client-Id': process.env.TwitchCLIENTID //ACTUALIZAR VALOR PARA REPLIT 
      }
    })
    .then((response) => response.json())
    .catch((err) => console.error(err))
    .then((channelData) =>  channelData.data[0])
    .catch((err) => console.error(err));

    return broadcasterData;
};

/**
 * 
 * @param {TwitchApi} twitchAPI API de Twitch
 * @param {String} twitchUserLogin User Login del canal de Twitch
 * @returns {Object} streamInfo
 */

const getStreamInfo = async function({ twitchAPI, twitchUserLogin })
{
    const streamInfo = await fetch(`https://api.twitch.tv/helix/streams?user_login=${twitchUserLogin}`, 
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${twitchAPI.access_token}`,
        'Client-Id': process.env.TwitchCLIENTID //ACTUALIZAR VALOR PARA REPLIT 
      }
    })
    .then((response) => response.json())
    .then((streamsInfo) =>  streamsInfo.data[0]);

    return streamInfo;
};

/**
 * 
 * @param {string} twitchUserID 
 * @returns {object} Objeto con la información del usuario de Twitch
 */

const getUserInfo = async function({ twitchAPI, twitchUserID })  
{
    const userInfo = await fetch(`https://api.twitch.tv/helix/users?id=${twitchUserID}`, 
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${twitchAPI.access_token}`,
        'Client-Id': process.env.TwitchCLIENTID//ACTUALIZAR VALOR PARA REPLIT 
      }
    })
    .then((response) => response.json())
    .then((usersInfo) =>  usersInfo.data[0]);

    return userInfo;
};

const notificationCheck = async function({ twitchAPI, twitchObject }) 
{
  const checkResponse = {
    isLive: false,
    isNotified: false,
    streamData: null,
    newTitle: {isNewTitle: false, newTitle: null}
  };

  const streamInfo = await getStreamInfo({ twitchAPI: twitchAPI, twitchUserLogin: twitchObject.twitchUser }).then( streamInfo => streamInfo )
  .catch(err => console.warn("ERROR TWITCH NOTIFY: \n" + err));

  const broadcastTitle = await getBroadcasterInfo({twitchAPI: twitchAPI, twitchUserID: twitchObject.twitchUserID}).then(broadcastTitle => broadcastTitle.title);

  if(streamInfo == undefined) //No esta en stream
  { 
    if(broadcastTitle != twitchObject.lastTitle && broadcastTitle != undefined) //Se modificó el titulo
    {
      checkResponse.newTitle.isNewTitle = true;
      checkResponse.newTitle.newTitle = broadcastTitle;
    }

    if(twitchObject.lastNotify == true) //Ya notificó
      checkResponse.isNotified = true;
    
    return checkResponse;

  }

  checkResponse.streamData = streamInfo;
  checkResponse.isLive = streamInfo.type == 'live' ? true: false;

  if(streamInfo.type != 'live') //No esta en stream
  {
    if(broadcastTitle != twitchObject.lastTitle && broadcastTitle != undefined) //Se modificó el titulo
    {
      checkResponse.newTitle.isNewTitle = true;
      checkResponse.newTitle.newTitle = broadcastTitle;
    }
    

    if(twitchObject.lastNotify == true) //Ya notificó
      checkResponse.isNotified = true;

    return checkResponse;
  }
  

  if (twitchObject.lastNotify == false || twitchObject.lastNotify == undefined) //Esta en stream y no se ha notificado
  {
    checkResponse.isNotified = false;
    return checkResponse;
  }
  else if (twitchObject.lastNotify == true) //Esta en stream y se ha notificado
  {
    checkResponse.isNotified = true;
    
    if(broadcastTitle != twitchObject.lastTitle) //Se ha modificado el titulo durante stream
    {
      checkResponse.newTitle.isNewTitle = true;
      checkResponse.newTitle.newTitle = broadcastTitle;
    }
    return checkResponse;
  }

  return checkResponse;
}

const notificationCreator = async function({ twitchAPI, twitchObject, streamData })
{
  const mention = twitchObject.twitchMentionID == "everyone" ? "@everyone" : `<@&${twitchObject.twitchMentionID}>`;

  const userData = await getUserInfo({ twitchAPI: twitchAPI, twitchUserID: twitchObject.twitchUserID }).then(userInfo => userInfo);

  let userAvatar = userData.profile_image_url;
  let userLogin = userData.login;
  let userDisplayUsername = userData.display_name;

  let streamThumbnail = streamData.thumbnail_url;
  streamThumbnail = streamThumbnail.replace('{width}', '1920');
  streamThumbnail = streamThumbnail.replace('{height}', '1080');

  const notifyEmbed = new Discord.EmbedBuilder()
  .setAuthor({ iconURL: userAvatar, name: `Twitch ${userDisplayUsername}` })
  .setColor("#7706C0")
  .addFields(
    {name: `\u200b`, value: `[**${streamData.title}**](https://www.twitch.tv/${userLogin})\n\nJugando **${streamData.game_name}**.`}
  )
  .setThumbnail(userAvatar)
  .setImage(streamThumbnail)
  .setTimestamp();

  return {
    notifyEmbed: notifyEmbed,
    notifyText: `¡${userDisplayUsername} Está en directo, pasense a verlo! ${mention}`
  }
};

function newTitleEmbedCreator({userData, twitchUserDB, isLive, newTitle}) 
{
  const newTitleString = newTitle != undefined ? newTitle : userData.title; 
  if(!userData) 
  {
    let text = isLive ? `ha actualizado el titulo del Stream.`: `ha actualizado el titulo del Stream en vivo.`;
    
    const embed = new Discord.EmbedBuilder()
    .setAuthor({iconURL: client.user.displayAvatarURL(), name: `${twitchUserDB._twitchUserName.charAt(0).toUpperCase() + twitchUserDB._twitchUserName.slice(1)} ${text}`})
    .setColor("#2F3136")
    .setDescription(`> [${newTitleString}](https://www.twitch.tv/${twitchUserDB._twitchUserName})`)
    .setTimestamp();

    return embed;
  } 
  else 
  {
    let text = isLive ? `ha actualizado el titulo del Stream.`: `ha actualizado el titulo del Stream en vivo.`;
    const embed = new Discord.EmbedBuilder()
    .setAuthor({iconURL: userData.profile_image_url, name: `${userData.display_name} ${text}`})
    .setColor("#2F3136")
    .setDescription(`> [${newTitleString}](https://www.twitch.tv/${userData.login})`)
    .setThumbnail(userData.profile_image_url)
    .setTimestamp();

    return embed;
  }
}

module.exports = { notificationCheck, notificationCreator, newTitleEmbedCreator, getUserInfo, getStreamInfo, twitchFunctionsCaller }
