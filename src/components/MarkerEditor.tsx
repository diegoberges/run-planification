import { Button, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useTrackContext } from '../state/TrackContext'
import { elapsedSecondsAt, formatClock } from '../lib/plan'
import type { FeedMarker } from '../types/track'
import { CommitInput } from './CommitInput'
import { formatKm, parseKm } from '../lib/pace'

export function MarkerEditor() {
  const { state, dispatch } = useTrackContext()
  const track = state.track
  if (!track) return null

  const sortedMarkers = [...state.markers].sort((a, b) => a.distanceMeters - b.distanceMeters)
  const placing = state.ui.placingMarkerType

  return (
    <section className="w-full">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Avituallamiento</h2>
        <div className="flex gap-2">
          <Button
            size="xs"
            color={placing === 'food' ? 'blue' : 'light'}
            onClick={() => dispatch({ type: 'SET_PLACING_MARKER_TYPE', markerType: placing === 'food' ? null : 'food' })}
          >
            🍌 Comida
          </Button>
          <Button
            size="xs"
            color={placing === 'drink' ? 'blue' : 'light'}
            onClick={() => dispatch({ type: 'SET_PLACING_MARKER_TYPE', markerType: placing === 'drink' ? null : 'drink' })}
          >
            💧 Agua
          </Button>
        </div>
      </div>

      {sortedMarkers.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Pulsa "Comida" o "Agua" y luego haz clic en el perfil para colocar un punto. Después puedes arrastrarlo.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell className="px-2">Tipo</TableHeadCell>
                <TableHeadCell className="px-2">Km</TableHeadCell>
                <TableHeadCell className="px-2">Paso</TableHeadCell>
                <TableHeadCell className="px-2">Nota</TableHeadCell>
                <TableHeadCell className="px-2">
                  <span className="sr-only">Acciones</span>
                </TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedMarkers.map((marker) => {
                const eta = elapsedSecondsAt(marker.distanceMeters, state.zones, state.settings.globalPaceSecPerKm)
                return (
                  <MarkerRow
                    key={marker.id}
                    marker={marker}
                    eta={eta}
                    totalDistanceMeters={track.totalDistanceMeters}
                  />
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}

function MarkerRow({
  marker,
  eta,
  totalDistanceMeters,
}: {
  marker: FeedMarker
  eta: number | null
  totalDistanceMeters: number
}) {
  const { dispatch } = useTrackContext()

  return (
    <TableRow>
      <TableCell className="p-1.5 text-lg" title={marker.type === 'food' ? 'Comida' : 'Agua'}>
        {marker.type === 'food' ? '🍌' : '💧'}
      </TableCell>
      <TableCell className="p-1.5">
        <CommitInput
          sizing="sm"
          inputMode="decimal"
          className="w-20"
          aria-label="Distancia del avituallamiento en km"
          value={marker.distanceMeters / 1000}
          format={formatKm}
          parse={parseKm}
          onCommit={(km) =>
            dispatch({
              type: 'UPDATE_MARKER',
              id: marker.id,
              patch: { distanceMeters: Math.min(Math.max(km * 1000, 0), totalDistanceMeters) },
            })
          }
        />
      </TableCell>
      <TableCell
        className="p-1.5 font-mono text-xs whitespace-nowrap text-gray-600 dark:text-gray-300"
        title="Tiempo estimado de paso"
      >
        {eta !== null ? formatClock(eta) : '—'}
      </TableCell>
      <TableCell className="p-1.5">
        <TextInput
          sizing="sm"
          className="min-w-24"
          defaultValue={marker.label ?? ''}
          placeholder="Gel, isotónica..."
          aria-label="Nota del avituallamiento"
          onBlur={(e) => dispatch({ type: 'UPDATE_MARKER', id: marker.id, patch: { label: e.target.value } })}
        />
      </TableCell>
      <TableCell className="p-1.5">
        <Button
          size="xs"
          color="light"
          aria-label="Borrar avituallamiento"
          onClick={() => dispatch({ type: 'REMOVE_MARKER', id: marker.id })}
        >
          ✕
        </Button>
      </TableCell>
    </TableRow>
  )
}
