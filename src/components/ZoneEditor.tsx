import { Button, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, TextInput } from 'flowbite-react'
import { useTrackContext } from '../state/TrackContext'
import { comparePace, formatPace, PACE_COMPARISON_COLORS } from '../lib/pace'
import { formatClock } from '../lib/plan'
import type { PaceZone } from '../types/track'
import { CommitInput } from './CommitInput'
import { formatKm, parseKm, parsePaceInput } from '../lib/pace'

const DEFAULT_ZONE_LENGTH_METERS = 1000
const DEFAULT_ZONE_PACE_SEC_PER_KM = 360 // 6:00/km fallback when there's no global pace yet
const MIN_ZONE_LENGTH_METERS = 20

export function ZoneEditor() {
  const { state, dispatch } = useTrackContext()
  const track = state.track
  if (!track) return null

  const sortedZones = [...state.zones].sort((a, b) => a.startDistanceMeters - b.startDistanceMeters)
  const lastEnd = sortedZones.length > 0 ? sortedZones[sortedZones.length - 1].endDistanceMeters : 0
  const canAdd = lastEnd < track.totalDistanceMeters - 1

  return (
    <section className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Zonas de ritmo</h2>
        <Button
          size="xs"
          disabled={!canAdd}
          onClick={() =>
            dispatch({
              type: 'APPEND_ZONE',
              id: crypto.randomUUID(),
              lengthMeters: DEFAULT_ZONE_LENGTH_METERS,
              fallbackPaceSecPerKm: DEFAULT_ZONE_PACE_SEC_PER_KM,
            })
          }
        >
          + Añadir zona
        </Button>
      </div>

      {sortedZones.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Añade zonas para marcar dónde apretar o soltar. Fuera de las zonas se usa el ritmo global. Puedes arrastrar los
          bordes de cada zona en el perfil.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell className="px-2">Desde km</TableHeadCell>
                <TableHeadCell className="px-2">Hasta km</TableHeadCell>
                <TableHeadCell className="px-2">Ritmo</TableHeadCell>
                <TableHeadCell className="px-2">Tiempo</TableHeadCell>
                <TableHeadCell className="px-2">Nota</TableHeadCell>
                <TableHeadCell className="px-2">
                  <span className="sr-only">Acciones</span>
                </TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedZones.map((zone, i) => (
                <ZoneRow
                  key={zone.id}
                  zone={zone}
                  lowerBound={sortedZones[i - 1]?.endDistanceMeters ?? 0}
                  upperBound={sortedZones[i + 1]?.startDistanceMeters ?? track.totalDistanceMeters}
                  globalPaceSecPerKm={state.settings.globalPaceSecPerKm}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}

function ZoneRow({
  zone,
  lowerBound,
  upperBound,
  globalPaceSecPerKm,
}: {
  zone: PaceZone
  lowerBound: number
  upperBound: number
  globalPaceSecPerKm: number | null
}) {
  const { dispatch } = useTrackContext()
  const comparison = comparePace(zone.paceSecPerKm, globalPaceSecPerKm)
  const color = PACE_COMPARISON_COLORS[comparison]
  const zoneSeconds = ((zone.endDistanceMeters - zone.startDistanceMeters) / 1000) * zone.paceSecPerKm

  return (
    <TableRow className="border-l-4" style={{ borderLeftColor: color.border }}>
      <TableCell className="p-1.5">
        <CommitInput
          sizing="sm"
          inputMode="decimal"
          className="w-20"
          aria-label="Inicio de la zona en km"
          value={zone.startDistanceMeters / 1000}
          format={formatKm}
          parse={parseKm}
          onCommit={(km) => {
            const start = Math.min(Math.max(km * 1000, lowerBound), zone.endDistanceMeters - MIN_ZONE_LENGTH_METERS)
            dispatch({ type: 'UPDATE_ZONE', id: zone.id, patch: { startDistanceMeters: start } })
          }}
        />
      </TableCell>
      <TableCell className="p-1.5">
        <CommitInput
          sizing="sm"
          inputMode="decimal"
          className="w-20"
          aria-label="Fin de la zona en km"
          value={zone.endDistanceMeters / 1000}
          format={formatKm}
          parse={parseKm}
          onCommit={(km) => {
            const end = Math.max(Math.min(km * 1000, upperBound), zone.startDistanceMeters + MIN_ZONE_LENGTH_METERS)
            dispatch({ type: 'UPDATE_ZONE', id: zone.id, patch: { endDistanceMeters: end } })
          }}
        />
      </TableCell>
      <TableCell className="p-1.5">
        <CommitInput
          sizing="sm"
          className="w-20"
          placeholder="5:30"
          aria-label="Ritmo de la zona (min/km)"
          value={zone.paceSecPerKm}
          format={formatPace}
          parse={parsePaceInput}
          onCommit={(sec) => dispatch({ type: 'UPDATE_ZONE', id: zone.id, patch: { paceSecPerKm: sec } })}
        />
      </TableCell>
      <TableCell className="p-1.5 font-mono text-xs whitespace-nowrap text-gray-600 dark:text-gray-300">
        {formatClock(zoneSeconds)}
      </TableCell>
      <TableCell className="p-1.5">
        <TextInput
          sizing="sm"
          className="min-w-24"
          defaultValue={zone.label ?? ''}
          placeholder="Subida..."
          aria-label="Nota de la zona"
          onBlur={(e) => dispatch({ type: 'UPDATE_ZONE', id: zone.id, patch: { label: e.target.value } })}
        />
      </TableCell>
      <TableCell className="p-1.5">
        <Button
          size="xs"
          color="light"
          aria-label="Borrar zona"
          onClick={() => dispatch({ type: 'REMOVE_ZONE', id: zone.id })}
        >
          ✕
        </Button>
      </TableCell>
    </TableRow>
  )
}
