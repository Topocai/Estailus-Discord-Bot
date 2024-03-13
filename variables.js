const STRING_VARIABLES = {
    TWITCH_IN_LIVE: 'live',
}

const YOUTUBE_STRINGS = {
    GET_VIDEOS_COUNT: 'videos_count',
    GET_LIST_OF_VIDEOS: 'list_of_videos',
    GET_CHANNEL_INFO_BY_USERNAME: 'channel_info_by_user_name',
    GET_CHANNEL_INFO_BY_ID: 'channel_info_by_id',
    GET_VIDEO_INFO: 'get_video_info',
    OPTION_ONLY_LAST_VIDEO_ID: 'last_video_id'
}

const NORMAL_COMMANDS_NAME = {
    YOUTUBE: 'youtube',
    TWITCH: 'twitch',
    NOTIFIER: 'notifier',
    HELP: 'help',
    BALL: 'ball',
    BROADCAST: 'broadcast',
    ELECTION: 'election',
    DECORATION_CHANNEL: 'decorationchannel',
}

const LOCAL_COMMANDS_NAME = {
    YOUTUBE: 'lyoutube',
    TWITCH: 'ltwitch',
    NOTIFIER: 'lnotifier',
    HELP: 'lhelp',
    BALL: 'lball',
    BROADCAST: 'lbroadcast',
    ELECTION: 'lelection',
    DECORATION_CHANNEL: 'ldecorationchannel',
}

const COMMAND_CATEGORY_DISPLAY_NAMES = {
    BASIC_COMMANDS: 'Comandos Básicos',
    NOTIFY_COMMANDS: 'Comandos de Notificación',
    OTHER_COMMANDS: 'Otros',
    ADMIN_COMMANDS: 'Comandos de Administración',
    UTILITY_COMMANDS: 'Comandos de Utilidad'
}

const COMMAND_CATEGORY_DESCRIPTIONS = {
    BASIC_COMMANDS: 'Lista de comandos básicos o de diversión',
    NOTIFY_COMMANDS: 'Comandos utilizados para la configuración de los notificadores',
    OTHER_COMMANDS: 'Comandos sin categoria',
    ADMIN_COMMANDS: 'Comandos para administrar el bot o el servidor',
    UTILITY_COMMANDS: 'Comandos de utilidad'
}

const GetKeyByValue = (object, value) => {
    return Object.keys(object).find(key => object[key] === value);
}

const COMMANDS_CATEGORY = {
    BASIC_COMMANDS: 'basic',
    NOTIFY_COMMANDS: 'notify',
    OTHER_COMMANDS: 'other',
    ADMIN_COMMANDS: 'admin',
    UTILITY_COMMANDS: 'utility'
}



module.exports = { 
    YOUTUBE_STRINGS,
    NORMAL_COMMANDS_NAME, 
    LOCAL_COMMANDS_NAME, 
    STRING_VARIABLES,
    COMMANDS_CATEGORY,
    COMMAND_CATEGORY_DESCRIPTIONS,
    COMMAND_CATEGORY_DISPLAY_NAMES,
    GetKeyByValue
};