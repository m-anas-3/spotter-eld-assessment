import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded'
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Slider,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { tripRequestSchema } from '../../schemas/tripSchema'
import type { TripRequest } from '../../types/trip'

interface TripFormProps {
  isLoading: boolean
  isCollapsed: boolean
  onToggleCollapsed: () => void
  onSubmit: (request: TripRequest) => void
}

const defaultValues: TripRequest = {
  current_location: 'Chicago, IL',
  pickup_location: 'Milwaukee, WI',
  dropoff_location: 'Dallas, TX',
  current_cycle_used_hours: 20,
}

const PANEL_TRANSITION_MS = 300

export function TripForm({ isLoading, isCollapsed, onToggleCollapsed, onSubmit }: TripFormProps) {
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const panelCollapsed = isDesktop && isCollapsed
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TripRequest>({
    resolver: zodResolver(tripRequestSchema),
    defaultValues,
  })

  return (
    <Card
      component="aside"
      className="trip-form-card"
      sx={{
        overflow: 'hidden',
        borderColor: panelCollapsed ? 'transparent' : 'divider',
        bgcolor: panelCollapsed ? 'transparent' : 'background.paper',
        transition: `border-color 160ms ease, background-color 160ms ease`,
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          minHeight: 56,
          alignItems: 'center',
          justifyContent: panelCollapsed ? 'center' : 'space-between',
          gap: 1,
          px: panelCollapsed ? 0.75 : 2.5,
          transition: `padding ${PANEL_TRANSITION_MS}ms ease`,
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            maxWidth: panelCollapsed ? 0 : 240,
            overflow: 'hidden',
            opacity: panelCollapsed ? 0 : 1,
            whiteSpace: 'nowrap',
            transition: `max-width ${PANEL_TRANSITION_MS}ms ease, opacity 180ms ease`,
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        >
          <Typography component="h1" variant="h3">
            Plan a trip
          </Typography>
        </Box>

        <Tooltip
          title={panelCollapsed ? 'Expand trip form' : 'Collapse trip form'}
          placement={panelCollapsed ? 'right' : 'bottom'}
          arrow
        >
          <IconButton
            type="button"
            size="small"
            aria-label={panelCollapsed ? 'Expand trip form' : 'Collapse trip form'}
            aria-expanded={!panelCollapsed}
            aria-controls="trip-form-content"
            onClick={onToggleCollapsed}
            sx={{
              width: 36,
              height: 36,
              display: { xs: 'none', lg: 'inline-flex' },
              flexShrink: 0,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper',
              color: 'text.secondary',
              transition: 'background-color 160ms ease, border-color 160ms ease, color 160ms ease',
              '& svg': { fontSize: 20 },
              '&:hover': {
                bgcolor: 'primary.light',
                borderColor: 'primary.main',
                color: 'primary.main',
              },
              '&:focus-visible': {
                outline: '3px solid',
                outlineColor: 'action.focus',
                outlineOffset: 2,
              },
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          >
            {panelCollapsed ? <ChevronRightRoundedIcon /> : <ChevronLeftRoundedIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        id="trip-form-content"
        aria-hidden={panelCollapsed}
        sx={{
          width: { xs: '100%', lg: panelCollapsed ? 0 : 358 },
          maxHeight: panelCollapsed ? 0 : 900,
          overflow: 'hidden',
          opacity: panelCollapsed ? 0 : 1,
          visibility: panelCollapsed ? 'hidden' : 'visible',
          pointerEvents: panelCollapsed ? 'none' : 'auto',
          transition: panelCollapsed
            ? `width ${PANEL_TRANSITION_MS}ms ease, max-height ${PANEL_TRANSITION_MS}ms ease, opacity 180ms ease, visibility 0s linear ${PANEL_TRANSITION_MS}ms`
            : `width ${PANEL_TRANSITION_MS}ms ease, max-height ${PANEL_TRANSITION_MS}ms ease, opacity 180ms 100ms ease, visibility 0s linear 0s`,
          '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
        }}
      >
        <Box sx={{ width: { xs: '100%', lg: 358 } }}>
          <Divider />
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Typography variant="body2" color="text.secondary">
              Enter locations in travel order.
            </Typography>

            <Stack
              component="form"
              noValidate
              aria-busy={isLoading}
              spacing={2}
              onSubmit={handleSubmit(onSubmit)}
              sx={{ mt: 2.5 }}
            >
              <Box>
                <Typography component="label" htmlFor="current-location" variant="body2" sx={{ fontWeight: 600 }}>
                  Current location
                </Typography>
                <TextField
                  id="current-location"
                  placeholder="City, state or address"
                  fullWidth
                  autoComplete="street-address"
                  error={Boolean(errors.current_location)}
                  helperText={errors.current_location?.message}
                  sx={{ mt: 0.75 }}
                  {...register('current_location')}
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="pickup-location" variant="body2" sx={{ fontWeight: 600 }}>
                  Pickup location
                </Typography>
                <TextField
                  id="pickup-location"
                  placeholder="City, state or address"
                  fullWidth
                  autoComplete="off"
                  error={Boolean(errors.pickup_location)}
                  helperText={errors.pickup_location?.message}
                  sx={{ mt: 0.75 }}
                  {...register('pickup_location')}
                />
              </Box>

              <Box>
                <Typography component="label" htmlFor="dropoff-location" variant="body2" sx={{ fontWeight: 600 }}>
                  Drop-off location
                </Typography>
                <TextField
                  id="dropoff-location"
                  placeholder="City, state or address"
                  fullWidth
                  autoComplete="off"
                  error={Boolean(errors.dropoff_location)}
                  helperText={errors.dropoff_location?.message}
                  sx={{ mt: 0.75 }}
                  {...register('dropoff_location')}
                />
              </Box>

              <Controller
                name="current_cycle_used_hours"
                control={control}
                render={({ field }) => {
                  const value = Number.isFinite(field.value) ? field.value : 0
                  const cycleError = errors.current_cycle_used_hours?.message

                  return (
                    <Box sx={{ pt: 0.5 }}>
                      <Stack
                        direction="row"
                        sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}
                      >
                        <Box>
                          <Typography component="label" htmlFor="cycle-hours" variant="body2" sx={{ fontWeight: 600 }}>
                            Cycle hours already used
                          </Typography>
                          <Typography variant="caption" color={cycleError ? 'error.main' : 'text.secondary'}>
                            {cycleError ?? `${value} of 70 hours used`}
                          </Typography>
                        </Box>
                        <TextField
                          id="cycle-hours"
                          type="number"
                          value={Number.isFinite(field.value) ? field.value : ''}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value === '' ? Number.NaN : Number(event.target.value),
                            )
                          }
                          onBlur={field.onBlur}
                          error={Boolean(cycleError)}
                          sx={{ width: 88, flexShrink: 0 }}
                          slotProps={{
                            htmlInput: { min: 0, max: 70, step: 0.5, 'aria-label': 'Cycle hours already used' },
                          }}
                          inputRef={field.ref}
                        />
                      </Stack>
                      <Slider
                        value={value}
                        onChange={(_, nextValue) => field.onChange(nextValue)}
                        min={0}
                        max={70}
                        step={0.5}
                        size="small"
                        aria-label="Cycle hours already used"
                        sx={{ mt: 1, mb: -0.5 }}
                      />
                    </Box>
                  )
                }}
              />

              <Button type="submit" variant="contained" fullWidth disabled={isLoading}>
                {isLoading && <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} />}
                {isLoading ? 'Calculating…' : 'Calculate trip'}
              </Button>
            </Stack>
          </CardContent>
        </Box>
      </Box>
    </Card>
  )
}
