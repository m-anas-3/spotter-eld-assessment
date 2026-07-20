import { useEffect, useRef } from 'react'
import { Box, Container, Grid, Stack, Typography } from '@mui/material'
import { EldLogsPreview } from '../components/eld/EldLogsPreview'
import { TimelinePreview } from '../components/eld/TimelinePreview'
import { AppHeader } from '../components/layout/AppHeader'
import { StopsList } from '../components/map/StopsList'
import { TripMap } from '../components/map/TripMap'
import { TripForm } from '../components/trip-form/TripForm'
import {
  EmptyResults,
  ErrorResults,
  LoadingResults,
} from '../components/trip-summary/ResultsState'
import { AssumptionsCard } from '../components/trip-summary/AssumptionsCard'
import { TripSummaryCards } from '../components/trip-summary/TripSummaryCards'
import { useTripCalculation } from '../hooks/useTripCalculation'
import type { TripRequest } from '../types/trip'

export function DashboardPage() {
  const calculation = useTripCalculation()
  const resultsRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!calculation.isSuccess || !calculation.data) return

    const frame = window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
      resultsRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [calculation.data, calculation.isSuccess])

  const handleCalculate = (request: TripRequest) => {
    calculation.mutate(request)
  }

  const handleRetry = () => {
    if (calculation.variables) {
      calculation.mutate(calculation.variables)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader />
      <Container component="main" maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
          <Grid
            size={{ xs: 12, lg: 3 }}
            sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}
          >
            <TripForm
              isLoading={calculation.isPending}
              onSubmit={handleCalculate}
            />
          </Grid>

          <Grid size={{ xs: 12, lg: 9 }}>
            <Box ref={resultsRef} tabIndex={-1} sx={{ outline: 'none' }}>
            {!calculation.data && !calculation.isPending && !calculation.isError && (
              <EmptyResults />
            )}

            {calculation.isPending && <LoadingResults />}

            {calculation.isError && (
              <ErrorResults
                onRetry={handleRetry}
                message={
                  calculation.error instanceof Error
                    ? calculation.error.message
                    : 'Please check your trip details and try again.'
                }
              />
            )}

            {calculation.isSuccess && calculation.data && (
              <Stack spacing={3}>
                <Box>
                  <Typography component="h2" variant="h2" sx={{ mb: 2 }}>
                    Trip plan
                  </Typography>
                  <TripSummaryCards summary={calculation.data.trip_summary} />
                </Box>
                <TripMap
                  route={calculation.data.route}
                  locations={calculation.data.locations}
                  stops={calculation.data.stops}
                />
                <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <StopsList stops={calculation.data.stops} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <TimelinePreview events={calculation.data.timeline} />
                  </Grid>
                </Grid>
                <EldLogsPreview logs={calculation.data.daily_logs} />
                <AssumptionsCard assumptions={calculation.data.assumptions} />
              </Stack>
            )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
