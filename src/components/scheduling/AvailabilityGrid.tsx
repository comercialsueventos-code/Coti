import React, { useMemo } from 'react'
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material'
import {
  EventAvailable as AvailableIcon,
  EventBusy as BusyIcon,
  Sick as SickIcon,
  FlightTakeoff as VacationIcon,
  Build as MaintenanceIcon,
  Add as AddIcon
} from '@mui/icons-material'
import moment from 'moment'
import { Employee, EmployeeShift } from '../../types'

interface AvailabilityGridProps {
  employees: Employee[]
  shifts: EmployeeShift[]
  selectedDate: Date
  onCellClick: (employee: Employee, date: Date) => void
}

const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  employees,
  shifts,
  selectedDate,
  onCellClick
}) => {
  // Generate days for the current week or month view
  const dates = useMemo(() => {
    const start = moment(selectedDate).startOf('week')
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(start.clone().add(i, 'days'))
    }
    return days
  }, [selectedDate])

  // Create a map for quick shift lookup
  const shiftMap = useMemo(() => {
    const map = new Map<string, EmployeeShift[]>()
    shifts.forEach(shift => {
      const key = `${shift.employee_id}-${shift.date}`
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(shift)
    })
    return map
  }, [shifts])

  const getShiftStatus = (employeeId: number, date: moment.Moment) => {
    const key = `${employeeId}-${date.format('YYYY-MM-DD')}`
    const dayShifts = shiftMap.get(key) || []
    
    if (dayShifts.length === 0) return null
    
    // Return the most restrictive status if multiple shifts
    const statusPriority = ['booked', 'sick', 'vacation', 'maintenance', 'available']
    for (const status of statusPriority) {
      if (dayShifts.some(s => s.status === status)) {
        return { status, shifts: dayShifts }
      }
    }
    return null
  }

  const getStatusIcon = (status: string | null) => {
    if (!status) return <AddIcon fontSize="small" color="action" />
    
    switch (status) {
      case 'available':
        return <AvailableIcon fontSize="small" color="success" />
      case 'booked':
        return <BusyIcon fontSize="small" color="error" />
      case 'vacation':
        return <VacationIcon fontSize="small" color="info" />
      case 'sick':
        return <SickIcon fontSize="small" color="warning" />
      case 'maintenance':
        return <MaintenanceIcon fontSize="small" color="action" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string | null) => {
    if (!status) return 'default'
    
    switch (status) {
      case 'available': return 'success'
      case 'booked': return 'error'
      case 'vacation': return 'info'
      case 'sick': return 'warning'
      case 'maintenance': return 'default'
      default: return 'default'
    }
  }

  const getShiftTypeLabel = (shifts: EmployeeShift[]) => {
    const types = shifts.map(s => {
      switch (s.shift_type) {
        case 'morning': return 'M'
        case 'afternoon': return 'T'
        case 'full_day': return 'C'
        default: return '?'
      }
    })
    return types.join('/')
  }

  const getCellContent = (employee: Employee, date: moment.Moment) => {
    const shiftInfo = getShiftStatus(employee.id, date)
    const isToday = date.isSame(moment(), 'day')
    const isPast = date.isBefore(moment(), 'day')
    
    return (
      <TableCell
        key={date.format('YYYY-MM-DD')}
        align="center"
        sx={{
          cursor: 'pointer',
          backgroundColor: isToday ? 'action.hover' : isPast ? 'grey.50' : 'inherit',
          '&:hover': {
            backgroundColor: 'action.selected'
          },
          position: 'relative',
          minWidth: 120
        }}
        onClick={() => onCellClick(employee, date.toDate())}
      >
        {shiftInfo ? (
          <Box>
            <Chip
              icon={getStatusIcon(shiftInfo.status)}
              label={getShiftTypeLabel(shiftInfo.shifts)}
              size="small"
              color={getStatusColor(shiftInfo.status) as any}
              variant={shiftInfo.status === 'available' ? 'outlined' : 'filled'}
            />
            {shiftInfo.shifts[0]?.quote && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {shiftInfo.shifts[0].quote.quote_number}
              </Typography>
            )}
          </Box>
        ) : (
          <Tooltip title="Agregar turno">
            <IconButton size="small" color="primary">
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </TableCell>
    )
  }

  // Calculate statistics
  const dailyStats = useMemo(() => {
    return dates.map(date => {
      const dateStr = date.format('YYYY-MM-DD')
      const dayShifts = shifts.filter(s => s.date === dateStr)
      
      return {
        date: dateStr,
        available: dayShifts.filter(s => s.status === 'available').length,
        booked: dayShifts.filter(s => s.status === 'booked').length,
        total: dayShifts.length
      }
    })
  }, [dates, shifts])

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 150, fontWeight: 'bold' }}>
                Empleado
              </TableCell>
              {dates.map(date => (
                <TableCell 
                  key={date.format('YYYY-MM-DD')} 
                  align="center"
                  sx={{ 
                    minWidth: 120,
                    fontWeight: date.isSame(moment(), 'day') ? 'bold' : 'normal'
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {date.format('ddd')}
                    </Typography>
                    <Typography variant="body2">
                      {date.format('DD/MM')}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map(employee => (
              <TableRow key={employee.id} hover>
                <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                  <Box>
                    <Typography variant="body2">{employee.name}</Typography>
                    <Chip 
                      label={employee.employee_type} 
                      size="small" 
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </TableCell>
                {dates.map(date => getCellContent(employee, date))}
              </TableRow>
            ))}
            
            {/* Statistics row */}
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>
                Resumen
              </TableCell>
              {dailyStats.map(stat => (
                <TableCell key={stat.date} align="center">
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Chip
                      size="small"
                      label={`${stat.available} disp`}
                      color="success"
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={`${stat.booked} ocup`}
                      color="error"
                      variant="outlined"
                    />
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Legend */}
      <Box sx={{ p: 2, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <AvailableIcon fontSize="small" color="success" />
          <Typography variant="caption">Disponible</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <BusyIcon fontSize="small" color="error" />
          <Typography variant="caption">Ocupado</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <VacationIcon fontSize="small" color="info" />
          <Typography variant="caption">Vacaciones</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <SickIcon fontSize="small" color="warning" />
          <Typography variant="caption">Enfermo</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" fontWeight="bold">M:</Typography>
          <Typography variant="caption">Mañana</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" fontWeight="bold">T:</Typography>
          <Typography variant="caption">Tarde</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" fontWeight="bold">C:</Typography>
          <Typography variant="caption">Completo</Typography>
        </Box>
      </Box>
    </Paper>
  )
}

export default AvailabilityGrid