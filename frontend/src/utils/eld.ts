import type { DailyEldEvent, DutyStatus, EldStatusTotals } from '../types/trip'

export const MINUTES_PER_DAY = 1440

export interface EldStatusRow {
  status: DutyStatus
  label: string
  shortLabel: string
  totalKey: keyof Pick<
    EldStatusTotals,
    | 'off_duty_hours'
    | 'sleeper_berth_hours'
    | 'driving_hours'
    | 'on_duty_not_driving_hours'
  >
}

export const ELD_STATUS_ROWS: EldStatusRow[] = [
  {
    status: 'OFF_DUTY',
    label: 'Off Duty',
    shortLabel: 'OFF',
    totalKey: 'off_duty_hours',
  },
  {
    status: 'SLEEPER_BERTH',
    label: 'Sleeper Berth',
    shortLabel: 'SB',
    totalKey: 'sleeper_berth_hours',
  },
  {
    status: 'DRIVING',
    label: 'Driving',
    shortLabel: 'D',
    totalKey: 'driving_hours',
  },
  {
    status: 'ON_DUTY_NOT_DRIVING',
    label: 'On Duty, Not Driving',
    shortLabel: 'ON',
    totalKey: 'on_duty_not_driving_hours',
  },
]

export function getOrderedDailyEvents(
  events: DailyEldEvent[],
): DailyEldEvent[] {
  return [...events].sort(
    (first, second) =>
      first.start_minute - second.start_minute ||
      first.end_minute - second.end_minute,
  )
}

export function clampMinute(minute: number): number {
  return Math.min(MINUTES_PER_DAY, Math.max(0, minute))
}

export function isExactDailyTotal(totalMinutes: number): boolean {
  return totalMinutes === MINUTES_PER_DAY
}

export function readableDutyStatus(status: DutyStatus): string {
  return (
    ELD_STATUS_ROWS.find((row) => row.status === status)?.label ?? status
  )
}
