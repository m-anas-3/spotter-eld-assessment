import { z } from 'zod'

const requiredLocation = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(200, `${label} must be 200 characters or fewer`)

export const tripRequestSchema = z.object({
  current_location: requiredLocation('Current location'),
  pickup_location: requiredLocation('Pickup location'),
  dropoff_location: requiredLocation('Drop-off location'),
  current_cycle_used_hours: z
    .number({ error: 'Enter the cycle hours already used' })
    .min(0, 'Cycle hours cannot be below 0')
    .max(70, 'Cycle hours cannot exceed 70'),
})
