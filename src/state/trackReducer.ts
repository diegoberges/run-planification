import type { AppState, FeedMarker, MapStyleId, PaceZone, Track } from '../types/track'

export const initialAppState: AppState = {
  track: null,
  zones: [],
  markers: [],
  settings: { globalPaceSecPerKm: null, mapStyle: 'road' },
  hoverDistanceMeters: null,
  ui: { importPanelOpen: true, placingMarkerType: null },
}

export type Action =
  | { type: 'LOAD_TRACK'; track: Track }
  | { type: 'CLEAR_TRACK' }
  | { type: 'SET_MAP_STYLE'; mapStyleId: MapStyleId }
  | { type: 'SET_GLOBAL_PACE'; paceSecPerKm: number | null }
  | { type: 'ADD_ZONE'; zone: PaceZone }
  | { type: 'UPDATE_ZONE'; id: string; patch: Partial<Omit<PaceZone, 'id'>> }
  | { type: 'REMOVE_ZONE'; id: string }
  | { type: 'ADD_MARKER'; marker: FeedMarker }
  | { type: 'UPDATE_MARKER'; id: string; patch: Partial<Omit<FeedMarker, 'id'>> }
  | { type: 'REMOVE_MARKER'; id: string }
  | { type: 'SET_HOVER_DISTANCE'; distanceMeters: number | null }
  | { type: 'SET_IMPORT_PANEL_OPEN'; open: boolean }
  | { type: 'SET_PLACING_MARKER_TYPE'; markerType: FeedMarker['type'] | null }
  /** Appends a new zone right after the last one, computed from the latest state so rapid
   * repeated clicks never create overlapping zones. */
  | { type: 'APPEND_ZONE'; id: string; lengthMeters: number; fallbackPaceSecPerKm: number }

export function trackReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_TRACK':
      return {
        ...state,
        track: action.track,
        zones: [],
        markers: [],
        hoverDistanceMeters: null,
        ui: { ...state.ui, importPanelOpen: false, placingMarkerType: null },
      }

    case 'CLEAR_TRACK':
      return {
        ...state,
        track: null,
        zones: [],
        markers: [],
        hoverDistanceMeters: null,
        ui: { ...state.ui, importPanelOpen: true, placingMarkerType: null },
      }

    case 'SET_MAP_STYLE':
      return { ...state, settings: { ...state.settings, mapStyle: action.mapStyleId } }

    case 'SET_GLOBAL_PACE':
      return { ...state, settings: { ...state.settings, globalPaceSecPerKm: action.paceSecPerKm } }

    case 'ADD_ZONE':
      return { ...state, zones: [...state.zones, action.zone].sort((a, b) => a.startDistanceMeters - b.startDistanceMeters) }

    case 'UPDATE_ZONE':
      return {
        ...state,
        zones: state.zones.map((z) => (z.id === action.id ? { ...z, ...action.patch } : z)),
      }

    case 'REMOVE_ZONE':
      return { ...state, zones: state.zones.filter((z) => z.id !== action.id) }

    case 'ADD_MARKER':
      return {
        ...state,
        markers: [...state.markers, action.marker].sort((a, b) => a.distanceMeters - b.distanceMeters),
        ui: { ...state.ui, placingMarkerType: null },
      }

    case 'UPDATE_MARKER':
      return {
        ...state,
        markers: state.markers.map((m) => (m.id === action.id ? { ...m, ...action.patch } : m)),
      }

    case 'REMOVE_MARKER':
      return { ...state, markers: state.markers.filter((m) => m.id !== action.id) }

    case 'SET_HOVER_DISTANCE':
      return { ...state, hoverDistanceMeters: action.distanceMeters }

    case 'SET_IMPORT_PANEL_OPEN':
      return { ...state, ui: { ...state.ui, importPanelOpen: action.open } }

    case 'SET_PLACING_MARKER_TYPE':
      return { ...state, ui: { ...state.ui, placingMarkerType: action.markerType } }

    case 'APPEND_ZONE': {
      if (!state.track) return state
      const total = state.track.totalDistanceMeters
      const lastEnd = state.zones.reduce((max, z) => Math.max(max, z.endDistanceMeters), 0)
      if (lastEnd >= total - 1) return state
      const zone: PaceZone = {
        id: action.id,
        startDistanceMeters: lastEnd,
        endDistanceMeters: Math.min(lastEnd + action.lengthMeters, total),
        paceSecPerKm: state.settings.globalPaceSecPerKm ?? action.fallbackPaceSecPerKm,
      }
      return { ...state, zones: [...state.zones, zone] }
    }

    default:
      return state
  }
}
