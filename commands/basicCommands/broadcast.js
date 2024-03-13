const { SlashCommandBuilder} = require('discord.js');
const Discord = require('discord.js');

const { replyMSG } = require('../../functions/embedCreator');
const { LOCAL_COMMANDS_NAME } = require('../../variables.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(LOCAL_COMMANDS_NAME.BROADCAST)
    .setDefaultMemberPermissions(Discord.PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub
    .setName('text')
    .setDescription('Mensaje de Texto')
    .addChannelOption((channelOpt) => channelOpt.setName('textchannel').setDescription('Canal a enviarse').setRequired(true).addChannelTypes(Discord.ChannelType.GuildText))
    .addStringOption((textOption) => textOption.setName('text').setDescription('Texto del mensaje').setRequired(true))
    )
    .addSubcommand((sub) => sub
    .setName('embed')
    .setDescription('Mensaje tipo Embed')
    .addChannelOption((channelOpt) => channelOpt.setName('textchannel').setDescription('Canal a enviarse').setRequired(true).addChannelTypes(Discord.ChannelType.GuildText))
    .addStringOption((textOption) => textOption.setName('title').setDescription('Titulo del Embed').setRequired(true))
    .addStringOption((textOption) => textOption.setName('text').setDescription('Texto del Embed').setRequired(true))
    .addStringOption((textOption) => textOption.setName('color').setDescription('Color en formato Hex (colocar sin #)')) 
    .addAttachmentOption((attachmentOption) => attachmentOption.setName("image").setDescription("Imagen para el Embed"))
    /////////////////////////////////////////////////////////FIELDS/////////////////////////////////////////////
    )
    .setDescription("Envia un mensaje/aviso a un canal en especifico en nombre del bot"),
    cooldown: 15,
    async execute(interaction, client) {

       if(interaction.options.getSubcommand() == "embed") {
            const title = interaction.options.getString("title");
            const text = interaction.options.getString("text");
            const channel = interaction.options.getChannel("textchannel");
            const attachment = interaction.options.getAttachment("image");
            const colorOpt = interaction.options.getString("color");

            let color = colorOpt == null ? "Red" : `#${colorOpt}`;

            const fields = [];

            if(attachment != null) {
                const embed = new Discord.EmbedBuilder()
                .setAuthor({name: title, iconURL: client.user.displayAvatarURL()})
                .setDescription(text)
                .setColor(color)
                .setFields(fields)
                .setImage(attachment.url);

                channel.send({embeds: [embed]}).then(async () => await replyMSG(`:white_check_mark: Se **ha enviado** el mensaje a <#${channel.id}>`, interaction))
                .catch(async () => await replyMSG(`:x: **Ha ocurrido un error**, vuelve a intentarlo`, interaction));
            } else {
                const embed = new Discord.EmbedBuilder()
                .setAuthor({name: title, iconURL: client.user.displayAvatarURL()})
                .setDescription(text)
                .setColor(color)
                .setFields(fields);

                channel.send({embeds: [embed]}).then(async () => await replyMSG(`:white_check_mark: Se **ha enviado** el mensaje a <#${channel.id}>`, interaction))
                .catch(async () => await replyMSG(`:x: **Ha ocurrido un error**, vuelve a intentarlo`, interaction));
            }
       } else {
            const text = interaction.options.getString("text");
            const channel = interaction.options.getChannel("textchannel");

            channel.send(text).then(async () => await replyMSG(`:white_check_mark: Se **ha enviado** el mensaje a <#${channel.id}>`, interaction))
            .catch(async () => await replyMSG(`:x: **Ha ocurrido un error**, vuelve a intentarlo`, interaction));
       }
    }
}
