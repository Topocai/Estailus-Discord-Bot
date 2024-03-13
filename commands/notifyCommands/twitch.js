const Discord = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

const NotifierModel = require('../../models/Notifier.js');
const notifierObjects = require('../../models/NotifierObjects.js');
const mongoose = require('mongoose');

const emojis = require('../../emojis.json');
const { replyMSG  }= require('../../functions/embedCreator.js');
const { twitch } = require('../../functions/loopFunctions/notifications.js');

const { LOCAL_COMMANDS_NAME } = require('../../variables.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(LOCAL_COMMANDS_NAME.TWITCH)
    .setDescription("Agrega/quita un canal a las notificaciones de Twitch")
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.ManageChannels, Discord.PermissionFlagsBits.ManageWebhooks)
    .addSubcommand((sub) => sub
    .setName("help")
    .setDescription("Ayuda/Guía del comando")
    )
    .addSubcommand((sub) => sub
    .setName("list")
    .setDescription("Muestra una lista de los canales y la posibilidad de eliminar cada uno")
    )
    .addSubcommand((sub) => sub
    .setName("add")
    .setDescription("Añadir canal")
    .addChannelOption((channelOpt) => channelOpt.setName("textchannel").setDescription("Canal de texto").setRequired(true).addChannelTypes(Discord.ChannelType.GuildText, Discord.ChannelType.GuildAnnouncement))
    .addStringOption((ytChannel) => ytChannel.setName("twchannel").setDescription("Canal de Twitch").setRequired(true))
    .addRoleOption((roleOpt) => roleOpt.setName("rol").setDescription("Nombre del rol").setRequired(true))
    ),  
    cooldown: 5,
    async execute (interaction, client) {

        if(interaction.options.getSubcommand() === "help") //SECCION DE AYUDA
        {
            const embed = new Discord.EmbedBuilder()
            .setColor("Purple")
            .setAuthor({name: 'Guia para el comando', iconURL: client.user.displayAvatarURL()})
            .setDescription(`\`textchannel\`: Canal de texto donde se enviarán las notificaciones.\n\`twChannel\`: Nombre del canal\n\`rol\`: Rol al cual mencionar en las notificaciones.`)
            .setFooter({iconURL: "https://cdn.discordapp.com/emojis/954932298472648784.png", text: `Twitch-Notify`})
            interaction.reply({embeds: [embed]});

        }
        else if(interaction.options.getSubcommand() === "list") //LISTA DE CANALES
        {
            const notifier = await NotifierModel.findOne({
                guildID: interaction.guild.id
            }, async (err) => {
                if(err) return console.error(err);
            });

            if(notifier != null) 
            {

                function TwitchChannelInfo() 
                {
                    this._channelsNames = [];
                    this._channelTextId = [];
                    this._rolId = [];
                } //Crea un objeto para guardar los valores de el/los canal/es
    
                let Fields = []
                const Components = []
    
                const twitchChannelsLength = await notifier.Twitch.length;
    
                if (twitchChannelsLength <= 0) return replyMSG(":x: No hay níngun canal registrado", interaction);

                const myTwitchChannelInfo = new TwitchChannelInfo();
    
                async function getInfo() 
                {
                    for (let i = 0; i < twitchChannelsLength; i++) { 

                        myTwitchChannelInfo._channelsNames.push(await notifier.Twitch[i].twitchUser);
                        myTwitchChannelInfo._channelTextId.push(await notifier.Twitch[i].channelID);
                        myTwitchChannelInfo._rolId.push(await notifier.Twitch[i].twitchMentionID);
        
                        let mentionId = myTwitchChannelInfo._rolId[i]
                        let mention = mentionId == 'everyone' ? "@everyone" : `<@&${mentionId}>`
        
                        Fields.push(
                            {name: `> ${emojis.TwitchLogo} ${myTwitchChannelInfo._channelsNames[i]}`, value: `Canal de notificaciones: <#${myTwitchChannelInfo._channelTextId[i]}> - ${mention}`}
                        );
        
                        Components.push(
                            new Discord.ButtonBuilder()
                            .setCustomId(`${i}`)
                            .setLabel(`${myTwitchChannelInfo._channelsNames[i]}`)
                            .setEmoji(`${emojis.TwitchLogo}`)
                            .setStyle(Discord.ButtonStyle.Primary),
                        );
                    }
                }
    
                await getInfo();
    
                const row = new Discord.ActionRowBuilder()
                .addComponents(Components);
    
                const embed = new Discord.EmbedBuilder()
                .setColor("Purple")
                .setTitle("➤ ​ Lista de canales añadidos.")
                .setDescription("*Al presionar un boton se elimina de la lista*\n\u200b")
                .setFooter({ iconURL: "https://cdn.discordapp.com/emojis/954932298472648784.png", text: "Twitch" })
                .addFields(Fields);
                await interaction.channel.send({embeds: [embed], components: [row]});
    
                const filter = i => i.user.id === interaction.user.id;
        
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });
    
                collector.on('collect', async i => { //ELIMINAR CANAL DE LA LISTA

                    let index = parseInt(i.customId);
    
                    let newTwitchList = await notifier.Twitch;
                    newTwitchList = newTwitchList.slice(0, index).concat(newTwitchList.slice(index+1));
    
                    await notifier.updateOne({
                        Twitch: newTwitchList
                    })
                    .then()
                    .catch(async (err) => 
                    {
                        console.log(err);
                        await replyMSG(":x: Ha **ocurrido un error**, vuelve a intentarlo", interaction);
                    });
    
                    const infoEmbed = new Discord.EmbedBuilder()
                    .setColor("#2F3136")
                    .setDescription(`❕ Se ha eliminado el canal **${myTwitchChannelInfo._channelsNames[index]}**.`);

                    Fields = Fields.slice(0, index).concat(Fields.slice(index+1));
                    const newEmbed = new Discord.EmbedBuilder()
                    .setColor("Purple")
                    .setTitle("➤ ​ Lista de canales añadidos.")
                    .setDescription("*Al presionar un boton se elimina de la lista*")
                    .setFooter({ iconURL: "https://cdn.discordapp.com/emojis/954932298472648784.png", text: "Twitch" })
                    .addFields(Fields);
                    
                    await i.update({embeds: [infoEmbed, newEmbed], components: []})
                });
                } 
                else return replyMSG(":x: No hay níngun canal registrado", interaction);
        }
        else //CONFIGURAR CANAL EL CUAL AÑADIR
        {
            const channelOpt = interaction.options.getChannel("textchannel");
            const twChannel = interaction.options.getString("twchannel");
            const roleOpt = interaction.options.getRole("rol");

            let channelid = channelOpt.id; //Id del canal de discord
            let mentionID = roleOpt.name == '@everyone' ? "@everyone": roleOpt.id; //ID del rol a mencionar

            const twitchUserData = await twitch.getUsers(`${twChannel}`);
            //console.log(twitchUserData.data[0])

            if(twitchUserData.data[0] == undefined) //Si el usuario no se encuentra devuelve mensaje de error
            {
                replyMSG(":x: Usuario no encontrado", interaction);
                return;
            } 
            else 
            {
                const notifier = await NotifierModel.findOne({
                    guildID: interaction.guild.id
                }, (err, tconfig) => 
                {
                    if(err) return console.error(err);
                    if(!tconfig) 
                    {
                       /* RETURNS error*/
                    }
                });
                if(notifier == null || notifier.Twitch == null) 
                {
                    replyMSG(":x: El servidor aun no fue agregado a la DB o ha ocurrido un error en la misma", interaction);
                    return;
                }
                else
                {
                    let twitchUserName = twitchUserData.data[0].login;
                    let twitchUserID = twitchUserData.data[0].id;
                    const myTwitchChannel = new notifierObjects.TwitchObject(
                        channelid,
                        mentionID,
                        twitchUserName,
                        twitchUserID,
                        false,
                        undefined,
                    );

                    const actualTwitchObjects = await notifier.Twitch;
                    actualTwitchObjects.push(myTwitchChannel);

                    await notifier.updateOne({
                        Twitch: actualTwitchObjects
                    })
                    .then(async (result) => 
                    {
                        console.log(`Se ha creado la notificación de Twitch:\n${result}`);
                        await replyMSG(":white_check_mark: Notifación de **Twitch actualizado**", interaction);
                    })
                    .catch((err) => 
                    {
                        console.log(`Ha habido un error al crear la notificación:\n${err}`);
                        replyMSG(":x: Ha **ocurrido un error**, vuelve a intentarlo", interaction);
                    });
                }
            }    
        }
    }
}