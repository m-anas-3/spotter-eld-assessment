import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface SectionHeadingProps {
  title: string
  description?: string
  action?: ReactNode
}

export function SectionHeading({
  title,
  description,
  action,
}: SectionHeadingProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 2,
        mb: 2.5,
      }}
    >
      <Box>
        <Typography component="h2" variant="h2">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </Box>
      {action}
    </Box>
  )
}
