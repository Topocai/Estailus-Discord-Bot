const Discord = require('discord.js');

/**
 * 
 * @param {string} content - Contenido del Embed "Hola buenas tardes"
 * @param {string=} color - Color del Embed "#33FF22"
 * @param {string=} footer - { text: "Texto", iconURL: URL }
 * @return {Discord.Embed}
 */
const defaultEmbed = ({content, color, footer}) => 
{
    content = content != undefined ? content : "Texto no especificado";
    color = color != undefined ? color: "#2F3136";

    if(footer != undefined) 
    {
        const embed = new Discord.EmbedBuilder()
        .setColor(color)
        .setDescription(`${content}.`)
        .setFooter(footer);

        return embed;
    } 
    else 
    {
        const embed = new Discord.EmbedBuilder()
        .setColor(color)
        .setDescription(`${content}.`);

        return embed;
    }
}

const replyMSG = async (content, interaction, suggestion, color) => 
{
    var replyContent = `> ${content}`;
    var color = color != null ? color: "#2F3136"; 

    if(suggestion != null) {
        const embed = new Discord.EmbedBuilder()
        .setColor(color)
        .setDescription(`${replyContent}.`)
        .setFooter({text: `Sugerencia: ${suggestion}.`});

        await interaction.reply({embeds: [embed]});
    } else {
        const embed = new Discord.EmbedBuilder()
        .setColor(color)
        .setDescription(`${replyContent}.`);

        await interaction.reply({embeds: [embed]});
    }
}

module.exports = { replyMSG, defaultEmbed };