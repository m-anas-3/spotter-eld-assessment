import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import EvStationRoundedIcon from '@mui/icons-material/EvStationRounded'
import RouteRoundedIcon from '@mui/icons-material/RouteRounded'
import { Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import type { TripSummary } from '../../types/trip'
import { formatHours, formatMiles } from '../../utils/formatters'

interface TripSummaryCardsProps {
  summary: TripSummary
}

interface SummaryCardProps {
  label: string
  value: string
  detail: string
  icon: ReactNode
}

function SummaryCard({ label, value, detail, icon }: SummaryCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: 'space-between' }}
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 600 }}
            >
              {label}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 750 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {detail}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 40,
              height: 40,
              flexShrink: 0,
              borderRadius: 2,
              bgcolor: 'primary.light',
              color: 'primary.main',
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function TripSummaryCards({ summary }: TripSummaryCardsProps) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
        <SummaryCard
          label="Total distance"
          value={`${formatMiles(summary.total_distance_miles)} mi`}
          detail={`${summary.fuel_stop_count} planned fuel stop`}
          icon={<RouteRoundedIcon fontSize="small" />}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
        <SummaryCard
          label="Driving time"
          value={formatHours(summary.estimated_driving_hours)}
          detail="Wheel-moving time"
          icon={<AccessTimeRoundedIcon fontSize="small" />}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
        <SummaryCard
          label="Total trip"
          value={formatHours(summary.total_trip_hours)}
          detail={`${summary.total_trip_days} ELD log days`}
          icon={<CalendarMonthRoundedIcon fontSize="small" />}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
        <SummaryCard
          label="Cycle usage"
          value={`${summary.final_cycle_used_hours.toFixed(1)} / 70 hr`}
          detail={`Starts at ${summary.initial_cycle_used_hours} hours`}
          icon={<EvStationRoundedIcon fontSize="small" />}
        />
      </Grid>
    </Grid>
  )
}
