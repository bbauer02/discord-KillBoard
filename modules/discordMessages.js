const Discord = require('discord.js');
const config = require('../config.json');

const status = async (client, titre, message,couleur, botChannel) => { 
    const messageEmbed = new Discord.MessageEmbed()
        .setColor(couleur)
        .setTitle(`:crossed_swords: ${titre}`)
        .setThumbnail(`https://i.ibb.co/SB8bbkf/avatar.png`)
        .setDescription(message)   
        .setFooter(config.credit);
        
        client.channels.fetch(botChannel).then(channel => {
            channel.send(messageEmbed);
          });

}


module.exports = { 
    status
}
