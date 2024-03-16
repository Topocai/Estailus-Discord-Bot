const DecorationChannels = require('../../models/DecorationChannels.js');

const { ALL_VARS, TWITCH_VARS, getArg, categories } = require('./decoration-vars.js');

async function decorationChannelsLoop(client) {
    const guildDChannels = await DecorationChannels.findOne({
        guildID: process.env.GUILD_ID
    }).exec();


    if(guildDChannels == null) {}
    else 
    {
      const dChannels = await guildDChannels.channels;

      if(dChannels == null || dChannels.length == 0) {}

      else 
      {
        const guild = client.guilds.cache.get(guildDChannels.guildID);
        for (let i = 0; i < dChannels.length; i++)
        {
        
          await guild.members.fetch();

          const dChannel = dChannels[i];
          const discord_Channel = guild.channels.cache.get(`${dChannel.discord_channelID}`);
          

          if(discord_Channel == null) //Si el canal solicitado ya no existe se elimina de la DB
          {
            var newDChannels = dChannels.filter(elemento => elemento != dChannel)
            await guildDChannels.updateOne({
              channels: newDChannels
            });

            console.log(`Canal ${dChannel.displayTitle} eliminado de la DB por no existir en el servidor.`);
          }
          else 
          {
            const NotifierModel = require('../../models/Notifier.js');

            const notifier = await NotifierModel.findOne({
              guildID: process.env.GUILD_ID
            }).exec();

            const dChannelElements = dChannel.titleElements;
            const dChannelVars = dChannel.variables;

            const newVariablesValues = [...dChannelElements];

            for(let i = 0; i < dChannelVars.length; i++) 
            {
                const actualVar = dChannelVars[i];
                const elementIndex = dChannelElements.findIndex(element => element.includes(actualVar));

                const args = ALL_VARS[actualVar].hasArgs ? getArg(dChannelElements[elementIndex]) : null;
                const variableValue = await ALL_VARS[actualVar].get_function(args, {guild_id: guildDChannels.guildID});

                newVariablesValues[elementIndex] = variableValue;
            }

            const newDisplayTitle = newVariablesValues.join(' ');

            if(newDisplayTitle == dChannel.displayTitle) return console.log("Sin cambios que registrar");

            discord_Channel.edit({name: newDisplayTitle}); //EDITAR EL CANAL
           
            dChannel.variablesValues = newVariablesValues;
            dChannel.displayTitle = newDisplayTitle;

            await guildDChannels.updateOne({
              channels: dChannels
            });
          }
        }
      }
    }   
}

module.exports = { decorationChannelsLoop };