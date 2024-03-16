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
const twitchFunctions = require('../functions/twitchFunctions.js');
const { twitchFunctionsCaller } = require('../functions/twitchFunctions.js');

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

            if(titleVars > 2) return await replyMSG(":x: **Error**, solo se pueden usar dos variable por canal.", interaction);

            //await replyMSG(":information_source: Espera un momento para evaluar tus variables", interaction);

            const channelCategories = Object.keys(categories).filter(categoryName => titleVars.map(v => Object.keys(categories[categoryName]).includes(v)).includes(true));
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
            channelObject.variablesCategories = channelCategories;

            for(let i = 0; i < titleVars.length; i++) 
            {
                const actualVar = titleVars[i];
                const elementIndex = titleElements.findIndex(element => element.includes(actualVar));

                const args = ALL_VARS[actualVar].hasArgs ? getArg(titleElements[elementIndex]) : null;
                const variableValue = await ALL_VARS[actualVar].get_function(args);

                channelObject.variablesValues[elementIndex] = variableValue;
            }

            channelObject.displayTitle = channelObject.variablesValues.join(' ');
            
            const newChannel = await interaction.guild.channels.create({
                type: Discord.ChannelType.GuildVoice,
                name: `${channelTitle}`,
                permissionOverwrites: [
                    {
                        id: everyoneId,
                        deny: ["Connect"],
                        allow: ["ViewChannel"]
                    }
                ]
            });
            }
            /*
            

            const decorationChannels = await DecorationChannels.findOne
            ({
                guildID: interaction.guild.id
            }).exec();

            if(decorationChannels == null) 
            {
                const newDecorationChannels = new DecorationChannels
                ({
                    guildID: interaction.guild.id,
                    channels: (
                        {
                            id: newChannel.id,
                            title: `${channelTitle}`
                        }
                    )
                });
                newDecorationChannels.save()
                .then(async () => 
                {
                await replyMSG(`:white_check_mark: Canal de decoración **creado con exito**\n> Canal: <#${newChannel.id}>`, interaction);
                    
                })
                .catch(async err => {
                console.log(err)
                await replyMSG(":x: Ha **ocurrido un error**, vuelve a intentarlo", interaction);
                });
            }
            else if(decorationChannels != null) 
            {
                const newChannelmongoose = {
                    id: newChannel.id,
                    title: `${channelTitle}`
                };
                let newChannels = await decorationChannels.channels;
                newChannels.push(newChannelmongoose);

                await decorationChannels.updateOne({
                    channels: newChannels
                })
                .then(async () => 
                {
                await replyMSG(`:white_check_mark: Canal de decoración **creado con exito**\n> Canal: <#${newChannel.id}>`, interaction);
                })
                .catch(async err => 
                {
                console.log(err)
                await replyMSG(":x: Ha **ocurrido un error**, vuelve a intentarlo", interaction);
                });
            }
            //interaction.guild.channels.create({type: Discord.ChannelType.GuildVoice, permissionOverwrites: [{id: 355877466415431683, deny: ["Connect"], allow: ["ViewChannel"]}]})
        }*/
    }
}
