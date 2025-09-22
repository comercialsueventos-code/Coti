import React from 'react'
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Alert,
  Typography,
  TextField,
  Button,
  Stack,
  Tooltip,
  Divider
} from '@mui/material'
import { PricingFormProps } from '../types'

const PricingEmployeeProductAssociation: React.FC<PricingFormProps> = ({ formData, updateFormData }) => {
  const products = formData.productInputs.map(p => p.product)
  const [query, setQuery] = React.useState('')
  const [compactMode, setCompactMode] = React.useState(true)

  const handleChange = (employeeIndex: number, newProductIds: number[]) => {
    const newEmployees = formData.employeeInputs.map((emp, idx) =>
      idx === employeeIndex ? { ...emp, selectedProductIds: newProductIds } : emp
    )
    updateFormData('employeeInputs', newEmployees)
  }

  const toggleSelection = (employeeIndex: number, productId: number) => {
    const current = formData.employeeInputs[employeeIndex]?.selectedProductIds || []
    const exists = current.includes(productId)
    const next = exists ? current.filter((id: number) => id !== productId) : [...current, productId]
    handleChange(employeeIndex, next)
  }

  const selectAll = (employeeIndex: number) => {
    handleChange(employeeIndex, products.map((p: any) => p.id))
  }

  const clearAll = (employeeIndex: number) => {
    handleChange(employeeIndex, [])
  }

  const autoSuggest = (employeeIndex: number) => {
    const emp = (formData.employeeInputs as any[])[employeeIndex]
    const type = (emp?.employee?.employee_type || '').toLowerCase()
    const preferred = products.filter((p: any) => {
      const name = `${p.name} ${p.category || ''} ${p.subcategory || ''}`.toLowerCase()
      if (type.includes('chef')) return /(bebid|frap|café|cafe|comida|alimento|coctel|cóctel|postre|barra)/.test(name)
      if (type.includes('mesero')) return /(bebid|servicio|barra|atenci|coctel|cóctel)/.test(name)
      if (type.includes('operario') || type.includes('supervisor')) return /(montaje|servicio|mobiliario|decor|equipo)/.test(name)
      return false
    })
    if (preferred.length > 0) {
      handleChange(employeeIndex, preferred.map((p: any) => p.id))
    }
  }

  const missingAssociations = formData.employeeInputs
    .filter(e => (e.selectedProductIds?.length || 0) === 0)

  const filteredProducts = products.filter((p: any) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.subcategory || '').toLowerCase().includes(q)
    )
  })

  return (
    <Card>
      <CardHeader 
        title="Vincular Operarios a Productos" 
        subheader="Asigne qué productos atiende cada operario" 
      />
      <CardContent>
        {formData.employeeInputs.length > 0 && products.length === 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Debe agregar al menos un producto para poder asociar operarios.
          </Alert>
        )}
        {formData.employeeInputs.length > 0 && products.length > 0 && missingAssociations.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {`Operarios sin asociación: ${missingAssociations.map(e => e.employee.name).join(', ')}`}
          </Alert>
        )}

        {/* Toolbar de filtros y vista */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ sm: 'center' }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar producto por nombre o categoría"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button variant={compactMode ? 'contained' : 'outlined'} onClick={() => setCompactMode(!compactMode)}>
            {compactMode ? 'Vista compacta' : 'Vista lista'}
          </Button>
        </Stack>

        <Grid container spacing={2}>
          {formData.employeeInputs.map((empInput, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2">{empInput.employee.name}</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip size="small" label={empInput.employee.employee_type} />
                  <Chip size="small" color="primary" variant="outlined" label={`Asignados: ${(empInput.selectedProductIds?.length || 0)}`} />
                </Stack>
              </Box>

              {/* Acciones rápidas */}
              <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Tooltip title="Seleccionar todos los productos filtrados">
                  <Button size="small" onClick={() => selectAll(index)}>Seleccionar todos</Button>
                </Tooltip>
                <Tooltip title="Limpiar selección">
                  <Button size="small" onClick={() => clearAll(index)}>Limpiar</Button>
                </Tooltip>
                <Tooltip title="Auto-sugerir según el rol del operario">
                  <Button size="small" onClick={() => autoSuggest(index)}>Auto-sugerir</Button>
                </Tooltip>
              </Stack>

              {!compactMode ? (
                <FormControl fullWidth size="small">
                  <InputLabel>Productos</InputLabel>
                  <Select
                    multiple
                    value={empInput.selectedProductIds || []}
                    label="Productos"
                    onChange={(e) => {
                      const values = e.target.value as number[]
                      handleChange(index, values)
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as number[]).map((value) => {
                          const product = products.find((p: any) => p.id === value)
                          return <Chip key={value} label={product ? product.name : value} size="small" />
                        })}
                      </Box>
                    )}
                  >
                    {filteredProducts.map((prod: any) => (
                      <MenuItem key={prod.id} value={prod.id}>
                        <Box>
                          <Typography variant="body2">{prod.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {prod.category}{prod.subcategory ? ` • ${prod.subcategory}` : ''}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {filteredProducts.map((prod: any) => {
                    const selected = (empInput.selectedProductIds || []).includes(prod.id)
                    return (
                      <Chip
                        key={`${empInput.employee.id}-${prod.id}`}
                        label={prod.name}
                        color={selected ? 'primary' : 'default'}
                        variant={selected ? 'filled' : 'outlined'}
                        onClick={() => toggleSelection(index, prod.id)}
                        size="small"
                      />
                    )
                  })}
                </Box>
              )}
            </Grid>
          ))}
        </Grid>

        {formData.employeeInputs.length === 0 && (
          <Typography color="text.secondary" textAlign="center">
            Agregue operarios para configurar sus asociaciones a productos.
          </Typography>
        )}

        {/* Resumen por producto */}
        {products.length > 0 && formData.employeeInputs.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="caption" color="text.secondary">
              Resumen rápido: empleados asociados por producto
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              {products.map((prod: any) => {
                const count = formData.employeeInputs.filter((e: any) => (e.selectedProductIds || []).includes(prod.id)).length
                return (
                  <Chip key={`summary-${prod.id}`} size="small" label={`${prod.name}: ${count}`} variant="outlined" />
                )
              })}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default PricingEmployeeProductAssociation
