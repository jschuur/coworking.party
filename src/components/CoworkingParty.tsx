'use client';

import { useAtomValue } from 'jotai';
import posthog from 'posthog-js';

import StatusUpdate from '@/components/Presence/StatusUpdate';
import UserList from '@/components/Presence/UserList';
import Error from '@/components/Site/Error';
import NewsCallout from '@/components/Site/NewsCallout';
import Todos from '@/components/Todos/Todos';

import useUserData from '@/hooks/useUserData';

import { connectionStatusAtom } from '@/stores/jotai';
import { useEffect } from 'react';

export default function CoworkingParty() {
  const connectionStatus = useAtomValue(connectionStatusAtom);
  const { user } = useUserData();
  const { id: userId, name, email } = user || {};

  useEffect(() => {
    if (userId) posthog.identify(userId, { name, email });
    else posthog.reset();
  }, [userId, name, email]);

  if (connectionStatus === 'fully connected' && user)
    return (
      <div className='flex flex-col items-center max-w-xl'>
        <NewsCallout title='Top task highlighting' className='mb-4'>
          Made a few tweaks to emphasize the most important tasks in the list.
        </NewsCallout>

        <div className='w-full xs:w-[450px]'>
          <StatusUpdate className='w-full' />
          <UserList className='w-full' />
          <Todos className='w-full' />
        </div>
      </div>
    );

  if (connectionStatus === 'partially connected') return <Error />;

  return null;
}
