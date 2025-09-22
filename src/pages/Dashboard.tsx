import React, { useMemo } from 'react'
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Divider
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  EventAvailable as EventIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useClients } from '../hooks/useClients'
import { useEmployees } from '../hooks/useEmployees'
import { useQuotes } from '../hooks/useQuotes'
import { useProducts } from '../hooks/useProducts'
import { useEmployeeShifts } from '../hooks/useEmployeeScheduling'
import moment from 'moment'
import 'moment/locale/es'

// Configure moment to use Spanish
moment.locale('es')

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { data: clients = [] } = useClients()
  const { data: employees = [] } = useEmployees()
  const { data: quotes = [] } = useQuotes()
  const { data: products = [] } = useProducts()
  
  // Get current month shifts
  const currentMonthStart = moment().startOf('month').format('YYYY-MM-DD')
  const currentMonthEnd = moment().endOf('month').format('YYYY-MM-DD')
  const { data: shifts = [] } = useEmployeeShifts({
    date_from: currentMonthStart,
    date_to: currentMonthEnd
  })
  
  // Calculate real metrics
  const metrics = useMemo(() => {
    const activeClients = clients.filter(c => c.is_active).length
    const activeEmployees = employees.filter(e => e.is_active).length
    const activeProducts = products.filter(p => p.is_active).length
    
    // Quotes metrics
    const pendingQuotes = quotes.filter(q => q.status === 'pending').length
    const approvedQuotes = quotes.filter(q => q.status === 'approved').length
    const completedQuotes = quotes.filter(q => q.status === 'completed').length
    
    // Financial metrics
    const monthRevenue = quotes
      .filter(q => {
        const quoteDate = moment(q.created_at)
        return quoteDate.isSame(moment(), 'month') && 
               (q.status === 'approved' || q.status === 'completed')
      })
      .reduce((sum, q) => sum + (q.total_cost || 0), 0)
    
    // Today's availability
    const todayShifts = shifts.filter(s => s.date === moment().format('YYYY-MM-DD'))
    const availableToday = todayShifts.filter(s => s.status === 'available').length
    const bookedToday = todayShifts.filter(s => s.status === 'booked').length
    
    // Upcoming events (next 7 days)
    const upcomingEvents = quotes.filter(q => {
      const eventDate = moment(q.event_date)
      return eventDate.isAfter(moment()) && 
             eventDate.isBefore(moment().add(7, 'days')) &&
             q.status === 'approved'
    })
    
    return {
      activeClients,
      activeEmployees,
      activeProducts,
      pendingQuotes,
      approvedQuotes,
      completedQuotes,
      monthRevenue,
      availableToday,
      bookedToday,
      upcomingEvents
    }
  }, [clients, employees, products, quotes, shifts])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const stats = [
    {
      title: 'Clientes Activos',
      value: metrics.activeClients,
      icon: <BusinessIcon />,
      color: 'primary.main',
      action: () => navigate('/clients')
    },
    {
      title: 'Cotizaciones Pendientes',
      value: metrics.pendingQuotes,
      icon: <AssignmentIcon />,
      color: 'warning.main',
      action: () => navigate('/quotes')
    },
    {
      title: 'Empleados Disponibles Hoy',
      value: metrics.availableToday,
      icon: <PeopleIcon />,
      color: 'success.main',
      action: () => navigate('/scheduling')
    },
    {
      title: 'Ingresos del Mes',
      value: formatCurrency(metrics.monthRevenue),
      icon: <TrendingUpIcon />,
      color: 'info.main',
      action: () => navigate('/quotes')
    }
  ]

  const recentClients = clients
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5)

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            📊 Dashboard - Sue Events
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Resumen general del sistema • {moment().format('dddd, DD [de] MMMM [de] YYYY')}
          </Typography>
        </Box>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Stats Cards */}
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3
                  }
                }}
                onClick={stat.action}
              >
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: stat.color,
                        color: 'white',
                        mr: 2
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Box>
                      <Typography variant="h4" component="div">
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Recent Clients & Upcoming Events */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  🗓️ Próximos Eventos
                </Typography>
                <Chip 
                  label={`${metrics.upcomingEvents.length} eventos`} 
                  color="primary" 
                  size="small"
                />
              </Box>
              {metrics.upcomingEvents.length > 0 ? (
                <List>
                  {metrics.upcomingEvents.slice(0, 3).map((event) => (
                    <ListItem key={event.id} divider>
                      <ListItemText
                        primary={event.event_title}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              📅 {moment(event.event_date).format('DD/MM/YYYY')}
                            </Typography>
                            <Typography variant="caption" display="block">
                              💰 {formatCurrency(event.total_cost || 0)}
                            </Typography>
                          </Box>
                        }
                      />
                      <Chip 
                        label="Aprobado" 
                        color="success" 
                        size="small" 
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No hay eventos programados para los próximos 7 días
                </Alert>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="h6" gutterBottom>
                👥 Clientes Recientes
              </Typography>
              <List dense>
                {recentClients.slice(0, 3).map((client) => (
                  <ListItem key={client.id}>
                    <ListItemText
                      primary={client.name}
                      secondary={`${client.type === 'corporate' ? 'Corporativo' : 'Social'}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Metrics Overview */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                📊 Métricas del Mes
              </Typography>
              
              {/* Quotes Overview */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Estado de Cotizaciones
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Chip 
                    icon={<PendingIcon />}
                    label={`${metrics.pendingQuotes} Pendientes`} 
                    color="warning" 
                    size="small"
                  />
                  <Chip 
                    icon={<CheckIcon />}
                    label={`${metrics.approvedQuotes} Aprobadas`} 
                    color="success" 
                    size="small"
                  />
                  <Chip 
                    label={`${metrics.completedQuotes} Completadas`} 
                    color="info" 
                    size="small"
                  />
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(metrics.approvedQuotes + metrics.completedQuotes) / (metrics.pendingQuotes + metrics.approvedQuotes + metrics.completedQuotes) * 100 || 0}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>

              {/* Employee Availability Today */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Disponibilidad Hoy
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption">Disponibles: {metrics.availableToday}</Typography>
                  <Typography variant="caption">Ocupados: {metrics.bookedToday}</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={metrics.bookedToday / (metrics.availableToday + metrics.bookedToday) * 100 || 0}
                  color="error"
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>

              {/* Quick Actions */}
              <Typography variant="subtitle2" gutterBottom>
                Acciones Rápidas
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    startIcon={<AssignmentIcon />}
                    onClick={() => navigate('/pricing')}
                  >
                    Nueva Cotización
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    variant="outlined"
                    fullWidth
                    size="small"
                    startIcon={<CalendarIcon />}
                    onClick={() => navigate('/scheduling')}
                  >
                    Ver Turnos
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* System Status */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2, backgroundColor: 'success.light' }}>
              <Typography variant="h6" gutterBottom color="success.main">
                ✅ Estado del Sistema - IMPLEMENTACIÓN COMPLETA
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" fontWeight="bold">Módulos Completados:</Typography>
                  <Typography variant="body2">
                    ✅ Gestión de Clientes<br/>
                    ✅ Gestión de Empleados<br/>
                    ✅ Gestión de Productos<br/>
                    ✅ Sistema de Cotizaciones<br/>
                    ✅ Calculadora de Precios
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" fontWeight="bold">Funcionalidades:</Typography>
                  <Typography variant="body2">
                    ✅ Sistema de Turnos<br/>
                    ✅ Calendario de Disponibilidad<br/>
                    ✅ Generación de PDF<br/>
                    ✅ Dashboard con Métricas<br/>
                    ✅ Cálculo de Retenciones
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" fontWeight="bold">Estadísticas:</Typography>
                  <Typography variant="body2">
                    📊 {metrics.activeClients} Clientes<br/>
                    👥 {metrics.activeEmployees} Empleados<br/>
                    📦 {metrics.activeProducts} Productos<br/>
                    📄 {quotes.length} Cotizaciones<br/>
                    💰 {formatCurrency(metrics.monthRevenue)} este mes
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}

export default Dashboard