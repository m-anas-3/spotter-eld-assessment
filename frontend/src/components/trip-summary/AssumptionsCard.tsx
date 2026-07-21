import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded'
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material'

interface AssumptionsCardProps {
  assumptions: string[]
}

export function AssumptionsCard({ assumptions }: AssumptionsCardProps) {
  if (assumptions.length === 0) {
    return null
  }

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
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
          Calculation assumptions
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        <Box
          component="ul"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 1,
            pl: 2.5,
            pr: 0,
            py: 0,
            my: 0,
          }}
        >
          {assumptions.map((assumption) => (
            <Box component="li" key={assumption} sx={{ pl: 0.25, pr: 1, py: 0.5 }}>
              <Typography variant="body2" color="text.secondary" component="span">
                {assumption}
              </Typography>
            </Box>
          ))}
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}
