const Discord = require('discord.js');
const config = require('./config.json');
const Albion = require('./modules/albionAPI');
const FileSync = require('lowdb/adapters/FileSync');
const low = require('lowdb');
const adapter = new FileSync('./LastKill.json');
const db = low(adapter);
const killBoardMessage = require('./modules/discordMessages');
const killBoard = require('./modules/killboard.js');
const quote = require('./quotes.json');
const nbrQuotes = quote.length;
/*
(async () => {

    const events = await Albion.getEvents();

    //console.log(events);
    events.map(async event => {
        console.log("[" + event.Killer.AllianceName + "]"  + event.Killer.Name + " VS " +  "[" + event.Victim.AllianceName + "]"  + event.Victim.Name);
       
        var kb = new killBoard.killboard();
        await kb.init(event);
        await kb.addInventory();
    });

})();
*/



if(!db.has('recents.eventId').value())
{
    db.defaults({ recents: { eventId: 0 } }).write();
}
const client = new Discord.Client();
client.on('ready', async () => {
    console.log(`Serveur Killboard ${config.version} Start`);
    const guildSubscribers = await killBoard.getGuildSubscribers(); 
    const allianceSubscribers = await killBoard.getAllianceSubscribers();
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
                        //On affiche le status du serveur ALbion sur tout les Serveurs DIscord Inscrit
                        guildSubscribers.forEach(guildSubscriber => {
                            killBoardMessage.status(client,`Killbot version ${config.version}`, `Le serveur ALBION est en ligne !`,"#00ff06", guildSubscriber.channelid);
                        });
                        //On affiche le status du serveur ALbion sur tout les Serveurs DIscord Inscrit
                        allianceSubscribers.forEach(allianceSubscriber => {
                            killBoardMessage.status(client,`Killbot version ${config.version}`, `Le serveur ALBION est en ligne !`,"#00ff06", allianceSubscriber.channelid);
                        });
                                                
                        
                        temp = serverStatus;
                    }
                    // On récupére l'ensemble des événements. 
                    const events = await Albion.getEvents(guildSubscribers,allianceSubscribers);
                   // console.log(events[Object.keys(events).length-1])
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
                                let title = `:poop:  ${event.Victim.Name} a été tué par ${event.Killer.Name} :cry:  `;
                                let color = "#ff0000";

                                guildSubscribers.forEach(guildSubscriber => {
                                   if(event.Killer.GuildName == guildSubscriber.guildName ) 
                                   {
                                        title = `:crossed_swords: ${event.Killer.Name} a tué ${event.Victim.Name}! `;
                                        color = "#00ff06";
                                   }
                                });
                                allianceSubscribers.forEach(allianceSubscriber => {
                                    if(event.Killer.AlliancedName == allianceSubscriber.allianceName ) 
                                    {
                                         title = `:crossed_swords: ${event.Killer.Name} a tué ${event.Victim.Name}! `;
                                         color = "#00ff06";
                                    }
                                 });


                                 const quoteNumber = Math.floor(Math.random() * nbrQuotes);
                                const messageKillBoard = new Discord.MessageEmbed()
                                    .setURL(`https://albiononline.com/en/killboard/kill/${event.EventId}`)
                                    .setDescription(quote[quoteNumber].quote + "\n" +"**" + quote[quoteNumber].autheur + "**")
                                    .setColor(color)
                                    .setTitle(title)
                                    .attachFiles(files)
                                    .setImage('attachment://KillBoard.png')
                                    .setFooter(`KillBot en exclusivité pour les 'Black Bear" et l'alliance 'OMBRE' `);
                                    // DISPATCH LES MESSAGES SUR LES DISCORDS CONCERNE
                                    // Sur Discord des Alliances

                                        let subscriberalliance = allianceSubscribers.filter(subscriber => subscriber.allianceName == event.Killer.AllianceName || subscriber.allianceName == event.Victim.AllianceName);
                                        if(subscriberalliance.length > 0)
                                        {
                                            client.channels.fetch(subscriberalliance[0].channelid).then(channel => {
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
                                        }


                                    // Sur Discord des Guildes
                                        let subscriber = guildSubscribers.filter(subscriber => subscriber.guildName == event.Killer.GuildName || subscriber.guildName == event.Victim.GuildName);
                                        if(subscriber.length > 0)
                                        {
                                            client.channels.fetch(subscriber[0].channelid).then(channel => {
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
                                        }


                            });
                        }

                    }
                    else {
                        console.log("Aucun événement de filtré !");
                    }
                } // Si le serveur est Hors Ligne.
                else if(serverStatus === false  && temp !== serverStatus) 
                {
                    temp = serverStatus;
                    guildSubscribers.forEach(guildSubscriber => {
                        killBoardMessage.status(client,`Killbot version ${config.version}`, `Le serveur ALBION est hors ligne !`,"ff0000", guildSubscriber.channelid);
                    });
                    allianceSubscribers.forEach(allianceSubscriber => {
                        killBoardMessage.status(client,`Killbot version ${config.version}`, `Le serveur ALBION est hors ligne !`,"#ff0000", allianceSubscriber.channelid);
                    });
                   
                }
            }
            catch(err) {
                var currentdate = new Date(); 
                var datetime = "[" + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds() + "]";
                console.log(datetime +"  " + err);
            }
        },30000);


});



  client.login(config.token);

  