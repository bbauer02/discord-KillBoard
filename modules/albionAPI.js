const config = require('../config.json');
const axios = require('axios');
/********
 * La fonction 'IsAlbionServeurOnline' renvoie "true" si le serveur est en ligne 
 * "false" si le serveur est hors ligne. 
 */
async function IsOnline() {
    try
    {
        let stream = await axios.get('http://live.albiononline.com/status.txt');
        let jsonStatus = JSON.parse(stream.data.replace(/\n/g, ' ').replace(/\r/g, '').trim());
        if(jsonStatus.status == "online") {
            return true;
        } 
        else {
            return false;
        }
    }
    catch(err) {
        throw "Erreur dans la fonction 'IsOnline' du fichier 'module/albionAPI.js'";
    }

}
/********
 * La fonction 'filter_by_guild' renvoie true  
 * si les conditions sont remplies et permet de filtrer la liste des evénements en ne gardant que les guildes passées en paramètre. * 
 */
const filter_by_alliance_guild = (guildSubscribers,allianceSubscribers) => (event) => {
        if(allianceSubscribers.length > 0) {
            for (const key in allianceSubscribers) {
                if(event.Killer.AllianceName == allianceSubscribers[key].allianceName || event.Victim.AllianceName == allianceSubscribers[key].allianceName ) 
                {
                    return true;
                }
            }
        }

        if(guildSubscribers.length > 0) {
            for (const key in allianceSubscribers) {
                if(event.Killer.GuildName == guildSubscribers[key].guildName || event.Victim.GuildName == guildSubscribers[key].guildName ) 
                {
                    return true;
                }
            }
        }

}

/********
 * La fonction 'getEvents' renvoie la liste des événements  
 * en fonction du nom de la guilde et de l'alliance. * 
 */
const getEvents = async (guildSubscribers, allianceSubscribers) => {
    try 
    {
        //On récupére les 52 événements donnés par l'API Albion Online.
        const res = await axios.get('https://gameinfo.albiononline.com/api/gameinfo/events?limit=51&offset=0');
       // Sur ces 52 événements, on applique un filtre pour ne conserver que ceux en rapport
       // avec la guilde
  
        let events = res.data.filter(filter_by_alliance_guild(guildSubscribers,allianceSubscribers));
        console.log("Nombre d'événements filtré : " + Object.keys(events).length);
    // On tri les événements du plus ancien au plus récent ( via leur EventId)   
        events.sort((a,b) => a.EventId - b.EventId);
        return events;
    }
    catch (err) {
        if(err.response.status == 502) {
            console.log("Erreur 502 : Bad Gateway");
            await new Promise(r => setTimeout(r, 5000));
            return getEvents(guildSubscribers, allianceSubscribers);
        }
        else if(err.response.status == 504) {
            console.log("Erreur 504 : Gateway Time-Out");
            await new Promise(r => setTimeout(r, 5000));
            return getEvents(guildSubscribers, allianceSubscribers);
        }
        else {
            throw err;
        }
    }
};

module.exports = { 
    getEvents,
    IsOnline
}
