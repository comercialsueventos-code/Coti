import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Avatar
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material'
import { EmployeeShift } from '../../types'
import { useEmployeeSchedulingUtils } from '../../hooks/useEmployeeScheduling'

interface EmployeeShiftCardProps {
  shift: EmployeeShift
  showDate?: boolean
  compact?: boolean
}

const EmployeeShiftCard: React.FC<EmployeeShiftCardProps> = ({ 
  shift, 
  showDate = false, 
  compact = false 
}) => {
  const { formatShiftTimeRange, getStatusOptions } = useEmployeeSchedulingUtils()
  
  const statusOptions = getStatusOptions()
  const statusConfig = statusOptions.find(option => option.value === shift.status) || statusOptions[0]
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <Card 
      sx={{ 
        mb: 1, 
        borderLeft: 4, 
        borderLeftColor: `${statusConfig.color}.main`,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 2,
          transform: 'translateY(-1px)'
        }
      }}
    >
      <CardContent sx={{ py: compact ? 1 : 2, '&:last-child': { pb: compact ? 1 : 2 } }}>
        <Box display="flex" alignItems="center" gap={2}>
          {/* Employee Avatar */}
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            <PersonIcon />
          </Avatar>
          
          {/* Main Content */}
          <Box flex={1}>
            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
              <Typography variant="subtitle1" fontWeight="bold">
                {shift.employee?.name || `Empleado #${shift.employee_id}`}
              </Typography>
              <Chip 
                label={statusConfig.label}
                color={statusConfig.color as any}
                size="small"
                variant="outlined"
              />
            </Box>
            
            {/* Date (if requested) */}
            {showDate && (
              <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(shift.date)}
                </Typography>
              </Box>
            )}
            
            {/* Time Range with specific times */}
            <Box display="flex" alignItems="center" gap={0.5}>
              <TimeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatShiftTimeRange(shift)}
              </Typography>
              
              {/* Show shift type as secondary info */}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({shift.shift_type === 'morning' ? 'Mañana' : 
                  shift.shift_type === 'afternoon' ? 'Tarde' : 'Día Completo'})
              </Typography>
            </Box>
            
            {/* Quote reference if available */}
            {shift.quote && (
              <Typography variant="caption" color="primary" sx={{ mt: 0.5, display: 'block' }}>
                Cotización: {shift.quote.quote_number}
              </Typography>
            )}
            
            {/* Notes if available */}
            {shift.notes && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {shift.notes}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default EmployeeShiftCard