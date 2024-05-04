import type * as Party from 'partykit/server';

import { debug } from '@/lib/utils';
import { parseApiRequest } from '@/party/api';
import { processClientMessage } from '@/party/messages';

import { UserList } from '@/party/userList';

export default class Server implements Party.Server {
  users: UserList = new UserList(this);
  // can't set this in global scope: https://stackoverflow.com/a/58491358/122864
  timeSinceOnStart?: Date = undefined;

  constructor(readonly room: Party.Room) {}

  onStart() {
    this.timeSinceOnStart = new Date();
  }

  async onConnect(connection: Party.Connection<unknown>, ctx: Party.ConnectionContext) {
    const { request } = ctx;
    // sending the userId in the query string lets us identify the user
    const userId = new URL(request.url).searchParams.get('userId');

    if (!userId) {
      console.error('userId query param missing in onConnect');

      connection.close();
      return;
    }

    await this.users.addUser({ userId, connection });
    // await persistUserList({ users: this.users, partyServer: this });
  }

  async onClose(connection: Party.Connection) {
    debug('Connection closed: ', { connectionId: connection.id });

    await this.users.removeUser({ connection });
    // await persistUserList({ users: this.users, partyServer: this });
  }

  async onMessage(message: string, sender: Party.Connection) {
    debug('Client message received:', message, { connectionId: sender.id });

    await processClientMessage({ message, users: this.users, partyServer: this, sender });
  }

  async onRequest(request: Party.Request) {
    return parseApiRequest({ partyServer: this, request });
  }
}

Server satisfies Party.Worker;
