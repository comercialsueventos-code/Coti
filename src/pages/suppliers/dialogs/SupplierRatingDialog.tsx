import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Rating
} from '@mui/material'
import { useRateSupplier } from '../../../hooks/useSuppliers'
import { SupplierDialogProps } from '../types'

const SupplierRatingDialog: React.FC<SupplierDialogProps> = ({
  open,
  onClose,
  supplier
}) => {
  const [qualityRating, setQualityRating] = useState(0)
  const [reliabilityRating, setReliabilityRating] = useState(0)
  const [priceRating, setPriceRating] = useState(0)
  
  const rateMutation = useRateSupplier()

  const handleSubmit = async () => {
    if (!supplier) return

    try {
      await rateMutation.mutateAsync({
        supplierId: supplier.id,
        qualityRating,
        reliabilityRating,
        priceRating
      })
      onClose()
      // Reset ratings
      setQualityRating(0)
      setReliabilityRating(0)
      setPriceRating(0)
    } catch (error) {
      console.error('Error rating supplier:', error)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset ratings when closing
    setQualityRating(0)
    setReliabilityRating(0)
    setPriceRating(0)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Calificar Proveedor - {supplier?.name}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Calidad del Servicio
            </Typography>
            <Rating
              value={qualityRating}
              onChange={(_, newValue) => setQualityRating(newValue || 0)}
              size="large"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Confiabilidad
            </Typography>
            <Rating
              value={reliabilityRating}
              onChange={(_, newValue) => setReliabilityRating(newValue || 0)}
              size="large"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Competitividad de Precios
            </Typography>
            <Rating
              value={priceRating}
              onChange={(_, newValue) => setPriceRating(newValue || 0)}
              size="large"
            />
            <Typography variant="caption" color="text.secondary">
              5 = Muy económico, 1 = Muy caro
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!qualityRating || !reliabilityRating || !priceRating || rateMutation.isPending}
        >
          Calificar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SupplierRatingDialog