export type EncyclopediaShips = Record<
   number, // Ship identifier
   {
      ship_id: number,
      tier: number,
      ship_id_str: string
   }
>;

export type ShipStats = Record<
   number, // Player identifier
   {
      ts: number,
      avgTier: string, // Stored as string with fixed one decimal place
      types: string
   }
>;

/* Member of the currently shown clan */

export interface ClanMember {
   id:           number,
   nickname:     string,
   createdDate:  string,
   role:         string,
   memberDays:   number,
   inactiveDays: number,
   battles?:     number,
   winRate?:     number,
   divShare?:    number
}