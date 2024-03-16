const { SlashCommandBuilder} = require('discord.js');
const Discord = require('discord.js');

const fetch = require('node-fetch');
const { replyMSG } = require('../functions/embedCreator.js');

const mongoose = require('mongoose');
const DecorationChannels = require('../models/DecorationChannels.js');

const {getCommandName} = require("../functions/commands.js");
const commandName = getCommandName("decorationchannel");

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

        if(interaction.options.getSubcommand() == "create") {
            const channelTitle = interaction.options.getString("title");
            const everyoneId = interaction.guild.roles.cache.find(r => r.name === '@everyone').id;
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
        }
    }
}
