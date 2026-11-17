import Semaphore from '../Semaphore';
import { type EncyclopediaShips } from '../types';
import z from 'zod';


/* Helper function to call any of the API endpoints */

const WgResponseSchema = z.object({
   status: z.string(),

   // Error is present when status is not "ok"

   error: z.optional(z.object({
      message: z.string()
   })),

   // Meta is present when status is "ok"

   meta: z.optional(z.object({
      page_total: z.number().optional()
   })),

   // Depending on the response, data is either an object or an array of objects.
   // In either case, the value is parsed with another schema.

   data: z.union([z.looseObject({}), z.array(z.unknown())])
});

const callApi = async (url: string) => {
   const data = await (await fetch(url)).json() as unknown;
   const response = WgResponseSchema.parse(data);

   if (response.status !== 'ok')
      throw new Error(`Wargaming API error: ${response?.error?.message}`);

   return response;
};


/* /encyclopedia/info -- Contains current game version */

const EncyclopediaInfoSchema = z.object({
   game_version: z.string()
});

export const encyclopediaInfo = async (apiId: string) => {
   const { data } = await callApi(`https://api.worldofwarships.eu/wows/encyclopedia/info/?application_id=${apiId}`);
   return EncyclopediaInfoSchema.parse(data);
};


/* /encyclopedia/ships -- List of ships in the current game version */

const EncyclopediaShipsSchema = z.record(
   z.number(),
   z.object({
      ship_id: z.number(),
      tier: z.number(),
      ship_id_str: z.string()
   })
);

export const encyclopediaShips = async (apiId: string) => {
   const { meta } = await callApi(`https://api.worldofwarships.eu/wows/encyclopedia/ships/?application_id=${apiId}`);

   if (!meta || !meta.page_total)
      throw new Error('Unexpected /encyclopedia/ships response');

   const sem = new Semaphore(5);
   const ships: EncyclopediaShips = {};

   for (let page = 1; page <= meta.page_total; page++)
      void sem.run(async () => {
         const { data } = await callApi(`https://api.worldofwarships.eu/wows/encyclopedia/ships/?application_id=${apiId}&page_no=${page}`);
         const response = EncyclopediaShipsSchema.parse(data);

         for (const ship of Object.values(response))
            ships[ship.ship_id] = {
               id: ship.ship_id,
               tier: ship.tier,
               index: ship.ship_id_str
            };

         console.log(`Loaded encyclopedia page ${page} / ${meta.page_total}`);
      });

   await sem.wait();
   return ships;
};


/* /clans/list -- Clans whose tags match the given string */

const ClansListSchema = z.array(
   z.object({
      clan_id: z.number(),
      tag: z.string(),
      name: z.string()
   })
);

export const clansList = async (apiId: string, region: string, clanTag: string) => {
   const { data } = await callApi(`https://api.worldofwarships.${region}/wows/clans/list/?application_id=${apiId}&search=${clanTag}`);
   const response = ClansListSchema.parse(data);
   const clanInfo = response.find(({ tag }) => tag === clanTag);

   if (!clanInfo)
      throw new Error(`No match: "${clanTag}"`);

   return clanInfo;
};


/* /clans/info -- Information about the given clan, including a list of members */

const ClansInfoSchema = z.record(
   z.number(),
   z.nullable(z.object({ // null for invalid clan identifier
      members_ids: z.array(
         z.number()
      ),
      members: z.record(
         z.number(),
         z.object({
            account_id: z.number(),
            account_name: z.string(),
            role: z.string(),
            joined_at: z.number()
         })
      )
   }))
);

export const clansInfo = async (apiId: string, region: string, clanId: number) => {
   const { data } = await callApi(`https://api.worldofwarships.${region}/wows/clans/info/?application_id=${apiId}&clan_id=${clanId}&extra=members`);
   const response = ClansInfoSchema.parse(data);

   if (!response[clanId])
      throw new Error('Clan not found in /clans/info response: ' + clanId);

   return response[clanId];
};


/* /account/info -- Information about given players */

const AccountInfoSchema = z.record(
   z.number(),
   z.object({
      account_id: z.number(),
      nickname: z.string(),
      created_at: z.number(),
      last_battle_time: z.number(),
      statistics: z.nullable(z.object({ // null for private accounts
         pvp: z.optional(z.object({
            battles: z.number(),
            wins: z.number()
         })),
         pvp_solo: z.optional(z.object({
            battles: z.number()
         }))
      }))
   })
);

export const accountInfo = async (apiId: string, region: string, accountIds: number[]) => {
   const { data } = await callApi(`https://api.worldofwarships.${region}/wows/account/info/?application_id=${apiId}&account_id=${accountIds.join(',')}&extra=statistics.pvp_solo`);
   const response = AccountInfoSchema.parse(data);
   return Object.values(response);
};


/* /ships/stats -- Given players' stats in different ships */

const ShipsStatsSchema = z.record(
   z.number(),
   z.array(
      z.object({
         ship_id: z.number(),
         pvp: z.object({
            battles: z.number()
         }).optional()
      })
   )
);

export const shipsStats = async (apiId: string, region: string, accountId: number)  => {
   const { data } = await callApi(`https://api.worldofwarships.${region}/wows/ships/stats/?application_id=${apiId}&account_id=${accountId}`);
   const response = ShipsStatsSchema.parse(data);

   if (!response[accountId]) {
      console.warn('Failed to fetch ship stats for account', accountId);
      return [];
   }

   return response[accountId];
};
