import type {
  Coordinate,
  TripLocation,
  TripRequest,
  TripResponse,
} from '../types/trip'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim()
const REQUEST_TIMEOUT_MS = 60_000
const DUTY_STATUSES = new Set([
  'OFF_DUTY',
  'SLEEPER_BERTH',
  'DRIVING',
  'ON_DUTY_NOT_DRIVING',
])
const TIMELINE_EVENT_TYPES = new Set([
  'INITIAL_REST',
  'DRIVING',
  'PICKUP',
  'DROPOFF',
  'FUEL',
  'REQUIRED_BREAK',
  'DAILY_REST',
  'CYCLE_RESTART',
])

type JsonRecord = Record<string, unknown>

export class ApiClientError extends Error {
  readonly status: number | null
  readonly code: string
  readonly fieldErrors: Record<string, string[]>

  constructor(
    message: string,
    options: {
      status?: number | null
      code?: string
      fieldErrors?: Record<string, string[]>
    } = {},
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.status = options.status ?? null
    this.code = options.code ?? 'API_ERROR'
    this.fieldErrors = options.fieldErrors ?? {}
  }
}

export async function calculateTrip(
  request: TripRequest,
): Promise<TripResponse> {
  if (!API_BASE_URL) {
    throw new ApiClientError(
      'The API URL is not configured. Add VITE_API_BASE_URL to the frontend environment.',
      { code: 'API_CONFIGURATION_ERROR' },
    )
  }

  let response: Response
  const controller = new AbortController()
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  )
  try {
    response = await fetch(
      `${API_BASE_URL.replace(/\/+$/, '')}/api/trips/calculate/`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      },
    )
  } catch {
    if (controller.signal.aborted) {
      throw new ApiClientError(
        'The trip calculation timed out. Please retry in a moment.',
        { code: 'REQUEST_TIMEOUT' },
      )
    }
    throw new ApiClientError(
      'Unable to reach the trip-planning service. Make sure the Django server is running and try again.',
      { code: 'NETWORK_ERROR' },
    )
  } finally {
    globalThis.clearTimeout(timeoutId)
  }

  const payload = await readJson(response)

  if (!response.ok) {
    throw createResponseError(response.status, payload)
  }

  if (!isTripResponse(payload)) {
    throw new ApiClientError(
      'The trip-planning service returned an unexpected response.',
      {
        status: response.status,
        code: 'INVALID_API_RESPONSE',
      },
    )
  }

  return payload
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function createResponseError(status: number, payload: unknown): ApiClientError {
  if (isRecord(payload) && isRecord(payload.error)) {
    const message = payload.error.message
    const code = payload.error.code

    if (typeof message === 'string') {
      return new ApiClientError(message, {
        status,
        code: typeof code === 'string' ? code : 'API_ERROR',
      })
    }
  }

  const fieldErrors = extractFieldErrors(payload)
  const validationMessage = Object.entries(fieldErrors)
    .map(([field, messages]) => `${readableFieldName(field)}: ${messages.join(' ')}`)
    .join(' ')

  if (validationMessage) {
    return new ApiClientError(validationMessage, {
      status,
      code: 'VALIDATION_ERROR',
      fieldErrors,
    })
  }

  const fallbackMessage =
    status >= 500
      ? 'The trip-planning service is temporarily unavailable. Please try again.'
      : 'The trip request could not be completed. Please check the details and try again.'

  return new ApiClientError(fallbackMessage, {
    status,
    code: `HTTP_${status}`,
  })
}

function extractFieldErrors(payload: unknown): Record<string, string[]> {
  if (!isRecord(payload)) return {}

  const result: Record<string, string[]> = {}
  for (const [field, value] of Object.entries(payload)) {
    if (field === 'error') continue
    const messages = collectMessages(value)
    if (messages.length > 0) result[field] = messages
  }
  return result
}

function collectMessages(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(collectMessages)
  if (isRecord(value)) return Object.values(value).flatMap(collectMessages)
  return []
}

