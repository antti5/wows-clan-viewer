import { useState, useEffect } from 'react';


/* A state persisted in Local Storage.

Based on: https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/

Note: Because the synchronization to Local Storage is done in an effect, it is important that
the component from which this hook is called stays mounted after the setValue() call. Otherwise
the effect will not run and the synchronization will not happen. */

const useLocalState = (key, defaultValue) => {

   /* The state gets the default value from local storage if available. */

   const [value, setValue] = useState(() => {
      const stickyValue = localStorage.getItem(key);
      return stickyValue !== null ?
         JSON.parse(stickyValue) :
         defaultValue;
   });

   /* Updates the web storage whenever the (key, value) pair changes. */

   useEffect(() => {
      localStorage.setItem(key, JSON.stringify(value));
   }, [key, value]);

   return [value, setValue];
};


export default useLocalState;