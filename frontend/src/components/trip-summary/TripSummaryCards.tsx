import { Box, Card, Typography } from '@mui/material'
import type { TripSummary } from '../../types/trip'
import { formatHours, formatMiles } from '../../utils/formatters'

interface TripSummaryCardsProps {
  summary: TripSummary
}

export function TripSummaryCards({ summary }: TripSummaryCardsProps) {
  const remainingCycleHours = Math.max(0, 70 - summary.final_cycle_used_hours)
  const metrics = [
    { label: 'Distance', value: `${formatMiles(summary.total_distance_miles)} mi` },
    { label: 'Driving time', value: formatHours(summary.estimated_driving_hours) },
    { label: 'Total trip time', value: formatHours(summary.total_trip_hours) },
    { label: 'Trip days', value: String(summary.total_trip_days) },
    { label: 'Fuel stops', value: String(summary.fuel_stop_count) },
    {
      label: 'Remaining cycle',
      value: `${remainingCycleHours.toFixed(1)} hr`,
      detail: `${summary.final_cycle_used_hours.toFixed(1)} of 70 hr used`,
    },
  ]

  return (
    <Card className="results-summary">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(6, minmax(0, 1fr))' },
          '& > *': {
            borderRight: '1px solid',
            borderBottom: { xs: '1px solid', lg: 'none' },
            borderColor: 'divider',
          },
          '& > *:nth-of-type(6n)': { borderRight: { lg: 'none' } },
          '& > *:nth-last-of-type(-n+2)': { borderBottom: { xs: 'none', md: '1px solid', lg: 'none' } },
          '& > *:nth-last-of-type(-n+3)': { borderBottom: { md: 'none', lg: 'none' } },
        }}
      >
        {metrics.map((metric) => (
          <Box key={metric.label} sx={{ minWidth: 0, p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {metric.label}
            </Typography>
            <Typography
              sx={{
                mt: 0.5,
                fontSize: '1.125rem',
                fontWeight: 600,
                lineHeight: 1.3,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {metric.value}
            </Typography>
            {metric.detail && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                {metric.detail}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Card>
  )
}
