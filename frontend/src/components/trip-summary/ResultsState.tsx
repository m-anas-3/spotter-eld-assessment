import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded'
import MapRoundedIcon from '@mui/icons-material/MapRounded'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'

export function EmptyResults() {
  return (
    <Card>
      <CardContent
        sx={{
          minHeight: 340,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          p: 4,
        }}
      >
        <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 430 }}>
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 72,
              height: 72,
              borderRadius: '50%',
              bgcolor: 'primary.light',
              color: 'primary.main',
            }}
          >
            <MapRoundedIcon sx={{ fontSize: 34 }} />
          </Box>
          <Typography component="h2" variant="h2">
            Your route will appear here
          </Typography>
          <Typography color="text.secondary">
            Add your current location, pickup, drop-off, and cycle hours to
            preview the route plan and ELD logs.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function LoadingResults() {
  return (
    <Card>
      <CardContent
        sx={{
          minHeight: 340,
          display: 'grid',
          placeItems: 'center',
          textAlign: 'center',
          p: 4,
        }}
      >
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress size={42} />
          <Typography component="h2" variant="h2">
            Building a compliant trip plan
          </Typography>
          <Typography color="text.secondary">
            Calculating route, stops, and driver duty periods…
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export function ErrorResults({ message }: { message: string }) {
  return (
    <Alert
      severity="error"
      icon={<ErrorOutlineRoundedIcon />}
      sx={{ alignItems: 'center' }}
    >
      <Typography sx={{ fontWeight: 700 }}>Trip calculation failed</Typography>
      <Typography variant="body2">{message}</Typography>
    </Alert>
  )
}
