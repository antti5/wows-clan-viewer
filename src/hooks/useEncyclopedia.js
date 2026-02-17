import { useEffect } from 'react';
import { encyclopediaInfo, encyclopediaShips } from '../services/wgApi';
import useLocalState from './useLocalState';
import Def from '../Def';

const useEncyclopedia = (apiId, setStatus, setError) => {

   const [encyclopedia, setEncyclopedia] = useLocalState('encyclopedia', null);

   /* Fetch ship encyclopedia from WG Public API on mount and whenever the API
   identifier changes.

   Fetched information is stored in Local Storage and is only fetched again in full
   if the game version changes. */

   useEffect(() => {
      if (!apiId?.match(Def.API_ID_REGEX)) {
         console.log(`API identifier "${apiId}" is not well-formed`);
         return;
      }

      (async () => {
         try {
            const { gameVersion } = await encyclopediaInfo(apiId);
            if (encyclopedia?.version === gameVersion) {
               console.log('Encyclopedia is up to date');
               setStatus(old => old === Def.STATUS_LOADED ? old : Def.STATUS_NONE);
               return;
            }

            setStatus(Def.STATUS_INITIALIZING);
            const newEncyclopedia = {
               version: gameVersion,
               ships: await encyclopediaShips(apiId)
            };
            setEncyclopedia(newEncyclopedia);
            setStatus(old => old === Def.STATUS_LOADED ? old : Def.STATUS_NONE);

         } catch (error) {
            console.error(error);
            setStatus(Def.STATUS_ERROR);
            setError(error.message);
         }
      })();
   }, [apiId]);

   return encyclopedia;
};

export default useEncyclopedia;