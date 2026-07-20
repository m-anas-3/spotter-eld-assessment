import ExploreRoundedIcon from '@mui/icons-material/ExploreRounded'
import FlagRoundedIcon from '@mui/icons-material/FlagRounded'
import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded'
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded'
import RouteRoundedIcon from '@mui/icons-material/RouteRounded'
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TripRequest>({
    resolver: zodResolver(tripRequestSchema),
    defaultValues,
  })

  return (
    <Card component="aside">
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: 3 } }}>
        <Stack spacing={0.75} sx={{ mb: 3 }}>
          <Typography component="h2" variant="h2">
            Plan your trip
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter the route details and your current cycle usage.
          </Typography>
        </Stack>

        <Stack
          component="form"
          noValidate
          spacing={2.25}
          onSubmit={handleSubmit(onSubmit)}
        >
          <TextField
            label="Current location"
            placeholder="City, state or address"
            fullWidth
            autoComplete="street-address"
            error={Boolean(errors.current_location)}
            helperText={errors.current_location?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <ExploreRoundedIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            {...register('current_location')}
          />

          <TextField
            label="Pickup location"
            placeholder="City, state or address"
            fullWidth
            error={Boolean(errors.pickup_location)}
            helperText={errors.pickup_location?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOnRoundedIcon color="primary" fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            {...register('pickup_location')}
          />

          <TextField
            label="Drop-off location"
            placeholder="City, state or address"
            fullWidth
            error={Boolean(errors.dropoff_location)}
            helperText={errors.dropoff_location?.message}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FlagRoundedIcon color="secondary" fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            {...register('dropoff_location')}
          />

          <TextField
            label="Current cycle used"
            type="number"
            fullWidth
            error={Boolean(errors.current_cycle_used_hours)}
            helperText={
              errors.current_cycle_used_hours?.message ??
              'Enter a value from 0 to 70 hours'
            }
            slotProps={{
              htmlInput: { min: 0, max: 70, step: 0.5 },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LocalShippingRoundedIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: <InputAdornment position="end">hours</InputAdornment>,
              },
            }}
            {...register('current_cycle_used_hours', { valueAsNumber: true })}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress color="inherit" size={18} />
              ) : (
                <RouteRoundedIcon />
              )
            }
          >
            {isLoading ? 'Calculating route…' : 'Calculate trip'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}
