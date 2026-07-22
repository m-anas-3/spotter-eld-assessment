import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { DailyEldEvent, DutyStatus, EldStatusTotals } from '../../types/trip'
import {
  clampMinute,
  ELD_STATUS_ROWS,
  MINUTES_PER_DAY,
} from '../../utils/eld'

const SVG_WIDTH = 1240
const SVG_HEIGHT = 304
const LABEL_WIDTH = 160
const GRAPH_WIDTH = 960
const TOTAL_WIDTH = 96
const GRAPH_TOP = 66
const ROW_HEIGHT = 50
const GRAPH_BOTTOM = GRAPH_TOP + ROW_HEIGHT * ELD_STATUS_ROWS.length

interface EldDutyGraphProps {
  dateLabel: string
  events: DailyEldEvent[]
  statusTotals: EldStatusTotals
  titleId: string
  descriptionId: string
}

export function EldDutyGraph({
  dateLabel,
  events,
  statusTotals,
  titleId,
  descriptionId,
}: EldDutyGraphProps) {
  const theme = useTheme()

  return (
    <Box
      className="eld-graph-scroll"
      role="region"
      aria-label={`Scrollable ELD graph for ${dateLabel}`}
      tabIndex={0}
      sx={{
        overflowX: 'auto',
        overscrollBehaviorX: 'contain',
        px: { xs: 1.5, sm: 2 },
        pb: { xs: 1.5, sm: 2 },
        '&:focus-visible': {
          outline: '3px solid',
          outlineColor: 'primary.light',
          outlineOffset: -3,
        },
      }}
    >
      <Box
        className="eld-graph-inner"
        sx={{ minWidth: SVG_WIDTH, lineHeight: 0 }}
      >
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          width={SVG_WIDTH}
          height={SVG_HEIGHT}
          preserveAspectRatio="xMinYMin meet"
          role="img"
          aria-labelledby={`${titleId} ${descriptionId}`}
          style={{
            display: 'block',
            width: '100%',
            height: 'auto',
            fontFamily: theme.typography.fontFamily,
          }}
        >
          <desc id={descriptionId}>
            A 24-hour driver duty graph for {dateLabel}. Horizontal lines show
            off duty, sleeper berth, driving, and on duty not driving periods.
            Vertical lines show each change in duty status.
          </desc>

          <rect
            x={LABEL_WIDTH}
            y={GRAPH_TOP}
            width={GRAPH_WIDTH}
            height={GRAPH_BOTTOM - GRAPH_TOP}
            fill={theme.palette.background.paper}
            stroke={theme.palette.text.secondary}
            strokeWidth="1"
          />

          {Array.from({ length: 23 }, (_, index) => {
            const hour = index + 1
            const x = minuteToX(hour * 60)
            const isSixHours = hour % 6 === 0

            return (
              <line
                key={`grid-${hour}`}
                x1={x}
                x2={x}
                y1={GRAPH_TOP}
                y2={GRAPH_BOTTOM}
                stroke={isSixHours ? theme.palette.text.secondary : theme.palette.divider}
                strokeWidth={isSixHours ? 1 : 0.65}
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
                y={45}
                textAnchor={hour === 0 ? 'start' : hour === 24 ? 'end' : 'middle'}
                fill={theme.palette.text.secondary}
                fontSize={emphasized ? 12 : 11}
                fontWeight={emphasized ? 650 : 500}
              >
                {hourLabel(hour)}
              </text>
            )
          })}

          <text
            x={LABEL_WIDTH + GRAPH_WIDTH + TOTAL_WIDTH / 2}
            y={45}
            textAnchor="middle"
            fill={theme.palette.text.secondary}
            fontSize="11"
            fontWeight="650"
          >
            Total
          </text>

          {ELD_STATUS_ROWS.map((row, index) => {
            const y = statusY(row.status)
            const boundaryY = GRAPH_TOP + index * ROW_HEIGHT

            return (
              <g key={row.status}>
                {index > 0 && (
                  <line
                    x1={LABEL_WIDTH}
                    x2={LABEL_WIDTH + GRAPH_WIDTH}
                    y1={boundaryY}
                    y2={boundaryY}
                    stroke={theme.palette.divider}
                    strokeWidth="1"
                  />
                )}
                <text
                  x={16}
                  y={y + 4}
                  fill={theme.palette.text.secondary}
                  fontSize="11"
                  fontWeight="650"
                >
                  {index + 1}
                </text>
                <text
                  x={36}
                  y={y + 4}
                  fill={theme.palette.text.primary}
                  fontSize="12"
                  fontWeight="550"
                >
                  {row.label}
                </text>
                <text
                  x={LABEL_WIDTH + GRAPH_WIDTH + TOTAL_WIDTH / 2}
                  y={y + 4}
                  textAnchor="middle"
                  fill={theme.palette.text.primary}
                  fontSize="13"
                  fontWeight="650"
                >
                  {formatTotal(statusTotals[row.totalKey])}
                </text>
              </g>
            )
          })}

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
                  strokeWidth="3.5"
                  strokeLinecap="butt"
                >
                  <title>
                    {event.start_time}–{event.end_time}: {event.description ?? event.type}
                  </title>
                </line>
                {shouldConnect && (
                  <>
                    <line
                      x1={endX}
                      x2={endX}
                      y1={y}
                      y2={statusY(nextEvent.status)}
                      stroke={theme.palette.text.primary}
                      strokeWidth="2.5"
                    />
                    <circle
                      cx={endX}
                      cy={statusY(nextEvent.status)}
                      r="2.75"
                      fill={theme.palette.text.primary}
                    />
                  </>
                )}
              </g>
            )
          })}
        </svg>
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

function hourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return '12 AM'
  if (hour === 12) return '12 PM'
  return String(hour % 12)
}

function formatTotal(hours: number): string {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(2)} hr`
}
