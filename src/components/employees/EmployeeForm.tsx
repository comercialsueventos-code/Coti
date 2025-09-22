import React from 'react'
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { useEmployeeForm } from './hooks/useEmployeeForm'
import { EmployeeFormProps } from './types'
import ScrollableDialog from '../common/ScrollableDialog'
import EmployeeBasicInfo from './sections/EmployeeBasicInfo'
import CategoryRatesDisplay from './sections/CategoryRatesDisplay'
import EmployeeArl from './sections/EmployeeArl'
import EmployeeCertifications from './sections/EmployeeCertifications'

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  open,
  onClose,
  employee,
  mode
}) => {
  const {
    formData,
    errors,
    isLoading,
    handleFormDataChange,
    handleSubmit
  } = useEmployeeForm(open, employee, mode, onClose)

  return (
    <ScrollableDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'create' ? '👤 Crear Nuevo Empleado' : `✏️ Editar ${employee?.name}`}
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Información básica */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              📋 Información Básica
            </Typography>
          </Grid>
          
          <EmployeeBasicInfo
            formData={formData}
            onFormDataChange={handleFormDataChange}
            errors={errors}
          />

          <CategoryRatesDisplay
            formData={formData}
            onFormDataChange={handleFormDataChange}
            errors={errors}
          />

          <EmployeeArl
            formData={formData}
            onFormDataChange={handleFormDataChange}
            errors={errors}
          />

          <EmployeeCertifications
            formData={formData}
            onFormDataChange={handleFormDataChange}
            errors={errors}
          />
        </Grid>
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
          {mode === 'create' ? 'Crear Empleado' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </ScrollableDialog>
  )
}

export default EmployeeForm