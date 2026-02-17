import clsx from 'clsx';
import Def from '../Def';

const average = a => {
   const aNumber = a.filter(x => typeof x === 'number' && !isNaN(x));
   return aNumber.length > 0 ?
      aNumber.reduce((sum, value) => sum + value) / aNumber.length :
      null;
};

const Table = ({ region, clanMembers, shipStats }) =>
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
                  <span title='Show on wows-numbers' className='player' onClick={() => window.open(`https://${Def.WOWS_NUMBERS_PREFIX[region] ?? ''}wows-numbers.com/player/${m.id},${m.nickname}`, '_blank')}>
                     {m.nickname}
                  </span>
               </td>
               <td className={'role' + (Object.values(Def.ROLES).indexOf(m.role) + 1)}>
                  {m.role}
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
                              Def.TYPES[type]
                           )}
                        >
                           {Def.TYPES[type]}
                        </span>
                     )}
                  </>}
               </td>
               <td>
                  {m.membership}
                  <small>d</small>
               </td>
               <td>
                  {m.inactive}
                  <small>d</small>
               </td>
               <td>
                  {m.created}
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