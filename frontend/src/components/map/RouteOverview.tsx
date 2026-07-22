import { Card, Grid } from '@mui/material'
import type { GeoJsonRoute, RouteLeg, Stop, TripLocations } from '../../types/trip'
import { RouteDirections } from './RouteDirections'
import { StopsList } from './StopsList'
import { TripMap } from './TripMap'

interface RouteOverviewProps {
  route: GeoJsonRoute
  locations: TripLocations
  stops: Stop[]
  legs: RouteLeg[]
}

export function RouteOverview({ route, locations, stops, legs }: RouteOverviewProps) {
  return (
    <>
      <Card sx={{ overflow: 'hidden' }}>
        <Grid container sx={{ alignItems: 'stretch' }}>
          <Grid
            size={{ xs: 12, lg: 8 }}
            sx={{ height: { xs: 400, sm: 480, lg: 560 }, minWidth: 0 }}
          >
            <TripMap route={route} locations={locations} stops={stops} />
          </Grid>
          <Grid
            size={{ xs: 12, lg: 4 }}
            sx={{
              height: { xs: 'auto', lg: 560 },
              minHeight: 0,
              overflow: 'hidden',
              borderTop: { xs: '1px solid', lg: 0 },
              borderColor: 'divider',
            }}
          >
            <StopsList stops={stops} />
          </Grid>
        </Grid>
      </Card>
      <RouteDirections legs={legs} />
    </>
  )
}
