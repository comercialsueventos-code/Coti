// Re-export the consolidated TabPanel with suppliers-specific defaults
import { TabPanel as ConsolidatedTabPanel, TabPanelProps } from '@/shared'

import React from 'react'

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <ConsolidatedTabPanel 
      value={value}
      index={index}
      idPrefix="suppliers"
      {...other}
    >
      {children}
    </ConsolidatedTabPanel>
  )
}

export default TabPanel