function readableFieldName(field: string): string {
  if (field === 'non_field_errors') return 'Request'
  return field
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function isTripResponse(value: unknown): value is TripResponse {
  if (!isRecord(value)) return false

  const summary = value.trip_summary
  const locations = value.locations
  const route = value.route

  return (
    isRecord(summary) &&
    [
      'total_distance_miles',
      'estimated_driving_hours',
      'total_trip_hours',
      'total_trip_days',
      'fuel_stop_count',
      'initial_cycle_used_hours',
      'final_cycle_used_hours',
    ].every((field) => typeof summary[field] === 'number') &&
    isRecord(locations) &&
    isTripLocation(locations.current) &&
    isTripLocation(locations.pickup) &&
    isTripLocation(locations.dropoff) &&
    isRecord(route) &&
    route.type === 'LineString' &&
    Array.isArray(route.coordinates) &&
    route.coordinates.every(isCoordinate) &&
    Array.isArray(value.route_legs) &&
    value.route_legs.every(isRouteLeg) &&
    Array.isArray(value.stops) &&
    value.stops.every(isStop) &&
    Array.isArray(value.timeline) &&
    value.timeline.every(isTimelineEvent) &&
    Array.isArray(value.daily_logs) &&
    value.daily_logs.every(isDailyLog) &&
    Array.isArray(value.assumptions) &&
    value.assumptions.every((assumption) => typeof assumption === 'string')
  )
}

function isRouteLeg(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.start_label === 'string' &&
    typeof value.end_label === 'string' &&
    typeof value.distance_miles === 'number' &&
    typeof value.duration_minutes === 'number' &&
    Array.isArray(value.geometry) &&
    value.geometry.every(isCoordinate) &&
    Array.isArray(value.instructions) &&
    value.instructions.every(isRouteInstruction)
  )
}

function isRouteInstruction(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.instruction === 'string' &&
    typeof value.distance_miles === 'number' &&
    typeof value.duration_minutes === 'number' &&
    (value.coordinate === null || isCoordinate(value.coordinate))
  )
}

function isTripLocation(value: unknown): value is TripLocation {
  return (
    isRecord(value) &&
    typeof value.label === 'string' &&
    (value.coordinate === null || isCoordinate(value.coordinate))
  )
}

function isStop(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    typeof value.label === 'string' &&
    (value.coordinate === null || isCoordinate(value.coordinate)) &&
    typeof value.arrival_time === 'string' &&
    typeof value.departure_time === 'string' &&
    typeof value.duration_minutes === 'number'
  )
}

function isTimelineEvent(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.type === 'string' &&
    TIMELINE_EVENT_TYPES.has(value.type) &&
    typeof value.status === 'string' &&
    DUTY_STATUSES.has(value.status) &&
    typeof value.start_time === 'string' &&
    typeof value.end_time === 'string' &&
    typeof value.duration_minutes === 'number' &&
    typeof value.duration_hours === 'number' &&
    (value.location === null || typeof value.location === 'string') &&
    (value.description === null || typeof value.description === 'string')
  )
}

function isDailyLog(value: unknown): boolean {
  if (
    !isRecord(value) ||
    typeof value.date !== 'string' ||
    !Array.isArray(value.events) ||
    !value.events.every(isDailyEvent) ||
    !isRecord(value.status_totals)
  ) {
    return false
  }

  const totals = value.status_totals
  return [
    'off_duty_minutes',
    'sleeper_berth_minutes',
    'driving_minutes',
    'on_duty_not_driving_minutes',
    'off_duty_hours',
    'sleeper_berth_hours',
    'driving_hours',
    'on_duty_not_driving_hours',
    'total_minutes',
    'total_hours',
  ].every((field) => typeof totals[field] === 'number')
}

function isDailyEvent(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.type === 'string' &&
    (TIMELINE_EVENT_TYPES.has(value.type) || value.type === 'OFF_DUTY_FILL') &&
    typeof value.status === 'string' &&
    DUTY_STATUSES.has(value.status) &&
    typeof value.start_minute === 'number' &&
    typeof value.end_minute === 'number' &&
    typeof value.start_time === 'string' &&
    typeof value.end_time === 'string' &&
    typeof value.duration_minutes === 'number' &&
    typeof value.duration_hours === 'number' &&
    (value.location === null || typeof value.location === 'string') &&
    (value.description === null || typeof value.description === 'string')
  )
}

function isCoordinate(value: unknown): value is Coordinate {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((part) => typeof part === 'number' && Number.isFinite(part))
  )
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
