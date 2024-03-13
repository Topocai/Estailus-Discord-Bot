const { SlashCommandBuilder, ComponentType } = require('discord.js');
const Discord = require('discord.js');

const index = require('../../index.js');

const NotifierModel = require('../../models/Notifier.js');
const mongoose = require('mongoose');

const { LOCAL_COMMANDS_NAME, NORMAL_COMMANDS_NAME } = require('../../variables.js');

const config = require('../../config.json');
const commandName = config.LOCAL_MODE ? LOCAL_COMMANDS_NAME.NOTIFIER : NORMAL_COMMANDS_NAME.NOTIFIER;

module.exports = {
    data: new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Agrega los notificadores a la DB")
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageChannels, Discord.PermissionFlagsBits.ManageWebhooks),
    cooldown: 20,
    async execute(interaction, client) {
       const notifier = await NotifierModel.findOne
       ({
        guildID: interaction.guild.id
       }, async (err, perfil) => 
       {
            if(err) return console.error(err);
            if(!perfil) 
            {
                const newPerfil = new NotifierModel
                ({
                    _id: mongoose.Types.ObjectId(),
                    guildID: interaction.guild.id,
                    Youtube: [],
                    Twitch: []
                });
                newPerfil.save().then(() => interaction.reply("Done"))
                .catch((err) => {return console.error(err)});
            } else 
            {
                return interaction.reply("Already one");
            }
       });
    }
}