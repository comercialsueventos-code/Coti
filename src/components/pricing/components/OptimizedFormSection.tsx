import React from 'react'
import { Box, Paper, Typography } from '@mui/material'

interface OptimizedFormSectionProps {
  title: string
  children: React.ReactNode
}

/**
 * Optimized form section wrapper that uses React.memo to prevent
 * unnecessary re-renders when parent components update
 */
export const OptimizedFormSection: React.FC<OptimizedFormSectionProps> = React.memo(({
  title,
  children
}) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title}
      </Typography>
      <Box>
        {children}
      </Box>
    </Paper>
  )
})

OptimizedFormSection.displayName = 'OptimizedFormSection'