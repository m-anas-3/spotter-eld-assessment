import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import {
  Alert,
  Box,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
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
}

export function EldLogSheet({ log }: EldLogSheetProps) {
  const events = getOrderedDailyEvents(log.events)
  const hasValidTotal = isExactDailyTotal(log.status_totals.total_minutes)
  const titleId = `eld-title-${log.date}`
  const descriptionId = `eld-description-${log.date}`

  return (
    <Box
      component="article"
      aria-labelledby={titleId}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 1.75,
          bgcolor: '#F8FAFB',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1,
        }}
      >
        <Box>
          <Typography id={titleId} component="h3" variant="h3">
            {formatLogDate(log.date)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Driver’s daily record of duty status
          </Typography>
        </Box>
        <Chip
          color={hasValidTotal ? 'success' : 'warning'}
          label={`${log.status_totals.total_hours} total hours`}
          size="small"
          variant={hasValidTotal ? 'outlined' : 'filled'}
        />
      </Stack>

      {!hasValidTotal && (
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          This log totals {log.status_totals.total_minutes} minutes instead of
          the required 1,440 minutes.
        </Alert>
      )}

      <Box
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
        <Box sx={{ minWidth: SVG_WIDTH, lineHeight: 0 }}>
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            width="100%"
            role="img"
            aria-labelledby={`${titleId} ${descriptionId}`}
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
              fill="#FBFCFD"
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
                  stroke={isMajorHour ? '#BAC5CC' : '#E7ECEF'}
                  strokeWidth={isMajorHour ? 1 : 0.6}
                />
              )
            })}

            {Array.from({ length: 25 }, (_, hour) => {
              const x = minuteToX(hour * 60)
              return (
                <text
                  key={`hour-${hour}`}
                  x={x}
                  y={42}
                  textAnchor={
                    hour === 0 ? 'start' : hour === 24 ? 'end' : 'middle'
                  }
                  fill="#607080"
                  fontSize={hour === 0 || hour === 12 || hour === 24 ? 12 : 10}
                  fontWeight={hour === 0 || hour === 12 || hour === 24 ? 700 : 500}
                >
                  {hourLabel(hour)}
                </text>
              )
            })}

            <text
              x={LABEL_WIDTH + GRAPH_WIDTH + TOTAL_WIDTH / 2}
              y={42}
              textAnchor="middle"
              fill="#607080"
              fontSize="11"
              fontWeight="700"
            >
              TOTAL
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
                    stroke="#BAC5CC"
                    strokeWidth="1"
                  />
                  <circle cx={18} cy={y} r={5} fill={statusColor(row.status)} />
                  <text
                    x={31}
                    y={y + 4}
                    fill="#263543"
                    fontSize="12"
                    fontWeight="650"
                  >
                    {row.label}
                  </text>
                  <text
                    x={LABEL_WIDTH + GRAPH_WIDTH + TOTAL_WIDTH / 2}
                    y={y + 4}
                    textAnchor="middle"
                    fill="#263543"
                    fontSize="13"
                    fontWeight="700"
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
              stroke="#BAC5CC"
              strokeWidth="1"
            />
            <line
              x1={LABEL_WIDTH}
              x2={LABEL_WIDTH}
              y1={GRAPH_TOP}
              y2={GRAPH_BOTTOM}
              stroke="#8796A2"
              strokeWidth="1.25"
            />
            <line
              x1={LABEL_WIDTH + GRAPH_WIDTH}
              x2={LABEL_WIDTH + GRAPH_WIDTH}
              y1={GRAPH_TOP}
              y2={GRAPH_BOTTOM}
              stroke="#8796A2"
              strokeWidth="1.25"
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
                    stroke={statusColor(event.status)}
                    strokeWidth="4"
                    strokeLinecap="round"
                  >
                    <title>
                      {event.start_time}–{event.end_time}:{' '}
                      {event.description ?? event.type}
                    </title>
                  </line>
                  {shouldConnect && (
                    <line
                      x1={endX}
                      x2={endX}
                      y1={y}
                      y2={statusY(nextEvent.status)}
                      stroke="#263543"
                      strokeWidth="2"
                    />
                  )}
                </g>
              )
            })}
          </svg>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, sm: 2.5 }, pb: 2.5 }}>
        <Typography component="h4" variant="h3" sx={{ mb: 1.5 }}>
          Status totals
        </Typography>
        <Grid container spacing={1}>
          {ELD_STATUS_ROWS.map((row) => (
            <Grid key={row.status} size={{ xs: 6, sm: 4, md: 2.4 }}>
              <Box
                sx={{
                  height: '100%',
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: '#F8FAFB',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block' }}
                >
                  {row.label}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 750 }}>
                  {formatTotal(log.status_totals[row.totalKey])}
                </Typography>
              </Box>
            </Grid>
          ))}
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
            <Box
              sx={{
                height: '100%',
                p: 1.25,
                borderRadius: 1.5,
                bgcolor: hasValidTotal ? 'primary.light' : 'warning.light',
                border: '1px solid',
                borderColor: hasValidTotal ? 'primary.main' : 'warning.main',
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                Total
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 800 }}>
                {formatTotal(log.status_totals.total_hours)}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />

        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', mb: 1.5 }}
        >
          <AccessTimeRoundedIcon color="primary" fontSize="small" />
          <Typography component="h4" variant="h3">
            Event remarks
          </Typography>
        </Stack>
        <Box
          component="ol"
          aria-label={`ELD event remarks for ${formatLogDate(log.date)}`}
          sx={{ listStyle: 'none', p: 0, m: 0 }}
        >
          {events.map((event, index) => (
            <Box
              component="li"
              key={`${event.type}-remark-${event.start_minute}-${index}`}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '120px 1fr' },
                gap: { xs: 0.5, sm: 1.5 },
                py: 1.25,
                borderTop: index === 0 ? 'none' : '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 750 }}>
                {event.start_time}–{event.end_time}
              </Typography>
              <Box sx={{ minWidth: 0 }}>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  sx={{
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 0.5, sm: 1 },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}
                  >
                    {readableEventType(event)}
                  </Typography>
                  <Chip
                    label={readableDutyStatus(event.status)}
                    size="small"
                    variant="outlined"
                    sx={{ height: 21, fontSize: '0.65rem' }}
                  />
                </Stack>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.25, overflowWrap: 'anywhere' }}
                >
                  {[event.description, event.location].filter(Boolean).join(' · ') ||
                    'No remarks'}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

function minuteToX(minute: number): number {
  return LABEL_WIDTH + (clampMinute(minute) / MINUTES_PER_DAY) * GRAPH_WIDTH
}

function statusY(status: DutyStatus): number {
  const rowIndex = Math.max(
    0,
    ELD_STATUS_ROWS.findIndex((row) => row.status === status),
  )
  return GRAPH_TOP + rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2
}

function statusColor(status: DutyStatus): string {
  const colors: Record<DutyStatus, string> = {
    OFF_DUTY: '#657481',
    SLEEPER_BERTH: '#6657A8',
    DRIVING: '#146B5A',
    ON_DUTY_NOT_DRIVING: '#D77E21',
  }
  return colors[status]
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
