import type { RawPoint } from '../types/track'

/** Parses a GPX file's text content into a flat list of raw lat/lon/elevation points.
 *
 * Only `trk > trkseg > trkpt` is supported (v1 scope: track files, not routes/waypoints-only
 * files). Multiple `<trk>`/`<trkseg>` elements are concatenated in document order. Uses
 * `getElementsByTagName` with the local (unprefixed) tag name, which matches regardless of
 * whatever default namespace a given GPX file declares — real-world GPX exports from Strava,
 * Garmin, etc. all declare slightly different namespace/schema-location combinations, but the
 * element names themselves are stable. */
export function parseGpx(xmlText: string): RawPoint[] {
  const doc = new DOMParser().parseFromString(xmlText, 'application/xml')

  const parserError = doc.getElementsByTagName('parsererror')[0]
  if (parserError) {
    throw new Error('El archivo GPX no se pudo leer: formato XML inválido.')
  }

  const trkptNodes = doc.getElementsByTagName('trkpt')
  if (trkptNodes.length === 0) {
    throw new Error('El archivo GPX no contiene ningún track (trk/trkseg/trkpt).')
  }

  const points: RawPoint[] = []
  for (let i = 0; i < trkptNodes.length; i++) {
    const node = trkptNodes[i]
    const lat = Number.parseFloat(node.getAttribute('lat') ?? '')
    const lon = Number.parseFloat(node.getAttribute('lon') ?? '')
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue

    const eleNode = node.getElementsByTagName('ele')[0]
    const ele = eleNode?.textContent ? Number.parseFloat(eleNode.textContent) : null

    points.push({ lat, lon, ele: ele !== null && !Number.isNaN(ele) ? ele : null })
  }

  if (points.length === 0) {
    throw new Error('El archivo GPX no contiene puntos con coordenadas válidas.')
  }

  return points
}

/** Best-effort route name from a GPX file's <name> (or <trk><name>), falling back to the
 * provided filename. */
export function parseGpxName(xmlText: string, fallbackName: string): string {
  try {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml')
    const trkName = doc.getElementsByTagName('trk')[0]?.getElementsByTagName('name')[0]?.textContent
    const metaName = doc.getElementsByTagName('name')[0]?.textContent
    return (trkName || metaName || fallbackName).trim()
  } catch {
    return fallbackName
  }
}
