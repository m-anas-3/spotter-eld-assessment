import AltRouteRoundedIcon from '@mui/icons-material/AltRouteRounded'
import NavigationRoundedIcon from '@mui/icons-material/NavigationRounded'
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import type { RouteLeg } from '../../types/trip'
import {
  formatDurationMinutes,
  formatMiles,
} from '../../utils/formatters'
import { SectionHeading } from '../layout/SectionHeading'

interface RouteDirectionsProps {
  legs: RouteLeg[]
}

export function RouteDirections({ legs }: RouteDirectionsProps) {
  const instructionCount = legs.reduce(
    (total, leg) => total + leg.instructions.length,
    0,
  )

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: 3 } }}>
        <SectionHeading
          title="Driving directions"
          description="Turn-by-turn instructions for each route leg"
          action={
            <Chip
              icon={<AltRouteRoundedIcon />}
              label={`${instructionCount} steps`}
              size="small"
              variant="outlined"
            />
          }
        />

        {instructionCount === 0 ? (
          <Alert severity="info">
            Turn-by-turn instructions were not returned for this route.
          </Alert>
        ) : (
          <Stack spacing={2.5}>
            {legs.map((leg, legIndex) => (
              <Box key={`${leg.start_label}-${leg.end_label}`}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  sx={{
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 1,
                    mb: 1.25,
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography component="h3" variant="h3">
                      Leg {legIndex + 1}: {leg.start_label} → {leg.end_label}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatMiles(leg.distance_miles)} mi ·{' '}
                    {formatDurationMinutes(leg.duration_minutes)}
                  </Typography>
                </Stack>

                <Box
                  component="ol"
                  aria-label={`Directions from ${leg.start_label} to ${leg.end_label}`}
                  sx={{
                    maxHeight: 360,
                    overflowY: 'auto',
                    listStyle: 'none',
                    p: 0,
                    pr: 0.5,
                    m: 0,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  {leg.instructions.map((instruction, index) => (
                    <Box
                      component="li"
                      key={`${instruction.instruction}-${index}`}
                      sx={{ px: 1.5, py: 1.25 }}
                    >
                      <Stack direction="row" spacing={1.5}>
                        <Avatar
                          sx={{
                            width: 30,
                            height: 30,
                            bgcolor: 'primary.light',
                            color: 'primary.main',
                          }}
                        >
                          <NavigationRoundedIcon sx={{ fontSize: 17 }} />
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}
                          >
                            {instruction.instruction}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatMiles(instruction.distance_miles)} mi
                            {instruction.duration_minutes > 0 &&
                              ` · ${formatDurationMinutes(
                                Math.max(1, Math.round(instruction.duration_minutes)),
                              )}`}
                          </Typography>
                        </Box>
                      </Stack>
                      {index < leg.instructions.length - 1 && (
                        <Divider sx={{ mt: 1.25, ml: 5.75 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
