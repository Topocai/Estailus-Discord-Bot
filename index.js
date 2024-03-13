require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const Discord = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers]})

//=======================================Enlistar Comandos==============================//

const { COMMANDS_TYPES } = require('./variables.js')

const commands = [];
const basicCommands = [];
const notifyCommands = [];

client.commands = new Discord.Collection();

client.interactionsList = new Discord.Collection();

function addCommandToClient(command, type) 
{
  client.commands.set(command.data.name, command);

  commands.push(command.data.toJSON());
  if (type == null) {}
  else if(type == COMMANDS_TYPES.BASIC_COMMANDS) basicCommands.push(command.data.toJSON());
  else if(type == COMMANDS_TYPES.NOTIFY_COMMANDS) notifyCommands.push(command.data.toJSON());

  console.log(`Añadido ${command.data.name}`);
}

module.exports = { addCommandToClient, commands, basicCommands, notifyCommands };


//===================================================INICIALIZACIÓN DEL BOT====================================//

client.once('ready', async () => 
{
  console.log(`El bot se ha iniciado`);

  const rest = new REST({version: 10}).setToken(process.env.TOKEN);

  const commandsFunctions = require("./functions/commands.js");
  await commandsFunctions.getAllCommands();
/*
  try 
  {
      console.log(`Cargando ${commands.length} comandos locales.`);
      await rest.put
      (
          Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
          {body: commands}
      )
      .then((result) => 
      {
        for (const item of result) 
        {
          client.interactionsList.set(item.name, item);
          console.log(`Interacción añadida: \n${item.name}`);
        }
      });

  } catch(error) 
  {
    console.error(`Error al cargar los comandos\n${error}`);
  }*/
  try 
  {
      console.log(`Cargando ${commands.length} comandos globales.`);
      await rest.put
      (
          Routes.applicationCommands(process.env.CLIENT_ID),
          {body: commands}
      )
      .then((result) => 
      {
        for (const item of result) 
        {
          console.log(`Interacción ${item.name} añadida`)
          client.interactionsList.set(item.name, item);
        }
      });

  } catch(error) 
  {
    console.error(`Error al cargar los comandos\n${error}`);
  }

});

const DecorationChannels = require('./models/DecorationChannels.js');

async function decorationChannels() {

    const decorationChannels = await DecorationChannels.findOne({
        guildID: process.env.GUILD_ID
    }, async (err) => 
    {
      if(err) return console.error(err);
    });


    if(decorationChannels == null) {}
    else 
    {
      const dChannels = await decorationChannels.channels;

      if(dChannels == null || dChannels.length == 0) {}

      else 
      {
        for (let i = 0; i < dChannels.length; i++)
        {
          const guild = client.guilds.cache.get(`${process.env.GUILD_ID}`);
          await guild.members.fetch();
          const dChannel = guild.channels.cache.get(`${dChannels[i].id}`);

          if(dChannel == null) //Si el canal solicitado ya no existe se elimina de la DB
          { 
            var newDChannels = dChannels.filter(elemento => elemento != dChannels[i])
            await decorationChannels.updateOne({
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
            }, err => 
            {
              if (err) return console.error(err);
            });

            const TwitchAPI = require('node-twitch').default;

            const twitch = new TwitchAPI({
                client_id: process.env.TwitchCLIENTID,
                client_secret: process.env.TwitchTOKEN 
            });

            if(titleUpdate.search(/{MemberCount}/) != -1) //VARIABLE CONTADOR DE MIEMBROS
            { 
              const MemberCount = guild.memberCount;
              const botsCount = await guild.members.cache.filter(member => member.user.bot).size;

              console.log("Bots: " + botsCount)

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
              console.log("HEre")
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
setInterval(
  decorationChannels, 10000
);
//////////////////////////////////////////////////NOTIFICATIONS////////////////////////////////////////////////////

const { twitchNotify, youtubeNotification } = require('./functions/loopFunctions/notifications.js');



twitchNotify(client);

setInterval(
  twitchNotify, 66000, client
)

youtubeNotification(client);

setInterval(
  youtubeNotification, 90000, client
)

//===================================================COMMAND HANDLER=========================================================//

const cooldowns = new Discord.Collection();

client.on('interactionCreate', async interaction => 
{
  if(!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if(!command) return interaction.reply(`:x: No se ha encontrado el comando ${interaction.commandName}`);

  if(command.cooldown)
    if(!cooldowns.has(command.data.name)) cooldowns.set(command.data.name, new Discord.Collection());

  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;

  if(timestamps.has(interaction.user.id)) 
  {
      const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
      if(now < expirationTime) 
      {
          const timeLeft = (expirationTime - now) / 1000;
          const embed = new Discord.EmbedBuilder()
          .setColor("#2F3136")
          .setDescription(`❕ Tienes que esperar \`${timeLeft.toFixed(1)}\` segundos antes de volver a usar este comando.`);
          return interaction.reply({embeds: [embed]});
      }
  }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try 
    {
        await command.execute(interaction, client); // <===== EJECUTA EL COMANDO
    } 
    catch(error) 
    {
        console.error(error);
    }
});

const mongoose = require('mongoose');

const dbOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
};

mongoose.connect(`mongodb+srv://${process.env.usernameDB}:${process.env.passwordDB}@estilistascluster.s34qj.mongodb.net/EstilistasBot?retryWrites=true&w=majority`, dbOptions);

mongoose.connection.on('connected', () => {
  console.log('¡[Mongoose] se ha conectado correctamente!');
});

mongoose.connection.on('err', err => {
  console.error(`[Mongoose] error de conexion: \n${err.stack}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[Mongoose] Conexion perdida');
});


process.on('unhandledRejection', error => {
  console.error('ERROR CRITICO:', error);
});

client.login(process.env.TOKEN);