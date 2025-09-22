import React, { useState } from 'react'
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  Tab,
  Tabs
} from '@mui/material'
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Comment as CommentIcon,
  AttachMoney as MoneyIcon,
  Event as EventIcon,
  Person as PersonIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material'
import { useQuotes, useUpdateQuote } from '../hooks/useQuotes'
import { useClients } from '../hooks/useClients'
import { useSmartQuoteManagement } from '../hooks/useSmartQuoteManagement'
import PDFGeneratorService from '../services/pdf-generator.service'
import moment from 'moment'
import 'moment/locale/es'

moment.locale('es')

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
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

const QuoteApprovals: React.FC = () => {
  const [tabValue, setTabValue] = useState(0)
  const [selectedQuote, setSelectedQuote] = useState<any>(null)
  const [approvalDialog, setApprovalDialog] = useState(false)
  const [rejectionDialog, setRejectionDialog] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const { data: quotes = [] } = useQuotes()
  const { data: clients = [] } = useClients()
  const updateQuote = useUpdateQuote()
  const { smartChangeStatus, isChangingStatus } = useSmartQuoteManagement()

  // Filter quotes by status
  const pendingQuotes = quotes.filter(q => q.status === 'pending')
  const approvedQuotes = quotes.filter(q => q.status === 'approved')
  const rejectedQuotes = quotes.filter(q => q.status === 'rejected')
  const completedQuotes = quotes.filter(q => q.status === 'completed')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleApprove = async () => {
    if (!selectedQuote) return

    try {
      console.log(`🎯 Smart approval for quote ${selectedQuote.quote_number}`)
      
      const result = await smartChangeStatus({
        quote: selectedQuote,
        newStatus: 'approved',
        reason: approvalNotes || 'Approved through approval system'
      })
      
      console.log(`✅ Quote approved with smart scheduling: ${result.releasedBookings} released, ${result.newBookings} booked`)
      
      setApprovalDialog(false)
      setSelectedQuote(null)
      setApprovalNotes('')
    } catch (error) {
      console.error('Error in smart approval:', error)
    }
  }

  const handleReject = async () => {
    if (!selectedQuote) return

    try {
      console.log(`❌ Smart rejection for quote ${selectedQuote.quote_number}`)
      
      const result = await smartChangeStatus({
        quote: selectedQuote,
        newStatus: 'rejected',
        reason: rejectionReason
      })
      
      console.log(`✅ Quote rejected with auto-release: ${result.releasedBookings} employees released`)
      
      setRejectionDialog(false)
      setSelectedQuote(null)
      setRejectionReason('')
    } catch (error) {
      console.error('Error in smart rejection:', error)
    }
  }

  const handleMarkCompleted = async (quote: any) => {
    try {
      console.log(`🏁 Smart completion for quote ${quote.quote_number}`)
      
      const result = await smartChangeStatus({
        quote,
        newStatus: 'completed',
        reason: 'Marked as completed through approval system'
      })
      
      console.log(`✅ Quote completed: Event finished successfully`)
      
    } catch (error) {
      console.error('Error in smart completion:', error)
    }
  }

  const handleGeneratePDF = async (quote: any) => {
    const client = clients.find(c => c.id === quote.client_id)
    if (!client) return

    try {
      // Ensure we have links and related joins
      const fullQuote = quote?.employee_product_links ? quote : await (await import('../services/quotes.service')).QuotesService.getById(quote.id)
      const links = fullQuote.employee_product_links || []

      // Build base products from quote items
      const productItems = (fullQuote.items || fullQuote.quote_items || []).filter((it: any) => it.item_type === 'product')
      const products = productItems.map((it: any) => ({
        product_id: it.product_id,
        product_name: it.product?.name || it.description || 'Producto',
        quantity: it.quantity || 1,
        unit_price: it.unit_price || 0,
        total_cost: it.total_price || 0
      }))

      // Employee costs allocation if links present
      const employeeItems = (fullQuote.items || fullQuote.quote_items || []).filter((it: any) => it.item_type === 'employee')
      let employees = employeeItems.map((it: any) => ({
        employee_id: it.employee_id,
        employee_name: it.employee?.name || 'Empleado',
        employee_type: it.employee?.employee_type || '',
        hours: it.hours_worked || 0,
        hourly_rate: it.unit_price || 0,
        total_cost: it.total_price || 0
      }))

      let employees_subtotal = (employees || []).reduce((s: number, e: any) => s + (e.total_cost || 0), 0)
      let products_subtotal = (products || []).reduce((s: number, p: any) => s + (p.total_cost || 0), 0)

      if (links.length > 0 && employees.length > 0) {
        const empToProducts = new Map<number, Array<{ product_id: number, hours?: number }>>()
        links.forEach((l: any) => {
          const arr = empToProducts.get(l.employee_id) || []
          arr.push({ product_id: l.product_id, hours: l.hours_allocated })
          empToProducts.set(l.employee_id, arr)
        })
        const productLabor: Record<number, number> = {}
        employees.forEach((e: any) => {
          const linksForEmp = empToProducts.get(e.employee_id) || []
          if (linksForEmp.length === 0) return
          let totalHours = 0
          let hasHours = false
          linksForEmp.forEach(l => { if (typeof l.hours === 'number' && !isNaN(l.hours)) { hasHours = true; totalHours += l.hours } })
          linksForEmp.forEach(l => {
            const share = hasHours && totalHours > 0 ? (e.total_cost * ((l.hours || 0) / totalHours)) : (e.total_cost / linksForEmp.length)
            productLabor[l.product_id] = (productLabor[l.product_id] || 0) + share
          })
        })
        // Apply labor to products
        for (const p of products) {
          p.total_cost = (p.total_cost || 0) + (productLabor[p.product_id] || 0)
        }
        products_subtotal += employees_subtotal
        employees_subtotal = 0
        employees = []
      }

      const pdfData = {
        quote: fullQuote,
        client,
        employees,
        products,
        summary: {
          subtotal: fullQuote.subtotal || 0,
          margin_amount: fullQuote.margin_amount || 0,
          tax_retention_amount: fullQuote.tax_retention_amount || 0,
          total_cost: fullQuote.total_cost || 0,
          employees_subtotal,
          products_subtotal,
          transport_subtotal: fullQuote.transport_cost || 0
        }
      }
      
      await PDFGeneratorService.generateQuotePDF(pdfData)
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const QuoteCard: React.FC<{ quote: any, showActions?: boolean }> = ({ quote, showActions = true }) => {
    const client = clients.find(c => c.id === quote.client_id)
    
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" component="div">
              {quote.quote_number}
            </Typography>
            <Chip 
              label={quote.status} 
              color={
                quote.status === 'approved' ? 'success' :
                quote.status === 'rejected' ? 'error' :
                quote.status === 'completed' ? 'info' :
                'warning'
              }
              size="small"
            />
          </Box>

          <List dense>
            <ListItem>
              <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <ListItemText 
                primary="Cliente"
                secondary={client?.name || 'Desconocido'}
              />
            </ListItem>
            <ListItem>
              <EventIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <ListItemText 
                primary="Evento"
                secondary={`${quote.event_title} - ${moment(quote.event_date).format('DD/MM/YYYY')}`}
              />
            </ListItem>
            <ListItem>
              <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <ListItemText 
                primary="Total"
                secondary={formatCurrency(quote.total_cost || 0)}
              />
            </ListItem>
          </List>

          {quote.approval_notes && (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Notas de aprobación:</strong> {quote.approval_notes}
              </Typography>
            </Alert>
          )}

          {quote.rejection_reason && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <Typography variant="caption">
                <strong>Razón de rechazo:</strong> {quote.rejection_reason}
              </Typography>
            </Alert>
          )}
        </CardContent>

        {showActions && (
          <CardActions>
            {quote.status === 'pending' && (
              <>
                <Button 
                  size="small" 
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={() => {
                    setSelectedQuote(quote)
                    setApprovalDialog(true)
                  }}
                >
                  Aprobar
                </Button>
                <Button 
                  size="small" 
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={() => {
                    setSelectedQuote(quote)
                    setRejectionDialog(true)
                  }}
                >
                  Rechazar
                </Button>
              </>
            )}

            {quote.status === 'approved' && (
              <Button 
                size="small"
                color="info"
                onClick={() => handleMarkCompleted(quote)}
              >
                Marcar Completado
              </Button>
            )}

            <Tooltip title="Generar PDF">
              <IconButton 
                size="small"
                onClick={() => handleGeneratePDF(quote)}
              >
                <PdfIcon />
              </IconButton>
            </Tooltip>
          </CardActions>
        )}
      </Card>
    )
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Typography variant="h4" gutterBottom>
          ✅ Sistema de Aprobaciones
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Gestiona el flujo de aprobación de cotizaciones
        </Typography>

        {/* Statistics */}
        <Grid container spacing={2} sx={{ mt: 2, mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'warning.light' }}>
              <Typography variant="h4">{pendingQuotes.length}</Typography>
              <Typography variant="body2">Pendientes</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'success.light' }}>
              <Typography variant="h4">{approvedQuotes.length}</Typography>
              <Typography variant="body2">Aprobadas</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'error.light' }}>
              <Typography variant="h4">{rejectedQuotes.length}</Typography>
              <Typography variant="body2">Rechazadas</Typography>
            </Paper>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: 'info.light' }}>
              <Typography variant="h4">{completedQuotes.length}</Typography>
              <Typography variant="body2">Completadas</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label={`Pendientes (${pendingQuotes.length})`} />
            <Tab label={`Aprobadas (${approvedQuotes.length})`} />
            <Tab label={`Rechazadas (${rejectedQuotes.length})`} />
            <Tab label={`Completadas (${completedQuotes.length})`} />
          </Tabs>
        </Paper>

        {/* Pending Quotes */}
        <TabPanel value={tabValue} index={0}>
          {pendingQuotes.length > 0 ? (
            <Grid container spacing={3}>
              {pendingQuotes.map(quote => (
                <Grid item xs={12} md={6} lg={4} key={quote.id}>
                  <QuoteCard quote={quote} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              No hay cotizaciones pendientes de aprobación
            </Alert>
          )}
        </TabPanel>

        {/* Approved Quotes */}
        <TabPanel value={tabValue} index={1}>
          {approvedQuotes.length > 0 ? (
            <Grid container spacing={3}>
              {approvedQuotes.map(quote => (
                <Grid item xs={12} md={6} lg={4} key={quote.id}>
                  <QuoteCard quote={quote} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              No hay cotizaciones aprobadas
            </Alert>
          )}
        </TabPanel>

        {/* Rejected Quotes */}
        <TabPanel value={tabValue} index={2}>
          {rejectedQuotes.length > 0 ? (
            <Grid container spacing={3}>
              {rejectedQuotes.map(quote => (
                <Grid item xs={12} md={6} lg={4} key={quote.id}>
                  <QuoteCard quote={quote} showActions={false} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              No hay cotizaciones rechazadas
            </Alert>
          )}
        </TabPanel>

        {/* Completed Quotes */}
        <TabPanel value={tabValue} index={3}>
          {completedQuotes.length > 0 ? (
            <Grid container spacing={3}>
              {completedQuotes.map(quote => (
                <Grid item xs={12} md={6} lg={4} key={quote.id}>
                  <QuoteCard quote={quote} showActions={false} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info">
              No hay cotizaciones completadas
            </Alert>
          )}
        </TabPanel>
      </Box>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Aprobar Cotización</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de aprobar la cotización {selectedQuote?.quote_number}?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Notas de aprobación (opcional)"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancelar</Button>
          <Button onClick={handleApprove} color="success" variant="contained">
            Aprobar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog} onClose={() => setRejectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar Cotización</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Por favor indique la razón para rechazar la cotización {selectedQuote?.quote_number}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Razón del rechazo"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="contained"
            disabled={!rejectionReason}
          >
            Rechazar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default QuoteApprovals
