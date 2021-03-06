import React from 'react';
import { Card } from '../Card';
import { BigTwoBoardProps } from '../../typings';
import { useTranslate } from '../../utils/useTranslate';

export function Center(props: BigTwoBoardProps) {
  const { previous } = props.G;
  const numOfCards = previous.hand?.length || 0;

  const [{ translateX, maxWidth }, ref] = useTranslate<HTMLDivElement>({
    axis: 'x',
    numOfCards
  });

  return (
    <div className="center">
      <div>
        <div className="last-hand" ref={ref}>
          <div className="cards" style={{ maxWidth }}>
            {previous.hand?.map((card: string, idx) => (
              <Card
                value={card}
                key={card}
                style={{
                  transform: `translate(${translateX * idx}px, 0)`
                }}
              />
            ))}
          </div>
        </div>
        <div className="message">
          {props.ctx.gameover
            ? `Player ${props.ctx.gameover} Win`
            : props.isActive
            ? 'Your Turn'
            : `Waiting for Player ${props.ctx.currentPlayer}`}
        </div>
      </div>
    </div>
  );
}
