import { ElevationProfile } from './components/ElevationProfile'
import { ImportPanel } from './components/ImportPanel'
import { MapView } from './components/MapView'
import { MarkerEditor } from './components/MarkerEditor'
import { Toolbar } from './components/Toolbar'
import { ZoneEditor } from './components/ZoneEditor'
import { TrackProvider } from './state/TrackContext'

function PlannerLayout() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <Toolbar />
      <MapView />
      <ElevationProfile />
      <div className="grid gap-6 sm:grid-cols-2">
        <ZoneEditor />
        <MarkerEditor />
      </div>
      <ImportPanel />
    </div>
  )
}

export default function App() {
  return (
    <TrackProvider>
      <PlannerLayout />
    </TrackProvider>
  )
}
