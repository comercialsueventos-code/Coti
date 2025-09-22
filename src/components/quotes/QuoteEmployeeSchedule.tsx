import React from 'react'
import {
  Box,
  Typography,
  Paper,
  Alert,
  Button,
  Divider
} from '@mui/material'
import {
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { useAllShiftsInRange } from '../../hooks/useEmployeeScheduling'
import EmployeeShiftsList from '../scheduling/EmployeeShiftsList'
import { Quote } from '../../types'

interface QuoteEmployeeScheduleProps {
  quote: Quote
  showRefreshButton?: boolean
}

const QuoteEmployeeSchedule: React.FC<QuoteEmployeeScheduleProps> = ({ 
  quote, 
  showRefreshButton = true 
}) => {
  // Calculate date range for the quote
  const startDate = quote.event_date
  const endDate = quote.event_end_date || quote.event_date
  
  // Fetch shifts for this quote's date range
  const { 
    data: allShifts = [], 
    isLoading, 
    error, 
    refetch 
  } = useAllShiftsInRange({
    date_from: startDate,
    date_to: endDate
  })
  
  // Filter shifts that belong to this quote
  const quoteShifts = allShifts.filter(shift => shift.quote_id === quote.id)
  
  if (isLoading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <ScheduleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Cargando programación de empleados...
        </Typography>
      </Paper>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Error al cargar la programación: {error.message}
        </Typography>
        {showRefreshButton && (
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={() => refetch()}
            size="small"
            sx={{ mt: 1 }}
          >
            Reintentar
          </Button>
        )}
      </Alert>
    )
  }

  const isMultiDay = new Date(endDate) > new Date(startDate)

  return (
    <Paper sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <ScheduleIcon color="primary" />
          <Typography variant="h6">
            Programación de Empleados
          </Typography>
        </Box>
        
        {showRefreshButton && (
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={() => refetch()}
            size="small"
            variant="outlined"
          >
            Actualizar
          </Button>
        )}
      </Box>

      {/* Quote info */}
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          <strong>Cotización:</strong> {quote.quote_number} - {quote.event_title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Fecha:</strong> {isMultiDay 
            ? `${new Date(startDate).toLocaleDateString('es-CO')} - ${new Date(endDate).toLocaleDateString('es-CO')}`
            : new Date(startDate).toLocaleDateString('es-CO')
          }
        </Typography>
        {quote.event_start_time && quote.event_end_time && (
          <Typography variant="body2" color="text.secondary">
            <strong>Horario general:</strong> {quote.event_start_time.slice(0, 5)} - {quote.event_end_time.slice(0, 5)}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Shifts display */}
      {quoteShifts.length === 0 ? (
        <Alert severity="info">
          <Typography variant="body2">
            No hay empleados programados para esta cotización.
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Los empleados se programan automáticamente cuando se guarda una cotización con empleados asignados.
          </Typography>
        </Alert>
      ) : (
        <EmployeeShiftsList
          shifts={quoteShifts}
          title=""
          groupByDate={isMultiDay}
          showDate={!isMultiDay}
          compact={false}
        />
      )}
      
      {/* Additional info for multi-day events */}
      {isMultiDay && quoteShifts.length > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Evento Multi-día:</strong> Los horarios específicos de cada día se muestran individualmente.
            Cada empleado puede tener diferentes horarios por día según la programación del evento.
          </Typography>
        </Alert>
      )}
    </Paper>
  )
}

export default QuoteEmployeeSchedule