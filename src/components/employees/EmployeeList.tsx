import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Grid,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { useEmployees, useDeleteEmployee, useEmployeeUtils } from '../../hooks/useEmployees'
import { EmployeeFilters } from '../../services/employees.service'
import { Employee } from '../../types'

interface EmployeeListProps {
  onEditEmployee?: (employee: Employee) => void
  onCreateEmployee?: () => void
  showActions?: boolean
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  onEditEmployee,
  onCreateEmployee,
  showActions = true
}) => {
  const [filters, setFilters] = useState<EmployeeFilters>({ is_active: true })
  const [searchTerm, setSearchTerm] = useState('')
  
  const { data: employees = [], isLoading, error } = useEmployees(filters)
  const deleteEmployee = useDeleteEmployee()
  const {
    getEmployeeTypeDisplayName,
    getEmployeeTypeIcon,
    formatHourlyRate,
    formatPhoneNumber,
    calculateAverageRate
  } = useEmployeeUtils()

  // Filtrar empleados por término de búsqueda local
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.identification_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteEmployee = async (employee: Employee) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${employee.name}?`)) {
      try {
        await deleteEmployee.mutateAsync(employee.id)
      } catch (error) {
        console.error('Error al eliminar empleado:', error)
      }
    }
  }

  const getEmployeeStatusColor = (employee: Employee) => {
    if (!employee.is_active) return 'error'
    if (employee.has_arl) return 'success'
    return 'warning'
  }

  const getEmployeeStatusText = (employee: Employee) => {
    if (!employee.is_active) return 'Inactivo'
    if (employee.has_arl) return 'Activo con ARL'
    return 'Activo sin ARL'
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        Error al cargar empleados: {error.message}
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header con controles */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            👥 Empleados ({filteredEmployees.length})
          </Typography>
          {showActions && onCreateEmployee && (
            <Button
              variant="contained"
              onClick={onCreateEmployee}
              startIcon={<BadgeIcon />}
            >
              Nuevo Empleado
            </Button>
          )}
        </Box>

        {/* Filtros */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre, email o cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Empleado</InputLabel>
              <Select
                value={filters.employee_type || ''}
                label="Tipo de Empleado"
                onChange={(e) => setFilters({ ...filters, employee_type: e.target.value as any })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="operario">Operario</MenuItem>
                <MenuItem value="chef">Chef</MenuItem>
                <MenuItem value="mesero">Mesero</MenuItem>
                <MenuItem value="supervisor">Supervisor</MenuItem>
                <MenuItem value="conductor">Conductor</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.is_active !== undefined ? filters.is_active.toString() : ''}
                label="Estado"
                onChange={(e) => {
                  const value = e.target.value
                  setFilters({
                    ...filters,
                    is_active: value === '' ? undefined : value === 'true'
                  })
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Activos</MenuItem>
                <MenuItem value="false">Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>ARL</InputLabel>
              <Select
                value={filters.has_arl !== undefined ? filters.has_arl.toString() : ''}
                label="ARL"
                onChange={(e) => {
                  const value = e.target.value
                  setFilters({
                    ...filters,
                    has_arl: value === '' ? undefined : value === 'true'
                  })
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Con ARL</MenuItem>
                <MenuItem value="false">Sin ARL</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Lista de empleados */}
      {filteredEmployees.length === 0 ? (
        <Alert severity="info">
          No se encontraron empleados con los filtros aplicados.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredEmployees.map((employee) => (
            <Grid item xs={12} md={6} lg={4} key={employee.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Header con avatar y nombre */}
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      {getEmployeeTypeIcon(employee.employee_type)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" component="div">
                        {employee.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getEmployeeTypeDisplayName(employee.employee_type)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Estado */}
                  <Box mb={2}>
                    <Chip
                      label={getEmployeeStatusText(employee)}
                      color={getEmployeeStatusColor(employee)}
                      size="small"
                    />
                  </Box>

                  {/* Información de contacto */}
                  <Stack spacing={1} mb={2}>
                    {employee.phone && (
                      <Box display="flex" alignItems="center">
                        <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {formatPhoneNumber(employee.phone)}
                        </Typography>
                      </Box>
                    )}
                    
                    {employee.email && (
                      <Box display="flex" alignItems="center">
                        <EmailIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {employee.email}
                        </Typography>
                      </Box>
                    )}
                    
                    {employee.identification_number && (
                      <Box display="flex" alignItems="center">
                        <BadgeIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          {employee.identification_number}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  {/* Tarifas horarias */}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    💰 Tarifas Horarias:
                  </Typography>
                  {employee.category ? (
                    <Box>
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                        📋 Desde categoría: {employee.category.name}
                      </Typography>
                      <Box component="ul" sx={{ fontSize: '0.8rem', margin: 0, paddingLeft: 2 }}>
                        {employee.category.default_hourly_rates.map((rate, index) => (
                          <li key={index}>
                            {rate.min_hours}h - {rate.max_hours ? `${rate.max_hours}h` : '∞'}: {formatHourlyRate(rate.rate)}
                          </li>
                        ))}
                      </Box>
                    </Box>
                  ) : employee.hourly_rates ? (
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        📝 Tarifas individuales
                      </Typography>
                      <Box component="ul" sx={{ fontSize: '0.8rem', margin: 0, paddingLeft: 2 }}>
                        {Array.isArray(employee.hourly_rates) ? (
                          employee.hourly_rates.map((rate, index) => (
                            <li key={index}>
                              {rate.min_hours}h - {rate.max_hours ? `${rate.max_hours}h` : '∞'}: {formatHourlyRate(rate.rate)}
                            </li>
                          ))
                        ) : (
                          <>
                            <li>1-4h: {formatHourlyRate(employee.hourly_rates['1-4h'] || 0)}</li>
                            <li>4-8h: {formatHourlyRate(employee.hourly_rates['4-8h'] || 0)}</li>
                            <li>8h+: {formatHourlyRate(employee.hourly_rates['8h+'] || 0)}</li>
                          </>
                        )}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="caption" color="error">
                      ⚠️ Sin tarifas configuradas
                    </Typography>
                  )}

                  {/* Certificaciones */}
                  {employee.certifications && employee.certifications.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        📜 Certificaciones:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {employee.certifications.map((cert, index) => (
                          <Chip
                            key={index}
                            label={cert}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>

                {/* Acciones */}
                {showActions && (
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Box>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => onEditEmployee?.(employee)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteEmployee(employee)}
                        disabled={deleteEmployee.isPending}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                    
                    <Button
                      size="small"
                      startIcon={<ScheduleIcon />}
                      variant="outlined"
                      disabled
                    >
                      Horarios
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default EmployeeList