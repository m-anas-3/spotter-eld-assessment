import { Box, Divider, Stack, Typography } from '@mui/material'
import type { Stop } from '../../types/trip'
import { formatCompactEventRange, formatDurationMinutes } from '../../utils/formatters'

interface StopsListProps {
  stops: Stop[]
}

export function StopsList({ stops }: StopsListProps) {
  return (
    <Box sx={{ height: '100%', p: 2 }}>
      <Typography component="h3" variant="h3">
        Route stops
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, mb: 1 }}>
        {stops.length} {stops.length === 1 ? 'stop' : 'stops'} · travel order
      </Typography>

      {stops.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No route stops were returned.
        </Typography>
      ) : (
        <Box
          component="ol"
          aria-label="Stops in route order"
          sx={{ maxHeight: { lg: 560 }, overflowY: { lg: 'auto' }, listStyle: 'none', p: 0, m: 0 }}
        >
          {stops.map((stop, index) => (
            <Box component="li" key={stop.id}>
              <Stack direction="row" spacing={1.25} sx={{ py: 1.25, alignItems: 'flex-start' }}>
                <Box
                  aria-hidden="true"
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '50%',
                    color: 'text.secondary',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  {index + 1}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                    {stop.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                    {readableType(stop.type)}
                    {stop.duration_minutes > 0 && ` · ${formatDurationMinutes(stop.duration_minutes)}`}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatCompactEventRange(stop.arrival_time, stop.departure_time)}
                  </Typography>
                </Box>
              </Stack>
              {index < stops.length - 1 && <Divider sx={{ ml: 5 }} />}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

function readableType(type: string): string {
  return type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
