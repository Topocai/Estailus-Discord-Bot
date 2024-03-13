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

    if (coincidencias) {
      const minutos = parseInt(coincidencias[1], 10);
      const segundos = parseInt(coincidencias[2], 10);
      return `${minutos}:${segundos}`;
    } else {
      return 'Formato de duración no válido';
    }
}

async function defaultFetchBody(fetchURL) //TODO
{
    await fetch("https://www.googleapis.com/youtube/v3/channels?key=" + process.env.YOUTUBEAPIKEY + "&part=statistics" + "&id=" + channelID)
    .then(async (response)=>{
        return response.json();
    }).then(async data => {
        videosCount = data.items[0].statistics.videoCount;
    });
}

async function videosCountFetch(channelID) 
{
    let videosCount = 0;
    await fetch("https://www.googleapis.com/youtube/v3/channels?key=" + process.env.YOUTUBEAPIKEY + "&part=statistics" + "&id=" + channelID)
    .then(async (response)=>{
        return response.json();
    }).then(async data => {
        videosCount = data.items[0].statistics.videoCount;
    });
    return videosCount;
}

async function videoInfo(videoId) 
{
    let videoInfo;
    await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&key=${process.env.YOUTUBEAPIKEY}&id=${videoId}`)
    .then(async (response)=>{
        return response.json();
    }).then(async data => {
        videoInfo = data.items[0];
        videoInfo.contentDetails.duration = traducirDuracion(videoInfo.contentDetails.duration);
    });
    return videoInfo;
}

async function listOfVideos(channelID, dataWanted) 
{
    let videos_list;
    await fetch(`https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBEAPIKEY}&channelId=${channelID}&order=date`)
    .then(async (response)=>{
        return response.json();
    }).then(async (data) => {
        videos_list = data.items;
    });

    if(dataWanted == "nothing") return videos_list;
    if(dataWanted == YOUTUBE_STRINGS.OPTION_ONLY_LAST_VIDEO_ID) return videos_list[0].id.videoId;
}

/**
 * @param {string} userName 
 * @returns {Object} YoutubeChannelInfo
 */

async function channelInfoByUserName(userName) 
{
    let channelInfo;
    await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=${userName}&key=${process.env.YOUTUBEAPIKEY}`) //https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=Tri-Line&key=AIzaSyCsxWVYghOw0c5nWd559ZCBPwNhvAEZmUM
    .then(async (response) => {
        return response.json();
    }).then(async (data) => {
        channelInfo = data.items[0];
    });
    return channelInfo;
}

async function channelInfoByID(channelID) 
{
    let channelInfo;
    await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&channelId=${channelID}&key=${process.env.YOUTUBEAPIKEY}`) //https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=1&q=Tri-Line&key=AIzaSyCsxWVYghOw0c5nWd559ZCBPwNhvAEZmUM
    .then(async (response) => {
        return response.json();
    }).then(async (data) => {
        channelInfo = data.items[0];
    });
    return channelInfo;
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