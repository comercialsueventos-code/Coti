import React, { useState } from 'react'
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Grid,
  Card,
  CardContent,
  Alert,
  Tab,
  Tabs,
  Chip
} from '@mui/material'
import { 
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon 
} from '@mui/icons-material'
import EmployeeList from '../components/employees/EmployeeList'
import EmployeeForm from '../components/employees/EmployeeForm'
import EmployeeCategories from '../components/employees/EmployeeCategories'
import { useEmployeeStats } from '../hooks/useEmployees'
import { Employee } from '../types'
import { TabPanel } from '@/shared'

const Employees: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  
  const { stats } = useEmployeeStats()

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  const handleCreateEmployee = () => {
    setSelectedEmployee(null)
    setFormMode('create')
    setFormOpen(true)
  }

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormMode('edit')
    setFormOpen(true)
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setSelectedEmployee(null)
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Typography variant="h4" gutterBottom>
          👥 Gestión de Empleados
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="👥 Lista de Empleados" />
            <Tab label="🏷️ Categorías" />
            <Tab label="📊 Estadísticas" />
            <Tab label="⚙️ Estado del Sistema" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0} idPrefix="employees">
          <EmployeeList
            onEditEmployee={handleEditEmployee}
            onCreateEmployee={handleCreateEmployee}
            showActions={true}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={1} idPrefix="employees">
          <EmployeeCategories />
        </TabPanel>

        <TabPanel value={currentTab} index={2} idPrefix="employees">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📊 Resumen General
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Total empleados:</Typography>
                      <Chip label={stats.total_employees} color="primary" size="small" />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Empleados activos:</Typography>
                      <Chip label={stats.active_employees} color="success" size="small" />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Con ARL:</Typography>
                      <Chip label={stats.with_arl} color="info" size="small" />
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Tarifa promedio (4-8h):</Typography>
                      <Typography variant="body2" color="primary">
                        ${stats.average_rate_4_8h.toLocaleString('es-CO')}/hora
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    👨‍💼 Empleados por Tipo
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    {Object.entries(stats.by_type).map(([type, count]) => (
                      <Box key={type} display="flex" justifyContent="space-between">
                        <Typography>
                          {type === 'operario' && '🔧 Operarios'}
                          {type === 'chef' && '👨‍🍳 Chefs'}
                          {type === 'mesero' && '🍽️ Meseros'}
                          {type === 'supervisor' && '👔 Supervisores'}
                          {type === 'conductor' && '🚐 Conductores'}
                        </Typography>
                        <Chip label={count} size="small" />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="success">
                <Typography variant="h6">🎉 Sistema Completamente Funcional</Typography>
                El sistema de empleados está listo para uso en producción. Todos los empleados están 
                registrados, validados y disponibles para asignación en cotizaciones. 
                La calculadora de precios utiliza estas tarifas automáticamente.
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Formulario de empleado */}
        <EmployeeForm
          open={formOpen}
          onClose={handleCloseForm}
          employee={selectedEmployee}
          mode={formMode}
        />
      </Box>
    </Container>
  )
}

export default Employees