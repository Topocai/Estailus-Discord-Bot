const index = require('../index.js');
const fs = require('node:fs');

const path = require('path');

async function getAllCommands(inLocalMode = false) 
{

    const commandFiles = fs.readdirSync(path.join(__dirname, '../commands/')).filter(file => file.endsWith(".js"));
    const basicCommandsFiles = fs.readdirSync(path.join(__dirname, '../commands/basicCommands/')).filter(file => file.endsWith(".js"));
    const notifyCommandsFiles = fs.readdirSync(path.join(__dirname, '../commands/notifyCommands/')).filter(file => file.endsWith(".js"));

    for (const file of commandFiles) 
    {
        const command = require(`../commands/${file}`);
        index.addCommandToClient(command);
    }

    for (const file of basicCommandsFiles) 
    {
        const command = require(`../commands/basicCommands/${file}`);
        index.addCommandToClient(command);
    }

    for (const file of notifyCommandsFiles) 
    {
        const command = require(`../commands/notifyCommands/${file}`);
        index.addCommandToClient(command);
    }
}

function getCommandName(command) 
{
    const { NORMAL_COMMANDS_NAME, LOCAL_COMMANDS_NAME, GetKeyByValue } = require("../variables.js");

    const config = require('../config.json');
    const commandName = config.LOCAL_MODE ? LOCAL_COMMANDS_NAME[GetKeyByValue(NORMAL_COMMANDS_NAME, command)] : NORMAL_COMMANDS_NAME[GetKeyByValue(NORMAL_COMMANDS_NAME, command)];
    return commandName
}

module.exports = {getAllCommands, getCommandName};