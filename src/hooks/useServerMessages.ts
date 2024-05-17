import { useAtom, useSetAtom } from 'jotai';
import { PartySocket } from 'partysocket';
import { toast } from 'sonner';

import userSoundEffects from '@/hooks/useSoundEffects';
import useUserListStore from '@/hooks/useUserListStore';

import { userSchema } from '@/lib/types';
import { debug, getErrorMessage } from '@/lib/utils';
import { serverMessageSchema } from '@/party/serverMessages';
import { connectionStatusAtom, errorAtom, serverMetaDataAtom, userAtom } from '@/stores/jotai';

import {
  ServerMessageAddUser,
  ServerMessageErrorEncountered,
  ServerMessageRemoveUser,
  ServerMessageServerMetaData,
  ServerMessageUpdatePublicData,
  ServerMessageUpdateSuccess,
  ServerMessageUserData,
  ServerMessageUserList,
} from '@/party/serverMessages';

import useConfetti from '@/hooks/useConfetti';

type Props = {
  ws: PartySocket;
};

export default function useServerMessages({ ws }: Props) {
  const [user, setUser] = useAtom(userAtom);
  const setServerMetaData = useSetAtom(serverMetaDataAtom);
  const setError = useSetAtom(errorAtom);
  const setConnectionStatus = useSetAtom(connectionStatusAtom);
  const { users, updateUser, setUserList } = useUserListStore();
  const { shootConfetti } = useConfetti();
  const { playListStatusUpdated, playUserJoined, playUserLeft } = userSoundEffects();

  // update the logged in user's data locally
  const processUsersFullDataMessage = ({ data }: ServerMessageUserData) => {
    debug('usersFullData client message');

    const result = userSchema.safeParse(data);

    setConnectionStatus('fully connected');
    setError(null);

    if (result.success) setUser(result.data);
    else {
      const message = `Error parsing user data from usersFullData: ${getErrorMessage(
        result.error
      )}`;

      console.error(message);
      toast.error(message);
    }
  };

  // get the full list of current users in the room
  const processUserListMessage = ({ users }: ServerMessageUserList) => {
    debug('usersList client message', { users: users });

    setUserList(users);
  };

  // add a user to the list
  const processAddUserMessage = ({ data }: ServerMessageAddUser) => {
    debug('addUser client message', { data });

    setUserList([...users, data]);
    playUserJoined();
  };

  // remove a user from the list
  const processRemoveUserMessage = ({ userId }: ServerMessageRemoveUser) => {
    debug('removeUser client message', { userId: userId });

    setUserList(users.filter((user) => user.id !== userId));
    playUserLeft();
  };

  // report a server error processing previous message
  const processErrorEncounteredMessage = ({ message }: ServerMessageErrorEncountered) => {
    setError({ title: 'Server Error', message: message });
    console.error('Server error:', message);

    toast.error(`Server error: ${message}`);
  };

  const processUpdateSuccessMessage = ({ message }: ServerMessageUpdateSuccess) => {
    toast.success(message);
  };

  // update a user's data in a local list
  const processUpdateUsersPublicDataMessage = ({ userId, data }: ServerMessageUpdatePublicData) => {
    debug('updateUsersPublicData client message', userId, data);

    updateUser(userId, data);

    // react to other people's updates
    if (user) {
      if (userId !== user.id) {
        if (data.update) {
          shootConfetti({ source: 'list update update' });
          playListStatusUpdated();
        } else if (data.status) {
          playListStatusUpdated();
        }
      } else {
        // update your own user data if it's you (at least the public data)
        setUser({ ...user, ...data });
      }
    }
  };

  // get latest server meta data (e.g. time since last onStart)
  const processServerMetaDataMessage = ({ data }: ServerMessageServerMetaData) => {
    setServerMetaData(data);
  };

  async function processSeverMessage({ message }: { message: string }) {
    try {
      const msg = serverMessageSchema.parse(JSON.parse(message));

      switch (msg.type) {
        case 'usersFullData':
          processUsersFullDataMessage(msg);
          break;
        case 'userList':
          processUserListMessage(msg);
          break;
        case 'addUser':
          processAddUserMessage(msg);
          break;
        case 'removeUser':
          processRemoveUserMessage(msg);
          break;
        case 'updateUsersPublicData':
          processUpdateUsersPublicDataMessage(msg);
          break;
        case 'errorEncountered':
          processErrorEncounteredMessage(msg);
          break;
        case 'updateSuccess':
          processUpdateSuccessMessage(msg);
          break;
        case 'serverMetaData':
          processServerMetaDataMessage(msg);
          break;
      }
    } catch (err) {
      console.error(`Error processing server message: ${getErrorMessage(err)}`, { message });
      toast.error(
        `Error processing server message: ${getErrorMessage(err)}. See console logo for details.`
      );
    }
  }

  return processSeverMessage;
}
