import { useState } from 'react';
import useLocalState from '../hooks/useLocalState';
import { useQueryState, parseAsString } from 'nuqs';
import NavigationBar from './NavigationBar';
import TextSpinner from './TextSpinner';
import Def from '../Def';
import Table from './Table';
import useEncyclopedia from '../hooks/useEncyclopedia';
import useShipStats from '../hooks/useShipStats';


const App = () => {

   const [status, setStatus] = useState(Def.STATUS_NONE);
   const [error, setError] = useState();
   const [apiId, setApiId] = useLocalState('apiId', '');
   const [clanTag, setClanTag] = useQueryState('c', parseAsString.withDefault(''));
   const [region, setRegion] = useQueryState('r', parseAsString.withDefault('eu'));
   const [clanName, setClanName] = useState();
   const [clanMembers, setClanMembers] = useState();
   const [inputTag, setInputTag] = useState('');

   const encyclopedia = useEncyclopedia(
      apiId,
      setStatus,
      setError
   );

   const shipStats = useShipStats(
      apiId,
      region,
      clanTag,
      encyclopedia,
      setStatus,
      setError,
      setInputTag,
      setClanName,
      setClanMembers
   );

   return <>
      <nav>
         <NavigationBar
            inputTag={inputTag}
            setInputTag={setInputTag}
            setClanTag={setClanTag}
            region={region}
            setRegion={setRegion}
            apiId={apiId}
            setApiId={setApiId}
         />
      </nav>

      <main>
         {status === Def.STATUS_INITIALIZING &&
            <p className='initializing'>
               Initializing...&ensp;<TextSpinner/>
            </p>
         }

         {status === Def.STATUS_ERROR &&
            <p className='error'>
               {error}
            </p>
         }

         {status === Def.STATUS_LOADED && <>
            {clanName &&
               <h1>
                  [{clanTag}] {clanName}
               </h1>
            }

            {clanMembers?.length > 0 &&
               <Table
                  region={region}
                  clanMembers={clanMembers}
                  shipStats={shipStats}
               />
            }
         </>}
      </main>
   </>;
};

export default App;