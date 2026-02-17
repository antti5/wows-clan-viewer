import Semaphore from '../Semaphore';

const callApi = async url => {
   const { status, error, meta, data } = await(await fetch(url)).json();
   if (status !== 'ok')
      throw new Error(`Wargaming API error: ${error.message}`);
   return { meta, data };
};

const encyclopediaInfo = async apiId => {
   const { data } = await callApi(`https://api.worldofwarships.eu/wows/encyclopedia/info/?application_id=${apiId}`);
   return {
      gameVersion: data.game_version
   };
};

const encyclopediaShips = async apiId => {
   const { meta: { page_total } } = await callApi(`https://api.worldofwarships.eu/wows/encyclopedia/ships/?application_id=${apiId}`);
   const sem = new Semaphore(5);
   const ships = {};
   for (let page = 1; page <= page_total; page++)
      sem.run(async () => {
         const { data } = await callApi(`https://api.worldofwarships.eu/wows/encyclopedia/ships/?application_id=${apiId}&page_no=${page}`);
         for (const [id, { tier, ship_id_str }] of Object.entries(data))
            ships[id] = {
               id,
               tier,
               index: ship_id_str
            };
         console.log(`Loaded encyclopedia page ${page} / ${page_total}`);
      });
   await sem.wait();
   return ships;
};

const clansList = async (apiId, region, clanTag) => {
   const { data } = await callApi(`https://api.worldofwarships.${region}/wows/clans/list/?application_id=${apiId}&search=${clanTag}`);
   const match = data.find(({ tag }) => tag === clanTag);
   if (!match)
      throw new Error(`No match: "${clanTag}"`);
   return {
      clanId: match.clan_id,
      clanName: match.name
   };
};

const clansInfo = async (apiId, region, clanId) => {
   const { data } = await callApi(`https://api.worldofwarships.${region}/wows/clans/info/?application_id=${apiId}&clan_id=${clanId}&extra=members`);
   const clanInfo = data[clanId];
   if (!clanInfo)
      throw new Error(`Clan not found: ${clanId}`);
   return {
      memberIds: clanInfo.members_ids, // [ id ]
      members: clanInfo.members // { id: { role, joined_at, account_id, account_name } }
   };
};

const accountInfo = async (apiId, region, accountIds) => {
   const { data } = await callApi(`https://api.worldofwarships.${region}/wows/account/info/?application_id=${apiId}&account_id=${accountIds.join(',')}&extra=statistics.pvp_solo`);
   return Object.values(data);
};

const shipsStats = async (apiId, region, accountId)  => {
   const { data } = await callApi(`https://api.worldofwarships.${region}/wows/ships/stats/?application_id=${apiId}&account_id=${accountId}`);
   return data[accountId];
};

export {
   encyclopediaInfo,
   encyclopediaShips,
   clansList,
   clansInfo,
   accountInfo,
   shipsStats
};