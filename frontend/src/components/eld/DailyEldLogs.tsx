import { useState } from 'react'
import { Box, Card, Stack, Tab, Tabs, Typography } from '@mui/material'
import type { DailyEldLog } from '../../types/trip'
import { formatLogDate } from '../../utils/formatters'
import { EldLogSheet } from './EldLogSheet'

interface DailyEldLogsProps {
  logs: DailyEldLog[]
}

export function DailyEldLogs({ logs }: DailyEldLogsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (logs.length === 0) {
    return (
      <Card sx={{ p: 2.5 }}>
        <Typography component="h3" variant="h3">
          Daily ELD logs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          No daily logs were returned for this trip.
        </Typography>
      </Card>
    )
  }

  const activeIndex = Math.min(selectedIndex, logs.length - 1)
  const selectedLog = logs[activeIndex]

  return (
    <Box className="daily-eld-logs">
      <Stack
        className="eld-screen-only"
        direction={{ xs: 'column', sm: 'row' }}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, gap: 1.5, mb: 2 }}
      >
        <Box>
          <Typography component="h3" variant="h3">
            Daily ELD logs
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {logs.length} log {logs.length === 1 ? 'sheet' : 'sheets'}
          </Typography>
        </Box>
        <Tabs
          value={activeIndex}
          onChange={(_, nextIndex: number) => setSelectedIndex(nextIndex)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Select a daily ELD log"
          sx={{ maxWidth: '100%', minWidth: 0, flex: { sm: 1 }, ml: { sm: 2 } }}
        >
          {logs.map((log) => (
            <Tab
              key={log.date}
              label={formatLogDate(log.date)}
              aria-label={`Show ELD log for ${formatLogDate(log.date)}`}
            />
          ))}
        </Tabs>
      </Stack>

      <Box className="eld-screen-only">
        <EldLogSheet log={selectedLog} idPrefix="screen" />
      </Box>

      <Box className="eld-print-only">
        {logs.map((log) => (
          <Box className="eld-print-sheet" key={`print-${log.date}`}>
            <EldLogSheet log={log} idPrefix="print" />
          </Box>
        ))}
      </Box>
    </Box>
  )
}
