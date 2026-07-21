import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import { Box, Button, Stack, Typography } from '@mui/material'
import type { TripLocations } from '../../types/trip'

interface TripResultsHeaderProps {
  locations: TripLocations
  onPrint: () => void
}

export function TripResultsHeader({ locations, onPrint }: TripResultsHeaderProps) {
  return (
    <Stack
      className="trip-results-heading"
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h2" variant="h2" sx={{ overflowWrap: 'anywhere' }}>
          {locations.current.label} → {locations.dropoff.label}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflowWrap: 'anywhere' }}>
          Pickup in {locations.pickup.label}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PrintOutlinedIcon />}
        onClick={onPrint}
        sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, whiteSpace: 'nowrap' }}
      >
        Print ELD logs
      </Button>
    </Stack>
  )
}
