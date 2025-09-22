import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material'
import { useScheduleMaintenance } from '../../../hooks/useMachinery'
import { MaintenanceDialogProps } from '../types'

const MaintenanceScheduleDialog: React.FC<MaintenanceDialogProps> = ({
  open,
  onClose,
  machinery
}) => {
  const [maintenanceDate, setMaintenanceDate] = useState('')
  const scheduleMaintenance = useScheduleMaintenance()

  const handleSchedule = async () => {
    if (!machinery || !maintenanceDate) return

    try {
      await scheduleMaintenance.mutateAsync({
        machineryId: machinery.id,
        maintenanceDate
      })
      onClose()
      setMaintenanceDate('')
    } catch (error) {
      console.error('Error scheduling maintenance:', error)
    }
  }

  const handleClose = () => {
    onClose()
    setMaintenanceDate('')
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Programar Mantenimiento - {machinery?.name}
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Fecha de Mantenimiento"
          type="date"
          value={maintenanceDate}
          onChange={(e) => setMaintenanceDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          onClick={handleSchedule}
          variant="contained"
          disabled={!maintenanceDate || scheduleMaintenance.isPending}
        >
          Programar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MaintenanceScheduleDialog