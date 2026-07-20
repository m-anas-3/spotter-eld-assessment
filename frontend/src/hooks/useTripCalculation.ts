import { useMutation } from '@tanstack/react-query'
import { calculateMockTrip } from '../api/mockTrip'

export const useTripCalculation = () =>
  useMutation({
    mutationFn: calculateMockTrip,
  })
