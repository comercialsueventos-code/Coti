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
import { useSuppliersPage } from './suppliers/hooks/useSuppliersPage'
import TabPanel from './suppliers/components/TabPanel'
import SuppliersDirectory from './suppliers/tabs/SuppliersDirectory'
import SuppliersTopRated from './suppliers/tabs/SuppliersTopRated'
import SuppliersStatistics from './suppliers/tabs/SuppliersStatistics'
import SupplierFormDialog from './suppliers/dialogs/SupplierFormDialog'
import SupplierRatingDialog from './suppliers/dialogs/SupplierRatingDialog'

const SuppliersPage: React.FC = () => {
  const { state, actions, data, closeAllDialogs } = useSuppliersPage()

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    actions.setCurrentTab(newValue)
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            🏢 Gestión de Proveedores y Subcontratistas
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={actions.handleCreateSupplier}
          >
            Nuevo Proveedor
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={state.currentTab} onChange={handleTabChange}>
            <Tab label="Directorio" />
            <Tab label="Top Proveedores" />
            <Tab label="Estadísticas" />
          </Tabs>
        </Box>

        <TabPanel value={state.currentTab} index={0}>
          <SuppliersDirectory
            suppliers={data.suppliers}
            statistics={data.statistics}
            searchTerm={state.searchTerm}
            selectedType={state.selectedType}
            filteredSuppliers={data.filteredSuppliers}
            onSearchChange={actions.setSearchTerm}
            onTypeChange={actions.setSelectedType}
            onEditSupplier={actions.handleEditSupplier}
            onDeleteSupplier={actions.handleDeleteSupplier}
            onRateSupplier={actions.handleRateSupplier}
          />
        </TabPanel>

        <TabPanel value={state.currentTab} index={1}>
          <SuppliersTopRated
            topRated={data.topRated}
            onRateSupplier={actions.handleRateSupplier}
          />
        </TabPanel>

        <TabPanel value={state.currentTab} index={2}>
          <SuppliersStatistics
            statistics={data.statistics}
          />
        </TabPanel>
      </Box>

      {/* Create/Edit Supplier Dialog */}
      <SupplierFormDialog
        open={state.createDialogOpen || state.editDialogOpen}
        onClose={closeAllDialogs}
        supplier={state.selectedSupplier}
        isEdit={state.editDialogOpen}
      />

      {/* Rating Dialog */}
      <SupplierRatingDialog
        open={state.ratingDialogOpen}
        onClose={closeAllDialogs}
        supplier={state.selectedSupplier}
      />
    </Container>
  )
}

export default SuppliersPage