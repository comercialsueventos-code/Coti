import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  Alert
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { EmployeeCategory } from '../../types'
import { useCategoryForm } from './hooks/useCategoryForm'
import { TAB_LABELS } from '@/shared/constants'
import BasicInfoTab from './sections/BasicInfoTab'
import DefaultRatesTab from './sections/DefaultRatesTab'
import CertificationsTab from './sections/CertificationsTab'
import SkillsEquipmentTab from './sections/SkillsEquipmentTab'

interface EmployeeCategoryFormProps {
  open: boolean
  onClose: () => void
  category?: EmployeeCategory | null
  mode: 'create' | 'edit'
}

const EmployeeCategoryForm: React.FC<EmployeeCategoryFormProps> = ({
  open,
  onClose,
  category,
  mode
}) => {
  const {
    formData,
    errors,
    currentTab,
    setCurrentTab,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useCategoryForm({ open, onClose, category, mode })

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return (
          <BasicInfoTab
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
        )
      case 1:
        return (
          <DefaultRatesTab
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
        )
      case 2:
        return (
          <CertificationsTab
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
        )
      case 3:
        return (
          <SkillsEquipmentTab
            formData={formData}
            errors={errors}
            onInputChange={handleInputChange}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {mode === 'create' ? '➕ Crear Nueva Categoría' : `✏️ Editar ${category?.name}`}
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Error Messages */}
        {Object.keys(errors).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {Object.values(errors).join(', ')}
          </Alert>
        )}

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab icon={<SettingsIcon />} label={TAB_LABELS[0].label} />
            <Tab icon={<PaletteIcon />} label={TAB_LABELS[1].label} />
            <Tab icon={<SecurityIcon />} label={TAB_LABELS[2].label} />
            <Tab icon={<ScheduleIcon />} label={TAB_LABELS[3].label} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ mt: 2 }}>
          {renderTabContent()}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} startIcon={<CancelIcon />}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={isLoading}
        >
          {mode === 'create' ? 'Crear Categoría' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EmployeeCategoryForm