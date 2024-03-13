const { SlashCommandBuilder, ComponentType } = require('discord.js');
const Discord = require('discord.js');

const index = require('../index.js');

const { LOCAL_COMMANDS_NAME, COMMANDS_CATEGORY, COMMAND_CATEGORY_DISPLAY_NAMES, COMMAND_CATEGORY_DESCRIPTIONS, GetKeyByValue } = require('../variables.js');

const config = require('../config.json');
const commandName = config.LOCAL_MODE ? LOCAL_COMMANDS_NAME.HELP : NORMAL_COMMANDS_NAME.HELP;

module.exports = {
    data: new SlashCommandBuilder()
    .setName('lhelp')
    .setDescription("Lista de comandos"),
    cooldown: 20,
    category: "utility",
    async execute(interaction, client) {
        const categories = index.commandsHandler.categories.map(category => category);

        //Crea las opciones del select menu, una por cada categoria de comandos
        const embedOptions = categories.map(category => {
            const option = new Discord.StringSelectMenuOptionBuilder({
                label: COMMAND_CATEGORY_DISPLAY_NAMES[GetKeyByValue(COMMANDS_CATEGORY, category.name)],
                description: COMMAND_CATEGORY_DESCRIPTIONS[GetKeyByValue(COMMANDS_CATEGORY, category.name)],
                value: category.name
            });
            return option
        });

        //==========================OPCIONES==========================//
        const selectMenu = new Discord.StringSelectMenuBuilder()
        .setCustomId("selectMenu")
        .setPlaceholder("Secciones")
        .addOptions(embedOptions.map(option => option))

        const row = new Discord.ActionRowBuilder()
        .addComponents(selectMenu);

            
        //==========================EMBEDS==========================//
        const mainEmbed = new Discord.EmbedBuilder()
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL()})
        .setColor("Purple")
        .setDescription("Selecciona una sección de comandos")
        .setTimestamp();

        // Crea un embed por cada categoría de comandos
        const embedsPerCategory = categories.map(category => {
            //Obtiene los comandos de la categoria y crea un string con el nombre y descripción de cada uno
            const commands = category.commands.map(command => {
                const currentInteraction = client.interactionsList.get(command.name);

                return `> </${command.name}:${currentInteraction.id}> : ${command.command.description}\n`;
            });

            const categoryEmbed = new Discord.EmbedBuilder()
            .setTitle(COMMAND_CATEGORY_DISPLAY_NAMES[GetKeyByValue(COMMANDS_CATEGORY, category.name)])
            .setDescription(commands.join("\n"))
            .setColor("Purple")
            .setTimestamp();

            return {embedName: category.name, categoryEmbed: categoryEmbed};
        });

        //==============================================INTERACCIÓN====================================================//
        await interaction.reply({embeds: [mainEmbed], components: [row]});

        const collectorFilter = i => i.user.id === interaction.user.id;

        const collector = interaction.channel.createMessageComponentCollector({filter: collectorFilter, componentType: ComponentType.StringSelect, time: 3_600_600});

        collector.on('collect', async i => {
            const selection = i.values[0];
            const selectedEmbed = embedsPerCategory.find(embedData => embedData.embedName == selection).categoryEmbed;
        
            await i.update({embeds: [selectedEmbed], components: [row]});
        });
    }
}