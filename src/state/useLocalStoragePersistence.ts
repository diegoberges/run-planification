import { useEffect, useRef } from 'react'
import type { AppState, PersistedAppState } from '../types/track'
import { initialAppState } from './trackReducer'

const STORAGE_KEY = 'run-planification:v1'
const DEBOUNCE_MS = 300

/** Builds the initial app state synchronously from localStorage, so the very first render
 * already has the saved track/settings (no empty flash, and components that seed local
 * input state from the store see the persisted values). Defensive against missing/corrupt
 * data — falls back to the empty initial state rather than crashing. */
export function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialAppState
    const parsed = JSON.parse(raw) as Partial<PersistedAppState> | null
    if (!parsed || typeof parsed !== 'object') return initialAppState
    const track = parsed.track ?? null
    return {
      ...initialAppState,
      track,
      zones: Array.isArray(parsed.zones) ? parsed.zones : [],
      markers: Array.isArray(parsed.markers) ? parsed.markers : [],
      settings: { ...initialAppState.settings, ...(parsed.settings ?? {}) },
      ui: { ...initialAppState.ui, importPanelOpen: track === null },
    }
  } catch {
    return initialAppState
  }
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
