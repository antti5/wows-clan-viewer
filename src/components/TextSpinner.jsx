import { useState, useEffect } from 'react';
import clsx from 'clsx';

const SPINNER_CHARS = '|/–\\';
const SPINNER_DELAY_MS = 150;

/* A one-character spinning line, contained in a <span> with class "spinner".

The span is added a second class "spinning" after a short delay, and this can
be used in CSS transitions. */

const TextSpinner = () => {

   const [spinnerIndex, setSpinnerIndex] = useState(0);

   useEffect(() => {
      const id = setTimeout(
         () => setSpinnerIndex(old => old + 1),
         SPINNER_DELAY_MS * (spinnerIndex > 0 ? 1 : 0.5)
      );
      return () => clearTimeout(id);
   }, [spinnerIndex]);

   return <span
      style={{
         display: 'inline-block',
         width: '0.7em'
      }}
      className={clsx(
         'spinner',
         spinnerIndex > 0 && 'spinning'
      )}
   >
      {SPINNER_CHARS[spinnerIndex % SPINNER_CHARS.length]}
   </span>;
};

export default TextSpinner;