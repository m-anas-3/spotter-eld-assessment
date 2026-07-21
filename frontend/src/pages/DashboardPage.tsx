import { useEffect, useRef, useState } from 'react'
import { Box, Container, Typography } from '@mui/material'
import { AppHeader } from '../components/layout/AppHeader'
import { TripForm } from '../components/trip-form/TripForm'
import {
  EmptyResults,
  ErrorResults,
  LoadingResults,
} from '../components/trip-summary/ResultsState'
import { TripResults } from '../components/trip-summary/TripResults'
import { useTripCalculation } from '../hooks/useTripCalculation'
import type { TripRequest } from '../types/trip'

export function DashboardPage() {
  const calculation = useTripCalculation()
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    if (!calculation.isSuccess || !calculation.data) return

    const frame = window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      resultsRef.current?.focus({ preventScroll: true })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [calculation.data, calculation.isSuccess])

  const handleCalculate = (request: TripRequest) => {
    setActiveTab(0)
    calculation.mutate(request)
  }

  const handleRetry = () => {
    if (calculation.variables) calculation.mutate(calculation.variables)
  }

  const handlePrintLogs = () => {
    setActiveTab(2)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print())
    })
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppHeader />
      <Container component="main" maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <Box className="page-heading" sx={{ mb: 3 }}>
          <Typography component="h1" variant="h1">
            Plan a trip
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Calculate a compliant route and generate daily ELD logs.
          </Typography>
        </Box>

        <Box
          className="planner-layout"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: '360px minmax(0, 1fr)' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Box className="trip-form-column" sx={{ position: { lg: 'sticky' }, top: { lg: 88 } }}>
            <TripForm isLoading={calculation.isPending} onSubmit={handleCalculate} />
          </Box>

          <Box ref={resultsRef} tabIndex={-1} sx={{ minWidth: 0, outline: 'none' }}>
            {!calculation.data && !calculation.isPending && !calculation.isError && <EmptyResults />}
            {calculation.isPending && <LoadingResults />}
            {calculation.isError && (
              <ErrorResults
                onRetry={handleRetry}
                message={
                  calculation.error instanceof Error
                    ? calculation.error.message
                    : 'Check the trip details and try again.'
                }
              />
            )}
            {calculation.isSuccess && calculation.data && (
              <TripResults
                trip={calculation.data}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onPrint={handlePrintLogs}
              />
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
