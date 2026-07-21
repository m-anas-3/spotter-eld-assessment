import { Box, Tab, Tabs } from '@mui/material'

interface ResultsTabsProps {
  value: number
  onChange: (value: number) => void
}

const labels = ['Route', 'Timeline', 'ELD logs']

export function ResultsTabs({ value, onChange }: ResultsTabsProps) {
  return (
    <Box
      className="results-navigation"
      sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}
    >
      <Tabs
        value={value}
        onChange={(_, nextValue: number) => onChange(nextValue)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Trip result views"
      >
        {labels.map((label, index) => (
          <Tab
            key={label}
            id={`trip-results-tab-${index}`}
            aria-controls={`trip-results-panel-${index}`}
            label={label}
          />
        ))}
      </Tabs>
    </Box>
  )
}
