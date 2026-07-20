import { useEffect, useMemo, useRef, useState } from 'react'
import MapRoundedIcon from '@mui/icons-material/MapRounded'
import { Alert, Box, Card, CardContent, Chip, Typography } from '@mui/material'
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
import { SectionHeading } from '../layout/SectionHeading'
import './TripMap.css'

const ROUTE_SOURCE_ID = 'trip-route'
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

  const locationItems = [
    { type: 'Current', location: locations.current },
    { type: 'Pickup', location: locations.pickup },
    { type: 'Drop-off', location: locations.dropoff },
  ]

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: 3 } }}>
        <SectionHeading
          title="Route overview"
          description="Interactive route and planned stop markers"
          action={
            <Chip
              icon={<MapRoundedIcon />}
              label="Live route"
              size="small"
              color="primary"
              variant="outlined"
            />
          }
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' },
            gap: 1,
            mb: 2,
          }}
        >
          {locationItems.map(({ type, location }) => (
            <Box
              key={type}
              sx={{
                minWidth: 0,
                px: 1.5,
                py: 1.25,
                borderRadius: 1.5,
                bgcolor: '#F8FAFB',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', fontWeight: 700 }}
              >
                {type}
              </Typography>
              <Typography
                variant="body2"
                title={location.label}
                sx={{
                  mt: 0.25,
                  fontWeight: 700,
                  overflowWrap: 'anywhere',
                }}
              >
                {location.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {!styleUrl && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Add VITE_MAP_STYLE_URL to the frontend environment to display the map.
          </Alert>
        )}
        {mapError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {mapError}
          </Alert>
        )}

        <Box sx={{ position: 'relative' }}>
          <Box
            ref={containerRef}
            aria-label="Interactive trip route map"
            sx={{
              width: '100%',
              height: { xs: 360, sm: 440, lg: 500 },
              overflow: 'hidden',
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: '#E8EFED',
            }}
          />
          {validRouteCoordinates.length < 2 && (
            <Alert
              severity="info"
              sx={{
                position: 'absolute',
                left: 16,
                right: 16,
                bottom: 16,
                boxShadow: 1,
              }}
            >
              Route geometry is unavailable, but valid location markers can
              still be displayed.
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

function updateRoute(map: Map, coordinates: Coordinate[]) {
  if (coordinates.length < 2) {
    if (map.getLayer(ROUTE_LAYER_ID)) map.removeLayer(ROUTE_LAYER_ID)
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
        'line-color': '#146B5A',
        'line-width': 5,
        'line-opacity': 0.9,
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
    element.type = 'button'
    element.className = `trip-map-marker trip-map-marker--${markerData.type
      .toLowerCase()
      .replaceAll('_', '-')}`
    element.textContent = markerLabel(markerData.type)
    element.setAttribute('aria-label', `${readableType(markerData.type)}: ${markerData.label}`)
    element.title = markerData.label

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
