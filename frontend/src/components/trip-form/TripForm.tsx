import { Box, Button, Card, CardContent, CircularProgress, Slider, Stack, TextField, Typography } from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { tripRequestSchema } from '../../schemas/tripSchema'
import type { TripRequest } from '../../types/trip'

interface TripFormProps {
  isLoading: boolean
  onSubmit: (request: TripRequest) => void
}

const defaultValues: TripRequest = {
  current_location: 'Chicago, IL',
  pickup_location: 'Milwaukee, WI',
  dropoff_location: 'Dallas, TX',
  current_cycle_used_hours: 20,
}

export function TripForm({ isLoading, onSubmit }: TripFormProps) {
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
    <Card component="aside" className="trip-form-card">
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Typography component="h2" variant="h3">
          Trip details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Enter locations in travel order.
        </Typography>

        <Stack
          component="form"
          noValidate
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
    </Card>
  )
}
