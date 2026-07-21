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
        <Grid container>
          <Grid size={{ xs: 12, lg: 8 }}>
            <TripMap route={route} locations={locations} stops={stops} />
          </Grid>
          <Grid
            size={{ xs: 12, lg: 4 }}
            sx={{ borderTop: { xs: '1px solid', lg: 0 }, borderLeft: { lg: '1px solid' }, borderColor: 'divider' }}
          >
            <StopsList stops={stops} />
          </Grid>
        </Grid>
      </Card>
      <RouteDirections legs={legs} />
    </>
  )
}
