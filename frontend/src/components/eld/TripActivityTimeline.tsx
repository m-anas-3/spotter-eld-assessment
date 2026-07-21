import { useMemo, type ReactNode } from 'react'
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined'
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined'
import EvStationOutlinedIcon from '@mui/icons-material/EvStationOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import { Avatar, Box, Card, CardContent, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import type { TimelineEvent, TripEventType } from '../../types/trip'
import { readableDutyStatus } from '../../utils/eld'
import { formatDurationMinutes, formatEventRange } from '../../utils/formatters'

interface TripActivityTimelineProps {
  events: TimelineEvent[]
}

const eventIcons: Record<TripEventType, ReactNode> = {
  INITIAL_REST: <HotelOutlinedIcon />,
  DRIVING: <DirectionsCarOutlinedIcon />,
  PICKUP: <Inventory2OutlinedIcon />,
  DROPOFF: <FlagOutlinedIcon />,
  FUEL: <EvStationOutlinedIcon />,
  REQUIRED_BREAK: <CoffeeOutlinedIcon />,
  DAILY_REST: <HotelOutlinedIcon />,
  CYCLE_RESTART: <RestartAltRoundedIcon />,
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
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 2 }}>
          Driver activities in chronological order
        </Typography>

        {orderedEvents.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
            No timeline events were returned.
          </Typography>
        ) : (
          <Box component="ol" aria-label="Chronological trip activities" sx={{ listStyle: 'none', p: 0, m: 0 }}>
            {orderedEvents.map((event, index) => {
              const isDriving = event.type === 'DRIVING'

              return (
                <Box
                  component="li"
                  key={`${event.type}-${event.start_time}-${index}`}
                  sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}
                >
                  <Stack sx={{ alignItems: 'center', flexShrink: 0 }}>
                    <Avatar
                      sx={{
                        width: 30,
                        height: 30,
                        bgcolor: isDriving ? 'primary.light' : 'action.hover',
                        color: isDriving ? 'primary.main' : 'text.secondary',
                        border: '1px solid',
                        borderColor: isDriving ? 'primary.main' : 'divider',
                        '& svg': { fontSize: 17 },
                      }}
                    >
                      {eventIcons[event.type]}
                    </Avatar>
                    {index < orderedEvents.length - 1 && (
                      <Box aria-hidden="true" sx={{ width: 1, minHeight: 40, flex: 1, bgcolor: 'divider' }} />
                    )}
                  </Stack>

                  <Box sx={{ minWidth: 0, flex: 1, pb: 2.25 }}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      sx={{ justifyContent: 'space-between', alignItems: { sm: 'baseline' }, gap: 0.25 }}
                    >
                      <Typography component="h4" variant="body2" sx={{ fontWeight: 600 }}>
                        {readableType(event.type)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {readableDutyStatus(event.status)}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                      {formatEventRange(event.start_time, event.end_time)} ·{' '}
                      {formatDurationMinutes(event.duration_minutes)}
                    </Typography>
                    {event.location && (
                      <Typography variant="body2" sx={{ mt: 0.65, fontWeight: 500, overflowWrap: 'anywhere' }}>
                        {event.location}
                      </Typography>
                    )}
                    {event.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2, overflowWrap: 'anywhere' }}>
                        {event.description}
                      </Typography>
                    )}
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
