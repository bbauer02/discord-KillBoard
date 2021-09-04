"use strict";
const Jimp      = require('jimp');
const coords    = require('./coords');
const fs = require("fs");
const mysql = require('mysql');
const config = require('../config.json');

const db_config = {
        connectionLimit : 2,
        host: config.MYSQL_HOST,
        port: config.MYSQL_PORT,
        user: config.MYSQL_USER,
        password: config.MYSQL_PASSWORD,
        database: config.MYSQL_DATABASE
  };
  const pool  = mysql.createPool(db_config);



class killboard {
// On initialise l'objet 'KillBoard'
    async init(event) {
        this.event                          =      event;
        this.FONT_PLAYER_NAME               =      await Jimp.loadFont("./fonts/myriadpro_26_grey.fnt");
        this.FONT_GUILD_NAME                =      await Jimp.loadFont("./fonts/myriadpro_22_grey.fnt");
        this.FONT_IP_DPS                    =      await Jimp.loadFont("./fonts/myriadpro_15_grey.fnt");
        this.FONT_QUANTITY                  =      await Jimp.loadFont("./fonts/myriadpro_14_white.fnt"); 
        this.FONT_PARTICIPANT_NAME          =      await Jimp.loadFont("./fonts/myriadpro_14_grey.fnt"); 
        this.FONT_IP_PARTICIPANT            =      await Jimp.loadFont("./fonts/myriadpro_14_darkred.fnt");
        this.FONT_HEAL                      =      await Jimp.loadFont("./fonts/myriadpro_14_blue.fnt");
        this.FONT_FAME_RED                  =      await Jimp.loadFont("./fonts/myriadpro_30_red.fnt");
        this.FONT_FAME                      =      await Jimp.loadFont("./fonts/myriadpro_30_grey.fnt");
       
        this.background                     =      await Jimp.read('./img/background.png'); 
        
        
        
    }


// Afficher un joueur aux coordonnées passées en paramêtres
    addName(playerName, coords) {
        const NameWidth      = Jimp.measureText(this.FONT_PLAYER_NAME, playerName);
        const NameHeight     = Jimp.measureTextHeight(this.FONT_PLAYER_NAME, playerName);
        this.background.print(this.FONT_PLAYER_NAME, coords.x - (NameWidth/2) , coords.y,
            {   
            text: playerName,
            }, NameWidth, NameHeight);
    }

// Afficher la guilde du tueur
    addGuild(guildName, allianceName, coords) {
        if( guildName != "")
        {
            guildName        = (allianceName != "") ? "["+allianceName+"]" + guildName : guildName;
            const guildWidth      = Jimp.measureText(this.FONT_GUILD_NAME,guildName);
            const guildHeight     = Jimp.measureTextHeight(this.FONT_GUILD_NAME,guildName);
            this.background.print( this.FONT_GUILD_NAME , coords.x - (guildWidth/2) , coords.y,
            {   
            text: guildName,
            }, guildWidth, guildHeight);
        }
    }
// Afficher l'IP du Tueur
    addItemPower(ItemPower,coords) {

        let itemPower  = Math.round(ItemPower).toLocaleString();
        const ipWidth      = Jimp.measureText(this.FONT_IP_DPS, itemPower);
        const ipHeight     = Jimp.measureTextHeight(this.FONT_IP_DPS, itemPower);
        this.background.print( this.FONT_IP_DPS , coords.x, coords.y,
        {   
            text: itemPower,
        },  ipWidth, ipHeight);
    }

// Afficher l'équipement
    async addEquipment(equipments, coords) {
        
        for(const name in equipments)
        {
            if(equipments[name] != null)
            {
                const iconUrl = await this.getItemPath(equipments[name]);
                let icon = await Jimp.read(iconUrl);
                let quantityWidth  =  Jimp.measureText(this.FONT_QUANTITY, `${equipments[name]["Count"]}`);
                let quantityHeight =  Jimp.measureTextHeight(this.FONT_QUANTITY, `${equipments[name]["Count"]}`); 
                let decalage = 0;
                if(equipments[name]["Count"] >= 10 ) decalage = 5;
                icon.print(this.FONT_QUANTITY, 68 - decalage ,63,
                {   
                    text: `${equipments[name]["Count"]}`,
                }, quantityWidth, quantityHeight);  
                await this.background.composite(icon, coords[name]["x"]  ,coords[name]["y"]  );
            }
        }
    }
// Afficher l'équipement des participants
    async addEquipmentParticipant(equipments, x,y) {
        for(const name in equipments)
        {
          if(equipments[name] != null && name != "Mount" &&  name != "Potion" &&  name != "Food")
            {
                const iconUrl = await this.getItemPath(equipments[name]);
                let icon = await Jimp.read(iconUrl); 
                await icon.resize(48, 48);
                await this.background.composite(icon, x  ,y  );
                x += 45;
            }
        }
    }
// Ajouter les participants
    async addParticipants(participants) {
        let positionX = 340;
        let positionY = 150;

  
        if(this.event.groupMemberCount > 1 ) {
            await this.background.print(this.FONT_GUILD_NAME , 339 ,125,"Participants"); 
        }
        else {
            await this.background.print(this.FONT_GUILD_NAME , 339 ,125,"Aucun participant !");
        }
           
            for(const key in participants)
            {
                if(participants[key]["Name"] != this.event.Killer.Name)
                {
                    // Ajout de la ligne de séparation entre participants
                    const separator = await Jimp.read('./img/line.png'); 
                    await this.background.composite(separator, positionX ,positionY);
                    positionY += 5;
                    // Ajout du nom des participants
                    const participantWidth = Jimp.measureText(this.FONT_PARTICIPANT_NAME, participants[key]["Name"]);
                    await this.background.print(this.FONT_PARTICIPANT_NAME ,positionX,positionY,participants[key]["Name"]);            
                    // Ajout de l'IP des participants
                    const IPtxtWidth = Jimp.measureText(this.FONT_IP_PARTICIPANT, "IP:");
                    const ipTxtPosition = positionX + participantWidth + 5;
                    await this.background.print(this.FONT_IP_PARTICIPANT ,ipTxtPosition ,positionY,"IP:");                         
                    const ip =  Math.round(participants[key]["AverageItemPower"]).toLocaleString();
                    const IPWidth = Jimp.measureText(this.FONT_PARTICIPANT_NAME, ip);
                    const ipValuePosition = ipTxtPosition + IPtxtWidth;
                    await this.background.print(this.FONT_PARTICIPANT_NAME , ipValuePosition ,positionY,ip);            
                
                    // Ajout des dégats des participants
                    const HittxtWidth = Jimp.measureText(this.FONT_IP_PARTICIPANT, "HIT:");
                    const HitTxtPosition = ipValuePosition + IPWidth + 5;
                    await this.background.print(this.FONT_IP_PARTICIPANT ,HitTxtPosition ,positionY,"HIT:");   
                    const HitValuewidth = Jimp.measureText(this.FONT_PARTICIPANT_NAME, Math.floor(participants[key]["DamageDone"]).toLocaleString());
                    const HitValuePosition = HitTxtPosition + HittxtWidth;
                    await this.background.print(this.FONT_PARTICIPANT_NAME , HitValuePosition ,positionY,Math.floor(participants[key]["DamageDone"])); 
                    // Ajout des soins s'ils ne sont pas nul
                    if( participants[key]["SupportHealingDone"] > 0) {
                        const HEALtxtWidth = Jimp.measureText(this.FONT_HEAL, "HEAL:");
                        const HealTxtPosition = HitValuePosition + HitValuewidth + 5;
                        await this.background.print(this.FONT_HEAL ,HealTxtPosition ,positionY,"HEAL:"); 
                        const HealValuewidth = Jimp.measureText(this.FONT_PARTICIPANT_NAME, Math.floor(participants[key]["SupportHealingDone"]).toLocaleString());
                        const HealtValuePosition = HealTxtPosition + HEALtxtWidth;
                        await this.background.print(this.FONT_PARTICIPANT_NAME , HealtValuePosition ,positionY,Math.floor(participants[key]["SupportHealingDone"])); 
                    }
                    positionY += 15;
                    await this.addEquipmentParticipant(participants[key]["Equipment"],positionX,positionY );
                    positionX = 340;


                    positionY += 50; 
                }
                else {
                    await this.background.print(this.FONT_IP_DPS , 277 ,484,Math.floor(participants[key]["DamageDone"])); 
                }
            }

    }
// Ajouter la Fame
    async addFame() {
        
        const libelleWidth = Jimp.measureText(this.FONT_FAME_RED, "FAME:");
        const Fame = this.numerWithSpaces(this.event.TotalVictimKillFame);
        const fameWidth = Jimp.measureText(this.FONT_FAME,Fame.toLocaleString() );
        const totalWidth = libelleWidth + 5 + fameWidth;
        await this.background.print(this.FONT_FAME_RED ,496-(totalWidth/2),72,"FAME:"); 
        await this.background.print(this.FONT_FAME ,496-(totalWidth/2) + libelleWidth,72,Fame);

    }
// Ajouter l'inventaire de la victime
    async addInventory() {
        return new Promise(async (resolve, reject) => {
            let largeur = 772;
            let hauteur = 105;

            let x = 11;
            let y = 7;

            // Slots d'inventaire complet,sans les slots vide.
            let inventaire = this.event.Victim.Inventory.filter(x => x != null);
            let ItemsCount = inventaire.length;
            if(ItemsCount > 0 ) 
            {
                
                let nbrligne =   Math.ceil(ItemsCount / 8)
                this.inventaireBG = await Jimp.read('./img/inventaire.png');
                this.inventaireBG.resize(largeur, hauteur*nbrligne);
                let nbItemSurLigne = 0;
                for(const item in inventaire) 
                {
                    if(nbItemSurLigne == 8 ) {
                        x = 11;
                        y += hauteur;
                        nbItemSurLigne = 0;
                    }
                    
                    let pictPath = await this.getItemPath(inventaire[item]);
                    let Icon = await Jimp.read(pictPath);

                    let decalage = 0;
                    if(inventaire[item]["Count"] >= 10 ) decalage = 5;
                    Icon.print(this.FONT_QUANTITY,68 - decalage,63,inventaire[item]["Count"].toLocaleString());
                    
                    await  this.inventaireBG.composite(Icon, x ,y);
                    x += 94;
                    nbItemSurLigne++;

                }
                
                for (let index = nbItemSurLigne; index <=7; index++) {
                    let emptyBag = await Jimp.read('./img/empty_slot.png');
                    await  this.inventaireBG.composite(emptyBag, x ,y);  
                    x += 94;
                }
               // this.inventaireBG.writeAsync(`img/test/${Date.now()}.png`);
                this.inventaireBG.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                    if (err )
                    { 
                        reject(err); 
                    }
                    else {
                        resolve(buffer);
                    }
                });
            }
            else 
            {
                resolve(false);
            }
            
        });
        
    }
