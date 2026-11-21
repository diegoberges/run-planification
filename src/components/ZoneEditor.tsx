import { Button, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useTrackContext } from '../state/TrackContext'
import { formatPace, parsePace } from '../lib/pace'
import type { PaceZone } from '../types/track'

const DEFAULT_ZONE_LENGTH_METERS = 1000
const DEFAULT_ZONE_PACE_SEC_PER_KM = 360 // 6:00/km fallback when there's no global pace yet

export function ZoneEditor() {
  const { state, dispatch } = useTrackContext()
  const track = state.track
  const sortedZones = [...state.zones].sort((a, b) => a.startDistanceMeters - b.startDistanceMeters)

  function addZone() {
    if (!track) return
    const lastEnd = sortedZones.length > 0 ? sortedZones[sortedZones.length - 1].endDistanceMeters : 0
    if (lastEnd >= track.totalDistanceMeters) return // no room left

    const start = lastEnd
    const end = Math.min(start + DEFAULT_ZONE_LENGTH_METERS, track.totalDistanceMeters)
    const zone: PaceZone = {
      id: crypto.randomUUID(),
      startDistanceMeters: start,
      endDistanceMeters: end,
      paceSecPerKm: state.settings.globalPaceSecPerKm ?? DEFAULT_ZONE_PACE_SEC_PER_KM,
    }
    dispatch({ type: 'ADD_ZONE', zone })
  }

  if (!track) return null

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Zonas de ritmo</h2>
        <Button size="xs" onClick={addZone}>
          + Añadir zona
        </Button>
      </div>

      {sortedZones.length === 0 ? (
        <p className="text-xs text-gray-400">Añade zonas para marcar dónde apretar o soltar el ritmo.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Desde (km)</TableHeadCell>
                <TableHeadCell>Hasta (km)</TableHeadCell>
                <TableHeadCell>Ritmo (min/km)</TableHeadCell>
                <TableHeadCell>Etiqueta</TableHeadCell>
                <TableHeadCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedZones.map((zone) => (
                <ZoneRow key={zone.id} zone={zone} totalDistanceMeters={track.totalDistanceMeters} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

function ZoneRow({ zone, totalDistanceMeters }: { zone: PaceZone; totalDistanceMeters: number }) {
  const { dispatch } = useTrackContext()

  return (
    <TableRow>
      <TableCell className="p-2">
        <TextInput
          sizing="sm"
          type="number"
          step="0.01"
          min={0}
          max={zone.endDistanceMeters / 1000}
          value={(zone.startDistanceMeters / 1000).toFixed(2)}
          onChange={(e) => {
            const km = Number.parseFloat(e.target.value)
            if (Number.isNaN(km)) return
            dispatch({ type: 'UPDATE_ZONE', id: zone.id, patch: { startDistanceMeters: Math.max(0, km * 1000) } })
          }}
        />
      </TableCell>
      <TableCell className="p-2">
        <TextInput
          sizing="sm"
          type="number"
          step="0.01"
          min={zone.startDistanceMeters / 1000}
          max={totalDistanceMeters / 1000}
          value={(zone.endDistanceMeters / 1000).toFixed(2)}
          onChange={(e) => {
            const km = Number.parseFloat(e.target.value)
            if (Number.isNaN(km)) return
            dispatch({
              type: 'UPDATE_ZONE',
              id: zone.id,
              patch: { endDistanceMeters: Math.min(totalDistanceMeters, km * 1000) },
            })
          }}
        />
      </TableCell>
      <TableCell className="p-2">
        <TextInput
          sizing="sm"
          defaultValue={formatPace(zone.paceSecPerKm)}
          placeholder="5:30"
          onBlur={(e) => {
            const sec = parsePace(e.target.value)
            if (sec !== null) dispatch({ type: 'UPDATE_ZONE', id: zone.id, patch: { paceSecPerKm: sec } })
          }}
        />
      </TableCell>
      <TableCell className="p-2">
        <TextInput
          sizing="sm"
          defaultValue={zone.label ?? ''}
          placeholder="Subida, viento..."
          onBlur={(e) => dispatch({ type: 'UPDATE_ZONE', id: zone.id, patch: { label: e.target.value } })}
        />
      </TableCell>
      <TableCell className="p-2">
        <Button size="xs" color="red" onClick={() => dispatch({ type: 'REMOVE_ZONE', id: zone.id })}>
          Borrar
        </Button>
      </TableCell>
    </TableRow>
  )
}
