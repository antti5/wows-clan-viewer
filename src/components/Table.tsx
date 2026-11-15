import clsx from 'clsx';
import Def from '../Def';
import type { ClanMember, ShipStats } from '../types';

const average = (values: (number | undefined)[]) => {
   const numbers = values
      .filter(n => typeof n === 'number')
      .filter(n => !isNaN(n));
   return numbers.length > 0 ?
      numbers.reduce((sum, value) => sum + value) / numbers.length :
      0;
};

const wowsNumberPrefix = (region: string) => {
   if (region === 'asia')
      return 'asia.';
   else if (region === 'com')
      return 'na.';
   else
      return '';
};

interface TableProps {
   region: string,
   clanMembers: ClanMember[],
   shipStats: ShipStats
}

const Table = ({ region, clanMembers, shipStats }: TableProps) =>
   <table>
      <thead>
         <tr>
            <th />
            <th>Player</th>
            <th>Role</th>
            <th>Battles</th>
            <th>Win rate</th>
            <th>Division</th>
            <th>Avg tier</th>
            <th>Favorites</th>
            <th>Member</th>
            <th>Inactive</th>
            <th>Created</th>
         </tr>
      </thead>

      <tbody>
         {clanMembers.map((m, i) =>
            <tr key={m.nickname}>
               <td>
                  {i + 1}
               </td>
               <td>
                  <span
                     title='Show on wows-numbers'
                     className='player'
                     onClick={() => {
                        window.open(`https://${wowsNumberPrefix(region)}wows-numbers.com/player/${m.id},${m.nickname}`, '_blank');
                     }}
                  >
                     {m.nickname}
                  </span>
               </td>
               <td className={'role' + (Object.values(Def.ROLES).indexOf(m.role) + 1)}>
                  {Def.ROLES[m.role as keyof typeof Def.ROLES] ?? ''}
               </td>
               <td>
                  {m.battles}
               </td>
               <td>
                  {typeof m.winRate === 'number' && <>
                     {Math.round(m.winRate * 100)}
                     <small>%</small>
                  </>}
               </td>
               <td>
                  {typeof m.divShare === 'number' && <>
                     {Math.round(m.divShare * 100)}
                     <small>%</small>
                  </>}
               </td>
               <td>
                  {shipStats[m.id] && <>
                     {shipStats[m.id].avgTier ?? ''}
                  </>}
               </td>
               <td>
                  {shipStats[m.id] && <>
                     {shipStats[m.id].types.split('').map(type =>
                        <span
                           key={type}
                           className={clsx(
                              'type',
                              type
                           )}
                        >
                           {Def.TYPES[type as keyof typeof Def.TYPES]}
                        </span>
                     )}
                  </>}
               </td>
               <td>
                  {m.memberDays}
                  <small>d</small>
               </td>
               <td>
                  {m.inactiveDays}
                  <small>d</small>
               </td>
               <td>
                  {m.createdDate}
               </td>
            </tr>
         )}

         <tr className='averages'>
            <td />
            <td />
            <td>
               Clan averages:
            </td>
            <td>
               {Math.round(average(clanMembers.map(m => m.battles)))}
            </td>
            <td>
               {Math.round(average(clanMembers.map(m => m.winRate)) * 100)}
               <small>%</small>
            </td>
            <td>
               {Math.round(average(clanMembers.map(m => m.divShare)) * 100)}
               <small>%</small>
            </td>
            <td>
               {average(clanMembers.map(m => Number(shipStats[m.id]?.avgTier)))?.toFixed(1) ?? ''}
            </td>
         </tr>
      </tbody>
   </table>;

export default Table;