// Générer l'URL des icones des équipements
    getItemUrl(item) {
        return item && [
            'https://render.albiononline.com/v1/item/',
            `${item.Type}.png`,
            `?count=${item.Count}`,
            `&quality=${item.Quality}`,
          ].join('');
      }
// Obtenir l'URL des icones des équipements en fonction de leur localisation : 
// Si l'image existe sur notre serveur, alors l'uutiliser, sinon la télécharger dans le cas contraitre.
    async  getItemPath(item) 
    {
        try 
        {
            let directory = `./img/icons/`;
            let filename = `${item.Type}_${item.Quality}.png`;
            let filePath = directory+filename;
            if (fs.existsSync(filePath)) 
            {
                return filePath;
            }
            else 
            {
                let url =  this.getItemUrl(item);
                let icon = await Jimp.read(url);
                await icon.resize(95, 95);
                await icon.writeAsync(`${filePath}`);
                return filePath;
            }
        }
        catch (err )
        {
            console.log("ERREUR : " + `${item.Type}_${item.Quality}.png`);
            return this.getItemPath(item);
            //throw "*****************Erreur dans la fonction getItemPath() : \n " + err;
        }
    }
// Format les chiffres trop long.
    numerWithSpaces(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
// On assemble toutes les pièces
    async make() {
        return new Promise (async (resolve, reject) => {
            this.addName(this.event.Killer.Name, coords.Killer.Name);
            this.addName(this.event.Victim.Name, coords.Victim.Name);
            this.addGuild(this.event.Killer.GuildName,this.event.Killer.AllianceName,coords.Killer.GuildName);
            this.addGuild(this.event.Victim.GuildName,this.event.Victim.AllianceName,coords.Victim.GuildName);
            this.addItemPower(this.event.Killer.AverageItemPower,coords.Killer.ItemPower);
            this.addItemPower(this.event.Victim.AverageItemPower,coords.Victim.ItemPower);
            await this.addEquipment(this.event.Killer.Equipment,coords.Killer.Equipment);
            await this.addEquipment(this.event.Victim.Equipment,coords.Victim.Equipment);
            await this.addParticipants(this.event.Participants);
            await this.addFame();
            // await this.background.writeAsync(`img/test/${Date.now()}.png`);
            //return await this.background.getBufferAsync(Jimp.MIME_PNG);
            this.background.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
                if (err) 
                { 
                    reject(err); }
                else {
                      resolve(buffer);
                  }
              });
        });
    }


}
/********
 * La fonction 'filtre' renvoie true  
 * si les conditions sont remplies et permet de filtrer la liste des evénements en ne gardant que les alliances passées en paramètre. * 
 */

const getGuildSubscribers = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id,channelid,guildName, isactive FROM killbot_guilds WHERE isactive = 1`;
        pool.query(sql, (err, resp) => {
            if(err) {
                reject(err);
            }
            else {
                const table = [];
                resp.forEach(element => {
                    let obj = {
                            'guildName' : element.guildName,
                            'channelid' : element.channelid
                        };  
                    
                    table.push(obj);
                    
                });
                resolve(table);
            }
        });
    });
}
const getAllianceSubscribers = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id,channelid,allianceName, isactive FROM killbot_alliances  WHERE isactive = 1`;
        pool.query(sql, (err, resp) => {
            if(err) {
                reject(err);
            }
            else {
                const table = [];
                resp.forEach(element => {
                    let obj = {
                            'allianceName' : element.allianceName,
                            'channelid' : element.channelid
                        };  
                    
                    table.push(obj);
                    
                });
                resolve(table);
            }
        });
    });
}
module.exports = { 
    killboard,
    getGuildSubscribers,
    getAllianceSubscribers
}


