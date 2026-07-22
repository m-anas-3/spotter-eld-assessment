import { Box, Stack } from '@mui/material'
import type { ReactNode } from 'react'
import type { TripResponse } from '../../types/trip'
import { DailyEldLogs } from '../eld/DailyEldLogs'
import { TripActivityTimeline } from '../eld/TripActivityTimeline'
import { RouteOverview } from '../map/RouteOverview'
import { ResultsTabs } from './ResultsTabs'
import { TripResultsHeader } from './TripResultsHeader'
import { TripSummaryCards } from './TripSummaryCards'

interface TripResultsProps {
  trip: TripResponse
  activeTab: number
  onTabChange: (value: number) => void
  onPrint: () => void
}

export function TripResults({ trip, activeTab, onTabChange, onPrint }: TripResultsProps) {
  return (
    <Stack spacing={2}>
      <TripResultsHeader locations={trip.locations} onPrint={onPrint} />
      <TripSummaryCards summary={trip.trip_summary} />
      <ResultsTabs value={activeTab} onChange={onTabChange} />

      <ResultPanel value={activeTab} index={0}>
        <RouteOverview
          route={trip.route}
          locations={trip.locations}
          stops={trip.stops}
          legs={trip.route_legs}
        />
      </ResultPanel>
      <ResultPanel value={activeTab} index={1}>
        <TripActivityTimeline events={trip.timeline} />
      </ResultPanel>
      <ResultPanel value={activeTab} index={2}>
        <DailyEldLogs logs={trip.daily_logs} />
      </ResultPanel>
    </Stack>
  )
}

interface ResultPanelProps {
  children: ReactNode
  index: number
  value: number
}

function ResultPanel({ children, index, value }: ResultPanelProps) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`trip-results-panel-${index}`}
      aria-labelledby={`trip-results-tab-${index}`}
      sx={{ minWidth: 0 }}
    >
      {children}
    </Box>
  )
}
