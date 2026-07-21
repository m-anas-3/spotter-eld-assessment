import { useEffect, useMemo, useRef, useState } from 'react'
import { Alert, Box, Stack } from '@mui/material'
import maplibregl, {
  type GeoJSONSource,
  type Map,
  type Marker,
} from 'maplibre-gl'
import type {
  Coordinate,
  GeoJsonRoute,
  Stop,
  TripLocations,
} from '../../types/trip'
import { formatEventTime } from '../../utils/formatters'
import { appTokens } from '../../theme'
import './TripMap.css'

const ROUTE_SOURCE_ID = 'trip-route'
const ROUTE_CASING_LAYER_ID = 'trip-route-casing'
const ROUTE_LAYER_ID = 'trip-route-line'
const SPECIAL_STOP_TYPES = new Set([
  'FUEL',
  'REQUIRED_BREAK',
  'DAILY_REST',
  'CYCLE_RESTART',
])

interface TripMapProps {
  route: GeoJsonRoute
  locations: TripLocations
  stops: Stop[]
}

interface MarkerData {
  id: string
  type: string
  label: string
  coordinate: Coordinate
  stop?: Stop
}

export function TripMap({ route, locations, stops }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Map | null>(null)
  const markersRef = useRef<Marker[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const styleUrl = import.meta.env.VITE_MAP_STYLE_URL?.trim()

  const validRouteCoordinates = useMemo(
    () => route.coordinates.filter(isValidCoordinate),
    [route.coordinates],
  )

  useEffect(() => {
    if (!containerRef.current || !styleUrl) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [-96, 38],
      zoom: 3,
      cooperativeGestures: true,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    const handleLoad = () => {
      setMapError(null)
    }
    const handleError = () => {
      setMapError(
        'The street basemap could not be loaded completely. Check your internet connection and VITE_MAP_STYLE_URL.',
      )
    }
    map.on('load', handleLoad)
    map.on('error', handleError)

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      map.off('load', handleLoad)
      map.off('error', handleError)
      map.remove()
      mapRef.current = null
    }
  }, [styleUrl])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const drawTrip = () => {
      updateRoute(map, validRouteCoordinates)

      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = createMarkers(map, locations, stops)

      fitTripBounds(map, validRouteCoordinates, locations, stops)
    }

    if (map.isStyleLoaded()) {
      drawTrip()
    } else {
      map.once('load', drawTrip)
    }

    return () => {
      map.off('load', drawTrip)
    }
  }, [locations, stops, validRouteCoordinates])

  return (
    <Box sx={{ position: 'relative', height: '100%', minHeight: { xs: 400, sm: 480, lg: 560 } }}>
      <Box
        ref={containerRef}
        role="region"
        aria-label="Interactive trip route map"
        sx={{
          width: '100%',
          height: { xs: 400, sm: 480, lg: 560 },
          overflow: 'hidden',
          bgcolor: 'action.hover',
        }}
      />

      {(!styleUrl || mapError) && (
        <Stack spacing={1} sx={{ position: 'absolute', zIndex: 2, top: 12, right: 12, left: 12 }}>
          {!styleUrl && (
            <Alert severity="warning">
              Add VITE_MAP_STYLE_URL to the frontend environment to display the map.
            </Alert>
          )}
          {mapError && <Alert severity="warning">{mapError}</Alert>}
        </Stack>
      )}

      {validRouteCoordinates.length < 2 && (
        <Alert
          severity="info"
          sx={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 12,
          }}
        >
          Route geometry is unavailable, but valid location markers can still be displayed.
        </Alert>
      )}
    </Box>
  )
}

function updateRoute(map: Map, coordinates: Coordinate[]) {
  if (coordinates.length < 2) {
    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID)
    if (map.getLayer(ROUTE_CASING_LAYER_ID)) map.removeLayer(ROUTE_CASING_LAYER_ID)
    if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID)
    return
  }

  const routeFeature = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates,
    },
  }

  const existingSource = map.getSource(ROUTE_SOURCE_ID)
  if (existingSource) {
    const geoJsonSource = existingSource as GeoJSONSource
    geoJsonSource.setData(routeFeature)
  } else {
    map.addSource(ROUTE_SOURCE_ID, {
      type: 'geojson',
      data: routeFeature,
    })
  }

  if (!map.getLayer(ROUTE_CASING_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_CASING_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': appTokens.colors.routeCasing,
        'line-width': 6,
        'line-opacity': 0.9,
      },
    })
  }

  if (!map.getLayer(ROUTE_LAYER_ID)) {
    map.addLayer({
      id: ROUTE_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': appTokens.colors.primary,
        'line-width': 3.5,
        'line-opacity': 0.94,
      },
    })
  }
}

