import React, { useEffect } from 'react';
import { encyclopediaInfo, encyclopediaShips } from '../services/wgApi';
import { type EncyclopediaShips } from '../types';
import useLocalState from './useLocalState';
import Def from '../Def';

const useEncyclopedia = (
   apiId: string,
   setStatus: React.Dispatch<React.SetStateAction<number>>,
   setError: React.Dispatch<string>
): EncyclopediaShips | null => {

   const [version, setVersion] = useLocalState<string>('encyclopediaVersion', '');
   const [ships, setShips] = useLocalState<EncyclopediaShips | null>('encyclopediaShips', null);

   /* Fetch ship encyclopedia from WG Public API on mount and whenever the API
   identifier changes.

   Fetched information is stored in Local Storage and is only fetched again in full
   if the game version changes. */

   useEffect(() => {
      if (!apiId?.match(Def.API_ID_REGEX)) {
         console.log(`API identifier "${apiId}" is not well-formed`);
         return;
      }

      void (async () => {
         try {
            const { game_version: newVersion } = await encyclopediaInfo(apiId);
            if (version === newVersion) {
               console.log('Encyclopedia is up to date');
               setStatus(old => old === Def.STATUS_LOADED ? old : Def.STATUS_NONE);
               return;
            }

            const newShips = await encyclopediaShips(apiId);

            setStatus(Def.STATUS_INITIALIZING);
            setVersion(newVersion);
            setShips(newShips);
            setStatus(old => old === Def.STATUS_LOADED ? old : Def.STATUS_NONE);

         } catch (error) {
            console.error(error);
            setStatus(Def.STATUS_ERROR);
            if (error instanceof Error)
               setError(error.message);
         }
      })();
   }, [apiId]);

   return ships;
};

export default useEncyclopedia;