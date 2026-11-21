import { useMemo, useRef } from 'react'
import { useTrackContext } from '../state/TrackContext'
import { AxesGrid } from './elevation/AxesGrid'
import { ElevationPath } from './elevation/ElevationPath'
import { HoverCrosshair } from './elevation/HoverCrosshair'
import { MarkerPins } from './elevation/MarkerPins'
import { clientPointToViewBox, PROFILE_VIEW_HEIGHT, PROFILE_VIEW_WIDTH, buildProfileScales } from './elevation/scales'
import { ZoneBands } from './elevation/ZoneBands'

export function ElevationProfile() {
  const { state, dispatch } = useTrackContext()
  const svgRef = useRef<SVGSVGElement>(null)

  const track = state.track

  const scales = useMemo(
    () => (track ? buildProfileScales(track.points, track.totalDistanceMeters) : null),
    [track],
  )

  if (!track || !scales) {
    return (
      <div className="flex h-48 w-full items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-400 dark:border-gray-700">
        Importa una ruta para ver el perfil de elevación
      </div>
    )
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current || !scales) return
    const { x } = clientPointToViewBox(svgRef.current, e.clientX, e.clientY)
    const distance = Math.min(Math.max(scales.x.invert(x), 0), track!.totalDistanceMeters)
    dispatch({ type: 'SET_HOVER_DISTANCE', distanceMeters: distance })
  }

  function handlePointerLeave() {
    dispatch({ type: 'SET_HOVER_DISTANCE', distanceMeters: null })
  }

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!state.ui.placingMarkerType || !svgRef.current || !scales) return
    const { x } = clientPointToViewBox(svgRef.current, e.clientX, e.clientY)
    const distance = Math.min(Math.max(scales.x.invert(x), 0), track!.totalDistanceMeters)
    dispatch({
      type: 'ADD_MARKER',
      marker: { id: crypto.randomUUID(), type: state.ui.placingMarkerType, distanceMeters: distance },
    })
  }

  return (
    <div className="w-full">
      {state.ui.placingMarkerType && (
        <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
          Haz clic en el perfil para colocar el marcador de {state.ui.placingMarkerType === 'food' ? 'comida' : 'agua'}
        </p>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${PROFILE_VIEW_WIDTH} ${PROFILE_VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        className={`h-56 w-full touch-none rounded-lg border border-gray-200 bg-white sm:h-64 dark:border-gray-700 dark:bg-gray-900 ${
          state.ui.placingMarkerType ? 'cursor-crosshair' : ''
        }`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onClick={handleClick}
      >
        <AxesGrid scales={scales} />
        <ElevationPath points={track.points} scales={scales} />
        <ZoneBands
          zones={state.zones}
          totalDistanceMeters={track.totalDistanceMeters}
          globalPaceSecPerKm={state.settings.globalPaceSecPerKm}
          scales={scales}
        />
        <MarkerPins markers={state.markers} totalDistanceMeters={track.totalDistanceMeters} scales={scales} />
        <HoverCrosshair points={track.points} hoverDistanceMeters={state.hoverDistanceMeters} scales={scales} />
      </svg>
    </div>
  )
}
