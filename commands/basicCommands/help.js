const { SlashCommandBuilder, ComponentType } = require('discord.js');
const Discord = require('discord.js');

const index = require('../../index.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Lista de comandos"),
    cooldown: 20,
    async execute(interaction, client) {
        const commands = index.commands;

        const basicCommands = index.basicCommands;
        const notifyCommands = index.notifyCommands;

        let commandsListed = [];
        let otherCommandsString = ``;
        let basicCommandsString = ``;
        let notifyCommandsString = ``;

        for (const item of basicCommands) 
        {
            if(commandsListed.includes(item.name)) continue;

            const currentInteraction = client.interactionsList.get(item.name);
            basicCommandsString += `> </${item.name}:${currentInteraction.id}> : ${item.description}\n`;

            commandsListed.push(item.name);
        }

        for (const item of notifyCommands) 
        {
            if(commandsListed.includes(item.name)) continue;

            const currentInteraction = client.interactionsList.get(item.name);
            notifyCommandsString += `> </${item.name}:${currentInteraction.id}> : ${item.description}\n`;

            commandsListed.push(item.name);
        }

        for(const item of commands) 
        {
            const currentInteraction = client.interactionsList.get(item.name);

            if(!commandsListed.includes(item.name)) otherCommandsString += `> </${item.name}:${currentInteraction.id}> : ${item.description}\n`;

            commandsListed.push(item.name);
        }


        //==========================OPCIONES==========================//
        const selectMenu = new Discord.StringSelectMenuBuilder()
        .setCustomId("selectMenu")
        .setPlaceholder("Secciones")
        .addOptions(
            new Discord.StringSelectMenuOptionBuilder()
            .setLabel("Comandos Basicos")
            .setDescription("Lista de comandos basicos o de diversión")
            .setValue("basic_commands"),
            new Discord.StringSelectMenuOptionBuilder()
            .setLabel("Comandos de notificación")
            .setDescription("Comandos utilizados para la configuración de los notificadores")
            .setValue("notify_commands"),
            new Discord.StringSelectMenuOptionBuilder()
            .setLabel("Otros")
            .setDescription("Comandos sin categoria")
            .setValue("other_commands")
        )

        const row = new Discord.ActionRowBuilder()
        .addComponents(selectMenu);


        //==========================EMBEDS==========================//
        const mainEmbed = new Discord.EmbedBuilder()
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL()})
        .setColor("Purple")
        .setDescription("Selecciona una sección de comandos")
        .setTimestamp();

        const basicCommandsEmbed = new Discord.EmbedBuilder()
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL()})
        .setColor("Purple")
        .setDescription(basicCommandsString)
        .setTimestamp();

        const notifyCommandsEmbed = new Discord.EmbedBuilder()
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL()})
        .setColor("Purple")
        .setDescription(notifyCommandsString)
        .setTimestamp();

        const otherCommandsEmbed = new Discord.EmbedBuilder()
        .setAuthor({name: client.user.username, iconURL: client.user.displayAvatarURL()})
        .setColor("Purple")
        .setDescription(otherCommandsString)
        .setTimestamp();

        //==============================================INTERACCIÓN====================================================//
        await interaction.reply({embeds: [mainEmbed], components: [row]});

        const collectorFilter = i => i.user.id === interaction.user.id;

        const collector = interaction.channel.createMessageComponentCollector({filter: collectorFilter, componentType: ComponentType.StringSelect, time: 3_600_600});

        collector.on('collect', async i => {
            const selection = i.values[0];
            const embeds = {
                "basic_commands": basicCommandsEmbed,
                "notify_commands": notifyCommandsEmbed,
                "other_commands": otherCommandsEmbed
            }
        
            await i.update({embeds: [embeds[selection]], components: [row]});
        });
    }
}