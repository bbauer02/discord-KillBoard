const Discord = require('discord.js');
const config = require('./config.json');
const Albion = require('./modules/albionAPI');
const FileSync = require('lowdb/adapters/FileSync');
const low = require('lowdb');
const adapter = new FileSync('../LastKill.json');
const db = low(adapter);
const killBoardMessage = require('./modules/discordMessages');
const killBoard = require('./modules/killboard.js');

/*(async () => {

    const events = await Albion.getEvents();
    events.map(async event => {
        var kb = new killBoard.killboard();
        await kb.init(event);
        await kb.addInventory();
    });

})();*/






if(!db.has('recents.eventId').value())
{
    db.defaults({ recents: { eventId: 0 } }).write();
}
const client = new Discord.Client();
client.on('ready', async () => {
  // Temp permet d'éviter d'afficher le status du serveur à chaque interval.
        let temp = 0;
        setInterval( async () => { 
            //On récupére le status du serveur ALBION
            try {
                const serverStatus = await Albion.IsOnline();
                //Si le serveur est en ligne
                if(serverStatus === true  ) 
                {
                    if(temp !== serverStatus) 
                    {
                        killBoardMessage.status(client,`Killbot version ${config.version}`, `Le serveur ALBION est en ligne !`,"#00ff06");
                        temp = serverStatus;
                    }
                    // On récupére l'ensemble des événements. 
                    const events = await Albion.getEvents();
                    if(Object.keys(events).length > 0)
                    {
                        // On récupére l'eventId du dernier élément de la liste.
                        const lastEventId = events[Object.keys(events).length-1]["EventId"];
                        // On récupére l'eventId enregistré dans le fichier 'LastKill.json'.
                        const lastRecordedEventId = db.get('recents.eventId').value();  
                        // Si les deux valeurs sont différentes 
                        if(lastRecordedEventId != lastEventId) 
                        {
                            //on met à jour le fichier 'LastKill.json' 
                            db.set('recents.eventId', lastEventId).write();
                            // On va générer alors le rapport.
                            events.map(async event => {
                                var kb = new killBoard.killboard();
                                await kb.init(event);
                                const imgBuffers =  await Promise.all([kb.make(),kb.addInventory()]);
                                let ReportBuffer = imgBuffers[0];
                                let InventoryBuffer = imgBuffers[1];

                                let files = [{ name: 'KillBoard.png', attachment: ReportBuffer }];
                                let title = "";
                                let color = "";
                                if(event.Killer.GuildName == config.guildName) {
                                    title = `:crossed_swords: ${event.Killer.Name} a tué ${event.Victim.Name}! `;
                                    color = "#00ff06";
                                }
                                else {
                                    title = `:poop:  ${event.Victim.Name} a été tué par ${event.Killer.Name} :cry:  `;
                                    color = "#ff0000";
                                }
                                const messageKillBoard = new Discord.MessageEmbed()
                                    .setURL(`https://albiononline.com/en/killboard/kill/${event.EventId}`)
                                    .setColor(color)
                                    .setTitle(title)
                                    .attachFiles(files)
                                    .setImage('attachment://KillBoard.png')
                                    .setFooter(`KillBot en exclusivité pour les 'Black Bear" `);
                                    client.channels.fetch(config.botChannel).then(channel => {
                                        channel.send(messageKillBoard);
                                        if(InventoryBuffer !== false)
                                        {
                                            files = [{ name: 'inventaire.png', attachment: InventoryBuffer }];
                                            embed = {
                                                url: `https://albiononline.com/en/killboard/kill/${event.EventId}`,
                                                title: ` :gift: Inventaire de :  ${event.Victim.Name}! :gift: `,
                                                color:  "#5b2d00",
                                                image: { url: 'attachment://inventaire.png' },
                                            };
                                            channel.send({embed,files});
                                        }
                                    });

                            });
                        }

                    }
                } // Si le serveur est Hors Ligne.
                else if(serverStatus === false  && temp !== serverStatus) 
                {
                    temp = serverStatus;
                    killBoardMessage.status(client,`Killbot version ${config.version}`, `Le serveur ALBION est hors ligne !`,"ff0000");
                }
            }
            catch(err) {
                console.log(err);
            }
        },50000);


});



  client.login(config.token);

  