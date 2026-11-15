import React, { useEffect } from 'react';
import type { ClanMember, EncyclopediaShips, ShipStats } from '../types';
import useLocalState from './useLocalState';
import { clansList, clansInfo, accountInfo, shipsStats } from '../services/wgApi';
import Def from '../Def';
import Semaphore from '../Semaphore';

const SUBS_INTRODUCTION = Date.parse('2023-01-01');

const typeShareMinSub = (createdAt: number) =>
   Math.min((Date.now() - SUBS_INTRODUCTION) / (Date.now() - createdAt * 1000), 1) * Def.TYPE_SHARE_MIN;


const useShipStats = (
   apiId: string,
   region: string,
   clanTag: string,
   encyclopedia: EncyclopediaShips | null,
   setStatus: React.Dispatch<number>,
   setError: React.Dispatch<string>,
   setInputTag: React.Dispatch<string>,
   setClanName: React.Dispatch<string>,
   setClanMembers: React.Dispatch<ClanMember[]>
) => {

   const [shipStats, setShipStats] = useLocalState<ShipStats>('shipStats', {});

   /* When the selected clan changes, load player information from WG Public API */

   useEffect(() => {
      if (clanTag?.length > 0 === false)
         return;

      if (!encyclopedia) {
         console.info('Not loading ship stats because ships are not loaded');
         return;
      }

      setStatus(Def.STATUS_NONE);

      void (async () => {
         try {
            const { clanId, clanName } = await clansList(apiId, region, clanTag);

            setInputTag(''); // Clear input field when the first API call succeeds
            setClanName(clanName);
            setClanMembers([]);
            setStatus(Def.STATUS_LOADED);

            const { memberIds, members } = await clansInfo(apiId, region, clanId);
            const membersInfo = await accountInfo(apiId, region, memberIds);

            membersInfo.sort((m1, m2) =>
               Object.keys(Def.ROLES).indexOf(members[m1.account_id].role) - Object.keys(Def.ROLES).indexOf(members[m2.account_id].role) ||
               members[m1.account_id].joined_at - members[m2.account_id].joined_at
            );

            setClanMembers(membersInfo.map(m => ({
               foo:          members[m.account_id].role,
               id:           m.account_id,
               nickname:     m.nickname,
               createdDate:  new Date(m.created_at * 1000).toISOString().slice(0,10),
               role:         members[m.account_id].role,
               memberDays:   Math.floor((Date.now() - members[m.account_id].joined_at * 1000) / Def.DAY_MS),
               inactiveDays: Math.floor((Date.now() - m.last_battle_time * 1000) / Def.DAY_MS),
               battles:      m.statistics?.pvp?.battles,
               winRate:      m.statistics?.pvp?.battles ? m.statistics.pvp?.wins / m.statistics.pvp?.battles : undefined,
               divShare:     m.statistics?.pvp?.battles ? (m.statistics.pvp?.battles - (m.statistics.pvp_solo?.battles ?? 0)) / m.statistics.pvp?.battles : undefined
            })));

            /* Fetch clan members' ship statistics so that favorite ship types and average
            ship tier can be calculated.

            Note: This phase requires a separate API call for each clan member. The results are cached
            in Local Storage for CACHE_SHIP_STATS_DAYS days. */

            const sem = new Semaphore(5);

            for (const { account_id, nickname, created_at, statistics } of membersInfo) {
               if (!statistics || statistics.pvp?.battles === 0)
                  continue;

               if (shipStats[account_id]?.ts * 1000 > Date.now() - Def.CACHE_SHIP_STATS_DAYS * Def.DAY_MS)
                  continue;

               void sem.run(async () => {
                  console.info('Loading ship stats for', nickname);
                  const memberShipStats = await shipsStats(apiId, region, account_id);

                  if (!memberShipStats)
                     return;

                  let battlesTotal = 0;
                  let tierTotal = 0;
                  const battlesByType = {
                     A: 0,
                     B: 0,
                     C: 0,
                     D: 0,
                     S: 0
                  };

                  for (const stats of memberShipStats) {
                     if (stats.ship_id in encyclopedia === false)
                        continue;
                     if (stats.pvp?.battles) {
                        const shipType = encyclopedia[stats.ship_id].index.slice(3,4);
                        battlesByType[shipType as keyof typeof battlesByType] += stats.pvp.battles;
                        battlesTotal += stats.pvp.battles;
                        tierTotal += encyclopedia[stats.ship_id].tier * stats.pvp.battles;
                     }
                  }

                  const avgTier = (tierTotal / battlesTotal).toFixed(1);

                  const types = Object.entries(battlesByType)
                     .map(([type, battles]) => [type, battles / battlesTotal])
                     /* Note: After map() TypeScript is no longer convinced that the object values are still number,
                     so type assertions are needed. This kind of a tight loop probably has no place in TypeScript. */
                     .sort(([, battles1], [, battles2]) => (battles2 as number) - (battles1 as number))
                     .filter(([type, battles]) => (battles as number) > (type === 'S' ? typeShareMinSub(created_at) : Def.TYPE_SHARE_MIN))
                     .map(([type]) => type)
                     .join('');

                  setShipStats(old => ({
                     ...old,
                     [account_id]: {
                        ts: Math.round(Date.now() / 1000),
                        avgTier,
                        types
                     }
                  }));
               });
            }

            /* If more than 1.5x of CACHE_SHIP_STATS_NUMBER ship stats are cached, discard oldest
            entries so that only CACHE_SHIP_STATS_NUMBER remain in cache.

            However, never discard entries that are currently shown. */

            await sem.wait();

            setShipStats(old => {
               const entries = Object.entries(old);
               const shown = entries.filter(([ key ]) => key in members);

               if (entries.length > Def.CACHE_SHIP_STATS_NUMBER * 1.5) {
                  console.log(`Cleaning ${entries.length - Def.CACHE_SHIP_STATS_NUMBER} oldest ship stats`);
                  entries.sort(([, { ts: ts1 }], [, { ts: ts2 }]) => ts1 - ts2);
                  return Object.fromEntries([
                     ...entries.slice(-Def.CACHE_SHIP_STATS_NUMBER),
                     ...shown
                  ]);
               } else
                  return old;
            });

         } catch (error) {
            console.error(error);
            setStatus(Def.STATUS_ERROR);
            if (error instanceof Error)
               setError(error.message);
         }
      })();
   }, [clanTag, encyclopedia]);

   return shipStats;
};

export default useShipStats;