import { Button, Label, TextInput } from 'flowbite-react'
import { useState } from 'react'
import { useTrackContext } from '../state/TrackContext'
import { formatDistance, formatElevation, formatPace, parsePace } from '../lib/pace'

export function Toolbar() {
  const { state, dispatch } = useTrackContext()
  const track = state.track
  const [paceText, setPaceText] = useState(
    state.settings.globalPaceSecPerKm !== null ? formatPace(state.settings.globalPaceSecPerKm) : '',
  )

  function commitPace() {
    if (paceText.trim() === '') {
      dispatch({ type: 'SET_GLOBAL_PACE', paceSecPerKm: null })
      return
    }
    const sec = parsePace(paceText)
    if (sec !== null) dispatch({ type: 'SET_GLOBAL_PACE', paceSecPerKm: sec })
  }

  function handleClear() {
    if (window.confirm('¿Seguro que quieres quitar la ruta actual y empezar de nuevo?')) {
      dispatch({ type: 'CLEAR_TRACK' })
    }
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-4 dark:border-gray-700">
      <div>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">Run Planification</h1>
        {track && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {track.name} · {formatDistance(track.totalDistanceMeters)} · +{formatElevation(track.totalElevationGainMeters)}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="global-pace">Ritmo global (min/km)</Label>
          <TextInput
            id="global-pace"
            sizing="sm"
            placeholder="5:30"
            className="w-24"
            value={paceText}
            onChange={(e) => setPaceText(e.target.value)}
            onBlur={commitPace}
          />
        </div>
        <Button size="sm" color="light" onClick={() => dispatch({ type: 'SET_IMPORT_PANEL_OPEN', open: true })}>
          Importar ruta
        </Button>
        {track && (
          <Button size="sm" color="red" onClick={handleClear}>
            Limpiar ruta
          </Button>
        )}
      </div>
    </div>
  )
}
