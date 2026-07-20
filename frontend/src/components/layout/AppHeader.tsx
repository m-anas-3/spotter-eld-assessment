import LocalShippingRoundedIcon from '@mui/icons-material/LocalShippingRounded'
import { Box, Chip, Container, Stack, Typography } from '@mui/material'

export function AppHeader() {
  return (
    <Box
      component="header"
      sx={{
        color: 'common.white',
        background:
          'linear-gradient(120deg, #0C3B36 0%, #145F52 55%, #1B7563 100%)',
        borderBottom: '1px solid',
        borderColor: 'rgba(255,255,255,0.14)',
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 48,
                height: 48,
                borderRadius: 2.5,
                bgcolor: 'rgba(255,255,255,0.13)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <LocalShippingRoundedIcon fontSize="medium" />
            </Box>
            <Box>
              <Typography component="h1" variant="h1" sx={{ fontSize: '1.65rem' }}>
                RouteLog
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.72)', mt: 0.25 }}>
                Trucking trip planner &amp; ELD log generator
              </Typography>
            </Box>
          </Stack>
          <Chip
            label="70-hour / 8-day cycle"
            size="small"
            sx={{
              color: 'common.white',
              bgcolor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.18)',
              fontWeight: 650,
            }}
          />
        </Stack>
      </Container>
    </Box>
  )
}
