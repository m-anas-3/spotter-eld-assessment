import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import { Box, Container, Stack, Typography } from '@mui/material'

export function AppHeader() {
  return (
    <Box
      component="header"
      className="app-header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 64,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="xl" sx={{ height: '100%' }}>
        <Stack
          direction="row"
          sx={{ height: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
        >
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Box
              aria-hidden="true"
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              <RouteOutlinedIcon sx={{ fontSize: 19 }} />
            </Box>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline', minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.9375rem', fontWeight: 650 }}>RouteLog</Typography>
              <Typography
                color="text.secondary"
                sx={{ display: { xs: 'none', sm: 'block' }, fontSize: '0.75rem' }}
              >
                Trip planner
              </Typography>
            </Stack>
          </Stack>

          <Typography color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
            70-hour / 8-day rules
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}
