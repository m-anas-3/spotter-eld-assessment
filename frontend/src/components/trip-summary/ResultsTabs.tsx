import { Box, Tab, Tabs } from '@mui/material'

interface ResultsTabsProps {
  value: number
  onChange: (value: number) => void
}

const labels = ['Route', 'Duty schedule', 'ELD logs']

export function ResultsTabs({ value, onChange }: ResultsTabsProps) {
  return (
    <Box
      component="nav"
      className="results-navigation"
      aria-label="Trip result sections"
      sx={{
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <Tabs
        value={value}
        onChange={(_, nextValue: number) => onChange(nextValue)}
        variant="fullWidth"
        aria-label="Trip result views"
        sx={{
          '& .MuiTab-root.Mui-selected': { bgcolor: 'primary.light' },
          '& .MuiTab-root': { px: { xs: 1, sm: 2 } },
        }}
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
