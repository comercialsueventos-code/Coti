import React, { useState } from 'react'
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  Grid,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Alert,
  Tab,
  Tabs,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material'
import { 
  Assignment as AssignmentIcon,
  Calculate as CalculateIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import PricingCalculator from '../components/pricing/PricingCalculator'
import { useQuotes, useDeleteQuote, useDuplicateQuote } from '../hooks/useQuotes'
import QuoteEditor from '../components/quotes/QuoteEditor'

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`quotes-tabpanel-${index}`}
      aria-labelledby={`quotes-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Quotes: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0)
  const [editingQuoteId, setEditingQuoteId] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const navigate = useNavigate()

  // 🤖 ULTRATHINK: Load real quotes from database
  const { data: quotes, isLoading: quotesLoading, refetch: refetchQuotes } = useQuotes()
  const deleteQuoteMutation = useDeleteQuote()
  const duplicateQuoteMutation = useDuplicateQuote()

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  const handleEditQuote = (quoteId: number) => {
    setEditingQuoteId(quoteId)
    setIsEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingQuoteId(null)
    refetchQuotes() // Refresh quotes after editing
  }

  const handleDuplicateQuote = (quote: any) => {
    duplicateQuoteMutation.mutate(quote.id, {
      onSuccess: (duplicatedQuote) => {
        alert(`🎉 Cotización duplicada exitosamente: ${duplicatedQuote.quote_number}`)
        refetchQuotes() // Refresh quotes after duplicating
      },
      onError: (error) => {
        console.error('Error duplicating quote:', error)
        alert('❌ Error al duplicar la cotización')
      }
    })
  }

  const handleDeleteQuote = async (quoteId: number, quoteNumber: string) => {
    if (window.confirm(`¿Estás seguro de eliminar la cotización ${quoteNumber}?`)) {
      try {
        await deleteQuoteMutation.mutateAsync(quoteId)
        alert(`Cotización ${quoteNumber} eliminada exitosamente`)
      } catch (error) {
        console.error('Error deleting quote:', error)
        alert('Error al eliminar la cotización')
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            📄 Sistema de Cotizaciones
          </Typography>
          <Button
            variant="contained"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate('/pricing')}
            sx={{ mb: 2 }}
          >
            Constructor de Cotizaciones
          </Button>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab label="Estado del Sistema" />
            <Tab label="Cotizaciones Existentes" />
            <Tab label="Calculadora Integrada" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* Estado Actual */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, backgroundColor: 'success.light' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="h6" color="success.main">
                    ✅ CONSTRUCTOR DE COTIZACIONES COMPLETO
                  </Typography>
                </Box>
                <Typography variant="body1" gutterBottom>
                  El sistema unificado de calculadora-cotizaciones está completamente funcional:
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Box component="ul" sx={{ fontSize: '0.9rem' }}>
                      <li>✅ Cálculo automático por escalones horarios</li>
                      <li>✅ Retención 4% para corporativos</li>
                      <li>✅ Márgenes de ganancia configurables</li>
                      <li>✅ Costos de transporte por zonas</li>
                      <li>✅ Múltiples operarios por cotización</li>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box component="ul" sx={{ fontSize: '0.9rem' }}>
                      <li>✅ Productos con doble tipo de pricing</li>
                      <li>✅ Equipos propios con tarifas</li>
                      <li>✅ Sistema de alquiler externo</li>
                      <li>✅ Subcontratación de eventos completos</li>
                      <li>✅ Gestión de proveedores</li>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, backgroundColor: 'primary.light' }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" color="primary.main">
                    🎯 Próximas Mejoras - FASE 3
                  </Typography>
                </Box>
                <Box component="ul" sx={{ fontSize: '0.9rem' }}>
                  <li>✅ Gestión completa de empleados (completado)</li>
                  <li>✅ Gestión completa de productos (completado)</li>
                  <li>Sistema de turnos y disponibilidad</li>
                  <li>Generación de PDF profesional</li>
                  <li>Dashboard con métricas avanzadas</li>
                  <li>Sistema de aprobaciones y flujos</li>
                </Box>
              </Paper>
            </Grid>

            {/* Flujo de Cotización Actual */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3, backgroundColor: 'info.light' }}>
                <Typography variant="h6" gutterBottom color="info.main">
                  🎯 Flujo Unificado - Constructor de Cotizaciones
                </Typography>
                <Typography variant="body2">
                  <strong>Paso 1:</strong> Definir evento (título, fecha, horas, asistentes) →
                  <strong>Paso 2:</strong> Seleccionar cliente (social/corporativo) →
                  <strong>Paso 3:</strong> Agregar empleados con verificación de disponibilidad →
                  <strong>Paso 4:</strong> Incluir productos (precio fijo o por medida) →
                  <strong>Paso 5:</strong> Configurar equipos (propios/alquiler/subcontratación) →
                  <strong>Paso 6:</strong> Definir transporte por zona →
                  <strong>Paso 7:</strong> Ver cálculos automáticos → 
                  <strong>Paso 8:</strong> Guardar como cotización SUE-2025-XXX
                </Typography>
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="body2" color="success.main">
                    💡 <strong>Sistema completo integrado:</strong> Gestiona eventos desde simples hasta 
                    complejos con equipos propios, alquiler externo o subcontratación total. 
                    Cálculos en tiempo real con márgenes automáticos y numeración SUE-2025-XXX.
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" gutterBottom>
                  🤖 ULTRATHINK: Cotizaciones Existentes
                </Typography>
                <IconButton onClick={() => refetchQuotes()} disabled={quotesLoading}>
                  <RefreshIcon />
                </IconButton>
              </Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                Sistema completo de edición de cotizaciones con asociaciones empleado-producto.
                Edita cotizaciones existentes con el sistema ULTRATHINK.
              </Alert>
            </Grid>

            {quotesLoading ? (
              <Grid item xs={12} display="flex" justifyContent="center">
                <CircularProgress />
              </Grid>
            ) : (
              <>
                {quotes && quotes.length > 0 ? quotes.map((quote) => (
                  <Grid item xs={12} md={6} key={quote.id}>
                    <Card>
                      <CardHeader 
                        title={quote.quote_number}
                        subheader={quote.event_title || 'Sin título'}
                        action={
                          <Box>
                            <Chip 
                              label={quote.client_type} 
                              color={quote.client_type === 'corporativo' ? 'primary' : 'secondary'}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                            <Chip 
                              label={quote.status} 
                              color={quote.status === 'aceptado' ? 'success' : 
                                     quote.status === 'cancelado' ? 'error' : 'warning'} 
                              size="small"
                            />
                          </Box>
                        }
                      />
                      <CardContent>
                        <List dense>
                          <ListItem>
                            <ListItemText 
                              primary="Cliente" 
                              secondary={quote.client?.name || 'No disponible'}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Fecha del Evento" 
                              secondary={new Date(quote.event_date + 'T12:00:00').toLocaleDateString('es-CO')}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Items/Asociaciones" 
                              secondary={`${quote.items?.length || 0} items en cotización`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Asistentes" 
                              secondary={quote.estimated_attendees ? `${quote.estimated_attendees} personas` : 'No especificado'}
                            />
                          </ListItem>
                          <Divider sx={{ my: 1 }} />
                          <ListItem>
                            <ListItemText 
                              primary={
                                <Typography variant="h6" color="primary">
                                  Total: {formatCurrency(quote.total_cost)}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary">
                                  Margen: {quote.margin_percentage}% • Subtotal: {formatCurrency(quote.subtotal)}
                                </Typography>
                              }
                            />
                          </ListItem>
                        </List>
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          <Grid item xs={4}>
                            <Button
                              startIcon={<EditIcon />}
                              variant="contained"
                              color="primary"
                              fullWidth
                              size="small"
                              onClick={() => handleEditQuote(quote.id)}
                            >
                              Editar
                            </Button>
                          </Grid>
                          <Grid item xs={4}>
                            <Button
                              startIcon={<CopyIcon />}
                              variant="outlined"
                              color="secondary"
                              fullWidth
                              size="small"
                              onClick={() => handleDuplicateQuote(quote)}
                              disabled={duplicateQuoteMutation.isPending}
                            >
                              {duplicateQuoteMutation.isPending ? 'Duplicando...' : 'Duplicar'}
                            </Button>
                          </Grid>
                          <Grid item xs={4}>
                            <Button
                              startIcon={<DeleteIcon />}
                              variant="outlined"
                              color="error"
                              fullWidth
                              size="small"
                              onClick={() => handleDeleteQuote(quote.id, quote.quote_number)}
                              disabled={deleteQuoteMutation.isPending}
                            >
                              Eliminar
                            </Button>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                )) : (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'grey.50' }}>
                      <Typography variant="h6" gutterBottom>
                        📋 No hay cotizaciones
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Aún no se han creado cotizaciones. Usa el Constructor de Cotizaciones para crear la primera.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AssignmentIcon />}
                        onClick={() => navigate('/pricing')}
                      >
                        Crear Primera Cotización
                      </Button>
                    </Paper>
                  </Grid>
                )}

                {quotes && quotes.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: 'grey.50' }}>
                      <Typography variant="h6" gutterBottom>
                        📊 Resumen de Cotizaciones
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Total cotizaciones:</strong> {quotes.length} <br/>
                        <strong>Valor total cotizado:</strong> {formatCurrency(quotes.reduce((sum, q) => sum + q.total_cost, 0))} <br/>
                        <strong>Corporativas:</strong> {quotes.filter(q => q.client_type === 'corporativo').length} • 
                        <strong> Sociales:</strong> {quotes.filter(q => q.client_type === 'social').length} <br/>
                        <strong>Pendientes:</strong> {quotes.filter(q => q.status === 'pendiente').length} •
                        <strong> Aceptadas:</strong> {quotes.filter(q => q.status === 'aceptado').length} •
                        <strong> Canceladas:</strong> {quotes.filter(q => q.status === 'cancelado').length}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="h6">🧮 Calculadora de Precios Integrada</Typography>
            Esta es la misma calculadora disponible en la página dedicada, integrada aquí para tu conveniencia.
          </Alert>
          <PricingCalculator />
        </TabPanel>

        {/* 🤖 ULTRATHINK: Quote Editor Dialog */}
        <Dialog 
          open={isEditDialogOpen} 
          onClose={handleCloseEditDialog}
          maxWidth="xl"
          fullWidth
        >
          <DialogTitle>
            🤖 ULTRATHINK: Editor de Cotización
          </DialogTitle>
          <DialogContent>
            {editingQuoteId && (
              <QuoteEditor 
                quoteId={editingQuoteId} 
                onClose={handleCloseEditDialog}
              />
            )}
          </DialogContent>
        </Dialog>

      </Box>
    </Container>
  )
}

export default Quotes