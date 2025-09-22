import React from 'react'
import { Dialog, DialogProps } from '@mui/material'

interface ScrollableDialogProps extends DialogProps {
  children: React.ReactNode
}

/**
 * Dialog component with proper scrolling configuration
 * Solves the scroll issue in forms and long content
 */
const ScrollableDialog: React.FC<ScrollableDialogProps> = ({ 
  children, 
  PaperProps,
  scroll = "body",
  ...props 
}) => {
  return (
    <Dialog
      {...props}
      scroll={scroll}
      PaperProps={{
        sx: {
          maxHeight: '90vh',
          overflow: 'auto',
          ...PaperProps?.sx
        },
        ...PaperProps
      }}
    >
      {children}
    </Dialog>
  )
}

export default ScrollableDialog