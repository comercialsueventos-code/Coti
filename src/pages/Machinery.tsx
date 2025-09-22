import React from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Tabs,
  Tab
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { useMachineryPage } from './machinery/hooks/useMachineryPage'
import TabPanel from './machinery/components/TabPanel'
import MachineryInventory from './machinery/tabs/MachineryInventory'
import MachineryMaintenance from './machinery/tabs/MachineryMaintenance'
import MachineryStatistics from './machinery/tabs/MachineryStatistics'
import MachineryFormDialog from './machinery/dialogs/MachineryFormDialog'
import MaintenanceScheduleDialog from './machinery/dialogs/MaintenanceScheduleDialog'

const MachineryPage: React.FC = () => {
  const { state, actions, data, closeAllDialogs } = useMachineryPage()

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    actions.setCurrentTab(newValue)
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            🔧 Gestión de Maquinaria y Equipos
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={actions.handleCreateMachinery}
          >
            Nueva Maquinaria
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={state.currentTab} onChange={handleTabChange}>
            <Tab label="Inventario" />
            <Tab label="Mantenimiento" />
            <Tab label="Estadísticas" />
          </Tabs>
        </Box>

        <TabPanel value={state.currentTab} index={0}>
          <MachineryInventory
            machinery={data.machinery}
            statistics={data.statistics}
            selectedCategory={state.selectedCategory}
            filteredMachinery={data.filteredMachinery}
            onCategoryChange={actions.setSelectedCategory}
            onEditMachinery={actions.handleEditMachinery}
            onDeleteMachinery={actions.handleDeleteMachinery}
            onScheduleMaintenance={actions.handleScheduleMaintenance}
          />
        </TabPanel>

        <TabPanel value={state.currentTab} index={1}>
          <MachineryMaintenance
            maintenanceNeeded={data.maintenanceNeeded}
            onScheduleMaintenance={actions.handleScheduleMaintenance}
          />
        </TabPanel>

        <TabPanel value={state.currentTab} index={2}>
          <MachineryStatistics
            statistics={data.statistics}
          />
        </TabPanel>
      </Box>

      {/* Create/Edit Machinery Dialog */}
      <MachineryFormDialog
        open={state.createDialogOpen || state.editDialogOpen}
        onClose={closeAllDialogs}
        machinery={state.selectedMachinery}
        isEdit={state.editDialogOpen}
      />

      {/* Maintenance Dialog */}
      <MaintenanceScheduleDialog
        open={state.maintenanceDialogOpen}
        onClose={closeAllDialogs}
        machinery={state.selectedMachinery}
      />
    </Container>
  )
}

export default MachineryPage