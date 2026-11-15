import Semaphore from '../Semaphore';
import { type EncyclopediaShips } from '../types';


interface WgResponse {
   status: string,
   error: {
      message: string
   },
   meta: {
      page_total: number
   },

   /* Depending on the API endpoint, the "data" property contains
   either an object or an array of objects. */

   data: object | object[]
}


const callApi = async (url: string): Promise<WgResponse> => {
   const response = await(await fetch(url)).json() as WgResponse;
   if (response.status !== 'ok')
      throw new Error(`Wargaming API error: ${response.error.message}`);
   return response;
};


const encyclopediaVersion = async (apiId: string) => {
   const { data } = await callApi(`https://api.worldofwarships.eu/wows/encyclopedia/info/?application_id=${apiId}`);

   if ('game_version' in data && typeof data.game_version === 'string')
      return data.game_version;

   throw new Error('Unexpected /encyclopedia/info response');
};


const encyclopediaShips = async (apiId: string) => {
   const { meta: { page_total } } = await callApi(`https://api.worldofwarships.eu/wows/encyclopedia/ships/?application_id=${apiId}`);
   const sem = new Semaphore(5);

   /* ships is an empty object, joka saa propertyt ovat määrätyn muotoisia olioita */

   const ships: EncyclopediaShips = {};

   for (let page = 1; page <= page_total; page++)
      void sem.run(async () => {
         const { data } = await callApi(`https://api.worldofwarships.eu/wows/encyclopedia/ships/?application_id=${apiId}&page_no=${page}`);

         for (const shipAny of Object.values(data)) {

            if (typeof shipAny !== 'object')
               throw new Error('Unexpected /encyclopedia/ships response');
            const ship = shipAny as object;

            if (
               'ship_id' in ship === false || typeof ship.ship_id !== 'number' ||
               'ship_id_str' in ship === false || typeof ship.ship_id_str !== 'string' ||
               'tier' in ship === false || typeof ship.tier !== 'number'
            )
               throw new Error('Unexpected /encyclopedia/ships response');

            ships[ship.ship_id] = {
               id: ship.ship_id,
               tier: ship.tier,
               index: ship.ship_id_str
            };
         }
         console.log(`Loaded encyclopedia page ${page} / ${page_total}`);
      });

   await sem.wait();

   return ships;
};


const clansList = async (apiId: string, region: string, clanTag: string) => {
   const { data } = await callApi(`https://api.worldofwarships.${region}/wows/clans/list/?application_id=${apiId}&search=${clanTag}`);

   if (data instanceof Array === false)
      throw new Error('Unexpected /clans/list response');

   for (const clan of data) {
      if (
         'tag' in clan === false || typeof clan.tag !== 'string' ||
         'clan_id' in clan === false || typeof clan.clan_id !== 'number' ||
         'name' in clan === false || typeof clan.name !== 'string'
      )
         throw new Error('Unexpected /clans/list response');

      /* It's possible that there are multiple matches, for example "THE" matches several clans
      in addition to [THESO]. Anything that isn't an exact match is skipped.  */

      if (clan.tag !== clanTag)
         continue;

      return {
         clanId: clan.clan_id,
         clanName: clan.name
      };
   }

   throw new Error(`No match: "${clanTag}"`);
};


const clansInfo = async (apiId: string, region: string, clanId: number) => {
   const { data } = await callApi(`https://api.worldofwarships.${region}/wows/clans/info/?application_id=${apiId}&clan_id=${clanId}&extra=members`);

   if (clanId in data === false)
      throw new Error('Clan not found: ' + clanId);

   const clanInfo = data[clanId as keyof object] as object;

   if (
      'members_ids' in clanInfo === false || clanInfo.members_ids instanceof Array === false ||
      'members' in clanInfo === false || typeof clanInfo.members !== 'object'
   )
      throw new Error('Unexpected /clans/info response');

   return {
      memberIds: clanInfo.members_ids as number[],
      members: clanInfo.members as Record<number, {
         account_id: number,
         account_name: string,
         role: string,
         joined_at: number
      }>
   };
};


const accountInfo = async (apiId: string, region: string, accountIds: number[]) => {

   interface WgAccountInfo {
      account_id: number,
      nickname: string,
      created_at: number,
      last_battle_time: number,
      statistics?: { // null for private accounts
         pvp?: {
            battles: number,
            wins: number
         },
         pvp_solo?: {
            battles: number
         }
      }
   }

   const { data } = await callApi(`https://api.worldofwarships.${region}/wows/account/info/?application_id=${apiId}&account_id=${accountIds.join(',')}&extra=statistics.pvp_solo`);
   const accounts: WgAccountInfo[] = [];

   for (const accountAny of Object.values(data)) {
      if (typeof accountAny !== 'object' || accountAny === null)
         throw new Error('Unexpected /account/info response');
      accounts.push(accountAny as WgAccountInfo);
   }
   return accounts;
};


const shipsStats = async (apiId: string, region: string, accountId: number)  => {

   interface WgShipStats {
      ship_id: number,
      pvp?: {
         battles: number
      }
   }

   const { data } = await callApi(`https://api.worldofwarships.${region}/wows/ships/stats/?application_id=${apiId}&account_id=${accountId}`);
   const shipStats: WgShipStats[] = [];

   if (accountId in data === false) {
      console.warn('Failed to fetch ship stats for account', accountId);
      return shipStats;
   }

   const playerStats = data[accountId as keyof typeof data] as unknown;
   if (playerStats instanceof Array === false)
      throw new Error('Unexpected /ships/stats response');

   for (const shipAny of playerStats) {
      if (typeof shipAny !== 'object' || shipAny === null)
         throw new Error('Unexpected /ships/stats response');
      shipStats.push(shipAny as WgShipStats);
   }

   return shipStats;
};


export {
   encyclopediaVersion,
   encyclopediaShips,
   clansList,
   clansInfo,
   accountInfo,
   shipsStats
};