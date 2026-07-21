import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  Typography,
} from '@mui/material'

interface AssumptionsCardProps {
  assumptions: string[]
}

export function AssumptionsCard({ assumptions }: AssumptionsCardProps) {
  const items = assumptions.length
    ? assumptions
    : ['No additional planning assumptions were returned.']

  return (
    <Accordion
      className="assumptions-section"
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px !important',
        '&::before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Box>
          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
            Calculation assumptions
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {items.length} rules used for this trip
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Box
          component="ul"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 1,
            p: 0,
            m: 0,
            listStyle: 'none',
          }}
        >
          {items.map((assumption) => (
            <Stack
              component="li"
              key={assumption}
              direction="row"
              spacing={1}
              sx={{ alignItems: 'flex-start', p: 1 }}
            >
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  mt: 0.8,
                  flexShrink: 0,
                  borderRadius: '50%',
                  bgcolor: 'text.secondary',
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {assumption}
              </Typography>
            </Stack>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}
