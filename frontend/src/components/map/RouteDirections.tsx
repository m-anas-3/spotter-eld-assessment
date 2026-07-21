import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import type { RouteLeg } from '../../types/trip'
import { formatDurationMinutes, formatMiles } from '../../utils/formatters'

interface RouteDirectionsProps {
  legs: RouteLeg[]
}

export function RouteDirections({ legs }: RouteDirectionsProps) {
  const instructionCount = legs.reduce((total, leg) => total + leg.instructions.length, 0)

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        mt: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px !important',
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Box>
          <Typography component="h3" variant="h3">
            Driving directions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {instructionCount} turn-by-turn {instructionCount === 1 ? 'step' : 'steps'}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {instructionCount === 0 ? (
          <Alert severity="info">Turn-by-turn instructions were not returned for this route.</Alert>
        ) : (
          <Stack spacing={3}>
            {legs.map((leg, legIndex) => (
              <Box key={`${leg.start_label}-${leg.end_label}`}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  sx={{ justifyContent: 'space-between', gap: 0.5, mb: 1 }}
                >
                  <Typography sx={{ fontSize: '0.8125rem', fontWeight: 600, overflowWrap: 'anywhere' }}>
                    Leg {legIndex + 1}: {leg.start_label} → {leg.end_label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    {formatMiles(leg.distance_miles)} mi · {formatDurationMinutes(leg.duration_minutes)}
                  </Typography>
                </Stack>

                <Box
                  component="ol"
                  aria-label={`Directions from ${leg.start_label} to ${leg.end_label}`}
                  sx={{ maxHeight: 360, overflowY: 'auto', listStyle: 'none', p: 0, m: 0 }}
                >
                  {leg.instructions.map((instruction, index) => (
                    <Box component="li" key={`${instruction.instruction}-${index}`}>
                      <Stack direction="row" spacing={1.25} sx={{ py: 1.1 }}>
                        <Typography
                          aria-hidden="true"
                          variant="caption"
                          color="text.secondary"
                          sx={{ width: 24, flexShrink: 0, textAlign: 'right' }}
                        >
                          {index + 1}
                        </Typography>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>
                            {instruction.instruction}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatMiles(instruction.distance_miles)} mi
                            {instruction.duration_minutes > 0 &&
                              ` · ${formatDurationMinutes(Math.max(1, Math.round(instruction.duration_minutes)))}`}
                          </Typography>
                        </Box>
                      </Stack>
                      {index < leg.instructions.length - 1 && <Divider sx={{ ml: 4.5 }} />}
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  )
}
