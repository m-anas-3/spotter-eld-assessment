import { Alert, Box, Divider, Paper, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { DailyEldEvent, DailyEldLog, DutyStatus } from '../../types/trip'
import {
  clampMinute,
  ELD_STATUS_ROWS,
  getOrderedDailyEvents,
  isExactDailyTotal,
  MINUTES_PER_DAY,
  readableDutyStatus,
} from '../../utils/eld'
import { formatLogDate } from '../../utils/formatters'

const SVG_WIDTH = 1240
const SVG_HEIGHT = 286
const LABEL_WIDTH = 150
const GRAPH_WIDTH = 960
const TOTAL_WIDTH = 90
const GRAPH_TOP = 58
const ROW_HEIGHT = 48
const GRAPH_BOTTOM = GRAPH_TOP + ROW_HEIGHT * ELD_STATUS_ROWS.length

interface EldLogSheetProps {
  log: DailyEldLog
  idPrefix?: string
}

export function EldLogSheet({ log, idPrefix = 'eld' }: EldLogSheetProps) {
  const theme = useTheme()
  const events = getOrderedDailyEvents(log.events)
  const hasValidTotal = isExactDailyTotal(log.status_totals.total_minutes)
  const titleId = `${idPrefix}-eld-title-${log.date}`
  const descriptionId = `${idPrefix}-eld-description-${log.date}`

  return (
    <Paper
      component="article"
      variant="outlined"
      className="eld-document"
      aria-labelledby={titleId}
      sx={{ overflow: 'hidden', borderRadius: 0.75, bgcolor: 'background.paper' }}
    >
      <Stack
        className="eld-document-header"
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 1.75,
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography id={titleId} component="h4" variant="h3">
            {formatLogDate(log.date)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Driver’s daily record of duty status
          </Typography>
        </Box>
        <Typography
          variant="body2"
          color={hasValidTotal ? 'text.primary' : 'warning.main'}
          sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
        >
          {hasValidTotal ? '24 total hours' : `${log.status_totals.total_hours} total hours`}
        </Typography>
      </Stack>

      {!hasValidTotal && (
        <Alert severity="warning" sx={{ m: 2 }}>
          This log totals {log.status_totals.total_minutes} minutes instead of 1,440 minutes.
        </Alert>
      )}

      <Box
        className="eld-graph-scroll"
        role="region"
        aria-label={`Scrollable ELD graph for ${formatLogDate(log.date)}`}
        tabIndex={0}
        sx={{
          overflowX: 'auto',
          overscrollBehaviorX: 'contain',
          p: { xs: 1.5, sm: 2 },
          '&:focus-visible': {
            outline: '3px solid',
            outlineColor: 'primary.light',
            outlineOffset: -3,
          },
        }}
      >
        <Box className="eld-graph-inner" sx={{ minWidth: SVG_WIDTH, lineHeight: 0 }}>
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            width="100%"
            role="img"
            aria-labelledby={`${titleId} ${descriptionId}`}
            style={{ fontFamily: theme.typography.fontFamily }}
          >
            <desc id={descriptionId}>
              A 24-hour ELD graph with four rows for off duty, sleeper berth,
              driving, and on duty not driving.
            </desc>

            <rect
              x={LABEL_WIDTH}
              y={GRAPH_TOP}
              width={GRAPH_WIDTH}
              height={GRAPH_BOTTOM - GRAPH_TOP}
              fill={theme.palette.background.paper}
            />

            {Array.from({ length: 97 }, (_, index) => {
              const x = LABEL_WIDTH + (index / 96) * GRAPH_WIDTH
              const isMajorHour = index % 4 === 0
              return (
                <line
                  key={`grid-${index}`}
                  x1={x}
                  x2={x}
                  y1={GRAPH_TOP}
                  y2={GRAPH_BOTTOM}
                  stroke={isMajorHour ? theme.palette.divider : theme.palette.action.hover}
                  strokeWidth={isMajorHour ? 1 : 0.6}
                />
              )
            })}

            {Array.from({ length: 25 }, (_, hour) => {
              const x = minuteToX(hour * 60)
              const emphasized = hour === 0 || hour === 12 || hour === 24
              return (
                <text
                  key={`hour-${hour}`}
                  x={x}
                  y={42}
                  textAnchor={hour === 0 ? 'start' : hour === 24 ? 'end' : 'middle'}
                  fill={theme.palette.text.secondary}
                  fontSize={emphasized ? 12 : 10}
                  fontWeight={emphasized ? 600 : 400}
                >
                  {hourLabel(hour)}
                </text>
              )
            })}

            <text
              x={LABEL_WIDTH + GRAPH_WIDTH + TOTAL_WIDTH / 2}
              y={42}
              textAnchor="middle"
              fill={theme.palette.text.secondary}
              fontSize="11"
              fontWeight="600"
            >
              Total
            </text>

            {ELD_STATUS_ROWS.map((row, index) => {
              const y = statusY(row.status)
              return (
                <g key={row.status}>
                  <line
                    x1={LABEL_WIDTH}
                    x2={LABEL_WIDTH + GRAPH_WIDTH}
                    y1={GRAPH_TOP + index * ROW_HEIGHT}
                    y2={GRAPH_TOP + index * ROW_HEIGHT}
                    stroke={theme.palette.divider}
                    strokeWidth="1"
                  />
                  <circle cx={18} cy={y} r={4} fill={theme.palette.text.secondary} />
                  <text x={31} y={y + 4} fill={theme.palette.text.primary} fontSize="12" fontWeight="500">
                    {row.label}
                  </text>
                  <text
                    x={LABEL_WIDTH + GRAPH_WIDTH + TOTAL_WIDTH / 2}
                    y={y + 4}
                    textAnchor="middle"
                    fill={theme.palette.text.primary}
                    fontSize="13"
                    fontWeight="600"
                  >
                    {formatTotal(log.status_totals[row.totalKey])}
                  </text>
                </g>
              )
            })}

            <line
              x1={LABEL_WIDTH}
              x2={LABEL_WIDTH + GRAPH_WIDTH}
              y1={GRAPH_BOTTOM}
              y2={GRAPH_BOTTOM}
              stroke={theme.palette.divider}
            />
            <line
              x1={LABEL_WIDTH}
              x2={LABEL_WIDTH}
              y1={GRAPH_TOP}
              y2={GRAPH_BOTTOM}
              stroke={theme.palette.text.secondary}
            />
            <line
              x1={LABEL_WIDTH + GRAPH_WIDTH}
              x2={LABEL_WIDTH + GRAPH_WIDTH}
              y1={GRAPH_TOP}
              y2={GRAPH_BOTTOM}
              stroke={theme.palette.text.secondary}
            />

            {events.map((event, index) => {
              const nextEvent = events[index + 1]
              const y = statusY(event.status)
              const startX = minuteToX(event.start_minute)
              const endX = minuteToX(event.end_minute)
              const shouldConnect =
                nextEvent !== undefined &&
                event.end_minute === nextEvent.start_minute &&
                event.status !== nextEvent.status

              return (
                <g key={`${event.type}-${event.start_minute}-${index}`}>
                  <line
                    x1={startX}
                    x2={endX}
                    y1={y}
                    y2={y}
                    stroke={theme.palette.text.primary}
                    strokeWidth="3"
                    strokeLinecap="square"
                  >
                    <title>
                      {event.start_time}–{event.end_time}: {event.description ?? event.type}
                    </title>
                  </line>
                  {shouldConnect && (
                    <line
                      x1={endX}
                      x2={endX}
                      y1={y}
                      y2={statusY(nextEvent.status)}
                      stroke={theme.palette.text.primary}
                      strokeWidth="2"
                    />
                  )}
                </g>
              )
            })}
          </svg>
        </Box>
      </Box>

      <Box className="eld-document-details" sx={{ px: { xs: 2, sm: 2.5 }, pb: 2.5 }}>
        <Typography component="h5" variant="body2" sx={{ mb: 0.75, fontWeight: 600 }}>
          Duty-status totals
        </Typography>
        <Box
          className="eld-totals"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(5, minmax(0, 1fr))' },
            borderTop: '1px solid',
            borderLeft: '1px solid',
            borderColor: 'divider',
          }}
        >
          {ELD_STATUS_ROWS.map((row) => (
            <TotalCell
              key={row.status}
              label={row.label}
              value={formatTotal(log.status_totals[row.totalKey])}
            />
          ))}
          <TotalCell label="Total" value={formatTotal(log.status_totals.total_hours)} emphasized />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography component="h5" variant="body2" sx={{ mb: 0.75, fontWeight: 600 }}>
          Remarks and activity
        </Typography>
        <Box
          component="ol"
          className="eld-remarks"
          aria-label={`ELD event remarks for ${formatLogDate(log.date)}`}
          sx={{ listStyle: 'none', p: 0, m: 0 }}
        >
          {events.map((event, index) => (
            <Box
              component="li"
              className="eld-remarks-row"
              key={`${event.type}-remark-${event.start_minute}-${index}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '120px 170px 170px minmax(0, 1fr)' },
                gap: { xs: 0.35, md: 1.5 },
                py: 1.1,
                borderTop: index === 0 ? 'none' : '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {event.start_time}–{event.end_time}
              </Typography>
              <Typography variant="body2">{readableEventType(event)}</Typography>
              <Typography variant="body2" color="text.secondary">
                {readableDutyStatus(event.status)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                {[event.description, event.location].filter(Boolean).join(' · ') || 'No remarks'}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  )
}

interface TotalCellProps {
  label: string
  value: string
  emphasized?: boolean
}

function TotalCell({ label, value, emphasized = false }: TotalCellProps) {
  return (
    <Box sx={{ p: 1, borderRight: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.25, fontWeight: emphasized ? 600 : 500 }}>
        {value}
      </Typography>
    </Box>
  )
}

function minuteToX(minute: number): number {
  return LABEL_WIDTH + (clampMinute(minute) / MINUTES_PER_DAY) * GRAPH_WIDTH
}

function statusY(status: DutyStatus): number {
  const rowIndex = Math.max(0, ELD_STATUS_ROWS.findIndex((row) => row.status === status))
  return GRAPH_TOP + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2
}

function hourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return '12 AM'
  if (hour === 12) return '12 PM'
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}

function formatTotal(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(2)} hr`
}

function readableEventType(event: DailyEldEvent): string {
  return event.type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
