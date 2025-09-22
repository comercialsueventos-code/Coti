import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Tab,
  Tabs,
  Alert,
  Grid,
  Card,
  CardContent
} from '@mui/material'
import {
  LocationOn as LocationIcon,
  TrendingUp as TrendingIcon,
  Speed as SpeedIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material'
import TransportZoneList from '../components/transport/TransportZoneList'
import { useTransportReport, useTransportZonesByCost, useTransportCostCalculator } from '../hooks/useTransport'
import { TabPanel } from '@/shared'

const TransportZones: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0)
  
  const { report } = useTransportReport()
  const { data: zonesByCost = [] } = useTransportZonesByCost()
  const { zones: allZones } = useTransportCostCalculator()

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`
    }
    return `${minutes}min`
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            🚚 Gestión de Zonas de Transporte ULTRATHINK
          </Typography>
        </Box>

        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Gestión de Zonas" icon={<LocationIcon />} />
            <Tab label="Reportes y Análisis" icon={<TrendingIcon />} />
            <Tab label="Calculadora de Costos" icon={<CalculateIcon />} />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <TabPanel value={currentTab} index={0} idPrefix="transport">
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6">🤖 Sistema ULTRATHINK de Zonas de Transporte</Typography>
            Gestiona todas las zonas de transporte para cotizaciones automáticas. 
            Configura costos base, costos de equipo adicional y tiempos estimados.
          </Alert>
          <TransportZoneList />
        </TabPanel>

        <TabPanel value={currentTab} index={1} idPrefix="transport">
          <Typography variant="h6" gutterBottom>
            📊 Análisis de Zonas de Transporte
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <LocationIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" color="primary.main">
                    {allZones.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Zonas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <SpeedIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" color="success.main">
                    {allZones.filter(z => z.is_active).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Zonas Activas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CalculateIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" color="info.main">
                    {formatCurrency(allZones.reduce((sum, z) => sum + z.base_cost, 0) / (allZones.length || 1))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Costo Promedio
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" color="warning.main">
                    {Math.round(allZones.reduce((sum, z) => sum + (z.estimated_travel_time_minutes || 0), 0) / (allZones.length || 1))}min
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tiempo Promedio
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top 5 Most Expensive Zones */}
          {zonesByCost.length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🏆 Top 5 Zonas por Costo
                </Typography>
                {zonesByCost.slice(0, 5).map((zone, index) => (
                  <Box key={zone.id} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                    <Typography variant="body1">
                      #{index + 1} {zone.name}
                      {zone.description && (
                        <Typography variant="body2" color="text.secondary" component="span">
                          {' • '}{zone.description}
                        </Typography>
                      )}
                    </Typography>
                    <Box textAlign="right">
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(zone.base_cost)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        +{formatCurrency(zone.additional_equipment_cost)} equipo
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Travel Times Analysis */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⏱️ Análisis de Tiempos de Viaje
              </Typography>
              {allZones.filter(z => z.estimated_travel_time_minutes).map(zone => (
                <Box key={zone.id} display="flex" justifyContent="space-between" alignItems="center" py={1}>
                  <Typography variant="body1">
                    {zone.name}
                  </Typography>
                  <Typography variant="body1">
                    {formatTime(zone.estimated_travel_time_minutes)}
                  </Typography>
                </Box>
              ))}
              
              {allZones.filter(z => z.estimated_travel_time_minutes).length === 0 && (
                <Typography variant="body2" color="text.secondary" style={{ fontStyle: 'italic' }}>
                  No hay datos de tiempo registrados para ninguna zona.
                </Typography>
              )}
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={currentTab} index={2} idPrefix="transport">
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6">🧮 Calculadora de Costos de Transporte</Typography>
            Utiliza esta herramienta para calcular costos de transporte en tiempo real.
          </Alert>
          
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                💰 Comparativa de Costos por Zona
              </Typography>
              
              <Grid container spacing={2}>
                {allZones.map(zone => {
                  const basicCost = zone.base_cost
                  const withEquipment = zone.base_cost + zone.additional_equipment_cost
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={zone.id}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6" gutterBottom>
                          {zone.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {zone.description || 'Sin descripción'}
                        </Typography>
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>Solo transporte:</strong>
                          </Typography>
                          <Typography variant="h6" color="primary.main">
                            {formatCurrency(basicCost)}
                          </Typography>
                          
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Con equipo:</strong>
                          </Typography>
                          <Typography variant="h6" color="secondary.main">
                            {formatCurrency(withEquipment)}
                          </Typography>
                          
                          {zone.estimated_travel_time_minutes && (
                            <>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                <strong>Tiempo estimado:</strong>
                              </Typography>
                              <Typography variant="body1">
                                {formatTime(zone.estimated_travel_time_minutes)}
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  )
                })}
              </Grid>

              {allZones.length === 0 && (
                <Typography variant="body1" textAlign="center" color="text.secondary" sx={{ py: 4 }}>
                  No hay zonas de transporte configuradas.
                  Ve a la pestaña "Gestión de Zonas" para crear la primera zona.
                </Typography>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      </Box>
    </Container>
  )
}

export default TransportZones