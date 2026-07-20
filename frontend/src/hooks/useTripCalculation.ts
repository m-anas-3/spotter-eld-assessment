import { useMutation } from '@tanstack/react-query'
import { calculateTrip } from '../api/client'

export const useTripCalculation = () =>
  useMutation({
    mutationFn: calculateTrip,
  })
