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