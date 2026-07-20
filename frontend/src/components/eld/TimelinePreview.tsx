import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import type { TimelineEvent } from '../../types/trip'
import { formatEventTime } from '../../utils/formatters'
import { SectionHeading } from '../layout/SectionHeading'

interface TimelinePreviewProps {
  events: TimelineEvent[]
}

const eventColor: Record<TimelineEvent['status'], string> = {
  OFF_DUTY: '#7B8793',
  SLEEPER_BERTH: '#6657A8',
  DRIVING: '#146B5A',
  ON_DUTY_NOT_DRIVING: '#E9983E',
}

const readableType = (type: string) =>
  type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export function TimelinePreview({ events }: TimelinePreviewProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: 3 } }}>
        <SectionHeading
          title="Duty timeline"
          description="Chronological trip activities"
        />
        <Stack spacing={0}>
          {events.map((event, index) => (
            <Stack
              key={`${event.type}-${event.start_time}`}
              direction="row"
              spacing={1.5}
              sx={{ minHeight: 65 }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: 14,
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={{
                    mt: 0.75,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: eventColor[event.status],
                  }}
                />
                {index < events.length - 1 && (
                  <Box sx={{ width: 2, flex: 1, bgcolor: 'divider' }} />
                )}
              </Box>
              <Box sx={{ pb: 1.5, minWidth: 0, flex: 1 }}>
                <Stack
                  direction="row"
                  sx={{ justifyContent: 'space-between', gap: 1 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {readableType(event.type)}
                  </Typography>
                  <Chip
                    label={`${event.duration_hours} hr`}
                    size="small"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                </Stack>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block' }}
                >
                  {formatEventTime(event.start_time)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: 'block' }}
                >
                  {event.location}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
