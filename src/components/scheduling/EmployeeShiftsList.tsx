import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  Alert
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material'
import { EmployeeShift } from '../../types'
import EmployeeShiftCard from './EmployeeShiftCard'

interface EmployeeShiftsListProps {
  shifts: EmployeeShift[]
  title?: string
  groupByDate?: boolean
  showDate?: boolean
  compact?: boolean
}

const EmployeeShiftsList: React.FC<EmployeeShiftsListProps> = ({ 
  shifts, 
  title = "Turnos de Empleados",
  groupByDate = false,
  showDate = true,
  compact = false
}) => {
  
  if (shifts.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No hay turnos programados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Los turnos aparecerán aquí cuando se asignen empleados a eventos
        </Typography>
      </Paper>
    )
  }

  // Group shifts by date if requested
  const groupedShifts = groupByDate 
    ? shifts.reduce((groups, shift) => {
        const date = shift.date
        if (!groups[date]) {
          groups[date] = []
        }
        groups[date].push(shift)
        return groups
      }, {} as Record<string, EmployeeShift[]>)
    : { 'all': shifts }

  const formatDateHeader = (dateString: string) => {
    if (dateString === 'all') return null
    
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const isTomorrow = date.toDateString() === tomorrow.toDateString()
    
    let label = date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    if (isToday) label += ' (Hoy)'
    if (isTomorrow) label += ' (Mañana)'
    
    return label
  }

  const getShiftSummary = (dayShifts: EmployeeShift[]) => {
    const totalShifts = dayShifts.length
    const bookedShifts = dayShifts.filter(s => s.status === 'booked').length
    const availableShifts = dayShifts.filter(s => s.status === 'available').length
    
    return { totalShifts, bookedShifts, availableShifts }
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TimeIcon color="primary" />
        <Typography variant="h6" component="h2">
          {title}
        </Typography>
        <Chip 
          label={`${shifts.length} turno${shifts.length !== 1 ? 's' : ''}`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Shifts grouped by date */}
      {Object.entries(groupedShifts).map(([dateKey, dayShifts], index) => {
        const dateHeader = formatDateHeader(dateKey)
        const summary = getShiftSummary(dayShifts)
        
        return (
          <Box key={dateKey} mb={3}>
            {/* Date header for grouped view */}
            {dateHeader && (
              <Box mb={2}>
                <Typography variant="h6" color="text.primary" gutterBottom>
                  {dateHeader}
                </Typography>
                <Box display="flex" gap={1} mb={1}>
                  <Chip 
                    label={`${summary.totalShifts} total`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    label={`${summary.bookedShifts} ocupados`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip 
                    label={`${summary.availableShifts} disponibles`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Box>
                <Divider sx={{ mb: 2 }} />
              </Box>
            )}

            {/* Shifts for this date */}
            {dayShifts.map((shift) => (
              <EmployeeShiftCard
                key={shift.id}
                shift={shift}
                showDate={!groupByDate && showDate}
                compact={compact}
              />
            ))}
          </Box>
        )
      })}

      {/* Summary for multi-day view */}
      {groupByDate && Object.keys(groupedShifts).length > 1 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Resumen total:</strong> {shifts.length} turnos programados en {Object.keys(groupedShifts).length} días
          </Typography>
        </Alert>
      )}
    </Box>
  )
}

export default EmployeeShiftsList