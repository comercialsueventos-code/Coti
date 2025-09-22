import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  Typography,
  CircularProgress
} from '@mui/material'
import { ContentCopy as CopyIcon, Info as InfoIcon } from '@mui/icons-material'
import { useDuplicateQuote } from '../../hooks/useQuotes'
import { Quote } from '../../types'

interface DuplicateQuoteDialogProps {
  open: boolean
  onClose: () => void
  quote: Quote | null
  onSuccess?: (duplicatedQuote: Quote) => void
}

const DuplicateQuoteDialog: React.FC<DuplicateQuoteDialogProps> = ({
  open,
  onClose,
  quote,
  onSuccess
}) => {
  const [error, setError] = useState<string | null>(null)

  const duplicateQuote = useDuplicateQuote()

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setError(null)
    }
  }, [open])

  const handleDuplicate = async () => {
    if (!quote) {
      setError('No se pudo encontrar la cotización')
      return
    }

    try {
      const duplicatedQuote = await duplicateQuote.mutateAsync(quote.id)

      if (onSuccess) {
        onSuccess(duplicatedQuote)
      }
      
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al duplicar la cotización')
    }
  }

  const handleCancel = () => {
    if (!duplicateQuote.isPending) {
      onClose()
    }
  }

  if (!quote) return null

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={duplicateQuote.isPending}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CopyIcon color="primary" />
          <Typography variant="h6">
            Duplicar Cotización
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Original Quote Info */}
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Cotización original:</strong> {quote.quote_number}
          </Typography>
          <Typography variant="body2">
            <strong>Cliente:</strong> {quote.client?.name || 'Sin cliente'}
          </Typography>
          <Typography variant="body2">
            <strong>Fecha:</strong> {new Date(quote.event_date).toLocaleDateString('es-ES')}
          </Typography>
          <Typography variant="body2">
            <strong>Valor:</strong> {new Intl.NumberFormat('es-CO', { 
              style: 'currency', 
              currency: 'COP',
              minimumFractionDigits: 0 
            }).format(quote.total_cost)}
          </Typography>
        </Alert>

        {/* Duplication Info */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            <InfoIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
            <strong>Se creará una copia exacta con:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Título: <strong>"{quote.event_title} (copia)"</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Mismas fechas y horarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Todos los productos y servicios ({quote.items?.length || 0} elementos)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Empleados asignados y horarios de trabajo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Precios y configuración de transporte
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Términos de pago y configuración del cliente
          </Typography>
          {quote.daily_schedules && quote.daily_schedules.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              • Horarios diarios ({quote.daily_schedules.length} horarios)
            </Typography>
          )}
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button 
          onClick={handleCancel}
          disabled={duplicateQuote.isPending}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleDuplicate}
          disabled={duplicateQuote.isPending}
          startIcon={duplicateQuote.isPending ? <CircularProgress size={18} /> : <CopyIcon />}
        >
          {duplicateQuote.isPending ? 'Duplicando...' : 'Duplicar Cotización'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DuplicateQuoteDialog