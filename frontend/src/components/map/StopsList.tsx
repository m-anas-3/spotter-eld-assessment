import BedtimeRoundedIcon from '@mui/icons-material/BedtimeRounded'
import EvStationRoundedIcon from '@mui/icons-material/EvStationRounded'
import FlagRoundedIcon from '@mui/icons-material/FlagRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import { Avatar, Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import type { Stop } from '../../types/trip'
import { formatEventTime } from '../../utils/formatters'
import { SectionHeading } from '../layout/SectionHeading'

interface StopsListProps {
  stops: Stop[]
}

const iconForStop = (type: string) => {
  if (type === 'FUEL') return <EvStationRoundedIcon fontSize="small" />
  if (type === 'DAILY_REST' || type === 'CYCLE_RESTART') {
    return <BedtimeRoundedIcon fontSize="small" />
  }
  if (type === 'DROPOFF') return <FlagRoundedIcon fontSize="small" />
  return <LocationOnRoundedIcon fontSize="small" />
}

export function StopsList({ stops }: StopsListProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: 3 } }}>
        <SectionHeading
          title="Planned stops"
          description={`${stops.length} route markers`}
        />
        <Stack>
          {stops.map((stop, index) => (
            <Box key={stop.id}>
              <Stack direction="row" spacing={1.5} sx={{ py: 1.25 }}>
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                  }}
                >
                  {iconForStop(stop.type)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {stop.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block' }}
                  >
                    {formatEventTime(stop.arrival_time)}
                  </Typography>
                  {stop.duration_minutes > 0 && (
                    <Typography variant="caption" color="text.secondary">
                      {stop.duration_minutes >= 60
                        ? `${stop.duration_minutes / 60} hr`
                        : `${stop.duration_minutes} min`}
                    </Typography>
                  )}
                </Box>
              </Stack>
              {index < stops.length - 1 && <Divider sx={{ ml: 6 }} />}
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
