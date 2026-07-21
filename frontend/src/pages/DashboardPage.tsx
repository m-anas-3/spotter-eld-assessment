import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, Container, Snackbar, Stack } from '@mui/material'
import { AppHeader } from '../components/layout/AppHeader'
import { TripForm } from '../components/trip-form/TripForm'
import { EmptyResults } from '../components/trip-summary/ResultsState'
import { TripResults } from '../components/trip-summary/TripResults'
import { useTripCalculation } from '../hooks/useTripCalculation'
import type { TripRequest, TripResponse } from '../types/trip'

const TRANSITION_MS = 300

export function DashboardPage() {
  const calculation = useTripCalculation()
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const revealFrameRef = useRef<number | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [trip, setTrip] = useState<TripResponse | null>(null)
  const [resultsVisible, setResultsVisible] = useState(false)
  const [formCollapsed, setFormCollapsed] = useState(false)
  const [errorToastOpen, setErrorToastOpen] = useState(false)

  useEffect(
    () => () => {
      if (revealFrameRef.current !== null) {
        window.cancelAnimationFrame(revealFrameRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    if (!trip || !resultsVisible) return

    const timeout = window.setTimeout(() => {
      const results = resultsRef.current
      if (!results) return

      const rect = results.getBoundingClientRect()
      const outsideViewport = rect.top > window.innerHeight - 120 || rect.bottom < 80
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (outsideViewport) {
        results.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
      }
      results.focus({ preventScroll: true })
    }, TRANSITION_MS)

    return () => window.clearTimeout(timeout)
  }, [resultsVisible, trip])

  const showSuccessfulTrip = (result: TripResponse) => {
    setActiveTab(0)
    setResultsVisible(false)
    setTrip(result)
    setFormCollapsed(true)
    setErrorToastOpen(false)

    if (revealFrameRef.current !== null) {
      window.cancelAnimationFrame(revealFrameRef.current)
    }
    revealFrameRef.current = window.requestAnimationFrame(() => {
      setResultsVisible(true)
      revealFrameRef.current = null
    })
  }

  const calculateTrip = (request: TripRequest) => {
    setErrorToastOpen(false)
    calculation.mutate(request, {
      onSuccess: showSuccessfulTrip,
      onError: () => setErrorToastOpen(true),
    })
  }

  const handleRetry = () => {
    if (calculation.variables) {
      setErrorToastOpen(false)
      calculation.mutate(calculation.variables, {
        onSuccess: showSuccessfulTrip,
        onError: () => setErrorToastOpen(true),
      })
    }
  }

  const errorMessage =
    calculation.error instanceof Error
      ? calculation.error.message
      : 'Check the trip details and try again.'

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
        <Box
          className="planner-layout"
          sx={{
            display: { xs: 'block', lg: 'flex' },
            alignItems: 'flex-start',
            gap: { xs: 0, lg: formCollapsed ? 1.5 : 3 },
            transition: `gap ${TRANSITION_MS}ms ease`,
            '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
          }}
        >
          <Box
            className="trip-form-column"
            sx={{
              width: { xs: '100%', lg: formCollapsed ? 56 : 360 },
              flex: '0 0 auto',
              position: { lg: 'sticky' },
              top: { lg: 88 },
              transition: `width ${TRANSITION_MS}ms ease`,
              '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
            }}
          >
            <TripForm
              isLoading={calculation.isPending}
              isCollapsed={formCollapsed}
              onToggleCollapsed={() => setFormCollapsed((collapsed) => !collapsed)}
              onSubmit={calculateTrip}
            />
          </Box>

          <Box
            ref={resultsRef}
            tabIndex={-1}
            role="region"
            aria-label="Trip planning results"
            sx={{ minWidth: 0, flex: 1, mt: { xs: 3, lg: 0 }, outline: 'none' }}
          >
            <Stack spacing={2}>
              {!trip && <EmptyResults />}

              {trip && (
                <Box
                  sx={{
                    opacity: resultsVisible ? 1 : 0,
                    transform: resultsVisible ? 'translateY(0)' : 'translateY(12px)',
                    transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
                    '@media (prefers-reduced-motion: reduce)': {
                      transition: 'none',
                      transform: 'none',
                    },
                  }}
                >
                  <TripResults
                    trip={trip}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onPrint={handlePrintLogs}
                  />
                </Box>
              )}
            </Stack>
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={errorToastOpen}
        autoHideDuration={8000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setErrorToastOpen(false)
        }}
      >
        <Alert
          severity="error"
          variant="standard"
          action={
            <Button
              color="inherit"
              size="small"
              disabled={calculation.isPending || !calculation.variables}
              onClick={handleRetry}
            >
              Retry
            </Button>
          }
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
