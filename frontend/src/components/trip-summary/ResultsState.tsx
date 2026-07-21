import { Box, Card, CardContent, Typography } from '@mui/material'

export function EmptyResults() {
  return (
    <Card component="section" aria-labelledby="empty-results-heading">
      <CardContent
        sx={{
          display: 'grid',
          minHeight: { xs: 280, md: 420 },
          placeItems: 'center',
          p: { xs: 3, md: 5 },
          '&:last-child': { pb: { xs: 3, md: 5 } },
        }}
      >
        <Box sx={{ maxWidth: 440, textAlign: 'center' }}>
          <Typography id="empty-results-heading" component="h2" variant="h3">
            Enter the trip details to calculate the route and driver logs.
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Route, required stops, duty timeline, and daily ELD sheets will appear here.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
