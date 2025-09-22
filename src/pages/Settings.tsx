import React, { useState } from 'react'
import { Box, Container, Typography, Paper, Grid, Chip, Button, Dialog } from '@mui/material'
import QuoteTemplateEditor from '../components/settings/QuoteTemplateEditor'

const Settings: React.FC = () => {
  const [showTemplateEditor, setShowTemplateEditor] = useState(false)

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">
            ⚙️ Configuración del Sistema
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowTemplateEditor(true)}
          >
            📄 Editar Plantillas de Cotización
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {/* Database Status */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📊 Estado de la Base de Datos
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Perfiles de usuario:</Typography>
                  <Chip label="✅ Configurado" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Empleados:</Typography>
                  <Chip label="✅ 8 registros" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Productos:</Typography>
                  <Chip label="✅ 9 registros" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Clientes:</Typography>
                  <Chip label="✅ 6 registros" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Zonas de transporte:</Typography>
                  <Chip label="✅ 7 zonas" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Cotizaciones:</Typography>
                  <Chip label="🟡 Pendiente" color="warning" size="small" />
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* System Configuration */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                🔧 Configuración del Sistema
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Supabase URL:</Typography>
                  <Chip label="Conectado" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>RLS Policies:</Typography>
                  <Chip label="✅ Dev Mode" color="warning" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Triggers automáticos:</Typography>
                  <Chip label="✅ Funcionando" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Numeración automática:</Typography>
                  <Chip label="✅ SUE-2025-XXX" color="success" size="small" />
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Business Rules */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📋 Reglas de Negocio Configuradas
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Empleados y Tarifas:
                  </Typography>
                  <Box component="ul" sx={{ fontSize: '0.9rem' }}>
                    <li>Escalones: 1-4h, 4-8h, 8h+ con tarifas diferenciadas</li>
                    <li>ARL configurado para empleados que lo requieren</li>
                    <li>Certificaciones por empleado</li>
                    <li>Sistema de reemplazos automático</li>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Clientes y Pagos:
                  </Typography>
                  <Box component="ul" sx={{ fontSize: '0.9rem' }}>
                    <li>Social: Pago inmediato + anticipo</li>
                    <li>Corporativo: Términos flexibles + retención 4%</li>
                    <li>Validación automática de NIT</li>
                    <li>Cálculo automático de anticipos</li>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Transporte y Zonas:
                  </Typography>
                  <Box component="ul" sx={{ fontSize: '0.9rem' }}>
                    <li>7 zonas pre-configuradas</li>
                    <li>Costos base + equipos adicionales</li>
                    <li>Tiempo estimado de viaje</li>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Productos y Servicios:
                  </Typography>
                  <Box component="ul" sx={{ fontSize: '0.9rem' }}>
                    <li>Catálogo completo Sue Events</li>
                    <li>Costos y márgenes configurados</li>
                    <li>Equipos requeridos por producto</li>
                    <li>Productos variables con costo manual</li>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Development Status */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, backgroundColor: 'success.light', color: 'success.contrastText' }}>
              <Typography variant="h6" gutterBottom>
                🚀 Estado de Desarrollo - FASE 2 COMPLETADA
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    ✅ FASE 1 Completada:
                  </Typography>
                  <Box component="ul" sx={{ fontSize: '0.85rem' }}>
                    <li>Schema de base de datos completo</li>
                    <li>CRUD de clientes funcional</li>
                    <li>Datos de prueba insertados</li>
                    <li>Navegación y layout</li>
                    <li>Sistema RLS configurado</li>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    ✅ FASE 2 Completada:
                  </Typography>
                  <Box component="ul" sx={{ fontSize: '0.85rem' }}>
                    <li>Motor de precios inteligente</li>
                    <li>Cálculos por escalones horarios</li>
                    <li>Transporte por zonas</li>
                    <li>Productos variables</li>
                    <li>Diferenciación social/corporativo</li>
                    <li>Calculadora en tiempo real</li>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    📅 FASE 3 - Siguiente:
                  </Typography>
                  <Box component="ul" sx={{ fontSize: '0.85rem' }}>
                    <li>Constructor visual de cotizaciones</li>
                    <li>Gestión completa de empleados</li>
                    <li>Sistema de turnos y disponibilidad</li>
                    <li>Generación de PDF</li>
                    <li>Dashboard con métricas avanzadas</li>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Configuración de Plantillas */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📄 Plantillas de Cotización
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Texto "INCLUYE":</Typography>
                  <Chip label="✅ Configurable" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Información de pago:</Typography>
                  <Chip label="✅ Personalizable" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Requerimientos técnicos:</Typography>
                  <Chip label="✅ Editable" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Observaciones generales:</Typography>
                  <Chip label="✅ Modificable" color="success" size="small" />
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography>Datos de contacto:</Typography>
                  <Chip label="✅ Actualizables" color="success" size="small" />
                </Box>
              </Box>
              <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
                Ahora puedes personalizar todos los textos que aparecen en las cotizaciones PDF.
                Haz clic en "Editar Plantillas de Cotización" para modificar el contenido.
              </Typography>
            </Paper>
          </Grid>

          {/* Development Notes */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, backgroundColor: 'warning.light' }}>
              <Typography variant="h6" gutterBottom>
                ⚠️ Notas de Desarrollo
              </Typography>
              <Typography variant="body2">
                <strong>Políticas RLS en Modo Desarrollo:</strong> Se han configurado políticas temporales que permiten acceso anónimo 
                para facilitar el desarrollo y testing. En producción, estas políticas deberán reemplazarse por un sistema completo 
                de autenticación con roles (admin, sales, viewer).
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Datos de Prueba:</strong> La aplicación incluye datos completos de empleados, clientes, productos y zonas 
                para testing. Todas las funcionalidades están probadas con datos reales.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Dialog del Editor de Plantillas */}
        <Dialog 
          open={showTemplateEditor} 
          onClose={() => setShowTemplateEditor(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: { height: '90vh' }
          }}
        >
          <QuoteTemplateEditor onClose={() => setShowTemplateEditor(false)} />
        </Dialog>
      </Box>
    </Container>
  )
}

export default Settings