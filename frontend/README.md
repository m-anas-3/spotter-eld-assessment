# RouteLog frontend

React and TypeScript dashboard for planning a trucking trip and displaying its
route, Hours-of-Service timeline, stops, and daily ELD log sheets. The frontend
uses Material UI, TanStack Query, React Hook Form, Zod, MapLibre GL, and Day.js.

## Local setup

Requirements:

- Node.js 20 or newer
- The Django backend running locally

Install dependencies and create the local environment file:

```bash
npm install
cp .env.example .env
```

The frontend environment variables are:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

`VITE_API_BASE_URL` points to Django. `VITE_MAP_STYLE_URL` must point to a
MapLibre-compatible street-map style document. The example uses OpenFreeMap's
Liberty style, which provides road, place, and geographic context from open map
data. Vite environment values are public browser configuration, so API keys and
other secrets must never be placed in them. OpenRouteService credentials belong
only in the backend environment.

Start Django separately, then run the frontend:

```bash
npm run dev
```

Vite normally serves the application at `http://localhost:5173`. The Django
backend must allow that origin through its CORS configuration.

## API flow

Submitting the trip form sends:

```text
POST {VITE_API_BASE_URL}/api/trips/calculate/
```

TanStack Query manages mutation state. The frontend renders the backend response
without recalculating routes, HOS constraints, stops, or ELD totals.

## Maps and ELD logs

- Route geometry is read as GeoJSON `LineString`.
- The complete geometry is intentionally kept only in `route.coordinates`;
  route legs contain metadata and directions without duplicating the polyline.
- Turn-by-turn directions are grouped by route leg.
- All map coordinates remain in `[longitude, latitude]` order.
- Full timestamps are formatted with Day.js.
- Each ELD day uses backend-provided `start_minute` and `end_minute` values on
  an SVG 24-hour graph.
- Projected sheets display daily driving miles, UTC period information, combined
  on-duty totals, supplied administrative metadata, and one concise notice when
  driver, carrier, vehicle, or shipment details are unavailable.
- Sheets are clearly identified as planning estimates rather than certified ELD records.
- Multi-day trips use scrollable date tabs.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run preview
```
