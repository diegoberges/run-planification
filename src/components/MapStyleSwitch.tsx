import { Button, ButtonGroup } from 'flowbite-react'
import { useTrackContext } from '../state/TrackContext'
import type { MapStyleId } from '../types/track'

const STYLES: { id: MapStyleId; label: string }[] = [
  { id: 'road', label: 'Asfalto' },
  { id: 'trail', label: 'Trail' },
]

export function MapStyleSwitch() {
  const { state, dispatch } = useTrackContext()

  return (
    <div className="absolute top-2 right-2 z-[1000]">
      <ButtonGroup>
        {STYLES.map((style) => (
          <Button
            key={style.id}
            size="xs"
            color={state.settings.mapStyle === style.id ? 'blue' : 'light'}
            onClick={() => dispatch({ type: 'SET_MAP_STYLE', mapStyleId: style.id })}
          >
            {style.label}
          </Button>
        ))}
      </ButtonGroup>
    </div>
  )
}
