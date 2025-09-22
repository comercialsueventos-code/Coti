import React from 'react'
import { Box } from '@mui/material'

/**
 * Generic props for TabPanel component
 */
export interface TabPanelProps {
  /** Content to display in the tab panel */
  children?: React.ReactNode
  /** Current active tab value */
  value: number
  /** Index of this tab panel */
  index: number
  /** ID prefix for accessibility attributes */
  idPrefix?: string
  /** Additional props to spread on the container */
  [key: string]: any
}

/**
 * Consolidated TabPanel Component
 * 
 * A reusable tab panel component that handles visibility based on active tab state.
 * Provides proper accessibility attributes and consistent styling.
 * 
 * @example
 * ```tsx
 * <TabPanel value={activeTab} index={0} idPrefix="machinery">
 *   <div>Content for tab 1</div>
 * </TabPanel>
 * ```
 */
const TabPanel: React.FC<TabPanelProps> = ({ 
  children, 
  value, 
  index, 
  idPrefix = 'generic',
  ...other 
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`${idPrefix}-tabpanel-${index}`}
      aria-labelledby={`${idPrefix}-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

export default TabPanel