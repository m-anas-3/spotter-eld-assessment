import { useMemo } from 'react'
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import type { TimelineEvent, TripEventType } from '../../types/trip'
import { readableDutyStatus } from '../../utils/eld'
import { formatDurationMinutes } from '../../utils/formatters'

interface TripActivityTimelineProps {
  events: TimelineEvent[]
}

export function TripActivityTimeline({ events }: TripActivityTimelineProps) {
  const orderedEvents = useMemo(
    () =>
      [...events].sort(
        (first, second) => dayjs(first.start_time).valueOf() - dayjs(second.start_time).valueOf(),
      ),
    [events],
  )

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: { xs: 2, md: 2.5 } } }}>
        <Typography component="h3" variant="h3">
          Duty timeline
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 1.5 }}>
          {orderedEvents.length} scheduled {orderedEvents.length === 1 ? 'activity' : 'activities'}
        </Typography>

        {orderedEvents.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No timeline events were returned.
          </Typography>
        ) : (
          <Box component="ol" aria-label="Chronological trip activities" sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {orderedEvents.map((event, index) => {
              const start = dayjs(event.start_time)
              const end = dayjs(event.end_time)
              const endLabel = start.isSame(end, 'day')
                ? end.format('h:mm A')
                : end.format('MMM D · h:mm A')

              return (
                <Box
                  component="li"
                  key={`${event.type}-${event.start_time}-${index}`}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'minmax(0, 1fr) auto',
                      md: '150px minmax(0, 1fr) 150px',
                    },
                    columnGap: { xs: 1.5, md: 2.5 },
                    rowGap: 0.75,
                    py: 1.5,
                    borderTop: index === 0 ? 0 : '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ gridColumn: { xs: '1 / -1', md: 'auto' }, minWidth: 0 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {start.format('MMM D · h:mm A')}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      to {endLabel}
                    </Typography>
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Box
                        aria-hidden="true"
                        sx={{
                          width: 8,
                          height: 8,
                          flexShrink: 0,
                          borderRadius: '50%',
                          bgcolor: event.type === 'DRIVING' ? 'primary.main' : 'text.disabled',
                        }}
                      />
                      <Typography component="h4" variant="body2" sx={{ fontWeight: 600 }}>
                        {readableType(event.type)}
                      </Typography>
                    </Stack>
                    {event.location && (
                      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500, overflowWrap: 'anywhere' }}>
                        {event.location}
                      </Typography>
                    )}
                    {event.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2, overflowWrap: 'anywhere' }}>
                        {event.description}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ minWidth: 0, textAlign: { md: 'right' } }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {formatDurationMinutes(event.duration_minutes)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {readableDutyStatus(event.status)}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

function readableType(type: TripEventType): string {
  return type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
