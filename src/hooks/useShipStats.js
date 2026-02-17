import { useEffect } from 'react';
import useLocalState from './useLocalState';
import { clansList, clansInfo, accountInfo, shipsStats } from '../services/wgApi';
import Def from '../Def';
import Semaphore from '../Semaphore';

const SUBS_INTRODUCTION = Date.parse('2023-01-01');

const typeShareMinSub = createdAt =>
   Math.min((Date.now() - SUBS_INTRODUCTION) / (Date.now() - createdAt * 1000), 1) * Def.TYPE_SHARE_MIN;


const useShipStats = (
   apiId,
   region,
   clanTag,
   encyclopedia,
   setStatus,
   setError,
   setInputTag,
   setClanName,
   setClanMembers
) => {

   const [shipStats, setShipStats] = useLocalState('shipStats', {});

   /* When the selected clan changes, load player information from WG Public API */

   useEffect(() => {
      if (clanTag?.length > 0 === false)
         return;

      if (!encyclopedia) {
         console.info('Not loading ship stats because ships are not loaded');
         return;
      }

      setStatus(Def.STATUS_NONE);

      (async () => {
         try {
            const { clanId, clanName } = await clansList(apiId, region, clanTag);

            setInputTag(''); // Clear input field when the first API call succeeds
            setClanName(clanName);
            setClanMembers(null);
            setStatus(Def.STATUS_LOADED);

            const { memberIds, members } = await clansInfo(apiId, region, clanId);
            const membersInfo = await accountInfo(apiId, region, memberIds);

            membersInfo.sort((m1, m2) =>
               Object.keys(Def.ROLES).indexOf(members[m1.account_id].role) - Object.keys(Def.ROLES).indexOf(members[m2.account_id].role) ||
               members[m1.account_id].joined_at - members[m2.account_id].joined_at
            );

            setClanMembers(membersInfo.map(m => ({
               id:         m.account_id,
               nickname:   m.nickname,
               role:       Def.ROLES[members[m.account_id].role],
               battles:    m.statistics?.pvp?.battles ?? null,
               winRate:    m.statistics?.pvp?.battles > 0 ? m.statistics.pvp?.wins / m.statistics.pvp?.battles : null,
               divShare:   m.statistics?.pvp?.battles > 0 ? (m.statistics.pvp?.battles - m.statistics.pvp_solo?.battles) / m.statistics.pvp?.battles : null,
               membership: Math.floor((Date.now() - members[m.account_id].joined_at * 1000) / Def.DAY_MS),
               inactive:   Math.floor((Date.now() - m.last_battle_time * 1000) / Def.DAY_MS),
               created:    new Date(m.created_at * 1000).toISOString().slice(0,10)
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

               sem.run(async () => {
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
                  for (const stats of memberShipStats)
                     if (stats.pvp?.battles > 0 && stats.ship_id in encyclopedia.ships) {
                        battlesTotal += stats.pvp.battles;
                        tierTotal += encyclopedia.ships[stats.ship_id].tier * stats.pvp.battles;
                        battlesByType[encyclopedia.ships[stats.ship_id].index.slice(3,4)] += stats.pvp.battles;
                     }

                  const avgTier = (tierTotal / battlesTotal).toFixed(1);

                  const types = Object.entries(battlesByType)
                     .map(([type, battles]) => [type, battles / battlesTotal])
                     .sort(([, battles1], [, battles2]) => battles2 - battles1)
                     .filter(([type, battles]) => battles > (type === 'S' ? typeShareMinSub(created_at) : Def.TYPE_SHARE_MIN))
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
                  return Object.fromEntries([
                     ...entries
                        .toSorted(([, { ts: ts1 }], [, { ts: ts2 }]) => ts1 - ts2)
                        .slice(-Def.CACHE_SHIP_STATS_NUMBER),
                     ...shown
                  ]);
               } else
                  return old;
            });
         } catch (error) {
            console.error(error);
            setStatus(Def.STATUS_ERROR);
            setError(error.message);
         }
      })();
   }, [clanTag, encyclopedia]);

   return shipStats;
};

export default useShipStats;