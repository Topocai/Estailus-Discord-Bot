const { SlashCommandBuilder } = require('discord.js');
const Discord = require('discord.js');

const { replyMSG  }= require('../../functions/embedCreator.js');
const { YOUTUBE_STRINGS } = require('../../variables.js');
const customFetchs = require('../../functions/customFetchs.js');

const NotifierModel = require('../../models/Notifier.js');
const notifierObjects = require('../../models/NotifierObjects.js')
const mongoose = require('mongoose');

const fetch = require('node-fetch');

const {getCommandName} = require("../../functions/commands.js");
const commandName = getCommandName("youtube");

module.exports = {
    data: new SlashCommandBuilder()
    .setName(commandName)
    .setDescription("Agrega/quita un canal a las notificaciones de YT")
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageChannels, Discord.PermissionFlagsBits.ManageWebhooks)
    .addSubcommand((sub) => sub
    .setName("help")
    .setDescription("Ayuda/guía del comando")
    )
    .addSubcommand((sub) => sub
    .setName("list")
    .setDescription("Lista y gestión de canales")
    )
    .addSubcommand((sub) => sub
    .setName("add")
    .setDescription("Añadir canal")
    .addChannelOption((channelOpt) => channelOpt.setName("textchannel").setDescription("Canal donde se enviaran las notificaciones").setRequired(true).addChannelTypes(Discord.ChannelType.GuildText, Discord.ChannelType.GuildAnnouncement))
    .addStringOption((ytChannel) => ytChannel.setName("ytchannel").setDescription("ID del canal de Youtube").setRequired(true))
    .addRoleOption((roleOpt) => roleOpt.setName("rol").setDescription("Rol que se mencionara en las notificaciones").setRequired(true))
    ),
    cooldown: 15,
    async execute(interaction, client) {

        ////////////////////////////////////////////////////AYUDA/////////////////////////////////////////////

        if(interaction.options.getSubcommand() === 'help') 
        {
            const embed = new Discord.EmbedBuilder()
            .setColor("Red")
            .setAuthor({name: 'Guia para el comando', iconURL: client.user.displayAvatarURL()})
            .setDescription(`\`textchannel\`: Canal de texto donde se enviarán las notificaciones.\n\`ytchannel\`: ID del canal [*¿Como obtener el ID?*](https://commentpicker.com/youtube-channel-id.php).\n\`rol\`: Rol al cual mencionar en las notificaciones.`)
            .setFooter({text: `<:YoutubeLogo:976319551174225980> YoutubeNotify`})
            interaction.reply({embeds: [embed]});
        }
        
        //////////////////////////////////////////////////////////LSITA/////////////////////////////////////////////

        else if(interaction.options.getSubcommand() === 'list') 
        {
            const notifier = await NotifierModel.findOne({
                guildID: interaction.guild.id
            }, async (err) => {
                if(err) return console.error(err);
            });

            if(notifier != null) 
            {

                function YoutubeChannelInfo() 
                {
                    this._channelId = [];
                    this._channelsNames = [];
                    this._channelTextId = [];
                    this._videoId = [];
                    this._rolId = [];
                    this._videosCount = [];
                } //Crea un objeto para guardar los valores de el/los canal/es
    
                let Fields = []
                const Components = []
    
                const youtubeChannelsLength = await notifier.Youtube.length;
    
                if (youtubeChannelsLength <= 0) return replyMSG(":x: No hay níngun canal registrado", interaction);

                const myYoutubeChannelInfo = new YoutubeChannelInfo();
    
                async function getInfo() 
                {
                    for (let i = 0; i < youtubeChannelsLength; i++) { 

                        myYoutubeChannelInfo._channelsNames.push(await notifier.Youtube[i].youtubeUserName)
                        myYoutubeChannelInfo._channelId.push(await notifier.Youtube[i].youtubeUserID)
                        myYoutubeChannelInfo._channelTextId.push(await notifier.Youtube[i].channelID)
                        myYoutubeChannelInfo._videoId.push(await notifier.Youtube[i].lastVideoID)
                        myYoutubeChannelInfo._rolId.push(await notifier.Youtube[i].youtubeMentionID)
                        myYoutubeChannelInfo._videosCount.push(await notifier.Youtube[i].lastVideosCount)
        
                        let mentionId = myYoutubeChannelInfo._rolId[i]
                        let mention = mentionId == 'everyone' ? "@everyone" : `<@&${mentionId}>`
        
                        Fields.push(
                            {name: `> <:YoutubeLogo:976319551174225980> ${myYoutubeChannelInfo._channelsNames[i]}`, value: `<#${myYoutubeChannelInfo._channelTextId[i]}> [Ultimo video](https://www.youtube.com/watch?v=${myYoutubeChannelInfo._videoId[i]}) - ${mention}`}
                        );
        
                        Components.push(
                            new Discord.ButtonBuilder()
                            .setCustomId(`${i}`)
                            .setLabel(`${myYoutubeChannelInfo._channelsNames[i]}`)
                            .setEmoji("<:YoutubeLogo:976319551174225980>")
                            .setStyle(Discord.ButtonStyle.Primary),
                        );
                    }
                }
    
                await getInfo();
    
                const row = new Discord.ActionRowBuilder()
                .addComponents(Components);
    
                const embed = new Discord.EmbedBuilder()
                .setColor("Red")
                .setTitle("➤ ​ Lista de canales añadidos.")
                .setDescription("*Al presionar un boton se elimina de la lista*")
                .setFooter({ iconURL: "https://cdn.discordapp.com/emojis/976319551174225980.png", text: "Youtube" })
                .addFields(Fields);
                await interaction.channel.send({embeds: [embed], components: [row]});
    
                const filter = i => i.user.id === interaction.user.id;
        
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
    
                collector.on('collect', async i => { //ELIMINAR CANAL DE LA LISTA

                    let index = parseInt(i.customId);
    
                    let newYoutubeList = await notifier.Youtube;
                    newYoutubeList = newYoutubeList.slice(0, index).concat(newYoutubeList.slice(index+1));
    
                    await notifier.updateOne({
                        Youtube: newYoutubeList
                    })
                    .then()
                    .catch(async (err) => 
                    {
                        console.log(err);
                        await replyMSG(":x: Ha **ocurrido un error**, vuelve a intentarlo", interaction);
                    });
    
                    const infoEmbed = new Discord.EmbedBuilder()
                    .setColor("#2F3136")
                    .setDescription(`❕ Se ha eliminado el canal **${myYoutubeChannelInfo._channelsNames[index]}**.`);

                    Fields = Fields.slice(0, index).concat(Fields.slice(index+1));
                    const newEmbed = new Discord.EmbedBuilder()
                    .setColor("Red")
                    .setTitle("➤ ​ Lista de canales añadidos.")
                    .setDescription("*Al presionar un boton se elimina de la lista*")
                    .setFooter({ iconURL: "https://cdn.discordapp.com/emojis/976319551174225980.png", text: "Youtube" })
                    .addFields(Fields);
                    
                    await i.update({embeds: [infoEmbed, newEmbed], components: []})
                });
                } 
                else return replyMSG(":x: No hay níngun canal registrado", interaction);
        }

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////AÑADIR/////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

        else 
        {
            const channelOpt = interaction.options.getChannel("textchannel");
            const ytChannel = interaction.options.getString("ytchannel");
            const roleOpt = interaction.options.getRole("rol");

            let channelid = channelOpt.id;
            let mentionID = roleOpt.name == '@everyone' ? "@everyone": roleOpt.id;

            await replyMSG("Espera un momento para encontrar tu canal de Youtube", interaction, null);

            const YoutubeChannelInfo = await customFetchs.youtubeFetchs({ fetchType: YOUTUBE_STRINGS.GET_CHANNEL_INFO_BY_USERNAME, username: ytChannel});

            if(YoutubeChannelInfo == null || YoutubeChannelInfo == undefined) return replyMSG(":x: Usuario no encontrado", interaction);

            const youtubeUserID = YoutubeChannelInfo.id.channelId; //Se obtiene el ID del canal de Youtube
            const channelName = YoutubeChannelInfo.snippet.title || ytChannel; //Se obtiene el nombre del canal de Youtube

            const lastVideo = await customFetchs.youtubeFetchs({ fetchType: YOUTUBE_STRINGS.GET_LIST_OF_VIDEOS, channelID: youtubeUserID }, YOUTUBE_STRINGS.OPTION_ONLY_LAST_VIDEO_ID);

            const notifier = await NotifierModel.findOne({ //Se comprueba si el servidor ya se encuentra en la DB
             guildID: interaction.guild.id
            }, async (err, dbnotifier) => {
                if(err) return console.error(err);
                if(!dbnotifier) 
                {
                    //DEVUELVE *Error*
                }
            });

            if(notifier != null) 
            {
                const videosCount = await customFetchs.youtubeFetchs({ fetchType: YOUTUBE_STRINGS.GET_VIDEOS_COUNT, channelID: youtubeUserID });

                const newYoutubeChannel = new notifierObjects.YoutubeOject(
                    channelid,
                    mentionID,
                    youtubeUserID,
                    channelName,
                    lastVideo,
                    videosCount
                );

                let youtubeObjects = await notifier.Youtube;
                youtubeObjects.push(newYoutubeChannel);

                await notifier.updateOne({
                    Youtube: youtubeObjects,
                }).then(async () => 
                {
                    console.log("Canal de Youtube añadido correctamente");
                    const embed = new Discord.EmbedBuilder()
                    .setColor("#2F3136")
                    .setDescription(`El canal se ha añadido correctamente.`);
                    interaction.channel.send({embeds: [embed]})
                }).catch(async (err) => 
                {
                    console.err("Error al añadir canal de Youtube:\n" + err);
                    interaction.channel.send("Ha ocurrido un error");
                });
            }
        }
    }
}
