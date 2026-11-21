import { Button, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useTrackContext } from '../state/TrackContext'
import type { FeedMarker } from '../types/track'

export function MarkerEditor() {
  const { state, dispatch } = useTrackContext()
  const track = state.track
  const sortedMarkers = [...state.markers].sort((a, b) => a.distanceMeters - b.distanceMeters)

  if (!track) return null

  const placing = state.ui.placingMarkerType

  return (
    <div className="w-full">
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
        <p className="text-xs text-gray-400">
          Pulsa "Comida" o "Agua" y luego haz clic en el perfil para colocar un punto.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Tipo</TableHeadCell>
                <TableHeadCell>Distancia (km)</TableHeadCell>
                <TableHeadCell>Etiqueta</TableHeadCell>
                <TableHeadCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedMarkers.map((marker) => (
                <MarkerRow key={marker.id} marker={marker} totalDistanceMeters={track.totalDistanceMeters} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function MarkerRow({ marker, totalDistanceMeters }: { marker: FeedMarker; totalDistanceMeters: number }) {
  const { dispatch } = useTrackContext()

  return (
    <TableRow>
      <TableCell className="p-2">{marker.type === 'food' ? '🍌 Comida' : '💧 Agua'}</TableCell>
      <TableCell className="p-2">
        <TextInput
          sizing="sm"
          type="number"
          step="0.01"
          min={0}
          max={totalDistanceMeters / 1000}
          value={(marker.distanceMeters / 1000).toFixed(2)}
          onChange={(e) => {
            const km = Number.parseFloat(e.target.value)
            if (Number.isNaN(km)) return
            dispatch({
              type: 'UPDATE_MARKER',
              id: marker.id,
              patch: { distanceMeters: Math.min(Math.max(km * 1000, 0), totalDistanceMeters) },
            })
          }}
        />
      </TableCell>
      <TableCell className="p-2">
        <TextInput
          sizing="sm"
          defaultValue={marker.label ?? ''}
          placeholder="Gel, isotónica..."
          onBlur={(e) => dispatch({ type: 'UPDATE_MARKER', id: marker.id, patch: { label: e.target.value } })}
        />
      </TableCell>
      <TableCell className="p-2">
        <Button size="xs" color="red" onClick={() => dispatch({ type: 'REMOVE_MARKER', id: marker.id })}>
          Borrar
        </Button>
      </TableCell>
    </TableRow>
  )
}
