import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { trackReducer, type Action } from './trackReducer'
import { loadInitialState, usePersistToLocalStorage } from './useLocalStoragePersistence'
import type { AppState } from '../types/track'

interface TrackContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const TrackContext = createContext<TrackContextValue | null>(null)

export function TrackProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(trackReducer, undefined, loadInitialState)

  usePersistToLocalStorage(state)

  return <TrackContext.Provider value={{ state, dispatch }}>{children}</TrackContext.Provider>
}

export function useTrackContext(): TrackContextValue {
  const ctx = useContext(TrackContext)
  if (!ctx) throw new Error('useTrackContext must be used within a TrackProvider')
  return ctx
}
