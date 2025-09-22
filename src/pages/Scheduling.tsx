import React, { useState, useMemo } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch
} from '@mui/material'
import {
  CalendarMonth as CalendarIcon,
  ViewWeek as WeekIcon,
  People as PeopleIcon,
  EventAvailable as AvailableIcon,
  EventBusy as BusyIcon,
  Sick as SickIcon,
  FlightTakeoff as VacationIcon,
  Build as MaintenanceIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  Today as TodayIcon,
  Event as EventIcon
} from '@mui/icons-material'
import { Calendar, momentLocalizer, View, Event } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'moment/locale/es'
import { 
  useAllShiftsInRange, 
  useEmployeeAvailability,
  useCreateShift,
  useUpdateShift,
  useDeleteShift
} from '../hooks/useEmployeeScheduling'
import { useEmployees } from '../hooks/useEmployees'
import { Employee, EmployeeShift } from '../types'
import ShiftDialog from '../components/scheduling/ShiftDialog'
import AvailabilityGrid from '../components/scheduling/AvailabilityGrid'

// Configurar moment en español
moment.locale('es')
const localizer = momentLocalizer(moment)

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scheduling-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

// Componente principal
const Scheduling: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [calendarView, setCalendarView] = useState<View>('month')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<EmployeeShift | null>(null)
  const [selectedEventResource, setSelectedEventResource] = useState<any>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'by_employee' | 'by_event'>('by_employee')

  // Hooks
  const { data: employees = [] } = useEmployees()
  const { data: shifts = [] } = useAllShiftsInRange({
    date_from: moment(selectedDate).startOf('month').format('YYYY-MM-DD'),
    date_to: moment(selectedDate).endOf('month').format('YYYY-MM-DD'),
    employee_id: selectedEmployeeId || undefined
  })
  const createShift = useCreateShift()
  const updateShift = useUpdateShift()
  const deleteShift = useDeleteShift()

  // Funciones auxiliares (DEBE estar antes de useMemo)
  const getShiftTypeLabel = (type: string) => {
    switch (type) {
      case 'morning': return 'Mañana'
      case 'afternoon': return 'Tarde'
      case 'full_day': return 'Día Completo'
      default: return type
    }
  }

  // Convertir shifts a eventos del calendario
  const calendarEvents = useMemo(() => {    
    const filteredShifts = shifts.filter(shift => filterStatus === 'all' || shift.status === filterStatus)
    
    if (viewMode === 'by_employee') {
      // Vista por empleado - mostrar empleados y sus turnos
      return filteredShifts.map(shift => {
        const employee = employees.find(e => e.id === shift.employee_id)
        const shiftDate = moment(shift.date)
        let start, end

        switch (shift.shift_type) {
          case 'morning':
            start = shiftDate.clone().hour(6).minute(0)
            end = shiftDate.clone().hour(14).minute(0)
            break
          case 'afternoon':
            start = shiftDate.clone().hour(14).minute(0)
            end = shiftDate.clone().hour(22).minute(0)
            break
          case 'full_day':
          default:
            start = shiftDate.clone().hour(6).minute(0)
            end = shiftDate.clone().hour(22).minute(0)
            break
        }

        // Enhanced title with smart information
        let title = `${employee?.name || 'Empleado'} - ${getShiftTypeLabel(shift.shift_type)}`
        
        if (shift.quote) {
          title = `🎯 ${employee?.name} - ${shift.quote.event_title || 'Evento'}`
        } else if (shift.status === 'available') {
          title = `✅ ${employee?.name} - Disponible`
        }

        return {
          id: shift.id,
          title,
          start: start.toDate(),
          end: end.toDate(),
          resource: shift,
          employee: employee
        }
      })
    } else {
      // Vista por evento - agrupar por eventos/cotizaciones
      const eventGroups = new Map()
      
      filteredShifts.forEach(shift => {
        if (shift.quote) {
          const eventKey = `event_${shift.quote.id}`
          if (!eventGroups.has(eventKey)) {
            eventGroups.set(eventKey, {
              quote: shift.quote,
              shifts: [],
              employees: new Set()
            })
          }
          eventGroups.get(eventKey).shifts.push(shift)
          
          const employee = employees.find(e => e.id === shift.employee_id)
          if (employee) {
            eventGroups.get(eventKey).employees.add(employee.name)
          }
        } else {
          // Turnos sin evento - mostrar individualmente
          const employee = employees.find(e => e.id === shift.employee_id)
          const shiftDate = moment(shift.date)
          let start, end

          switch (shift.shift_type) {
            case 'morning':
              start = shiftDate.clone().hour(6).minute(0)
              end = shiftDate.clone().hour(14).minute(0)
              break
            case 'afternoon':
              start = shiftDate.clone().hour(14).minute(0)
              end = shiftDate.clone().hour(22).minute(0)
              break
            case 'full_day':
            default:
              start = shiftDate.clone().hour(6).minute(0)
              end = shiftDate.clone().hour(22).minute(0)
              break
          }

          eventGroups.set(`shift_${shift.id}`, {
            quote: null,
            shifts: [shift],
            employees: new Set([employee?.name || 'Empleado']),
            start: start.toDate(),
            end: end.toDate()
          })
        }
      })

      // Convertir grupos a eventos del calendario
      return Array.from(eventGroups.values()).map(group => {
        if (group.quote) {
          // Evento con cotización
          const startDate = moment(Math.min(...group.shifts.map(s => new Date(s.date).getTime())))
          const endDate = moment(Math.max(...group.shifts.map(s => new Date(s.date).getTime())))
          
          return {
            id: `event_${group.quote.id}`,
            title: `🎯 ${group.quote.event_title || 'Evento'} (${group.employees.size} empleados)`,
            start: startDate.hour(6).minute(0).toDate(),
            end: endDate.hour(22).minute(0).toDate(),
            resource: {
              type: 'event',
              quote: group.quote,
              shifts: group.shifts,
              employeeCount: group.employees.size,
              employees: Array.from(group.employees)
            }
          }
        } else {
          // Turno individual sin evento
          const shift = group.shifts[0]
          const employee = employees.find(e => e.id === shift.employee_id)
          
          let title = `${employee?.name || 'Empleado'} - ${getShiftTypeLabel(shift.shift_type)}`
          if (shift.status === 'available') {
            title = `✅ ${employee?.name} - Disponible`
          }

          return {
            id: `shift_${shift.id}`,
            title,
            start: group.start,
            end: group.end,
            resource: shift,
            employee: employee
          }
        }
      })
    }
  }, [shifts, employees, filterStatus, viewMode])

  // Funciones auxiliares adicionales
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <AvailableIcon color="success" />
      case 'booked': return <BusyIcon color="error" />
      case 'vacation': return <VacationIcon color="info" />
      case 'sick': return <SickIcon color="warning" />
      case 'maintenance': return <MaintenanceIcon color="action" />
      default: return null
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

  // Handlers
  const handleSelectSlot = (slotInfo: any) => {
    setSelectedDate(slotInfo.start)
    setSelectedShift(null)
    setShiftDialogOpen(true)
  }

  const handleSelectEvent = (event: any) => {
    if (viewMode === 'by_event' && event.resource.type === 'event') {
      // Vista por evento - abrir diálogo de evento
      setSelectedShift(null)
      setSelectedEventResource(event.resource)
      setShiftDialogOpen(true)
    } else {
      // Vista por empleado - abrir diálogo de turno individual
      setSelectedShift(event.resource)
      setSelectedEventResource(null)
      setShiftDialogOpen(true)
    }
  }

  const handleSaveShift = async (shiftData: any) => {
    try {
      if (selectedShift) {
        await updateShift.mutateAsync({
          id: selectedShift.id,
          ...shiftData
        })
      } else {
        await createShift.mutateAsync(shiftData)
      }
      setShiftDialogOpen(false)
      setSelectedShift(null)
    } catch (error) {
      console.error('Error saving shift:', error)
    }
  }

  const handleDeleteShift = async (shiftId: number) => {
    try {
      await deleteShift.mutateAsync(shiftId)
      setShiftDialogOpen(false)
      setSelectedShift(null)
    } catch (error) {
      console.error('Error deleting shift:', error)
    }
  }

  // Estilos personalizados para eventos
  const eventStyleGetter = (event: any) => {
    if (viewMode === 'by_event' && event.resource.type === 'event') {
      // Eventos agrupados - usar color especial
      return {
        style: {
          backgroundColor: '#9c27b0', // Purple for grouped events
          borderRadius: '5px',
          opacity: 0.9,
          color: 'white',
          border: '2px solid #673ab7',
          display: 'block',
          fontWeight: 'bold'
        }
      }
    }
    
    const status = event.resource.status || 'default'
    let backgroundColor = '#3174ad'
    
    switch (status) {
      case 'available':
        backgroundColor = '#4caf50'
        break
      case 'booked':
        backgroundColor = '#f44336'
        break
      case 'vacation':
        backgroundColor = '#2196f3'
        break
      case 'sick':
        backgroundColor = '#ff9800'
        break
      case 'maintenance':
        backgroundColor = '#9e9e9e'
        break
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    }
  }

  // Estadísticas
  const stats = useMemo(() => {
    const today = moment().format('YYYY-MM-DD')
    const todayShifts = shifts.filter(s => s.date === today)
    
    return {
      totalEmployees: employees.filter(e => e.is_active).length,
      availableToday: todayShifts.filter(s => s.status === 'available').length,
      bookedToday: todayShifts.filter(s => s.status === 'booked').length,
      onVacation: shifts.filter(s => s.status === 'vacation').length,
      totalShifts: shifts.length
    }
  }, [employees, shifts])

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          📅 Gestión de Turnos y Disponibilidad Ultra-Inteligente
        </Typography>
        
        {/* Smart Booking Status */}
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          icon={<EventIcon />}
        >
          <Typography variant="body2">
            <strong>🤖 Sistema Inteligente Activo:</strong> Los empleados se reservan automáticamente al crear cotizaciones. 
            Las reservas se liberan automáticamente al rechazar o cancelar cotizaciones.
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
            Los eventos con 🎯 indican reservas automáticas de cotizaciones. Los ✅ son disponibilidades manuales.
          </Typography>
        </Alert>
        
        {/* Estadísticas rápidas */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <PeopleIcon color="primary" />
                <Typography variant="h4">{stats.totalEmployees}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Empleados
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <AvailableIcon color="success" />
                <Typography variant="h4">{stats.availableToday}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Disponibles Hoy
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <BusyIcon color="error" />
                <Typography variant="h4">{stats.bookedToday}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Ocupados Hoy
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <VacationIcon color="info" />
                <Typography variant="h4">{stats.onVacation}</Typography>
                <Typography variant="caption" color="text.secondary">
                  En Vacaciones
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <CalendarIcon color="action" />
                <Typography variant="h4">{stats.totalShifts}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Turnos del Mes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Controles y filtros */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Empleado</InputLabel>
                <Select
                  value={selectedEmployeeId || ''}
                  onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : null)}
                  label="Empleado"
                >
                  <MenuItem value="">
                    <em>Todos los empleados</em>
                  </MenuItem>
                  {employees.filter(e => e.is_active).map(employee => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.employee_type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Estado"
                >
                  <MenuItem value="all">Todos los estados</MenuItem>
                  <MenuItem value="available">Disponible</MenuItem>
                  <MenuItem value="booked">Ocupado</MenuItem>
                  <MenuItem value="vacation">Vacaciones</MenuItem>
                  <MenuItem value="sick">Enfermo</MenuItem>
                  <MenuItem value="maintenance">Mantenimiento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2.4}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Ir a fecha"
                value={moment(selectedDate).format('YYYY-MM-DD')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2.4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={viewMode === 'by_event'}
                    onChange={(e) => setViewMode(e.target.checked ? 'by_event' : 'by_employee')}
                    size="small"
                  />
                }
                label={
                  <Typography variant="body2">
                    {viewMode === 'by_employee' ? '👤 Por Empleado' : '📅 Por Evento'}
                  </Typography>
                }
              />
            </Grid>
            <Grid item xs={12} md={2.4}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setSelectedShift(null)
                    setShiftDialogOpen(true)
                  }}
                  fullWidth
                >
                  Nuevo Turno
                </Button>
                <Tooltip title="Ir a hoy">
                  <IconButton 
                    color="primary"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    <TodayIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs de vistas */}
        <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Calendario" icon={<CalendarIcon />} iconPosition="start" />
            <Tab label="Vista de Disponibilidad" icon={<WeekIcon />} iconPosition="start" />
            <Tab label="Resumen por Empleado" icon={<PeopleIcon />} iconPosition="start" />
          </Tabs>
        </Paper>

        {/* Leyenda de vista */}
        {tabValue === 0 && (
          <Alert severity="info" sx={{ mt: 2, mb: 0 }}>
            <Typography variant="body2">
              <strong>Vista actual:</strong> {viewMode === 'by_employee' ? '👤 Por Empleado' : '📅 Por Evento'} • 
              {viewMode === 'by_employee' 
                ? ' Muestra turnos individuales de cada empleado'
                : ' Agrupa empleados por evento/cotización'
              }
              {viewMode === 'by_event' && (
                <> • <span style={{ background: '#9c27b0', color: 'white', padding: '2px 6px', borderRadius: '3px', marginLeft: '4px' }}>
                  Eventos agrupados
                </span></>
              )}
            </Typography>
          </Alert>
        )}

        {/* Vista de Calendario */}
        <TabPanel value={tabValue} index={0}>
          <Paper sx={{ p: 2, height: 600 }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              date={selectedDate}
              onNavigate={(date) => setSelectedDate(date)}
              view={calendarView}
              onView={(view) => setCalendarView(view)}
              views={['month', 'week', 'day', 'agenda']}
              eventPropGetter={eventStyleGetter}
              messages={{
                today: 'Hoy',
                previous: 'Anterior',
                next: 'Siguiente',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
                agenda: 'Agenda',
                date: 'Fecha',
                time: 'Hora',
                event: 'Turno',
                noEventsInRange: 'No hay turnos en este rango',
                showMore: (total) => `+ ${total} más`
              }}
            />
          </Paper>
        </TabPanel>

        {/* Vista de Disponibilidad Grid */}
        <TabPanel value={tabValue} index={1}>
          <AvailabilityGrid 
            employees={employees.filter(e => e.is_active)}
            shifts={shifts}
            selectedDate={selectedDate}
            onCellClick={(employee, date) => {
              setSelectedEmployeeId(employee.id)
              setSelectedDate(date)
              setShiftDialogOpen(true)
            }}
          />
        </TabPanel>

        {/* Resumen por Empleado */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {employees.filter(e => e.is_active).map(employee => {
              const employeeShifts = shifts.filter(s => s.employee_id === employee.id)
              const availableCount = employeeShifts.filter(s => s.status === 'available').length
              const bookedCount = employeeShifts.filter(s => s.status === 'booked').length
              
              return (
                <Grid item xs={12} md={6} lg={4} key={employee.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                          {employee.name}
                        </Typography>
                        <Chip 
                          label={employee.employee_type}
                          size="small"
                          color="primary"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          icon={<AvailableIcon />}
                          label={`${availableCount} Disponible`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                        <Chip
                          icon={<BusyIcon />}
                          label={`${bookedCount} Ocupado`}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Próximos turnos:
                      </Typography>
                      
                      {employeeShifts
                        .filter(s => moment(s.date).isAfter(moment()))
                        .slice(0, 3)
                        .map(shift => (
                          <Box key={shift.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {getStatusIcon(shift.status)}
                            <Typography variant="caption" sx={{ ml: 1 }}>
                              {moment(shift.date).format('DD/MM')} - {getShiftTypeLabel(shift.shift_type)}
                            </Typography>
                          </Box>
                        ))
                      }
                      
                      {employeeShifts.filter(s => moment(s.date).isAfter(moment())).length === 0 && (
                        <Typography variant="caption" color="text.secondary">
                          Sin turnos programados
                        </Typography>
                      )}
                      
                      <Button
                        size="small"
                        fullWidth
                        sx={{ mt: 2 }}
                        onClick={() => {
                          setSelectedEmployeeId(employee.id)
                          setShiftDialogOpen(true)
                        }}
                      >
                        Asignar Turno
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </TabPanel>
      </Box>

      {/* Dialog para crear/editar turnos */}
      <ShiftDialog
        open={shiftDialogOpen}
        onClose={() => {
          setShiftDialogOpen(false)
          setSelectedShift(null)
          setSelectedEventResource(null)
        }}
        shift={selectedShift}
        employees={employees}
        selectedDate={selectedDate}
        selectedEmployeeId={selectedEmployeeId}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
        viewMode={viewMode}
        eventResource={selectedEventResource}
      />
    </Container>
  )
}

export default Scheduling