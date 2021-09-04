
const axios = require('axios');
const moment = require("moment");
const EVENTS_ENDPOINT = "https://gameinfo.albiononline.com/api/gameinfo/events";
const EVENTS_LIMIT = 51;
const EVENTS_COLLECTION = "events";
const EVENT_KEEP_HOURS = 2;

(
    async () =>  {

        try 
        {
            let offset = 1;
            //On récupére les 52 événements donnés par l'API Albion Online.
            const res = await axios.get(EVENTS_ENDPOINT, {
                params: {
                  offset,
                  limit: EVENTS_LIMIT,
                  timestamp: moment().unix(),
                },
                timeout: 60000,
              });
           // Sur ces 52 événements, on applique un filtre pour ne conserver que ceux en rapport
           // avec la guilde
            console.log(res);

            console.log("ok");
        }
        catch (err) {
           console.log(err)
        }



})();
