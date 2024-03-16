const twitchFunctions = require('../twitchFunctions.js');
const { twitchFunctionsCaller } = require('../twitchFunctions.js');

const mongoose = require('mongoose');
const NotifierModel = require('../../models/Notifier.js');

const TWITCH_VARS = {
    '<live_status>': {
        name: 'Estado de transmisión',
        description: 'Estado de la transmisión del canal de Twitch, se debe agregar :<TWITCH_USER> para obtener el estado de transmisión de un canal específico, ejemplo: <live_status>:ibai',
        hasArgs: true
    },
    '<live_title>': {
        name: 'Título de la transmisión',
        description: 'Título de la transmisión del canal de Twitch, se debe agregar :<TWITCH_USER> para obtener el título de la transmisión de un canal específico, ejemplo: <live_title>:ibai\nEl usuario debe estar registrado en los notificadores, si el usuario esta offstream se devolvera el ultimo titulo registrado.',
        hasArgs: true,
    },
    '<live_game>': {
        name: 'Juego de la transmisión',
        description: 'Juego de la transmisión del canal de Twitch, se debe agregar :<TWITCH_USER> para obtener el juego de la transmisión de un canal específico, ejemplo: <live_game>:ibai\nSí el usuario esta offstream  se dira que esta "Chilling".',
        hasArgs: true
    },
}

function getArg(varKey) 
{
    const varKeySplit = varKey.split(':');
    return varKeySplit[1];
}

TWITCH_VARS["<live_game>"].get_function = async (twitch_user, {}) => 
{
    return await twitchFunctionsCaller(
        { twitchUserLogin: twitch_user },
         twitchFunctions.getStreamInfo)
    .then(streamInfo => {
        if(streamInfo == undefined || !streamInfo.game_name) return "Chilling";
        return streamInfo.game_name;
    })
    .catch(err => console.error(err));
}

TWITCH_VARS["<live_title>"].get_function = async (twitch_user, {guild_id}) => 
{
    const Notifier = await NotifierModel.findOne({
        guildID: guild_id
    }).exec();

    if(Notifier == null) return new Error("Sin registros de notificadores");

    const twitchChannelDB = Notifier.Twitch.find(twitch => twitch.twitchUser == twitch_user);

    if(twitchChannelDB == null) return new Error("Usuario no registrado en notificadores");

    if(twitchChannelDB.lastTitle != null) return twitchChannelDB.lastTitle;
    else return '[Sin titulo]';
}

TWITCH_VARS["<live_status>"].get_function = async (twitch_user, {}) => {
    return await twitchFunctionsCaller(
        { twitchUserLogin: twitch_user },
        twitchFunctions.getStreamInfo)
    .then(streamInfo => {
        if(streamInfo instanceof Error) return streamInfo;
        if(streamInfo == null || streamInfo.type != 'live') return 'OFF';
        else return 'ON';
    })
    .catch(err => console.error(err));;
}

const categories = {
    'Twitch': TWITCH_VARS
}

const ALL_VARS = {...TWITCH_VARS };

module.exports = { ALL_VARS, TWITCH_VARS, getArg, categories }