import { Button, FileInput, Modal, ModalBody, ModalHeader, Spinner, TabItem, Tabs } from 'flowbite-react'
import { useEffect, useRef, useState } from 'react'
import { buildTrackPoints, totalElevationGain } from '../lib/geo'
import { parseGpx, parseGpxName } from '../lib/gpx'
import { disconnectStrava, fetchStravaActivities, importStravaActivityAsTrack, type StravaActivitySummary } from '../lib/strava'
import { useStravaConnected } from '../lib/useStravaConnected'
import { useTrackContext } from '../state/TrackContext'
import { formatDistance } from '../lib/pace'

export function ImportPanel() {
  const { state, dispatch } = useTrackContext()
  const open = state.ui.importPanelOpen

  function close() {
    // Only allow closing without importing if a track is already loaded.
    if (state.track) dispatch({ type: 'SET_IMPORT_PANEL_OPEN', open: false })
  }

  return (
    <Modal show={open} onClose={close} dismissible={state.track !== null}>
      <ModalHeader>Importar ruta</ModalHeader>
      <ModalBody>
        <Tabs>
          <TabItem title="Subir GPX">
            <GpxUploadTab />
          </TabItem>
          <TabItem title="Strava">
            <StravaImportTab />
          </TabItem>
        </Tabs>
      </ModalBody>
    </Modal>
  )
}

function GpxUploadTab() {
  const { dispatch } = useTrackContext()
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    try {
      const text = await file.text()
      const rawPoints = parseGpx(text)
      const points = buildTrackPoints(rawPoints)
      dispatch({
        type: 'LOAD_TRACK',
        track: {
          id: crypto.randomUUID(),
          name: parseGpxName(text, file.name.replace(/\.gpx$/i, '')),
          source: 'gpx',
          points,
          totalDistanceMeters: points.length > 0 ? points[points.length - 1].distance : 0,
          totalElevationGainMeters: totalElevationGain(points),
          createdAt: new Date().toISOString(),
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo GPX.')
    }
  }

  return (
    <div className="space-y-3 py-2">
      <FileInput
        accept=".gpx"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
        }}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

function StravaImportTab() {
  const { dispatch } = useTrackContext()
  const [connected, setConnected] = useStravaConnected()
  const [activities, setActivities] = useState<StravaActivitySummary[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [importingId, setImportingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const hasCheckedQueryRef = useRef(false)

  // After the OAuth redirect lands back on "/", clean up the query string and surface any
  // error Strava/the callback endpoint reported.
  useEffect(() => {
    if (hasCheckedQueryRef.current) return
    hasCheckedQueryRef.current = true
    const params = new URLSearchParams(window.location.search)
    if (params.has('stravaConnected') || params.has('stravaError')) {
      if (params.get('stravaError')) setError('No se pudo conectar con Strava. Inténtalo de nuevo.')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (!connected) return
    setLoading(true)
    fetchStravaActivities()
      .then((result) => {
        if (result === null) {
          setConnected(false)
          return
        }
        setActivities(result)
      })
      .catch(() => setError('No se pudieron cargar las actividades de Strava.'))
      .finally(() => setLoading(false))
  }, [connected, setConnected])

  async function handleImport(activity: StravaActivitySummary) {
    setError(null)
    setImportingId(activity.id)
    try {
      const track = await importStravaActivityAsTrack(activity)
      dispatch({ type: 'LOAD_TRACK', track })
    } catch {
      setError('No se pudo importar esa actividad.')
    } finally {
      setImportingId(null)
    }
  }

  async function handleDisconnect() {
    await disconnectStrava()
    setConnected(false)
    setActivities(null)
  }

  if (!connected) {
    return (
      <div className="space-y-3 py-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Conecta tu cuenta de Strava para importar una actividad directamente.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={() => (window.location.href = '/api/strava/login')}>Conectar con Strava</Button>
      </div>
    )
  }

  return (
    <div className="space-y-3 py-2">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">Tus actividades recientes:</p>
        <Button size="xs" color="light" onClick={handleDisconnect}>
          Desconectar
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <Spinner size="sm" />}
      {!loading && activities && activities.length === 0 && (
        <p className="text-sm text-gray-400">No se encontraron actividades con recorrido.</p>
      )}
      <ul className="max-h-64 space-y-1 overflow-y-auto">
        {activities?.map((activity) => (
          <li key={activity.id} className="flex items-center justify-between gap-2 rounded border border-gray-200 p-2 dark:border-gray-700">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{activity.name}</p>
              <p className="text-xs text-gray-400">
                {formatDistance(activity.distanceMeters)} · {new Date(activity.startDate).toLocaleDateString()}
              </p>
            </div>
            <Button size="xs" disabled={importingId === activity.id} onClick={() => handleImport(activity)}>
              {importingId === activity.id ? 'Importando…' : 'Importar'}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
