import React, { useCallback, useState } from 'react';
import router from 'next/router';
import { useRxAsync } from 'use-rx-hooks';
import { Toaster } from '@/utils/toaster';
import { gameMetaMap } from '@/games';
import { ApiError, Param$GetMatch } from '@/typings';
import { MatchProvider, useMatchState } from '@/hooks/useMatch';
import { MatchState, getMatch, matchStorage, isMatchState } from '@/services';
import { Chat } from '../Chat';
import { ShareButton } from '../ShareButton';
import { Preferences } from '../Preferences';
import { MatchHeader } from './MatchHeader';
import { MatchContent, Gameover } from './MatchContent';
import { Spectator } from './Spectator';
import styles from './Match.module.scss';

interface State {
  matchName: string;
  numPlayers: number;
  allowSpectate?: boolean;
}

type Props = MatchState & Gameover;

const onFailure = (error: ApiError) => {
  // match not found
  if (
    typeof error == 'object' &&
    'response' in error &&
    error.response?.status === 404 &&
    matchStorage.get()
  ) {
    matchStorage.save(null);
  } else {
    Toaster.apiError('Get Match Failure', error);
  }
  router.push('/');
};

function MatchComponent(state: Props) {
  const { name, matchID }: Partial<Param$GetMatch> = isMatchState(
    state,
    'local'
  )
    ? {}
    : { name: state.name, matchID: state.matchID };

  const _getMatch = useCallback(async (): Promise<State> => {
    if (name && matchID) {
      const { data } = await getMatch({ name, matchID });

      return data.setupData
        ? {
            ...data,
            ...data.setupData,
            numPlayers: data.players.length
          }
        : Promise.reject('Invalid match');
    }
    return { matchName: 'Local', numPlayers: 0 };
  }, [name, matchID]);

  const [{ data, loading }] = useRxAsync(_getMatch, { onFailure });
  const { matchName, allowSpectate } = data || {};
  const { gameName } = gameMetaMap[state.name];
  const { started } = useMatchState(['started']);
  const [isGameover, setIsGameover] = useState<boolean | undefined>();

  return (
    <div className={styles['match']}>
      <MatchHeader title={[gameName, matchName].filter(Boolean).join(' - ')}>
        {isMatchState(state, 'multi') && (
          <ShareButton
            gameName={gameName}
            name={state.name}
            matchID={state.matchID}
            playerName={state.playerName}
          />
        )}
        <Preferences disablePlayerName />
      </MatchHeader>
      {isMatchState(state, 'spectate') && (
        <Spectator name={state.name} matchID={state.matchID} />
      )}
      {(isMatchState(state, 'local') || started) && (
        <MatchContent
          state={state}
          loading={!data || loading}
          isSpectator={allowSpectate}
          onGameover={() => setIsGameover(true)}
        />
      )}
      {isMatchState(state, 'multi') && data && (
        <Chat
          matchID={state.matchID}
          playerID={state.playerID}
          playerName={state.playerName}
          credentials={state.credentials}
          isGameover={isGameover}
        />
      )}
    </div>
  );
}

export function Match(props: Props) {
  return (
    <MatchProvider>
      <MatchComponent {...props} />
    </MatchProvider>
  );
}
