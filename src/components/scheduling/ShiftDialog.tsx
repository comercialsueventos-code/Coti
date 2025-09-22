import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  Typography,
  Chip,
  FormHelperText
} from '@mui/material'
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import moment from 'moment'
import { Employee, EmployeeShift } from '../../types'

interface ShiftDialogProps {
  open: boolean
  onClose: () => void
  shift: EmployeeShift | null
  employees: Employee[]
  selectedDate: Date
  selectedEmployeeId: number | null
  onSave: (shiftData: any) => void
  onDelete: (shiftId: number) => void
  viewMode?: 'by_employee' | 'by_event'
  eventResource?: any // For grouped event data
}

const ShiftDialog: React.FC<ShiftDialogProps> = ({
  open,
  onClose,
  shift,
  employees,
  selectedDate,
  selectedEmployeeId,
  onSave,
  onDelete,
  viewMode = 'by_employee',
  eventResource
}) => {
  const [formData, setFormData] = useState({
    employee_id: selectedEmployeeId || (shift?.employee_id ?? null),
    date: moment(selectedDate).format('YYYY-MM-DD'),
    shift_type: shift?.shift_type || 'full_day',
    status: shift?.status || 'available',
    notes: shift?.notes || ''
  })

  const [errors, setErrors] = useState<string[]>([])

  // Determinar si es de solo lectura (viene de cotización)
  const isReadOnly = shift?.quote != null || eventResource?.quote != null

  useEffect(() => {
    if (shift) {
      setFormData({
        employee_id: shift.employee_id,
        date: shift.date,
        shift_type: shift.shift_type,
        status: shift.status,
        notes: shift.notes || ''
      })
    } else {
      setFormData({
        employee_id: selectedEmployeeId || null,
        date: moment(selectedDate).format('YYYY-MM-DD'),
        shift_type: 'full_day',
        status: 'available',
        notes: ''
      })
    }
  }, [shift, selectedDate, selectedEmployeeId])

  const handleSubmit = () => {
    const validationErrors: string[] = []

    if (!formData.employee_id) {
      validationErrors.push('Debe seleccionar un empleado')
    }

    if (!formData.date) {
      validationErrors.push('Debe seleccionar una fecha')
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    onSave(formData)
  }

  const handleDelete = () => {
    if (shift && window.confirm('¿Está seguro de eliminar este turno?')) {
      onDelete(shift.id)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success'
      case 'booked': return 'error'
      case 'vacation': return 'info'
      case 'sick': return 'warning'
      case 'maintenance': return 'default'
      default: return 'default'
    }
  }

  const getDialogTitle = () => {
    if (viewMode === 'by_event' && eventResource?.quote) {
      return `📅 ${eventResource.quote.event_title || 'Evento'}`
    }
    if (shift) {
      return isReadOnly ? '📋 Ver Turno (Solo Lectura)' : 'Editar Turno'
    }
    return 'Nuevo Turno'
  }

  const renderEventView = () => {
    if (!eventResource?.quote) return null

    return (
      <Box sx={{ mb: 3 }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            🎯 {eventResource.quote.event_title || 'Evento sin título'}
          </Typography>
          <Typography variant="body2">
            <strong>Cotización:</strong> {eventResource.quote.quote_number}
          </Typography>
          <Typography variant="body2">
            <strong>Empleados asignados:</strong> {eventResource.employeeCount}
          </Typography>
        </Alert>

        <Typography variant="h6" gutterBottom>
          👥 Empleados Asignados:
        </Typography>
        
        {eventResource.shifts?.map((shift: any, index: number) => {
          const employee = employees.find(e => e.id === shift.employee_id)
          return (
            <Box key={shift.id} sx={{ 
              p: 2, 
              mb: 1, 
              border: '1px solid #e0e0e0', 
              borderRadius: 1,
              backgroundColor: '#f9f9f9'
            }}>
              <Typography variant="subtitle2">
                👤 {employee?.name || 'Empleado'} ({employee?.employee_type})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                📅 {moment(shift.date).format('DD/MM/YYYY')} - 
                🕐 {shift.shift_type === 'morning' ? '6:00 AM - 2:00 PM' : 
                    shift.shift_type === 'afternoon' ? '2:00 PM - 10:00 PM' : 
                    '6:00 AM - 10:00 PM'}
              </Typography>
              {shift.notes && (
                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                  📝 {shift.notes}
                </Typography>
              )}
            </Box>
          )
        })}
      </Box>
    )
  }

  const renderEmployeeView = () => {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
        <FormControl fullWidth required>
          <InputLabel>Empleado</InputLabel>
          <Select
            value={formData.employee_id || ''}
            onChange={(e) => setFormData({ ...formData, employee_id: Number(e.target.value) })}
            label="Empleado"
            disabled={isReadOnly}
          >
            {employees.filter(e => e.is_active).map(employee => (
              <MenuItem key={employee.id} value={employee.id}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>{employee.name}</span>
                  <Chip 
                    label={employee.employee_type} 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>
            {isReadOnly ? 'Empleado asignado desde cotización' : 'Seleccione el empleado para este turno'}
          </FormHelperText>
        </FormControl>

        <TextField
          fullWidth
          required
          type="date"
          label="Fecha"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          InputLabelProps={{ shrink: true }}
          helperText={isReadOnly ? 'Fecha del evento' : 'Fecha del turno'}
          disabled={isReadOnly}
        />

        <FormControl fullWidth required>
          <InputLabel>Tipo de Turno</InputLabel>
          <Select
            value={formData.shift_type}
            onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
            label="Tipo de Turno"
            disabled={isReadOnly}
          >
            <MenuItem value="morning">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🌅 Mañana (6:00 AM - 2:00 PM)
              </Box>
            </MenuItem>
            <MenuItem value="afternoon">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🌆 Tarde (2:00 PM - 10:00 PM)
              </Box>
            </MenuItem>
            <MenuItem value="full_day">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                ☀️ Día Completo (6:00 AM - 10:00 PM)
              </Box>
            </MenuItem>
          </Select>
          <FormHelperText>
            {isReadOnly ? 'Horario definido en la cotización' : 'Horario del turno'}
          </FormHelperText>
        </FormControl>

        <FormControl fullWidth required>
          <InputLabel>Estado</InputLabel>
          <Select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            label="Estado"
            disabled={isReadOnly}
          >
            <MenuItem value="available">
              <Chip label="Disponible" color="success" size="small" />
            </MenuItem>
            <MenuItem value="booked">
              <Chip label="Ocupado" color="error" size="small" />
            </MenuItem>
            <MenuItem value="vacation">
              <Chip label="Vacaciones" color="info" size="small" />
            </MenuItem>
            <MenuItem value="sick">
              <Chip label="Enfermo" color="warning" size="small" />
            </MenuItem>
            <MenuItem value="maintenance">
              <Chip label="Mantenimiento" color="default" size="small" />
            </MenuItem>
          </Select>
          <FormHelperText>
            {isReadOnly ? 'Estado automático desde cotización' : 'Estado del empleado para este turno'}
          </FormHelperText>
        </FormControl>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Notas"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder={isReadOnly ? "Notas del evento..." : "Notas adicionales sobre este turno..."}
          helperText={isReadOnly ? "Información del evento" : "Información adicional opcional"}
          disabled={isReadOnly}
        />

        {shift?.quote && (
          <Alert severity="info">
            <Typography variant="body2">
              <strong>🎯 Vinculado a cotización:</strong> {shift.quote.quote_number}
            </Typography>
            <Typography variant="caption">
              {shift.quote.event_title}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              💡 Este turno se actualiza automáticamente cuando se modifica la cotización
            </Typography>
          </Alert>
        )}
      </Box>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {getDialogTitle()}
        {isReadOnly && (
          <Chip 
            label="Solo Lectura" 
            color="warning" 
            size="small" 
            sx={{ ml: 2 }}
          />
        )}
      </DialogTitle>
      
      <DialogContent>
        {!isReadOnly && errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        {viewMode === 'by_event' ? renderEventView() : renderEmployeeView()}
      </DialogContent>

      <DialogActions>
        {!isReadOnly && shift && (
          <Button
            onClick={handleDelete}
            color="error"
            startIcon={<DeleteIcon />}
            sx={{ mr: 'auto' }}
          >
            Eliminar
          </Button>
        )}
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          {isReadOnly ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!isReadOnly && (
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            {shift ? 'Actualizar' : 'Crear'} Turno
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ShiftDialog