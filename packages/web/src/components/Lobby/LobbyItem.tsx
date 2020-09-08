import React from 'react';
import { Card } from '@blueprintjs/core';
import { JoinMatch } from './JoinMatch';
import { Player, Match, GameMeta } from '@/typings';

interface Props extends Match {
  meta: GameMeta;
}

export function LobbyItem({
  meta,
  matchID,
  setupData,
  updatedAt,
  players
}: Props) {
  const [nextPlayers, playerJoined] = players.reduce(
    (result, p) => {
      result[typeof p.name === 'undefined' ? 0 : 1].push(p);
      return result;
    },
    [[], []] as [Player[], Player[]]
  );
  const numPlayers = players.length;
  const { name } = meta;

  if (setupData) {
    const { matchName, description } = setupData;
    return (
      <Card className="lobby-item" elevation={1}>
        <div className="lobby-item-header">
          <div className="lobby-item-name">{matchName.slice(0, 10)}</div>
          <div>
            {playerJoined.length} / {numPlayers}
          </div>
        </div>
        <div className="lobby-item-description">
          {description?.slice(0, 50)}
        </div>
        <div className="lobby-item-footer">
          <div>
            {new Date(updatedAt)
              .toISOString()
              .replace(/T/, ' ')
              .replace(/\..*/, '')}
          </div>
          <div>
            {nextPlayers.length ? (
              <JoinMatch
                meta={meta}
                name={name}
                matchID={matchID}
                matchName={matchName}
                playerID={String(nextPlayers[0]?.id)}
              />
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  return <Card className="lobby-item">Invlid Match</Card>;
}
