const { SlashCommandBuilder, ComponentType } = require('discord.js');
const Discord = require('discord.js');

const index = require('../../index.js');

const NotifierModel = require('../../models/Notifier.js');
const mongoose = require('mongoose');

const {getCommandName} = require("../../functions/commands.js");
const commandName = getCommandName("notifier");

module.exports = {
    data: new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Agrega los notificadores a la DB")
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageChannels, Discord.PermissionFlagsBits.ManageWebhooks),
    cooldown: 20,
    async execute(interaction, client) {

       const newPerfil = new NotifierModel
        ({
            guildID: interaction.guild.id,
            Youtube: [],
            Twitch: []
        });
        newPerfil.save().then(() => interaction.reply("Done"))
        .catch((err) => {return console.error(err)});
    }
}