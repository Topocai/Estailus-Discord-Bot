const DecorationChannels = require('../../models/DecorationChannels.js');

async function decorationChannels() {
    const guildDChannels = await DecorationChannels.findOne({
        guildID: process.env.GUILD_ID
    }).exec();


    if(decorationChannels == null) {}
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
          const dChannel = guild.channels.cache.get(`${dChannels[i].discord_channelID}`);

          if(dChannel == null) //Si el canal solicitado ya no existe se elimina de la DB
          {
            var newDChannels = dChannels.filter(elemento => elemento != dChannels[i])
            await guildDChannels.updateOne({
              channels: newDChannels
            });

            console.log(`Se ha removido de la lista el canal`);
          }
          else 
          {
            let titleUpdate = `${dChannels[i].title}`

            const NotifierModel = require('./models/Notifier.js');

            const notifier = await NotifierModel.findOne({
              guildID: process.env.GUILD_ID
            }).exec();

            const TwitchAPI = require('node-twitch').default;

            const twitch = new TwitchAPI({
                client_id: process.env.TwitchCLIENTID,
                client_secret: process.env.TwitchTOKEN 
            });

            if(titleUpdate.search(/{MemberCount}/) != -1) //VARIABLE CONTADOR DE MIEMBROS
            { 
              const MemberCount = guild.memberCount;
              const botsCount = await guild.members.cache.filter(member => member.user.bot).size;

              titleUpdate = titleUpdate.replace(/{MemberCount}/, `${MemberCount - botsCount}`);
            }

            if(titleUpdate.search(/{LiveStatus}/) != -1 && notifier != null && notifier.Twitch != []) //VARIABLE DE STREAM ON/OFF
            {
              const twitchUserName = await notifier.Twitch[0].twitchUser;
              await twitch.getStreams({ channel: `${twitchUserName}` }).then(async data => 
              {
                const r = data.data[0];

                if(r != undefined) 
                {
                  titleUpdate = titleUpdate.replace(/{LiveStatus}/, `ON`); //ON
                } 
                else titleUpdate = titleUpdate.replace(/{LiveStatus}/, `OFF`); //OFF
              });

            }
            /*
            if(titleUpdate.search(/{FollowCount}/) != -1 && notifier != null && notifier.Twitch != [])  //VARIABLE DE SEGUIDORES EN TWITCH
            {
              const twitchUserName = await notifier.Twitch[0].twitchUser;
              const twitchUserData = await twitch.getUsers(`${twitchUserName}`);
              console.log(twitchUserData + "\n\n");
              const follows = await twitch.getFollows({to_id: twitchUserData.data[0].id});
              console.log(follows)

              titleUpdate = titleUpdate.replace(/{FollowCount}/, follows.total);
            }*/ 
            dChannel.edit({name: titleUpdate}); //EDITAR EL CANAL
          }
        }
      }
    }   
}