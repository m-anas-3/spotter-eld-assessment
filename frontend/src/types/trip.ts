export type Coordinate = [longitude: number, latitude: number]

export type DutyStatus =
  | 'OFF_DUTY'
  | 'SLEEPER_BERTH'
  | 'DRIVING'
  | 'ON_DUTY_NOT_DRIVING'

export type TripEventType =
  | 'INITIAL_REST'
  | 'PRE_TRIP_INSPECTION'
  | 'DRIVING'
  | 'PICKUP'
  | 'DROPOFF'
  | 'FUEL'
  | 'REQUIRED_BREAK'
  | 'DAILY_REST'
  | 'CYCLE_RESTART'
  | 'POST_TRIP_INSPECTION'

export interface TripRequest {
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_used_hours: number
  start_time?: string
}

export interface TripSummary {
  total_distance_miles: number
  estimated_driving_hours: number
  total_trip_hours: number
  total_trip_days: number
  fuel_stop_count: number
  initial_cycle_used_hours: number
  final_cycle_used_hours: number
}

export interface TripLocation {
  label: string
  coordinate: Coordinate | null
}

export interface TripLocations {
  current: TripLocation
  pickup: TripLocation
  dropoff: TripLocation
}

export interface RouteInstruction {
  instruction: string
  distance_miles: number
  duration_minutes: number
  coordinate: Coordinate | null
}

export interface RouteLeg {
  start_label: string
  end_label: string
  distance_miles: number
  duration_minutes: number
  instructions: RouteInstruction[]
}

export interface GeoJsonRoute {
  type: 'LineString'
  coordinates: Coordinate[]
}

export interface Stop {
  id: string
  type: string
  label: string
  coordinate: Coordinate | null
  arrival_time: string
  departure_time: string
  duration_minutes: number
  location: string
}

export interface TimelineEvent {
  type: TripEventType
  status: DutyStatus
  start_time: string
  end_time: string
  duration_minutes: number
  duration_hours: number
  location: string | null
  coordinate: Coordinate | null
  distance_miles: number | null
  description: string | null
}

export interface DailyEldEvent {
  type: TripEventType | 'OFF_DUTY_FILL'
  status: DutyStatus
  start_minute: number
  end_minute: number
  start_time: string
  end_time: string
  iso_start_time: string
  iso_end_time: string
  duration_minutes: number
  duration_hours: number
  location: string | null
  description: string | null
  coordinate: Coordinate | null
  distance_miles: number | null
}

export interface EldStatusTotals {
  off_duty_minutes: number
  sleeper_berth_minutes: number
  driving_minutes: number
  on_duty_not_driving_minutes: number
  off_duty_hours: number
  sleeper_berth_hours: number
  driving_hours: number
  on_duty_not_driving_hours: number
  total_minutes: number
  total_hours: number
  total_on_duty_minutes: number
  total_on_duty_hours: number
}

export interface EldLogMetadata {
  record_type: 'PROJECTED'
  time_zone: string
  period_start: string
  driver_name: string | null
  driver_id: string | null
  co_driver_name: string | null
  carrier_name: string | null
  main_office_address: string | null
  tractor_number: string | null
  trailer_number: string | null
  shipping_document_number: string | null
  shipper_name: string | null
  commodity: string | null
  certification_status: 'NOT_CERTIFIED'
}

export interface DailyEldLog {
  date: string
  events: DailyEldEvent[]
  status_totals: EldStatusTotals
  total_driving_miles: number
  log_metadata: EldLogMetadata
}

export interface TripResponse {
  trip_summary: TripSummary
  locations: TripLocations
  route: GeoJsonRoute
  route_legs: RouteLeg[]
  stops: Stop[]
  timeline: TimelineEvent[]
  daily_logs: DailyEldLog[]
  assumptions: string[]
}
