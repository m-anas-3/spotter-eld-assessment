import FlagRoundedIcon from '@mui/icons-material/FlagRounded'
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material'
import type { TripLocations } from '../../types/trip'
import { SectionHeading } from '../layout/SectionHeading'

interface RouteMapPlaceholderProps {
  locations: TripLocations
}

const coordinateLabel = (coordinate: [number, number] | null) =>
  coordinate ? `${coordinate[1].toFixed(3)}, ${coordinate[0].toFixed(3)}` : '—'

export function RouteMapPlaceholder({ locations }: RouteMapPlaceholderProps) {
  const markers = [
    {
      icon: <LocalShippingRoundedIcon fontSize="small" />,
      label: locations.current.label,
      coordinate: locations.current.coordinate,
      color: '#1B7563',
    },
    {
      icon: <LocationOnRoundedIcon fontSize="small" />,
      label: locations.pickup.label,
      coordinate: locations.pickup.coordinate,
      color: '#E9983E',
    },
    {
      icon: <FlagRoundedIcon fontSize="small" />,
      label: locations.dropoff.label,
      coordinate: locations.dropoff.coordinate,
      color: '#C75252',
    },
  ]

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: 3 } }}>
        <SectionHeading
          title="Route overview"
          description="GeoJSON preview · coordinates use longitude, latitude"
          action={<Chip label="Mock route" size="small" color="primary" variant="outlined" />}
        />
        <Box
          role="img"
          aria-label="Map placeholder showing a route from Chicago through Milwaukee to Dallas"
          sx={{
            position: 'relative',
            minHeight: { xs: 310, md: 390 },
            overflow: 'hidden',
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: '#DDE9E6',
            backgroundImage: `
              linear-gradient(30deg, rgba(20,107,90,.08) 12%, transparent 12.5%, transparent 87%, rgba(20,107,90,.08) 87.5%),
              linear-gradient(150deg, rgba(20,107,90,.08) 12%, transparent 12.5%, transparent 87%, rgba(20,107,90,.08) 87.5%),
              linear-gradient(30deg, rgba(20,107,90,.08) 12%, transparent 12.5%, transparent 87%, rgba(20,107,90,.08) 87.5%)
            `,
            backgroundSize: '80px 140px',
          }}
        >
          <Box
            component="svg"
            viewBox="0 0 800 390"
            preserveAspectRatio="none"
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          >
            <path
              d="M 155 70 C 270 25, 345 80, 420 155 S 545 235, 645 325"
              fill="none"
              stroke="rgba(255,255,255,.9)"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M 155 70 C 270 25, 345 80, 420 155 S 545 235, 645 325"
              fill="none"
              stroke="#146B5A"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="2 1"
            />
          </Box>

          {[
            { left: '18%', top: '14%', color: '#1B7563' },
            { left: '27%', top: '10%', color: '#E9983E' },
            { left: '79%', top: '82%', color: '#C75252' },
          ].map((marker, index) => (
            <Box
              key={marker.color}
              sx={{
                position: 'absolute',
                left: marker.left,
                top: marker.top,
                width: 18,
                height: 18,
                borderRadius: '50%',
                bgcolor: marker.color,
                border: '4px solid white',
                boxShadow: '0 2px 8px rgba(23,33,47,.28)',
                transform: 'translate(-50%, -50%)',
                zIndex: index + 1,
              }}
            />
          ))}

          <Card
            sx={{
              position: 'absolute',
              left: 16,
              right: { xs: 16, sm: 'auto' },
              bottom: 16,
              width: { sm: 315 },
              bgcolor: 'rgba(255,255,255,.94)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack spacing={1.25}>
                {markers.map((marker) => (
                  <Stack
                    key={marker.label}
                    direction="row"
                    spacing={1.25}
                    sx={{ alignItems: 'center' }}
                  >
                    <Box sx={{ color: marker.color, display: 'flex' }}>{marker.icon}</Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                        {marker.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {coordinateLabel(marker.coordinate)}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </CardContent>
    </Card>
  )
}
