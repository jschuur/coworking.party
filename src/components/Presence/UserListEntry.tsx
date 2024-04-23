import Avatar from '@/components/Presence/Avatar';
import TimeAgo from '@/components/Presence/TimeAgo';

import { ConnectedUser } from '@/lib/types';

type Props = {
  user: ConnectedUser;
};

export default function UserListEntry({ user }: Props) {
  return (
    <div className='p-2 flex gap-2 items-center even:bg-purple-200'>
      <div className='flex flex-row gap-2 items-center'>
        <div>
          <Avatar user={user} className='size-8 sm:size-8' status={'online'} />
        </div>
        <div className='flex flex-col min-w-72'>
          <div className='text-lg'>{user.name}</div>
          <TimeAgo className='text-xs text-slate-700 self-end' date={user.firstConnected} />
        </div>
      </div>
    </div>
  );
}