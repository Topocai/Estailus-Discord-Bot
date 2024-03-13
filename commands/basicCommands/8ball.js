const Discord = require("discord.js");
const { SlashCommandBuilder } = require('@discordjs/builders');
const { NORMAL_COMMANDS_NAME, LOCAL_COMMANDS_NAME } = require("../../variables.js");

const config = require('../../config.json');
const commandName = config.LOCAL_MODE ? LOCAL_COMMANDS_NAME.BALL : NORMAL_COMMANDS_NAME.BALL;

module.exports = {
    data: new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Preguntale lo que quieras a la bola y ella te respondera")
    .addStringOption((textOption) => textOption.setName("pregunta").setDescription("Pregunta la cual responder").setRequired(true)),
    cooldown: 10,
    async execute(interaction, client) {
        let answers = [
            ["Eso es cierto" , "Es ciertamente un si", "Sin ninguna duda si", "Si, definitivamente si", "Perspectivamente si", "Si", "Ya veo que si", "Puedes confiar en ello"],
            ["No cuentes con ello", "No", "Mi respuesta es no", "Definitivamente no", "Sin dudar no"],
            ["Pregunta de nuevo..", "Mejor no te lo cuento", "Concentrate y vuelve a preguntar", "...", "Preguntalo mas tarde", "¡No puedo predecir eso!"]
        ];

        const answerType = answers[Math.floor(Math.random() * (3 - 1 + 1) )];
        const answer = answerType[Math.floor(Math.random() * ((answerType.length - 1) - 0 + 1) + 0)]

        const question = interaction.options.getString("pregunta");

        const embed = new Discord.EmbedBuilder()
        .setAuthor({iconURL: interaction.user.displayAvatarURL(), name: `${interaction.user.username}`})
        .setDescription(`> ¿${question}?\n${answer}`);

        interaction.reply({embeds: [embed]});
    }
}