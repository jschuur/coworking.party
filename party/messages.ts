'use client';

import { clientMessageSchema, serverMessageSchema } from '@/lib/types';
import { debug, getErrorMessage } from '@/lib/utils';

import type Server from '@/party/server';
import { UserList } from '@/party/userList';

type processClientMessageParams = {
  message: string;
  users: UserList;
  partyServer: Server;
};

// messages received by the server from the client
export async function processClientMessage({
  message,
  users,
  partyServer,
}: processClientMessageParams) {
  try {
    const { type, data, userId } = clientMessageSchema.parse(JSON.parse(message));

    if (type === 'updateUserData') {
      // update the user's data
      debug('updateUserData: ', { userId, data });

      await users.updateUserData({
        data,
        userId,
      });
    } else {
      console.error('Unknown client message type:', type);
    }
  } catch (err) {
    console.error('Error processing client message:', getErrorMessage(err));
  }
}

export function buildServerMessage<T>(message: T) {
  return JSON.stringify(serverMessageSchema.parse(message));
}