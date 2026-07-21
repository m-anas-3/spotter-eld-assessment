import { Alert, Box, Button, Card, CardContent, Grid, Skeleton, Stack, Typography } from '@mui/material'

export function EmptyResults() {
  return (
    <Card>
      <CardContent
        sx={{
          minHeight: 176,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Box sx={{ maxWidth: 440 }}>
          <Typography component="h2" variant="h3">
            Enter the trip details to calculate the route and driver logs.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Route, required stops, duty timeline, and daily ELD sheets will appear here.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export function LoadingResults() {
  return (
    <Stack spacing={2.5} aria-label="Calculating route and driver logs">
      <Card>
        <Grid container>
          {Array.from({ length: 6 }, (_, index) => (
            <Grid key={index} size={{ xs: 6, md: 4, xl: 2 }}>
              <Box sx={{ p: 2, borderRight: '1px solid', borderColor: 'divider' }}>
                <Skeleton width="58%" height={16} />
                <Skeleton width="78%" height={28} sx={{ mt: 0.5 }} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Card>

      <Card sx={{ overflow: 'hidden' }}>
        <Grid container>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Box sx={{ p: 2 }}>
              <Skeleton width={120} height={22} />
              <Skeleton variant="rounded" height={480} sx={{ mt: 1.5 }} />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }} sx={{ borderLeft: { lg: '1px solid' }, borderColor: 'divider' }}>
            <Stack spacing={0} sx={{ p: 2 }}>
              <Skeleton width={150} height={22} sx={{ mb: 1 }} />
              {Array.from({ length: 6 }, (_, index) => (
                <Box key={index} sx={{ py: 1.5, borderTop: index ? '1px solid' : 0, borderColor: 'divider' }}>
                  <Skeleton width="70%" />
                  <Skeleton width="92%" />
                </Box>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Card>
    </Stack>
  )
}

interface ErrorResultsProps {
  message: string
  onRetry: () => void
}

export function ErrorResults({ message, onRetry }: ErrorResultsProps) {
  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={onRetry}>
          Retry
        </Button>
      }
      sx={{ alignItems: 'center' }}
    >
      <Typography sx={{ fontWeight: 600 }}>Unable to calculate the trip</Typography>
      <Typography variant="body2">{message}</Typography>
    </Alert>
  )
}
