import React, { useEffect, useReducer, useState } from 'react';
import { BehaviorSubject } from 'rxjs';
import { Schema$Message } from '@/typings';
import {
  matchReducer,
  initialState,
  UseMatchState,
  UseMatchActions
} from './matchReducer';

type Key = keyof UseMatchState;

const defaultDeps = Object.keys(initialState) as Key[];

const StateContext = React.createContext<UseMatchState | undefined>(undefined);
const DispatchContext = React.createContext<
  React.Dispatch<UseMatchActions> | undefined
>(undefined);

// cannot use Subject
const subject = new BehaviorSubject(initialState);

export function useMatchState<T extends Key>(
  _deps = defaultDeps
): Pick<UseMatchState, T> {
  const [state, setState] = useState<UseMatchState>(initialState);
  const [deps] = useState(_deps);

  if (state === undefined) {
    throw new Error('useMatchState must be used within a ChatProvider');
  }

  useEffect(() => {
    const subscription = subject.subscribe(newState => {
      setState(state => {
        const hasChanged = deps.some(k => {
          if (state[k] !== newState[k]) return true;
          return false;
        });
        return hasChanged ? newState : state;
      });
    });
    return () => subscription.unsubscribe();
  }, [deps]);

  return state;
}

export function useMatchDispatch() {
  const context = React.useContext(DispatchContext);
  if (context === undefined) {
    throw new Error('useMatchDispatch must be used within a ChatProvider');
  }
  return context;
}

export function useMatch<T extends Key>(deps?: T[]) {
  return [useMatchState<T>(deps), useMatchDispatch()] as const;
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

export const MatchProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(matchReducer, initialState);

  useEffect(() => {
    subject.next(state);
  }, [state]);

  return React.createElement(
    StateContext.Provider,
    { value: state },
    React.createElement(DispatchContext.Provider, { value: dispatch }, children)
  );
};
