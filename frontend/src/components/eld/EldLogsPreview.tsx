import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import type { DailyEldEvent, DailyEldLog, DutyStatus } from '../../types/trip'
import { formatLogDate } from '../../utils/formatters'
import { SectionHeading } from '../layout/SectionHeading'

interface EldLogsPreviewProps {
  logs: DailyEldLog[]
}

const rows: Array<{ status: DutyStatus; label: string; shortLabel: string }> = [
  { status: 'OFF_DUTY', label: 'Off duty', shortLabel: 'OFF' },
  { status: 'SLEEPER_BERTH', label: 'Sleeper berth', shortLabel: 'SB' },
  { status: 'DRIVING', label: 'Driving', shortLabel: 'D' },
  {
    status: 'ON_DUTY_NOT_DRIVING',
    label: 'On duty, not driving',
    shortLabel: 'ON',
  },
]

const statusColor: Record<DutyStatus, string> = {
  OFF_DUTY: '#7B8793',
  SLEEPER_BERTH: '#6657A8',
  DRIVING: '#146B5A',
  ON_DUTY_NOT_DRIVING: '#E9983E',
}

function EventBar({ event }: { event: DailyEldEvent }) {
  return (
    <Box
      title={`${event.start_time}–${event.end_time}: ${event.description ?? event.type}`}
      sx={{
        position: 'absolute',
        left: `${(event.start_minute / 1440) * 100}%`,
        width: `${((event.end_minute - event.start_minute) / 1440) * 100}%`,
        top: 5,
        bottom: 5,
        minWidth: 2,
        borderRadius: 0.75,
        bgcolor: statusColor[event.status],
      }}
    />
  )
}

function EldDay({ log }: { log: DailyEldLog }) {
  return (
    <Box
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
          px: 2,
          py: 1.5,
          bgcolor: '#F8FAFB',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CalendarMonthRoundedIcon color="primary" fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 750 }}>
            {formatLogDate(log.date)}
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {log.status_totals.driving_hours} hr driving ·{' '}
          {log.status_totals.total_hours} hr logged
        </Typography>
      </Stack>

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '42px 1fr', sm: '112px 1fr' },
            rowGap: 0.75,
          }}
        >
          <Box />
          <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
            {[0, 6, 12, 18, 24].map((hour) => (
              <Typography key={hour} variant="caption" color="text.secondary">
                {hour}
              </Typography>
            ))}
          </Stack>
          {rows.map((row) => (
            <Box key={row.status} sx={{ display: 'contents' }}>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ alignSelf: 'center' }}
                title={row.label}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  {row.label}
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  {row.shortLabel}
                </Box>
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  height: 28,
                  borderRadius: 1,
                  bgcolor: '#F2F5F6',
                  backgroundImage:
                    'linear-gradient(to right, rgba(96,112,128,.12) 1px, transparent 1px)',
                  backgroundSize: '25% 100%',
                }}
              >
                {log.events
                  .filter((event) => event.status === row.status)
                  .map((event) => (
                    <EventBar
                      key={`${event.type}-${event.start_minute}`}
                      event={event}
                    />
                  ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export function EldLogsPreview({ logs }: EldLogsPreviewProps) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: 3 } }}>
        <SectionHeading
          title="Daily ELD logs"
          description="24-hour duty-status breakdown"
          action={<Chip label={`${logs.length} days`} size="small" />}
        />
        <Stack spacing={2}>
          {logs.map((log) => (
            <EldDay key={log.date} log={log} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
