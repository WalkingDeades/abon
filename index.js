const { Client, Collection, GatewayIntentBits, Partials, Intents } = require("discord.js");
const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.MessageContent], shards: "auto", partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.Reaction, Partials.GuildScheduledEvent, Partials.User, Partials.ThreadMember]});
const { prefix, owner, token } = require("./config.js");
const { readdirSync } = require("fs")
const moment = require("moment");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

//Altyapı discord.gg/neksare adresine aittir.
//İzinsiz paylaşılması ve kullanılması yasaktır.

client.commands = new Collection()

const rest = new REST({ version: '10' }).setToken(token);

const log = l => { console.log(`[${moment().format("DD-MM-YYYY HH:mm:ss")}] ${l}`) };

//command-handler
const commands = [];
const commandFiles = readdirSync('./src/commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./src/commands/${file}`);
  commands.push(command.data.toJSON());
  client.commands.set(command.data.name, command);
}

client.on("ready", async () => {
        try {
            await rest.put(
                Routes.applicationCommands(client.user.id),
                { body: commands },
            );
        } catch (error) {
            console.error(error);
        }
    log(`${client.user.username} Aktif Edildi!`);
})

//event-handler
const eventFiles = readdirSync('./src/events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const event = require(`./src/events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

//Altyapı discord.gg/neksare adresine aittir.
//İzinsiz paylaşılması ve kullanılması yasaktır.

//-----------------------------------------NEKSARE STUDİO---------------------------------------------//
const GALLERY_CHANNEL_ID = '1125898527927701617'; // Galeri kanalının ID'si
const SUPPORT_ROLE_ID = '1123529938910318702'; // Destek ekibi rolünün ID'si
const APPROVE_EMOJI = '✅'; // Onay emojisi
const REJECT_EMOJI = '❌'; // Reddet emojisi
const APPROVE_ROLE_NAME = 'Abone'; // Onay verildiğinde verilecek rolün adı

const userReactions = new Set();

client.on('ready', () => {
  console.log(`Bot giriş yaptı: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== GALLERY_CHANNEL_ID) return;

  if (message.attachments.size > 0) {
    await message.react(APPROVE_EMOJI);
    await message.react(REJECT_EMOJI);
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (!reaction.message.guild) return;
  if (reaction.message.channel.id !== GALLERY_CHANNEL_ID) return;

  const member = reaction.message.guild.members.cache.get(user.id);
  const supportRole = reaction.message.guild.roles.cache.get(SUPPORT_ROLE_ID);
  const approveRole = reaction.message.guild.roles.cache.find(role => role.name === APPROVE_ROLE_NAME);

  if (!supportRole) {
    console.log(`"${SUPPORT_ROLE_ID}" ID'sine sahip bir rol bulunamadı.`);
    return;
  }

  if (reaction.emoji.name === APPROVE_EMOJI) {
    if (!member.roles.cache.has(supportRole.id)) {
      reaction.users.remove(user.id);
      const warningMessage = 'Bu işlemi kullanabilmeniz için destek ekibi rolüne sahip olmanız gerekiyor.';
      user.send(warningMessage)
        .catch(error => {
          console.error('Uyarı mesajı gönderme hatası:', error);
        });
      return;
    }

    if (userReactions.has(user.id)) {
      reaction.users.remove(user.id);
      return;
    }

    userReactions.add(user.id);

    reaction.message.channel.send(`${user}, resim onaylandı.`);

    if (approveRole && reaction.message.author) {
      const memberToGrantRole = reaction.message.guild.members.cache.get(reaction.message.author.id);
      if (memberToGrantRole) {
        memberToGrantRole.roles.add(approveRole)
          .then(() => {
            console.log(`Kullanıcıya rol verildi: ${reaction.message.author.tag}`);
          })
          .catch((error) => {
            console.error('Rol verme hatası:', error);
          });
      }
    }

    // Emojilerin silinmesi
    reaction.message.reactions.removeAll().catch(error => {
      console.error('Emojileri silme hatası:', error);
    });

    // Kullanıcının tepkisini bir süreliğine engellemek için timer başlat
    setTimeout(() => {
      userReactions.delete(user.id);
    }, 5000); // Örneğin, 5 saniye boyunca kullanıcının tekrar tepki göndermesini engelle
  } else if (reaction.emoji.name === REJECT_EMOJI) {
    if (!member.roles.cache.has(supportRole.id)) {
      reaction.users.remove(user.id);
      const warningMessage = 'Bu işlemi kullanabilmeniz için destek ekibi rolüne sahip olmanız gerekiyor.';
      user.send(warningMessage)
        .catch(error => {
          console.error('Uyarı mesajı gönderme hatası:', error);
        });
      return;
    }

    if (userReactions.has(user.id)) {
      reaction.users.remove(user.id);
      return;
    }

    userReactions.add(user.id);

    reaction.message.channel.send(`${user}, resim reddedildi.`);

    // Emojilerin silinmesi
    reaction.message.reactions.removeAll().catch(error => {
      console.error('Emojileri silme hatası:', error);
    });

    // Kullanıcının tepkisini bir süreliğine engellemek için timer başlat
    setTimeout(() => {
      userReactions.delete(user.id);
    }, 5000); // Örneğin, 5 saniye boyunca kullanıcının tekrar tepki göndermesini engelle
  }
});

//-----------------------------------------NEKSARE STUDİO---------------------------------------------//

  
//Altyapı discord.gg/neksare adresine aittir.
//İzinsiz paylaşılması ve kullanılması yasaktır.

client.login(token);