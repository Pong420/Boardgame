import { Game, Ctx, PhaseConfig } from 'boardgame.io';
import { BoardProps } from 'boardgame.io/react';
import { Gameover } from '@/typings';
import { moves } from './game/moves';

type Name = 'game-name';

export interface Prefix_State {
  players: Record<string, Prefix_Player>;
  opponents: Prefix_Opponent[];
  secret?: Prefix_Secret;
}

export interface Prefix_Secret {}

export interface Prefix_Player {
  ready: boolean;
}

export interface Prefix_Opponent extends Partial<Prefix_Player> {
  id: string;
}

export type OmitArg<F> = F extends (
  G: any,
  ctx: any,
  ...args: infer P
) => infer R // eslint-disable-line @typescript-eslint/no-unused-vars
  ? (...args: P) => R
  : never;

type ExtractMove<T> = T extends (...args: any) => any
  ? T
  : T extends { move: (...args: any) => any }
  ? T['move']
  : never;

export type Prefix_Moves = {
  [K in keyof typeof moves]: OmitArg<ExtractMove<typeof moves[K]>>;
};

export interface Prefix_Gameover extends Gameover {}

export interface Prefix_Ctx extends Ctx {
  events: NonNullable<Required<Ctx['events']>>;
  random: NonNullable<Ctx['random']>;
  gameover?: Prefix_Gameover;
}

export type Prefix_Game = Game<Prefix_State, Prefix_Ctx> & { name: Name };
export type Prefix_PlayerView = Prefix_Game['playerView'];
export type Prefix_PhaseConfig = PhaseConfig<Prefix_State, Prefix_Ctx>;
export type Prefix_BoardProps = Omit<BoardProps<Prefix_State>, 'ctx'> & {
  isConnected?: boolean;
  moves: Prefix_Moves;
  ctx: Prefix_Ctx;
};
