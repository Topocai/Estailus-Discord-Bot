const { SlashCommandBuilder} = require('discord.js');
const Discord = require('discord.js');

const fetch = require('node-fetch');
const { replyMSG } = require('../functions/embedCreator.js');

const mongoose = require('mongoose');
const DecorationChannels = require('../models/DecorationChannels.js');

const {getCommandName} = require("../functions/commands.js");
const commandName = getCommandName("decorationchannel");

const { ALL_VARS, TWITCH_VARS, getArg, categories } = require('../functions/decorationChannels/decoration-vars.js');
const { DecorationChannelObject } = require('../functions/decorationChannels/DecorationChannelObjects.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(commandName)
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageChannels)
    .addSubcommand((sub) => sub
    .setName("guia")
    .setDescription("Lista de variables y como usarlas.")
    )
    .addSubcommand((sub) => sub
    .setName("create")
    .setDescription("Crea un nuevo canal de decoración.")
    .addStringOption((textOption) => textOption.setName('title').setDescription('Titulo del canal').setRequired(true))
    )
    .setDescription("Crea canales de decoración con posibilidad de variables."),
    cooldown: 15,
    async execute(interaction, client) {
        ///VARIABLES
        //-{MemberCount} - Cantidad de miembros excluyendo bots
        //-{FollowCount} - Cantidad de seguidores en Twitch
        //-{LiveStatus} - Estado de LIVE en Twitch

        if(interaction.options.getSubcommand() == "create") 
        {
            const channelTitle = interaction.options.getString("title");

            const everyoneId = interaction.guild.roles.cache.find(r => r.name === '@everyone').id;

            const fixedTitle = channelTitle.replace(/\s+/g, '-');
            const titleElements = fixedTitle.split('-');
            const titleVars = Object.keys(ALL_VARS).filter(key => titleElements.map(element => element.includes(key)).includes(true));

            if(titleVars > 2) return await replyMSG(":x: **Error**: solo se pueden usar dos variable por canal.", interaction);
            if(titleVars.length == 0) return await replyMSG(":x: **Error**: no se han encontrado variables en el titulo.", interaction);

            //await replyMSG(":information_source: Espera un momento para evaluar tus variables", interaction);

            /**
             * this.discord_channelID = null;
                this.titleElements = titleElements;
                this.variablesValues = [];
                this.variablesCategories = [];
                this.displayTitle = null;
             */
            const channelObject = new DecorationChannelObject();

            channelObject.titleElements = titleElements;
            channelObject.variablesValues = [...titleElements];
            channelObject.variables = [...titleVars];

            for(let i = 0; i < titleVars.length; i++) 
            {
                const actualVar = titleVars[i];
                const elementIndex = titleElements.findIndex(element => element.includes(actualVar));

                const args = ALL_VARS[actualVar].hasArgs ? getArg(titleElements[elementIndex]) : null;
                const variableValue = await ALL_VARS[actualVar].get_function(args, {guild_id: interaction.guild.id});

                channelObject.variablesValues[elementIndex] = variableValue;
            }


                const hasError = channelObject.variablesValues.find(value => value instanceof Error);
                if(hasError) return await replyMSG(`:x: **Error**: Hubo un error en un pseudo valor de una variable, asegurate de haber escrito correctamente el valor luego de los ":"`, interaction);
                
                channelObject.displayTitle = channelObject.variablesValues.join(' ');
            
                const newChannel = await interaction.guild.channels.create({
                    type: Discord.ChannelType.GuildVoice,
                    name: `${channelObject.displayTitle}`,
                    permissionOverwrites: [
                        {
                            id: everyoneId,
                            deny: ["Connect"],
                            allow: ["ViewChannel"]
                        }
                    ]
                });

                channelObject.discord_channelID = newChannel.id;

                const DecorationChannelsModel = await DecorationChannels.findOne({
                    guildID: interaction.guild.id
                }).exec();

                if(DecorationChannelsModel == null) 
                {
                    const newDecorationChannels = new DecorationChannels({
                        guildID: interaction.guild.id,
                        channels: [channelObject]
                    });

                    newDecorationChannels.save()
                    .then(async () => {
                        await replyMSG(`:white_check_mark: Canal de decoración **creado con exito**\n> Canal: <#${newChannel.id}>`, interaction);
                    })
                    .catch(async err => {
                        console.log(err);
                        await replyMSG(":x: Ha **ocurrido un error**, vuelve a intentarlo", interaction);
                    });

                }
                else 
                {
                    const actualChannels = await DecorationChannelsModel.channels;
                    actualChannels.push(channelObject); 

                    await DecorationChannelsModel.updateOne({
                        channels: actualChannels
                    })
                    .then(async () => {
                        await replyMSG(`:white_check_mark: Canal de decoración **creado con exito**\n> Canal: <#${newChannel.id}>`, interaction);
                    })
                    .catch(async err => {
                        console.log(err);
                        await replyMSG(":x: Ha **ocurrido un error**, vuelve a intentarlo", interaction);
                    });

                }   
        }
    }
}
