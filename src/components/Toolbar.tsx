import { Button, Label } from 'flowbite-react'
import { useTrackContext } from '../state/TrackContext'
import { formatDistance, formatElevation, formatPace } from '../lib/pace'
import { elapsedSecondsAt, formatClock } from '../lib/plan'
import { CommitInput } from './CommitInput'
import { parsePaceInput } from '../lib/pace'

export function Toolbar() {
  const { state, dispatch } = useTrackContext()
  const track = state.track
  const globalPace = state.settings.globalPaceSecPerKm

  const totalSeconds = track ? elapsedSecondsAt(track.totalDistanceMeters, state.zones, globalPace) : null
  const averagePace = track && totalSeconds !== null ? totalSeconds / (track.totalDistanceMeters / 1000) : null

  function handleClear() {
    if (window.confirm('¿Seguro que quieres quitar la ruta actual y empezar de nuevo?')) {
      dispatch({ type: 'CLEAR_TRACK' })
    }
  }

  return (
    <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 dark:border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Run Planification</h1>
          {track && <p className="truncate text-sm text-gray-500 dark:text-gray-400">{track.name}</p>}
        </div>
        <div className="flex gap-2">
          <Button size="sm" color="light" onClick={() => dispatch({ type: 'SET_IMPORT_PANEL_OPEN', open: true })}>
            Importar ruta
          </Button>
          {track && (
            <Button size="sm" color="light" onClick={handleClear}>
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {track && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Distancia" value={formatDistance(track.totalDistanceMeters)} />
          <Stat label="Desnivel +" value={formatElevation(track.totalElevationGainMeters)} />
          <div>
            <Label htmlFor="global-pace" className="text-xs font-normal text-gray-500 dark:text-gray-400">
              Ritmo global (min/km)
            </Label>
            <CommitInput
              id="global-pace"
              sizing="sm"
              className="mt-1 w-24"
              placeholder="ej. 5:30"
              value={globalPace}
              format={(v) => (v === null ? '' : formatPace(v))}
              parse={(text) => (text.trim() === '' ? null : parsePaceInput(text))}
              onCommit={(sec) => dispatch({ type: 'SET_GLOBAL_PACE', paceSecPerKm: sec })}
            />
          </div>
          <Stat
            label="Tiempo estimado"
            value={totalSeconds !== null ? formatClock(totalSeconds) : '—'}
            hint={totalSeconds === null ? 'Indica un ritmo global' : undefined}
            emphasis
          />
          <Stat label="Ritmo medio" value={averagePace !== null ? `${formatPace(averagePace)} /km` : '—'} />
        </div>
      )}
    </header>
  )
}

function Stat({ label, value, hint, emphasis }: { label: string; value: string; hint?: string; emphasis?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p
        className={`font-mono tabular-nums ${
          emphasis ? 'text-lg font-semibold text-blue-700 dark:text-blue-400' : 'text-base text-gray-900 dark:text-gray-100'
        }`}
      >
        {value}
      </p>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}
