const { YOUTUBE_STRINGS } = require('../variables.js');

const fetch = require('node-fetch');

/**
 * @param {string} duracionISO 
 * @returns {string} duracion en MM:SS
*/

function traducirDuracion(duracionISO) 
{
    // Usamos una expresión regular para extraer minutos (M) y segundos (S) del formato ISO.
    const regex = /PT(\d+)M(\d+)S/;
    const coincidencias = duracionISO.match(regex);

    if (coincidencias) 
    {
      const minutos = parseInt(coincidencias[1], 10);
      const segundos = parseInt(coincidencias[2], 10);

      if (segundos < 10)
        segundos = `0${segundos}`;

      return `${minutos}:${segundos}`;
    } 
    else 
    {
      console.warn(`Formato de duración no válido: ${duracionISO}`);
      return '00:00';
    }
}

async function videosCountFetch(channelID) 
{
    return await fetch("https://www.googleapis.com/youtube/v3/channels?key=" + process.env.YOUTUBEAPIKEY + "&part=statistics" + "&id=" + channelID)
    .then(async (response)=>{
        const data = await response.json();
        if (data.error) return new Error(`Error in fetching of videosCountFetch: (${data.error.code}) ${data.error.message}`);
        const videosCount = data.items[0].statistics.videoCount;
        return videosCount;
    }).catch((error) => {
        new Error(`Error in videosCountFetch fetch: ${error}`);
    });
}

async function videoInfo(videoId) 
{
    return await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&key=${process.env.YOUTUBEAPIKEY}&id=${videoId}`)
    .then(async (response)=>{
        const data = await response.json();
        if (data.error) return new Error(`Error in fetching of videoInfo: (${data.error.code}) ${data.error.message}`);
        const videoInfo = data.items[0];
        videoInfo.contentDetails.duration = traducirDuracion(videoInfo.contentDetails.duration);
        return videoInfo;
    }).catch((error) => {
        new Error(`Error in videoInfo fetch: ${error}`);
    });
}

async function listOfVideos(channelID, dataWanted) 
{
    return await fetch(`https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBEAPIKEY}&channelId=${channelID}&order=date`)
    .then(async (response)=>{
        const data = await response.json();
        if (data.error) return new Error(`Error in fetching of listOfVideos: (${data.error.code}) ${data.error.message}`);
        const videos_list = data.items;
        if(dataWanted == YOUTUBE_STRINGS.OPTION_ONLY_LAST_VIDEO_ID) return videos_list[0].id.videoId;
        return videos_list;
    }).catch((error) => {
        new Error(`Error in listOfVideos fetch: ${error}`);
    });
}

/**
 * @param {string} userName 
 * @returns {Object} YoutubeChannelInfo
 */

async function channelInfoByUserName(userName) 
{
    return await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=2&q=${userName}&key=${process.env.YOUTUBEAPIKEY}`)
    .then(async (response) => {
        const data = await response.json();
        if (data.error) return new Error(`Error in fetching of channelInfoByUserName: (${data.error.code}) ${data.error.message}`);
        const channelInfo = data.items[0];
        return channelInfo;
    }).catch((error) => {
        new Error(`Error in channelInfoByID fetch: ${error}`);
    });
}

async function channelInfoByID(channelID) 
{
    
    return await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&channelId=${channelID}&key=${process.env.YOUTUBEAPIKEY}`)
    .then(async (response) => {
        return response.json();
    }).then(async (data) => {;
        if (data.error) return new Error(`Error in fetching of channelInfoByID: (${data.error.code}) ${data.error.message}`);
        resolve(data.items[0]);
    }).catch((error) => {
       return new Error(`Error in channelInfoByID fetch: ${error}`);
    });
}

function youtubeFetchs({ fetchType, channelID, userName, videoId }, ...options) 
{
    options = options != null ? options : "nothing";
    if(fetchType == YOUTUBE_STRINGS.GET_VIDEOS_COUNT) return videosCountFetch(channelID);
    if(fetchType == YOUTUBE_STRINGS.GET_LIST_OF_VIDEOS) return listOfVideos(channelID, options);
    if(fetchType == YOUTUBE_STRINGS.GET_CHANNEL_INFO_BY_USERNAME) return channelInfoByUserName(userName);
    if(fetchType == YOUTUBE_STRINGS.GET_CHANNEL_INFO_BY_ID) return channelInfoByID(channelID);
    if(fetchType == YOUTUBE_STRINGS.GET_VIDEO_INFO) return videoInfo(videoId);
}

module.exports = { youtubeFetchs };