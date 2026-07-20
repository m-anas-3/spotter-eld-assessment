# RouteLog

RouteLog is a full-stack trucking trip planner built with Django REST Framework
and React. It geocodes a current location, pickup, and drop-off; calculates a
heavy-vehicle route; schedules required work, fuel, breaks, and rest; and draws
daily ELD duty-status logs.

## Features

- OpenRouteService geocoding, heavy-vehicle routing, and turn-by-turn directions
- MapLibre street map with route, location, fuel, break, rest, and restart markers
- Property-carrying HOS schedule for the 70-hour/8-day cycle
- 11-hour driving limit, 14-hour window, 30-minute break, and 10-hour daily rest
- Fuel stops at least every 1,000 miles and one-hour pickup/drop-off activities
- Multi-day SVG ELD sheets with midnight splitting and exact 24-hour totals
- Responsive Material UI dashboard with validation and clear API errors

## Architecture

```text
frontend/  React, TypeScript, Vite, Material UI, MapLibre, Day.js
backend/   Django, Django REST Framework, HTTPX, SQLite, WhiteNoise
```

The backend owns routing, HOS scheduling, and ELD calculations. The frontend
only validates input and renders the API response.

## Local setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

Set `OPENROUTESERVICE_API_KEY` in `backend/.env`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The default frontend URL is `http://localhost:5173` and the default backend URL
is `http://127.0.0.1:8000`.

## API

```http
POST /api/trips/calculate/
Content-Type: application/json
```

```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Milwaukee, WI",
  "dropoff_location": "Dallas, TX",
  "current_cycle_used_hours": 20
}
```

The response includes summary metrics, locations, GeoJSON route geometry,
route legs and directions, stops, a chronological duty timeline, and daily ELD
logs.

## Verification

```bash
cd backend
python manage.py check
python manage.py test

cd ../frontend
npm run build
npm run lint
```

## Deployment

Deploy `backend/` to Render, Railway, or another Python host with:

```text
gunicorn config.wsgi:application
```

Set the backend environment variables from `backend/.env.example`, including
the production frontend origin in `CORS_ALLOWED_ORIGINS`.

Deploy `frontend/` to Vercel with build command `npm run build` and output
directory `dist`. Set `VITE_API_BASE_URL` to the hosted Django URL and
`VITE_MAP_STYLE_URL` to a MapLibre-compatible street style.

## Assessment assumptions

- Property-carrying driver on the 70-hour/8-day cycle
- No adverse-driving-condition exception
- Driver starts after a qualifying 10-hour rest
- Pickup and drop-off take one hour each
- Fueling takes 30 minutes and is required at least every 1,000 miles
- A 34-hour restart is scheduled when more driving is required at the cycle limit
- Cycle history is simplified because only the current used-hour total is provided

## Known limitations

- ELD calendar-day boundaries use UTC because driver/terminal timezone is not an input.
- The 70-hour cycle is based on the supplied current total, not eight days of prior logs.
- Route and geocoding availability depend on OpenRouteService quotas and uptime.

More detail is available in the [backend](backend/README.md) and
[frontend](frontend/README.md) documentation.
