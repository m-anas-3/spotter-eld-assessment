# RouteLog

RouteLog is a full-stack trip-planning workspace for property-carrying truck drivers. It calculates an ordered truck route, plans fuel and Hours-of-Service
events, and produces daily ELD-style duty-status sheets for the trip.


## What the application does

Drivers enter:

- Current location
- Pickup location
- Drop-off location
- Current 70-hour cycle usage

RouteLog returns:

- An ordered current-to-pickup-to-drop-off truck route
- Route distance, driving time, trip duration, and cycle usage
- MapLibre-compatible GeoJSON and route instructions
- Pickup, delivery, fuel, break, daily-rest, and restart stops
- A chronological duty schedule
- One printable ELD-style log sheet for every trip date

## Technology

### Frontend

- React and TypeScript
- Vite
- Material UI
- TanStack Query
- React Hook Form and Zod
- MapLibre GL
- Day.js

### Backend

- Python and Django
- Django REST Framework
- OpenRouteService through HTTPX
- SQLite for local development
- Gunicorn and WhiteNoise for deployment

## Architecture

```text
React trip form
      │
      ▼
POST /api/trips/calculate/
      │
      ├── Request validation
      ├── Address geocoding
      ├── Heavy-vehicle route calculation
      ├── Minute-based HOS scheduling
      ├── Stop-coordinate interpolation
      └── Daily ELD log generation
      │
      ▼
Map, route details, duty schedule, and printable logs
```

Routing and compliance calculations remain in Django. React is responsible for
input handling, API state, formatting, map rendering, and document presentation.
The OpenRouteService key is therefore never exposed to the browser.

## Repository structure

```text
.
├── backend/
│   ├── config/                 Django configuration
│   ├── trips/
│   │   ├── services/           Routing, scheduling, geometry, and ELD logic
│   │   ├── tests/              API and service tests
│   │   ├── serializers.py      Request validation
│   │   ├── exceptions.py       Sanitized API errors
│   │   └── views.py            DRF endpoints
│   ├── Dockerfile
│   ├── Procfile
│   └── requirements.txt
└── frontend/
    ├── src/api/                Typed API client
    ├── src/components/         Form, map, timeline, and ELD UI
    ├── src/pages/              Planner page
    ├── src/schemas/            Zod validation
    ├── src/types/              API types
    └── src/theme.ts            Material UI design system
```

## Local development

### 1. Start Django

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

Add a valid OpenRouteService key to `backend/.env` before calculating a live
route.

### 2. Start React

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The local API runs at
`http://127.0.0.1:8000`.

## Environment variables

### Backend

```env
DJANGO_SECRET_KEY=development-secret-key
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
OPENROUTESERVICE_API_KEY=
```

### Frontend

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

Vite variables are public browser configuration. Secrets belong only in the
backend environment.

## API

### Health check

```http
GET /api/health/
```

### Calculate a trip

```bash
curl -X POST http://127.0.0.1:8000/api/trips/calculate/ \
  -H "Content-Type: application/json" \
  -d '{
    "current_location": "Chicago, IL",
    "pickup_location": "Milwaukee, WI",
    "dropoff_location": "Dallas, TX",
    "current_cycle_used_hours": 20
  }'
```

The response contains:

```text
trip_summary   Calculated distance, duration, days, fuel, and cycle values
locations      Geocoded current, pickup, and drop-off locations
route          GeoJSON LineString in [longitude, latitude] order
route_legs     Per-leg distance, duration, and driving instructions
stops          Map markers with arrival and departure timestamps
timeline       Chronological driving and duty-status events
daily_logs     Midnight-split, 24-hour ELD sheet data
```

## Scheduling and ELD generation

The scheduler uses integer minutes and advances through the trip until the next
route, fuel, driving, work-window, break, or cycle boundary. Driving and
on-duty-not-driving activities contribute to cycle usage; qualifying off-duty
and sleeper periods do not.

The ELD service validates the generated timeline, splits events at UTC
midnight, fills the first and final calendar-day gaps, and verifies that every
daily sheet covers exactly 1,440 non-overlapping minutes. The frontend plots
the returned minute positions as a printable SVG duty-status graph; it does not
recalculate HOS rules.

## Tests and verification

Backend provider calls are mocked, so the test suite does not use API quota or
make live network requests.

```bash
cd backend
python manage.py check
python manage.py test

cd ../frontend
npm run build
npm run lint
```

## Deployment

### Frontend: Vercel

Create a Vercel project from this GitHub repository and configure:

```text
Root Directory: frontend
Framework:      Vite
Build Command:  npm run build
Output:         dist
```

Add these Vercel environment variables for Production and Preview:

```env
VITE_API_BASE_URL=https://your-django-api.example.com
VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

Redeploy after changing a Vite environment variable because its value is
embedded during the frontend build.

### Backend: Render, Railway, or another Python host

Configure the service root as `backend` and use:

```text
Build: pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
Start: gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
```

Production environment example:

```env
DJANGO_DEBUG=false
DJANGO_SECRET_KEY=use-a-long-random-value
DJANGO_ALLOWED_HOSTS=your-api-host.example.com
CORS_ALLOWED_ORIGINS=https://your-project.vercel.app
OPENROUTESERVICE_API_KEY=your-server-side-key
```

After deployment, verify both:

```text
https://your-api-host.example.com/api/health/
https://your-project.vercel.app
```

## Project scope

- Fuel and rest markers are route-distance planning points, not verified truck facilities.
- Cycle planning uses the submitted used-hour total because prior eight-day logs are not inputs.
- Daily sheets use UTC boundaries and are projected trip-planning records rather than certified ELD records.
- Live geocoding and routing depend on OpenRouteService availability and account limits.

Additional implementation details are available in the
[backend documentation](backend/README.md) and
[frontend documentation](frontend/README.md).
