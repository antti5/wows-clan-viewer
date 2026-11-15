import { Fragment } from 'react/jsx-runtime';
import Def from '../Def';
import clsx from 'clsx';
import type React from 'react';

const RADIO_LABEL = {
   eu: 'EU',
   com: 'NA',
   asia: 'Asia'
};

interface NavigationBarProps {
   inputTag: string,
   setInputTag: React.Dispatch<string>,
   setClanTag: React.Dispatch<string>,
   region: string,
   setRegion: React.Dispatch<string>,
   apiId: string,
   setApiId: React.Dispatch<string>
}

const NavigationBar = ({
   inputTag,
   setInputTag,
   setClanTag,
   region,
   setRegion,
   apiId,
   setApiId
}: NavigationBarProps) => <>

   <form onSubmit={event => {
      event.preventDefault();
      if (inputTag.length === 0) {
         console.log('Empty tag');
         return;
      }
      setClanTag(inputTag.toUpperCase());
   }}>

      <div className='inputContainer tag'>
         Clan tag:
         <input
            type='text'
            name='tag'
            maxLength={5}
            value={inputTag}
            onChange={event => setInputTag(event.target.value)}
         />
      </div>

      <div className='inputContainer region'>
         Region:
         {(Object.keys(RADIO_LABEL) as Array<keyof typeof RADIO_LABEL>).map(r =>
            <Fragment key={r}>
               <input
                  type='radio'
                  id={r}
                  name='region'
                  value={r}
                  checked={r === region}
                  onChange={() => setRegion(r)}
               />
               <label htmlFor={r}>
                  {RADIO_LABEL[r]}
               </label>
            </Fragment>
         )}
      </div>

      <div className='inputContainer apiId'>
         Application ID:
         <input
            className={clsx(
               apiId.length > 0 && !apiId.match(Def.API_ID_REGEX) && 'invalid'
            )}
            type='text'
            name='apiId'
            maxLength={32}
            value={apiId}
            onChange={event => setApiId(event.target.value)}
         />
      </div>

      {/* Allow enter to submit */}
      <input type="submit" hidden />
   </form>
</>;

export default NavigationBar;