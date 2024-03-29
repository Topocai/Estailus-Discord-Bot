const { SlashCommandBuilder } = require('@discordjs/builders');
const Discord = require('discord.js');

const {getCommandName} = require("../../functions/commands.js");
const commandName = getCommandName("election");

module.exports = {
    data: new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Elige una de las dos opciones")
    .addStringOption((stringOpt) => stringOpt.setName("opcion1").setDescription("La primera de las opciones").setRequired(true))
    .addStringOption((stringOpt) => stringOpt.setName("opcion2").setDescription("La segunda de las opciones").setRequired(true)),
    cooldown: 10,
    async execute(interaction, client) {
        const option1 = interaction.options.getString("opcion1");
        const option2 = interaction.options.getString("opcion2");

        const choose = Math.floor(Math.random() * 10) < 5 ? option1: option2;
        
        const embed = new Discord.EmbedBuilder()
        .setAuthor({iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.username}`})
        .setDescription(`> ¿\`${option1}\` o \`${option2}\`?\n:point_right: ${choose}`);

        interaction.reply({embeds: [embed]});
    }
}