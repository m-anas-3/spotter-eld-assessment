import { Box, Container, Grid, Stack, Typography } from '@mui/material'
import { EldLogsPreview } from '../components/eld/EldLogsPreview'
import { TimelinePreview } from '../components/eld/TimelinePreview'
import { AppHeader } from '../components/layout/AppHeader'
import { RouteMapPlaceholder } from '../components/map/RouteMapPlaceholder'
import { StopsList } from '../components/map/StopsList'
import { TripForm } from '../components/trip-form/TripForm'
import {
  EmptyResults,
  ErrorResults,
  LoadingResults,
} from '../components/trip-summary/ResultsState'
import { TripSummaryCards } from '../components/trip-summary/TripSummaryCards'
import { useTripCalculation } from '../hooks/useTripCalculation'
import type { TripRequest } from '../types/trip'

export function DashboardPage() {
  const calculation = useTripCalculation()

  const handleCalculate = (request: TripRequest) => {
    calculation.mutate(request)
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
            {!calculation.data && !calculation.isPending && !calculation.isError && (
              <EmptyResults />
            )}

            {calculation.isPending && <LoadingResults />}

            {calculation.isError && (
              <ErrorResults
                message={
                  calculation.error instanceof Error
                    ? calculation.error.message
                    : 'Please check your trip details and try again.'
                }
              />
            )}

            {calculation.data && !calculation.isPending && (
              <Stack spacing={3}>
                <Box>
                  <Typography component="h2" variant="h2" sx={{ mb: 2 }}>
                    Trip plan
                  </Typography>
                  <TripSummaryCards summary={calculation.data.trip_summary} />
                </Box>
                <RouteMapPlaceholder locations={calculation.data.locations} />
                <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <StopsList stops={calculation.data.stops} />
                  </Grid>
                  <Grid size={{ xs: 12, md: 7 }}>
                    <TimelinePreview events={calculation.data.timeline} />
                  </Grid>
                </Grid>
                <EldLogsPreview logs={calculation.data.daily_logs} />
              </Stack>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
