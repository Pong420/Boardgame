import React, { useEffect, useReducer, useRef, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import { MessageType, Schema$Message, WsPlayer } from '@/typings';

interface State {
  started: boolean;
  list: string[];
  unread: string[];
  group: string[][];
  byIds: Record<string, Schema$Message>;
  players: (WsPlayer | null)[];
}

interface Create {
  type: 'Create';
  payload: Schema$Message | Schema$Message[];
}

interface Update {
  type: 'Update';
  payload: Schema$Message;
}

interface Reset {
  type: 'Reset';
}

interface UpdatePlayer {
  type: 'UpdatePlayer';
  payload: (WsPlayer | null)[];
}

interface ReadMessage {
  type: 'ReadMessage';
  payload: string;
}

interface Ready {
  type: 'Ready';
  payload: string;
}

type Actions = Create | Update | Reset | UpdatePlayer | ReadMessage | Ready;

const initialState: State = {
  started: false,
  list: [],
  unread: [],
  group: [],
  players: [],
  byIds: {}
};

const defaultDeps = Object.keys(initialState) as (keyof State)[];

const StateContext = React.createContext<State | undefined>(undefined);
const DispatchContext = React.createContext<
  React.Dispatch<Actions> | undefined
>(undefined);

function isStarted(players: UpdatePlayer['payload'], playerID?: string) {
  return players.reduce(
    (state, p) => {
      const player =
        p && (p.playerID === playerID ? { ...p, ready: !p.ready } : p);
      return {
        ...state,
        players: [...state.players, player],
        started: state.started && !!player?.ready
      };
    },
    { players: [], started: true } as Pick<State, 'players' | 'started'>
  );
}

function reducer(state = initialState, action: Actions): State {
  switch (action.type) {
    case 'Create':
      return (() => {
        if (Array.isArray(action.payload)) {
          return action.payload.reduce(
            (state, payload) => reducer(state, { type: 'Create', payload }),
            state
          );
        }

        const { id } = action.payload;

        // for development fast refresh
        if (state.list.includes(id)) {
          console.warn('duplicate id', action.payload.content);
          return state;
        }

        let { group } = state;
        const last = group.slice(-1)[0] || [];
        const msg = state.byIds[last[0]];

        if (
          msg &&
          msg.type === MessageType.CHAT &&
          action.payload.type === MessageType.CHAT &&
          msg.playerID === action.payload.playerID &&
          msg.playerName === action.payload.playerName
        ) {
          group = [...group.slice(0, group.length - 1), [...last, id]];
        } else {
          group = [...group, [id]];
        }

        return {
          ...state,
          group,
          list: [...state.list, id],
          unread: [...state.unread, id],
          byIds: {
            ...state.byIds,
            [id]: action.payload
          }
        };
      })();

    case 'Update':
      return (() => {
        const { id } = action.payload;
        return {
          ...state,
          byIds: {
            ...state.byIds,
            [id]: { ...state.byIds[id], ...action.payload }
          }
        };
      })();

    case 'UpdatePlayer':
      return {
        ...state,
        ...isStarted(action.payload)
      };

    case 'Ready':
      return {
        ...state,
        ...isStarted(state.players, action.payload)
      };

    case 'ReadMessage':
      return (() => {
        const idx = state.unread.indexOf(action.payload);
        if (idx >= 0) {
          return {
            ...state,
            unread: [
              ...state.unread.slice(0, idx),
              ...state.unread.slice(idx + 1)
            ]
          };
        }
        return state;
      })();

    case 'Reset':
      return initialState;

    default:
      throw new Error(`invalid action type`);
  }
}

const subject = new BehaviorSubject(initialState);

export function useChatState(deps = defaultDeps) {
  const context = React.useContext(StateContext);
  const [state, setState] = useState<State | undefined>(context);
  const ref = useRef(deps);

  if (state === undefined) {
    throw new Error('useChatState must be used within a ChatProvider');
  }

  useEffect(() => {
    const deps = ref.current || [];
    const subscription = subject.subscribe(newState => {
      setState(state =>
        deps.some(k => {
          if (!state) return true;
          if (state[k] !== newState[k]) return true;
          return false;
        })
          ? newState
          : state
      );
    });
    return () => subscription.unsubscribe();
  }, []);

  return state;
}

export function useChatDispatch() {
  const context = React.useContext(DispatchContext);
  if (context === undefined) {
    throw new Error('useChatDispatch must be used within a ChatProvider');
  }
  return context;
}

export function useChat(deps?: (keyof State)[]) {
  return [useChatState(deps), useChatDispatch()] as const;
}

export function useChatMessage(id: string) {
  const [msg, setMsg] = useState<Schema$Message>();
  const [unread, setUnread] = useState<boolean>(false);

  useEffect(() => {
    const subscription = subject.subscribe(state => {
      const newMsg = state.byIds[id];
      setMsg(msg => (msg?.status === newMsg?.status ? msg : newMsg));
      setUnread(state.unread.includes(id));
    });
    return () => subscription.unsubscribe();
  }, [id]);

  return [msg, unread] as const;
}

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    subject.next(state);
  }, [state]);

  return React.createElement(
    StateContext.Provider,
    { value: state },
    React.createElement(DispatchContext.Provider, { value: dispatch }, children)
  );
};
