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
 * La fonction 'getEvents' renvoie la liste des événements  
 * en fonction du nom de la guilde et de l'alliance. * 
 */
const getEvents = async () => {
    try {
        //On récupére les 52 événements donnés par l'API Albion Online.
       const res = await axios.get('https://gameinfo.albiononline.com/api/gameinfo/events?limit=10&offset=0');
       // Sur ces 52 événements, on applique un filtre pour ne conserver que ceux en rapport
       // avec la guilde et l'alliance du fichier de configuration.
       let events = res.data.filter(e =>
                    e.Killer.GuildName == config.guildName ||
                    e.Victim.GuildName == config.guildName ||
                    e.Killer.AllianceName == config.allianceName || 
                    e.Victim.AllianceName == config.allianceName );
        // On tri les événements du plus ancien au plus récent ( via leur EventId)
        events.sort((a,b) => a.EventId - b.EventId);
        return events;
    }catch (err) {
        throw "Erreur dans la fonction 'getEvents' du fichier 'module/albionAPI.js'";
    }
};

module.exports = { 
    getEvents,
    IsOnline
}
