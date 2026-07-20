import { useMemo, type ReactNode } from 'react'
import CoffeeRoundedIcon from '@mui/icons-material/CoffeeRounded'
import DirectionsCarFilledRoundedIcon from '@mui/icons-material/DirectionsCarFilledRounded'
import EvStationRoundedIcon from '@mui/icons-material/EvStationRounded'
import FlagRoundedIcon from '@mui/icons-material/FlagRounded'
import HotelRoundedIcon from '@mui/icons-material/HotelRounded'
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded'
import MoreTimeRoundedIcon from '@mui/icons-material/MoreTimeRounded'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import dayjs from 'dayjs'
import type { TimelineEvent, TripEventType } from '../../types/trip'
import { readableDutyStatus } from '../../utils/eld'
import {
  formatDurationMinutes,
  formatEventRange,
} from '../../utils/formatters'
import { SectionHeading } from '../layout/SectionHeading'

interface TripActivityTimelineProps {
  events: TimelineEvent[]
}

interface ActivityStyle {
  icon: ReactNode
  background: string
  foreground: string
}

const activityStyles: Record<TripEventType, ActivityStyle> = {
  INITIAL_REST: {
    icon: <HotelRoundedIcon fontSize="small" />,
    background: '#EEEAFB',
    foreground: '#6657A8',
  },
  DRIVING: {
    icon: <DirectionsCarFilledRoundedIcon fontSize="small" />,
    background: '#E3F2EE',
    foreground: '#146B5A',
  },
  PICKUP: {
    icon: <Inventory2RoundedIcon fontSize="small" />,
    background: '#FFF1E2',
    foreground: '#B86618',
  },
  DROPOFF: {
    icon: <FlagRoundedIcon fontSize="small" />,
    background: '#FBE8E8',
    foreground: '#B63F3F',
  },
  FUEL: {
    icon: <EvStationRoundedIcon fontSize="small" />,
    background: '#E4F0F8',
    foreground: '#3278A8',
  },
  REQUIRED_BREAK: {
    icon: <CoffeeRoundedIcon fontSize="small" />,
    background: '#EDF0F2',
    foreground: '#657481',
  },
  DAILY_REST: {
    icon: <HotelRoundedIcon fontSize="small" />,
    background: '#EEEAFB',
    foreground: '#6657A8',
  },
  CYCLE_RESTART: {
    icon: <RestartAltRoundedIcon fontSize="small" />,
    background: '#E7EBF3',
    foreground: '#293B5F',
  },
}

export function TripActivityTimeline({
  events,
}: TripActivityTimelineProps) {
  const orderedEvents = useMemo(
    () =>
      [...events].sort(
        (first, second) =>
          dayjs(first.start_time).valueOf() - dayjs(second.start_time).valueOf(),
      ),
    [events],
  )

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: 3 } }}>
        <SectionHeading
          title="Trip activity timeline"
          description={`${events.length} chronological activit${events.length === 1 ? 'y' : 'ies'}`}
        />

        {orderedEvents.length === 0 ? (
          <Stack
            spacing={1.5}
            sx={{
              minHeight: 180,
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <MoreTimeRoundedIcon sx={{ fontSize: 38 }} />
            <Typography>No trip activities were returned.</Typography>
          </Stack>
        ) : (
          <Box
            component="ol"
            aria-label="Chronological trip activities"
            sx={{
              maxHeight: { md: 760 },
              overflowY: { md: 'auto' },
              listStyle: 'none',
              p: 0,
              pr: { md: 0.5 },
              m: 0,
            }}
          >
            {orderedEvents.map((event, index) => {
              const style = activityStyles[event.type]

              return (
                <Box
                  component="li"
                  key={`${event.type}-${event.start_time}-${index}`}
                  sx={{ display: 'flex', gap: 1.5, minWidth: 0 }}
                >
                  <Stack sx={{ alignItems: 'center', flexShrink: 0 }}>
                    <Avatar
                      sx={{
                        width: 38,
                        height: 38,
                        bgcolor: style.background,
                        color: style.foreground,
                      }}
                    >
                      {style.icon}
                    </Avatar>
                    {index < orderedEvents.length - 1 && (
                      <Box
                        aria-hidden="true"
                        sx={{
                          width: 2,
                          minHeight: 34,
                          flex: 1,
                          bgcolor: 'divider',
                        }}
                      />
                    )}
                  </Stack>

                  <Box sx={{ minWidth: 0, flex: 1, pb: 2.25 }}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      sx={{
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 0.75,
                      }}
                    >
                      <Typography
                        component="h3"
                        variant="body2"
                        sx={{ fontWeight: 800 }}
                      >
                        {readableType(event.type)}
                      </Typography>
                      <Chip
                        label={readableDutyStatus(event.status)}
                        size="small"
                        variant="outlined"
                        sx={{ height: 23, fontSize: '0.66rem' }}
                      />
                    </Stack>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.25 }}
                    >
                      {formatEventRange(event.start_time, event.end_time)}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      Duration: {formatDurationMinutes(event.duration_minutes)}
                    </Typography>

                    {event.location && (
                      <Typography
                        variant="body2"
                        sx={{ mt: 0.75, fontWeight: 700, overflowWrap: 'anywhere' }}
                      >
                        {event.location}
                      </Typography>
                    )}
                    {event.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.25, overflowWrap: 'anywhere' }}
                      >
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
