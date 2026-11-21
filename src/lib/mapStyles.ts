import type { MapStyleId } from '../types/track'

export interface MapStyleConfig {
  url: string
  attribution: string
  maxZoom: number
  maxNativeZoom?: number
  subdomains?: string
}

/** Free, no-API-key raster tile sources. Both are community-run services intended for
 * low-volume personal/development use — not a production-grade CDN. If this app ever grows
 * beyond personal use, switch to a paid provider (MapTiler, Thunderforest, Stadia Maps). */
export const MAP_STYLES: Record<MapStyleId, MapStyleConfig> = {
  road: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: 'abc',
  },
  trail: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 17,
    maxNativeZoom: 17,
    subdomains: 'abc',
  },
}
