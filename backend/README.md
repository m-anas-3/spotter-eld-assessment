# Trucking Trip Planner API

This Django REST Framework backend geocodes a driver's current, pickup, and
drop-off locations; calculates a truck route; applies deterministic
Hours-of-Service (HOS) rules; and returns route geometry, stops, a chronological
duty-status timeline, and complete daily ELD log data.

## Architecture

The API view validates input and delegates calculation to service modules:

- `trips/services/openrouteservice.py` handles OpenRouteService HTTP calls.
- `trips/services/routing.py` defines provider-neutral route contracts.
- `trips/services/geometry.py` interpolates stop positions along the route.
- `trips/services/scheduling.py` creates the minute-based HOS timeline.
- `trips/services/eld.py` validates, splits, fills, and totals daily logs.
- `trips/services/trip_calculator.py` assembles the API response.

```text
backend/
├── config/                 Django settings, URLs, ASGI, and WSGI
├── trips/
│   ├── services/           Routing, scheduling, geometry, and ELD logic
│   ├── tests/              API and service tests
│   ├── serializers.py      Request validation
│   ├── exceptions.py       Sanitized API errors
│   └── views.py            Thin DRF endpoints
├── Dockerfile
├── Procfile
├── manage.py
└── requirements.txt
```

## Local setup

From the `backend` directory:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Django automatically loads variables from `backend/.env` during startup.
Existing shell environment variables take precedence over values in that file.

Apply database migrations and start the development server:

```bash
python manage.py migrate
python manage.py runserver
```

The health endpoint is available at `GET /api/health/`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `OPENROUTESERVICE_API_KEY` | Required for geocoding and live routing |
| `DJANGO_SECRET_KEY` | Required when `DJANGO_DEBUG=false` |
| `DJANGO_DEBUG` | `true` locally; use `false` in production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated API hostnames |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed frontend origins |
| `DJANGO_LOG_LEVEL` | Optional console log level; defaults to `INFO` |
| `PORT` | Production web port; commonly supplied by the host |

Never commit `.env` or an actual OpenRouteService key.

## OpenRouteService and OpenStreetMap

Create an API key in the HeiGIT/OpenRouteService account dashboard and assign
it to `OPENROUTESERVICE_API_KEY`. OpenStreetMap supplies the underlying
geographic map data. OpenRouteService performs address geocoding and
`driving-hgv` route calculation over that data through the current
`api.heigit.org` endpoints.

The backend requests current-to-pickup and pickup-to-drop-off legs and combines
them in order. All coordinates use GeoJSON/MapLibre order:
`[longitude, latitude]`.

## API request

```bash
curl -X POST http://127.0.0.1:8000/api/trips/calculate/ \
  -H "Content-Type: application/json" \
  -d '{
    "current_location": "Chicago, IL",
    "pickup_location": "Milwaukee, WI",
    "dropoff_location": "Dallas, TX",
    "current_cycle_used_hours": 20,
    "start_time": "2026-07-21T08:00:00Z"
  }'
```

`start_time` is optional. When omitted, the API uses the current UTC time
rounded down to the nearest 15 minutes.

The response has this structure:

```json
{
  "trip_summary": {},
  "locations": {},
  "route": {"type": "LineString", "coordinates": [], "legs": []},
  "route_legs": [],
  "stops": [],
  "timeline": [],
  "daily_logs": [],
  "assumptions": []
}
```

`timeline` contains timezone-aware ISO-8601 timestamps. Each `daily_logs`
entry represents one UTC calendar date and contains ordered SVG-ready events
covering minutes `0` through `1440`, plus exact status totals.

## HOS rules and assessment assumptions

The scheduler implements:

- 11 driving hours after 10 consecutive off-duty hours.
- A 14-consecutive-hour work window.
- A qualifying 30-minute non-driving period after 8 driving hours.
- A 70-hour/8-day cycle using driving and on-duty-not-driving time.
- A 10-hour sleeper-berth reset when daily driving or window limits bind.
- A simplified 34-hour off-duty restart when the cycle limit binds.
- 60-minute pickup and drop-off activities.
- 30-minute fueling at least every 1,000 route miles.

The driver is assumed to begin after a valid 10-hour rest and with enough fuel
to travel the first 1,000 miles. Pickup, drop-off, and fueling can qualify as
the required 30-minute non-driving period. The cycle restart is simplified
because only the current cycle-used total is provided, not eight days of logs.

## ELD daily logs

Events crossing UTC midnight are split without changing their status, type,
description, location, or coordinate. The first day is filled with off-duty
time before trip start and the final day after completion. Intermediate gaps,
overlaps, invalid timestamps, and daily totals other than exactly 1,440 minutes
raise sanitized internal service errors.

The official rows are:

- `OFF_DUTY`
- `SLEEPER_BERTH`
- `DRIVING`
- `ON_DUTY_NOT_DRIVING`

## Frontend integration

For MapLibre GL, use `route` directly as a GeoJSON `LineString` geometry and
use each stop's `[longitude, latitude]` coordinate for markers.

For Day.js, parse `timeline[].start_time`, `timeline[].end_time`, and the daily
events' `iso_start_time`/`iso_end_time`. Daily SVG labels are already provided
as `HH:mm`; `24:00` is used only as the visual end of a daily sheet.

## Tests

Tests mock or replace all provider access and never call the live API:

```bash
python manage.py check
python manage.py test
```

## Deployment

Render, Railway, and similar hosts can install `requirements.txt`, set the
environment variables above, run migrations, and use:

```bash
gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

WhiteNoise serves collected static files. A `Procfile` and `Dockerfile` are
included. To run the container locally:

```bash
docker build -t trip-planner-api .
docker run --rm -p 8000:8000 \
  -e DJANGO_DEBUG=false \
  -e DJANGO_SECRET_KEY=replace-me \
  -e DJANGO_ALLOWED_HOSTS=localhost \
  -e CORS_ALLOWED_ORIGINS=http://localhost:5173 \
  -e OPENROUTESERVICE_API_KEY=replace-me \
  trip-planner-api
```

Run `python manage.py migrate` as a release command on the deployment host.

## Known limitations

- Route durations are rounded to integer minutes for deterministic HOS math.
- Fuel and rest coordinates are approximate polyline interpolations.
- The cycle calculation cannot reconstruct rolling eight-day history.
- The scheduler does not implement split-sleeper, adverse-driving, short-haul,
  team-driver, or state-specific exceptions.
- SQLite is intended for local development; use persistent storage or a
  production database before adding persistent application data.
