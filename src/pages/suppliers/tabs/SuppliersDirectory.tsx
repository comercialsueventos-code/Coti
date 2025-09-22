import React from 'react'
import {
  Grid,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Box,
  Chip,
  Divider,
  Rating,
  IconButton,
  Button
} from '@mui/material'
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Add as AddIcon
} from '@mui/icons-material'
import { useSuppliersUtils } from '../../../hooks/useSuppliers'
import { SuppliersTabProps } from '../types'

const SuppliersDirectory: React.FC<SuppliersTabProps> = ({
  filteredSuppliers,
  statistics,
  searchTerm,
  selectedType,
  onSearchChange,
  onTypeChange,
  onEditSupplier,
  onDeleteSupplier,
  onRateSupplier
}) => {
  const {
    getTypeOptions,
    getTypeIcon,
    getTypeDisplayName,
    getSupplierStatus,
    formatPaymentTerms,
    formatCollaborationSummary,
    calculateOverallScore
  } = useSuppliersUtils()

  return (
    <Grid container spacing={3}>
      {/* Search and Filters */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Buscar y Filtrar
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar proveedores..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Proveedor</InputLabel>
                <Select
                  value={selectedType}
                  label="Tipo de Proveedor"
                  onChange={(e) => onTypeChange(e.target.value)}
                >
                  <MenuItem value="">Todos los tipos</MenuItem>
                  {getTypeOptions().map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="body2" color="text.secondary">
                Total: {filteredSuppliers.length} proveedores
                {statistics && (
                  <>
                    {' • '}
                    Activos: {statistics.active_suppliers}
                  </>
                )}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Suppliers Grid */}
      {filteredSuppliers.map((supplier) => {
        const status = getSupplierStatus(supplier)
        const overallScore = calculateOverallScore(supplier)
        
        return (
          <Grid item xs={12} md={6} lg={4} key={supplier.id}>
            <Card>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {getTypeIcon(supplier.type)}
                  </Avatar>
                }
                title={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6">{supplier.name}</Typography>
                  </Box>
                }
                action={
                  <Chip
                    label={status.label}
                    color={status.color as any}
                    size="small"
                  />
                }
                subheader={getTypeDisplayName(supplier.type)}
              />
              <CardContent>
                {/* Contact Info */}
                <Box sx={{ mb: 2 }}>
                  {supplier.contact_person && (
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <BusinessIcon fontSize="small" color="action" />
                      <Typography variant="body2">{supplier.contact_person}</Typography>
                    </Box>
                  )}
                  {supplier.phone && (
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{supplier.phone}</Typography>
                    </Box>
                  )}
                  {supplier.email && (
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">{supplier.email}</Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Ratings */}
                <Grid container spacing={1}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      Calidad
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Rating
                        value={supplier.quality_rating}
                        precision={0.5}
                        size="small"
                        readOnly
                      />
                      <Typography variant="caption" sx={{ ml: 0.5 }}>
                        {supplier.quality_rating.toFixed(1)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      Confiabilidad
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Rating
                        value={supplier.reliability_rating}
                        precision={0.5}
                        size="small"
                        readOnly
                      />
                      <Typography variant="caption" sx={{ ml: 0.5 }}>
                        {supplier.reliability_rating.toFixed(1)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      Precio
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Rating
                        value={supplier.price_rating}
                        precision={0.5}
                        size="small"
                        readOnly
                      />
                      <Typography variant="caption" sx={{ ml: 0.5 }}>
                        {supplier.price_rating.toFixed(1)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                {/* Specialties */}
                {supplier.specialties && supplier.specialties.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Especialidades:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                      {supplier.specialties.slice(0, 3).map((specialty, index) => (
                        <Chip
                          key={index}
                          label={specialty}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {supplier.specialties.length > 3 && (
                        <Chip
                          label={`+${supplier.specialties.length - 3} más`}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      )}
                    </Box>
                  </Box>
                )}

                {/* Payment Terms */}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Términos: {formatPaymentTerms(supplier)} • Comisión: {supplier.commission_percentage}%
                </Typography>

                {/* Last Collaboration */}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {formatCollaborationSummary(supplier)}
                </Typography>

                {/* Actions */}
                <Box display="flex" gap={1} mt={2}>
                  <IconButton
                    size="small"
                    onClick={() => onEditSupplier(supplier)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onRateSupplier(supplier)}
                  >
                    <StarIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDeleteSupplier(supplier.id)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )
      })}

      {filteredSuppliers.length === 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No hay proveedores disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Agrega tu primer proveedor para empezar
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
              onClick={() => {/* This would be handled by parent */}}
            >
              Agregar Proveedor
            </Button>
          </Paper>
        </Grid>
      )}
    </Grid>
  )
}

export default SuppliersDirectory