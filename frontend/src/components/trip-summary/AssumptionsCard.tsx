import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import { SectionHeading } from '../layout/SectionHeading'

interface AssumptionsCardProps {
  assumptions: string[]
}

export function AssumptionsCard({ assumptions }: AssumptionsCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: 3 } }}>
        <SectionHeading
          title="Planning assumptions"
          description="Rules used by the backend for this calculation"
          action={<InfoOutlinedIcon color="primary" />}
        />
        <Box
          component="ul"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 1.25,
            p: 0,
            m: 0,
            listStyle: 'none',
          }}
        >
          {(assumptions.length > 0
            ? assumptions
            : ['No additional planning assumptions were returned.']
          ).map((assumption) => (
            <Stack
              component="li"
              key={assumption}
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'flex-start',
                p: 1.25,
                borderRadius: 1.5,
                bgcolor: '#F8FAFB',
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 6,
                  mt: 0.8,
                  flexShrink: 0,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {assumption}
              </Typography>
            </Stack>
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}
