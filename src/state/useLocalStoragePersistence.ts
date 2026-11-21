import { useEffect, useRef } from 'react'
import type { AppState, PersistedAppState } from '../types/track'
import type { Action } from './trackReducer'

const STORAGE_KEY = 'run-planification:v1'
const DEBOUNCE_MS = 300

/** Reads the persisted subset of app state from localStorage on mount and dispatches it as a
 * hydration action. Defensive against missing/corrupt/old-shape data — falls back to leaving
 * the initial (empty) state untouched rather than crashing the app. */
export function useHydrateFromLocalStorage(dispatch: React.Dispatch<Action>) {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as PersistedAppState
      if (!parsed || typeof parsed !== 'object') return
      dispatch({
        type: 'HYDRATE_FROM_STORAGE',
        state: {
          track: parsed.track ?? null,
          zones: Array.isArray(parsed.zones) ? parsed.zones : [],
          markers: Array.isArray(parsed.markers) ? parsed.markers : [],
          settings: parsed.settings ?? { globalPaceSecPerKm: null, mapStyle: 'road' },
        },
      })
    } catch {
      // Corrupt localStorage contents — ignore and keep the default empty state.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/** Persists the relevant subset of app state to localStorage on every change, debounced so
 * rapid updates (e.g. dragging a zone boundary) don't thrash storage writes. */
export function usePersistToLocalStorage(state: AppState) {
  const timeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current)

    timeoutRef.current = window.setTimeout(() => {
      const persisted: PersistedAppState = {
        track: state.track,
        zones: state.zones,
        markers: state.markers,
        settings: state.settings,
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
      } catch {
        // Storage full/unavailable (e.g. private browsing) — silently skip persistence.
      }
    }, DEBOUNCE_MS)

    return () => {
      if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current)
    }
  }, [state.track, state.zones, state.markers, state.settings])
}
