const twitchFunctions = require('../twitchFunctions.js');
const { twitchFunctionsCaller } = require('../twitchFunctions.js');



const TWITCH_VARS = {
    '<live_status>': {
        name: 'Estado de transmisión',
        description: 'Estado de la transmisión del canal de Twitch, se debe agregar :<TWITCH_USER> para obtener el estado de transmisión de un canal específico, ejemplo: <live_status>:ibai\nEl usuario debe estar registrado en los notificadores',
        hasArgs: true
    },
    '<live_title>': {
        name: 'Título de la transmisión',
        description: 'Título de la transmisión del canal de Twitch, se debe agregar :<TWITCH_USER> para obtener el título de la transmisión de un canal específico, ejemplo: <live_title>:ibai\nEl usuario debe estar registrado en los notificadores, si el usuario esta offstream se devolvera el ultimo titulo registrado.',
        hasArgs: true
    },
    '<live_game>': {
        name: 'Juego de la transmisión',
        description: 'Juego de la transmisión del canal de Twitch, se debe agregar :<TWITCH_USER> para obtener el juego de la transmisión de un canal específico, ejemplo: <live_game>:ibai\nEl usuario debe estar registrado en los notificadores, si el usuario esta offstream  se dira que esta "Chilling".',
        hasArgs: true
    },
}

function getArg(varKey) {
    const varKeySplit = varKey.split(':');
    return varKeySplit[1];
}

TWITCH_VARS["<live_game>"].get_function = async (twitch_user) => {
    return await twitchFunctionsCaller({ twitchUserLogin: twitch_user }, twitchFunctions.getStreamInfo).then(streamInfo => {
        if(streamInfo == undefined || !streamInfo.game_name) return "Chilling";
        return streamInfo.game_name;
    });
}

TWITCH_VARS["<live_title>"].get_function = async (twitch_user) => {
    return await twitchFunctionsCaller({ twitchUserLogin: twitch_user }, twitchFunctions.getStreamInfo).then(streamInfo => {
        if(streamInfo == undefined || !streamInfo.title) return null;
        return streamInfo.title;
    });
}

TWITCH_VARS["<live_status>"].get_function = async (twitch_user) => {
    return await twitchFunctionsCaller({ twitchUserLogin: twitch_user }, twitchFunctions.getStreamInfo).then(streamInfo => {
        if(streamInfo == undefined) return 'OFF';
        if(streamInfo.type == 'live') return 'ON';
        else return 'OFF';
    });
}

const test_vars = {
    '<test>': {
        name: 'Test',
        description: 'Test',
        hasArgs: true
    }
}

const categories = {
    'Twitch': TWITCH_VARS
}

const ALL_VARS = {...TWITCH_VARS, ...test_vars};

module.exports = { ALL_VARS, TWITCH_VARS, getArg, categories }