function createMarkers(
  map: Map,
  locations: TripLocations,
  stops: Stop[],
): Marker[] {
  const markers: MarkerData[] = []
  const locationDefinitions = [
    { id: 'current', type: 'CURRENT', location: locations.current },
    { id: 'pickup', type: 'PICKUP', location: locations.pickup },
    { id: 'dropoff', type: 'DROPOFF', location: locations.dropoff },
  ]

  for (const definition of locationDefinitions) {
    if (!isValidCoordinate(definition.location.coordinate)) continue
    markers.push({
      id: definition.id,
      type: definition.type,
      label: definition.location.label,
      coordinate: definition.location.coordinate,
      stop: stops.find(
        (stop) =>
          stop.id === definition.id || stop.type === definition.type,
      ),
    })
  }

  for (const stop of stops) {
    if (
      SPECIAL_STOP_TYPES.has(stop.type) &&
      isValidCoordinate(stop.coordinate)
    ) {
      markers.push({
        id: stop.id,
        type: stop.type,
        label: stop.label,
        coordinate: stop.coordinate,
        stop,
      })
    }
  }

  return markers.map((markerData) => {
    const element = document.createElement('button')
    const operational = SPECIAL_STOP_TYPES.has(markerData.type)
    element.type = 'button'
    element.className = `trip-map-marker${operational ? ' trip-map-marker--operational' : ''}`
    element.textContent = markerLabel(markerData.type)
    element.setAttribute('aria-label', `${readableType(markerData.type)}: ${markerData.label}`)
    element.title = markerData.label

    const appearance = markerAppearance(markerData.type)
    element.style.setProperty('--marker-background', appearance.background)
    element.style.setProperty('--marker-color', appearance.color)
    element.style.setProperty('--marker-border', appearance.border)
    element.style.setProperty('--marker-focus', appTokens.colors.primary)

    const popup = new maplibregl.Popup({
      offset: 18,
      closeButton: false,
      maxWidth: '280px',
    }).setDOMContent(createPopupContent(markerData))

    return new maplibregl.Marker({ element })
      .setLngLat(markerData.coordinate)
      .setPopup(popup)
      .addTo(map)
  })
}

function markerAppearance(type: string) {
  if (type === 'PICKUP' || type === 'DROPOFF') {
    return {
      background: appTokens.colors.primary,
      color: appTokens.colors.surface,
      border: appTokens.colors.surface,
    }
  }
  if (SPECIAL_STOP_TYPES.has(type)) {
    return {
      background: appTokens.colors.surface,
      color: appTokens.colors.text,
      border: appTokens.colors.text,
    }
  }
  return {
    background: appTokens.colors.text,
    color: appTokens.colors.surface,
    border: appTokens.colors.surface,
  }
}

function createPopupContent(marker: MarkerData): HTMLElement {
  const content = document.createElement('div')
  content.className = 'trip-map-popup'

  const title = document.createElement('strong')
  title.textContent = marker.label
  content.append(title)

  const type = document.createElement('span')
  type.textContent = readableType(marker.type)
  content.append(type)

  if (marker.stop) {
    const time = document.createElement('span')
    time.textContent = `Arrive ${formatEventTime(marker.stop.arrival_time)}`
    content.append(time)

    if (marker.stop.duration_minutes > 0) {
      const departure = document.createElement('span')
      departure.textContent = `Depart ${formatEventTime(
        marker.stop.departure_time,
      )}`
      content.append(departure)
    }
  }

  return content
}

function fitTripBounds(
  map: Map,
  routeCoordinates: Coordinate[],
  locations: TripLocations,
  stops: Stop[],
) {
  const bounds = new maplibregl.LngLatBounds()
  routeCoordinates.forEach((coordinate) => bounds.extend(coordinate))

  const locationCoordinates = [
    locations.current.coordinate,
    locations.pickup.coordinate,
    locations.dropoff.coordinate,
  ]
  locationCoordinates.forEach((coordinate) => {
    if (isValidCoordinate(coordinate)) bounds.extend(coordinate)
  })
  stops.forEach((stop) => {
    if (isValidCoordinate(stop.coordinate)) bounds.extend(stop.coordinate)
  })

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: { top: 64, right: 64, bottom: 64, left: 64 },
      maxZoom: 11,
      duration: 700,
    })
  }
}

function isValidCoordinate(value: Coordinate | null): value is Coordinate {
  return (
    value !== null &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    value[0] >= -180 &&
    value[0] <= 180 &&
    value[1] >= -90 &&
    value[1] <= 90
  )
}

function markerLabel(type: string): string {
  const labels: Record<string, string> = {
    CURRENT: 'C',
    PICKUP: 'P',
    DROPOFF: 'D',
    FUEL: 'F',
    REQUIRED_BREAK: 'B',
    DAILY_REST: 'R',
    CYCLE_RESTART: '34',
  }
  return labels[type] ?? '•'
}

function readableType(type: string): string {
  return type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
