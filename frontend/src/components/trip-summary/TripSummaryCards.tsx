import { Box, Card, LinearProgress, Typography } from '@mui/material'
import type { TripSummary } from '../../types/trip'
import { formatHours, formatMiles } from '../../utils/formatters'

interface TripSummaryCardsProps {
  summary: TripSummary
}

export function TripSummaryCards({ summary }: TripSummaryCardsProps) {
  const remainingCycleHours = Math.max(0, 70 - summary.final_cycle_used_hours)
  const cycleUsagePercent = Math.min(100, (summary.final_cycle_used_hours / 70) * 100)
  const isNearCycleLimit = remainingCycleHours <= 7
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
          '& > *:nth-of-type(2n)': { borderRight: { xs: 'none', md: '1px solid', lg: '1px solid' } },
          '& > *:nth-of-type(3n)': { borderRight: { md: 'none', lg: '1px solid' } },
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
            <Typography sx={{ mt: 0.5, fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.3 }}>
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

      <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <LinearProgress
          variant="determinate"
          value={cycleUsagePercent}
          color={isNearCycleLimit ? 'warning' : 'primary'}
          aria-label={`${summary.final_cycle_used_hours} of 70 cycle hours used`}
        />
      </Box>
    </Card>
  )
}
