export default {
   API_ID_REGEX: /^[0-9a-fA-Z]{32}$/,

   STATUS_NONE: 0,
   STATUS_INITIALIZING: 1,
   STATUS_ERROR: 2,
   STATUS_LOADED: 3,

   DAY_MS: 24 * 60 * 60 * 1000,
   CACHE_SHIP_STATS_DAYS : 30,
   CACHE_SHIP_STATS_NUMBER: 1000,

   /* Clan roles -- defined here because they seem to be out-of-date in the Public API */

   ROLES: {
      commander: 'Commander',
      executive_officer: 'Deputy Commander',
      recruitment_officer: 'Recruiter',
      commissioned_officer: 'Commissioned Officer',
      officer: 'Line Officer',
      private: 'Midshipman',
   },

   /* Mapping from the 4th letter of ship index string to hull classification codes */

   TYPES: {
      A: 'CV',
      B: 'BB',
      C: 'CA',
      D: 'DD',
      S: 'SS'
   },

   WOWS_NUMBERS_PREFIX: {
      com: 'na.',
      asia: 'asia.'
   },

   /* Share of player's total battles for a ship type to be listed */
   TYPE_SHARE_MIN: 0.1
};