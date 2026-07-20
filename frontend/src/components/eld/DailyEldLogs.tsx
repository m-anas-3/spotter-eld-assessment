import { useState } from 'react'
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded'
import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material'
import type { DailyEldLog } from '../../types/trip'
import { formatLogDate } from '../../utils/formatters'
import { SectionHeading } from '../layout/SectionHeading'
import { EldLogSheet } from './EldLogSheet'

interface DailyEldLogsProps {
  logs: DailyEldLog[]
}

export function DailyEldLogs({ logs }: DailyEldLogsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (logs.length === 0) {
    return (
      <Card>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <SectionHeading
            title="Daily ELD logs"
            description="No daily logs were returned for this trip"
          />
          <Stack
            spacing={1.5}
            sx={{
              minHeight: 160,
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'text.secondary',
            }}
          >
            <EventNoteRoundedIcon sx={{ fontSize: 38 }} />
            <Typography>
              Daily log sheets will appear here when available.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    )
  }

  const activeIndex = Math.min(selectedIndex, logs.length - 1)
  const selectedLog = logs[activeIndex]

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: 3 } }}>
        <SectionHeading
          title="Daily ELD logs"
          description={`${logs.length} daily log${logs.length === 1 ? '' : 's'} generated`}
          action={<Chip label={`${logs.length} days`} size="small" />}
        />

        {logs.length > 1 ? (
          <Box
            sx={{
              mb: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              maxWidth: '100%',
            }}
          >
            <Tabs
              value={activeIndex}
              onChange={(_, nextIndex: number) => setSelectedIndex(nextIndex)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              aria-label="Select a daily ELD log"
            >
              {logs.map((log) => (
                <Tab
                  key={log.date}
                  label={formatLogDate(log.date)}
                  aria-label={`Show ELD log for ${formatLogDate(log.date)}`}
                />
              ))}
            </Tabs>
          </Box>
        ) : (
          <Chip
            icon={<EventNoteRoundedIcon />}
            label={formatLogDate(selectedLog.date)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
        )}

        <EldLogSheet log={selectedLog} />
      </CardContent>
    </Card>
  )
}
