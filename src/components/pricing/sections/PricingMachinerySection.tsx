import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  Alert,
  Typography,
  Box,
  Chip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  Divider,
  Paper
} from '@mui/material'
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Build as BuildIcon,
  Store as StoreIcon,
  Handshake as HandshakeIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ProductsIcon,
  FlashOn as QuickIcon
} from '@mui/icons-material'
import { MachineryManagementProps, ProductInput } from '../types'
import { useMachinery } from '../../../hooks/useMachinery'
import MachineryRentalTab from './components/MachineryRentalTab'
import EventSubcontractTab from './components/EventSubcontractTab'
import DisposableItemsTab from './components/DisposableItemsTab'
import QuickAddProductDialog, { CustomProduct } from './components/QuickAddProductDialog'
import { Product } from '../../../types'

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
      id={`machinery-tabpanel-${index}`}
      aria-labelledby={`machinery-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

const PricingMachinerySection: React.FC<MachineryManagementProps> = ({
  formData,
  updateFormData,
  addMachinery,
  removeMachinery,
  updateMachinery,
  addMachineryRental,
  removeMachineryRental,
  updateMachineryRental,
  addEventSubcontract,
  removeEventSubcontract,
  updateEventSubcontract,
  addDisposableItem,
  removeDisposableItem,
  updateDisposableItem
}) => {
  const [activeTab, setActiveTab] = useState(0)
  const [customProducts, setCustomProducts] = useState<CustomProduct[]>([])
  
  // Convert quick products from formData.productInputs to customProducts for display
  useEffect(() => {
    const quickProducts = formData.productInputs
      .filter(prod => prod.product.category === 'productos_rapidos')
      .map(prod => ({
        id: prod.product.id,
        name: prod.product.name,
        category: 'servicio', // Default category for display
        description: prod.product.description || '',
        unit: prod.product.unit,
        unit_price: prod.customPrice || prod.product.base_price,
        quantity: prod.quantity,
        is_taxable: true,
        requires_setup: false,
        setup_cost: 0,
        notes: prod.customReason || ''
      } as CustomProduct))
    
    setCustomProducts(quickProducts)
  }, [formData.productInputs])
  const [showQuickAddProduct, setShowQuickAddProduct] = useState(false)
  const { data: availableMachinery = [] } = useMachinery({ is_active: true, is_available: true })

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  // Calculate totals for each section
  const machineryTotal = formData.machineryInputs.reduce((total, input) => {
    const baseCost = input.hours >= 8 ? input.machinery.daily_rate : input.machinery.hourly_rate * input.hours
    const operatorCost = input.includeOperator && input.machinery.operator_hourly_rate 
      ? input.machinery.operator_hourly_rate * input.hours 
      : 0
    const setupCost = input.setupRequired ? (input.machinery.setup_cost || 0) : 0
    return total + baseCost + operatorCost + setupCost
  }, 0)

  const rentalTotal = formData.machineryRentalInputs.reduce((total, input) => {
    const baseCost = input.hours >= 8 ? input.machineryRental.sue_daily_rate : input.machineryRental.sue_hourly_rate * input.hours
    const operatorCost = input.includeOperator && input.machineryRental.operator_cost 
      ? input.machineryRental.operator_cost * input.hours 
      : 0
    const setupCost = input.machineryRental.setup_cost || 0
    const deliveryCost = input.includeDelivery ? (input.machineryRental.delivery_cost || 0) : 0
    const pickupCost = input.includePickup ? (input.machineryRental.pickup_cost || 0) : 0
    return total + baseCost + operatorCost + setupCost + deliveryCost + pickupCost
  }, 0)

  const subcontractTotal = formData.eventSubcontractInputs.reduce((total, input) => {
    return total + (input.customSuePrice || input.eventSubcontract.sue_price)
  }, 0)

  const disposableTotal = formData.disposableItemInputs.reduce((total, input) => {
    const unitPrice = input.isCustomPrice && input.customPrice ? input.customPrice : input.disposableItem.sale_price
    const actualQuantity = Math.max(input.quantity, input.disposableItem.minimum_quantity)
    return total + (unitPrice * actualQuantity)
  }, 0)

  const customProductsTotal = customProducts.reduce((total, product) => {
    const baseTotal = product.unit_price * product.quantity
    const setupCost = product.requires_setup ? product.setup_cost : 0
    return total + baseTotal + setupCost
  }, 0)

  const grandTotal = machineryTotal + rentalTotal + subcontractTotal + disposableTotal + customProductsTotal

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader 
        title="🏭 Maquinaria, Alquiler y Subcontratación"
        subheader={`Total general: ${formatCurrency(grandTotal)} (Propios: ${formatCurrency(machineryTotal)} | Alquiler: ${formatCurrency(rentalTotal)} | Subcontrato: ${formatCurrency(subcontractTotal)} | Adicionales: ${formatCurrency(disposableTotal)} | Productos Personalizados: ${formatCurrency(customProductsTotal)})`}
      />
      <CardContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              icon={<BuildIcon />} 
              label="Equipos Propios" 
              id="machinery-tab-0"
              aria-controls="machinery-tabpanel-0"
            />
            <Tab 
              icon={<StoreIcon />} 
              label="Alquiler Externo" 
              id="machinery-tab-1"
              aria-controls="machinery-tabpanel-1"
            />
            <Tab 
              icon={<HandshakeIcon />} 
              label="Subcontratación" 
              id="machinery-tab-2"
              aria-controls="machinery-tabpanel-2"
            />
            <Tab
              icon={<InventoryIcon />}
              label="Adicionales"
              id="machinery-tab-3"
              aria-controls="machinery-tabpanel-3"
            />
            <Tab 
              icon={<ProductsIcon />} 
              label="Productos" 
              id="machinery-tab-4"
              aria-controls="machinery-tabpanel-4"
            />
          </Tabs>
        </Box>

        {/* Equipos Propios Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary">
              🔧 Equipos Propios de Sue Events
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addMachinery}
              disabled={availableMachinery.length === 0}
            >
              Agregar Equipo
            </Button>
          </Box>

          {availableMachinery.length === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No hay maquinaria disponible. Primero agrega equipos en la sección de Maquinaria.
            </Alert>
          )}

          {formData.machineryInputs.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">
                No hay equipos agregados. Haz clic en "Agregar Equipo" para comenzar.
              </Typography>
            </Paper>
          ) : (
            <List>
              {formData.machineryInputs.map((input, index) => {
                const baseCost = input.hours >= 8 ? input.machinery.daily_rate : input.machinery.hourly_rate * input.hours
                const operatorCost = input.includeOperator && input.machinery.operator_hourly_rate 
                  ? input.machinery.operator_hourly_rate * input.hours 
                  : 0
                const setupCost = input.setupRequired ? (input.machinery.setup_cost || 0) : 0
                const totalCost = baseCost + operatorCost + setupCost

                return (
                  <React.Fragment key={index}>
                    <ListItem>
                      <Box sx={{ width: '100%' }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={3}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Equipo</InputLabel>
                              <Select
                                value={input.machinery.id}
                                label="Equipo"
                                onChange={(e) => {
                                  const machinery = availableMachinery.find(m => m.id === Number(e.target.value))
                                  if (machinery) {
                                    updateMachinery(index, 'machinery', machinery)
                                  }
                                }}
                              >
                                {availableMachinery.map((machinery) => (
                                  <MenuItem key={machinery.id} value={machinery.id}>
                                    {machinery.name} - {formatCurrency(machinery.hourly_rate)}/h
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          
                          <Grid item xs={6} md={2}>
                            <TextField
                              label="Horas"
                              type="number"
                              size="small"
                              value={input.hours}
                              onChange={(e) => updateMachinery(index, 'hours', Number(e.target.value))}
                              inputProps={{ min: 0.5, step: 0.5 }}
                              fullWidth
                            />
                          </Grid>

                          <Grid item xs={6} md={2}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={input.includeOperator}
                                  onChange={(e) => updateMachinery(index, 'includeOperator', e.target.checked)}
                                  disabled={!input.machinery.requires_operator}
                                />
                              }
                              label="Operador"
                            />
                          </Grid>

                          <Grid item xs={6} md={2}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={input.setupRequired}
                                  onChange={(e) => updateMachinery(index, 'setupRequired', e.target.checked)}
                                  disabled={!input.machinery.setup_cost}
                                />
                              }
                              label="Instalación"
                            />
                          </Grid>

                          <Grid item xs={6} md={2}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(totalCost)}
                            </Typography>
                          </Grid>

                          <Grid item xs={12} md={1}>
                            <IconButton
                              color="error"
                              onClick={() => removeMachinery(index)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Base: {formatCurrency(baseCost)} 
                          {operatorCost > 0 && ` + Operador: ${formatCurrency(operatorCost)}`}
                          {setupCost > 0 && ` + Instalación: ${formatCurrency(setupCost)}`}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < formData.machineryInputs.length - 1 && <Divider />}
                  </React.Fragment>
                )
              })}
            </List>
          )}

          {formData.machineryInputs.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="h6" color="primary.contrastText">
                Total Equipos Propios: {formatCurrency(machineryTotal)}
              </Typography>
            </Box>
          )}
        </TabPanel>

        {/* Alquiler Externo Tab */}
        <TabPanel value={activeTab} index={1}>
          <MachineryRentalTab
            formData={formData}
            updateFormData={updateFormData}
            addMachinery={addMachinery}
            removeMachinery={removeMachinery}
            updateMachinery={updateMachinery}
            addMachineryRental={addMachineryRental}
            removeMachineryRental={removeMachineryRental}
            updateMachineryRental={updateMachineryRental}
            addEventSubcontract={addEventSubcontract}
            removeEventSubcontract={removeEventSubcontract}
            updateEventSubcontract={updateEventSubcontract}
            addDisposableItem={addDisposableItem}
            removeDisposableItem={removeDisposableItem}
            updateDisposableItem={updateDisposableItem}
          />
        </TabPanel>

        {/* Subcontratación Tab */}
        <TabPanel value={activeTab} index={2}>
          <EventSubcontractTab
            formData={formData}
            updateFormData={updateFormData}
            addMachinery={addMachinery}
            removeMachinery={removeMachinery}
            updateMachinery={updateMachinery}
            addMachineryRental={addMachineryRental}
            removeMachineryRental={removeMachineryRental}
            updateMachineryRental={updateMachineryRental}
            addEventSubcontract={addEventSubcontract}
            removeEventSubcontract={removeEventSubcontract}
            updateEventSubcontract={updateEventSubcontract}
            addDisposableItem={addDisposableItem}
            removeDisposableItem={removeDisposableItem}
            updateDisposableItem={updateDisposableItem}
          />
        </TabPanel>

        {/* Adicionales Tab */}
        <TabPanel value={activeTab} index={3}>
          <DisposableItemsTab
            formData={formData}
            updateFormData={updateFormData}
            addMachinery={addMachinery}
            removeMachinery={removeMachinery}
            updateMachinery={updateMachinery}
            addMachineryRental={addMachineryRental}
            removeMachineryRental={removeMachineryRental}
            updateMachineryRental={updateMachineryRental}
            addEventSubcontract={addEventSubcontract}
            removeEventSubcontract={removeEventSubcontract}
            updateEventSubcontract={updateEventSubcontract}
            addDisposableItem={addDisposableItem}
            removeDisposableItem={removeDisposableItem}
            updateDisposableItem={updateDisposableItem}
          />
        </TabPanel>

        {/* Productos Personalizados Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary">
              🛍️ Productos y Servicios Personalizados
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<QuickIcon />}
              onClick={() => setShowQuickAddProduct(true)}
            >
              Agregar Producto
            </Button>
          </Box>

          {customProducts.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">
                No hay productos personalizados agregados. Haz clic en "Agregar Producto" para comenzar.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Productos o servicios específicos para esta cotización
              </Typography>
            </Paper>
          ) : (
            <List>
              {customProducts.map((product, index) => {
                const baseTotal = product.unit_price * product.quantity
                const setupCost = product.requires_setup ? product.setup_cost : 0
                const totalCost = baseTotal + setupCost

                return (
                  <React.Fragment key={index}>
                    <ListItem>
                      <Box sx={{ width: '100%' }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                              {product.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {product.category.replace('_', ' ').toUpperCase()} - {product.description}
                            </Typography>
                          </Grid>

                          <Grid item xs={6} md={2}>
                            <Typography variant="body2">
                              {formatCurrency(product.unit_price)}/{product.unit}
                            </Typography>
                          </Grid>

                          <Grid item xs={6} md={2}>
                            <Typography variant="body2">
                              Cantidad: {product.quantity}
                            </Typography>
                          </Grid>

                          <Grid item xs={6} md={2}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(totalCost)}
                              </Typography>
                              {product.requires_setup && (
                                <Typography variant="caption" color="text.secondary">
                                  + Setup: {formatCurrency(setupCost)}
                                </Typography>
                              )}
                            </Box>
                          </Grid>

                          <Grid item xs={6} md={1}>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {product.is_taxable && <Chip label="IVA" size="small" color="info" />}
                              {product.requires_setup && <Chip label="Setup" size="small" />}
                            </Box>
                          </Grid>

                          <Grid item xs={12} md={1}>
                            <IconButton
                              color="error"
                              onClick={() => {
                                const productToRemove = customProducts[index]
                                
                                // Remove from customProducts
                                const newCustomProducts = customProducts.filter((_, i) => i !== index)
                                setCustomProducts(newCustomProducts)
                                
                                // Also remove from formData.productInputs
                                const newProductInputs = formData.productInputs.filter(prod => 
                                  prod.product.id !== productToRemove.id
                                )
                                updateFormData('productInputs', newProductInputs)
                              }}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>

                        {product.notes && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            <strong>Notas:</strong> {product.notes}
                          </Typography>
                        )}
                      </Box>
                    </ListItem>
                    {index < customProducts.length - 1 && <Divider />}
                  </React.Fragment>
                )
              })}
            </List>
          )}

          {customProducts.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="h6" color="primary.contrastText">
                Total Productos Personalizados: {formatCurrency(customProductsTotal)}
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>💡 Productos incluidos:</strong> Servicios especiales, productos únicos, instalaciones personalizadas, etc.
            </Typography>
          </Box>
        </TabPanel>

        {/* Summary */}
        {(formData.machineryInputs.length > 0 || formData.machineryRentalInputs.length > 0 || formData.eventSubcontractInputs.length > 0 || formData.disposableItemInputs.length > 0 || customProducts.length > 0) && (
          <Box sx={{ mt: 3 }}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>💡 Resumen completo:</strong><br/>
                {formData.machineryInputs.length > 0 && <span>• <strong>Equipos propios:</strong> {formData.machineryInputs.length} equipo(s) - {formatCurrency(machineryTotal)}<br/></span>}
                {formData.machineryRentalInputs.length > 0 && <span>• <strong>Alquiler externo:</strong> {formData.machineryRentalInputs.length} equipo(s) - {formatCurrency(rentalTotal)}<br/></span>}
                {formData.eventSubcontractInputs.length > 0 && <span>• <strong>Subcontratación:</strong> {formData.eventSubcontractInputs.length} servicio(s) - {formatCurrency(subcontractTotal)}<br/></span>}
                {formData.disposableItemInputs.length > 0 && <span>• <strong>Elementos desechables:</strong> {formData.disposableItemInputs.length} tipo(s) - {formatCurrency(disposableTotal)}<br/></span>}
                {customProducts.length > 0 && <span>• <strong>Productos personalizados:</strong> {customProducts.length} producto(s) - {formatCurrency(customProductsTotal)}<br/></span>}
                <strong>Total general: {formatCurrency(grandTotal)}</strong>
              </Typography>
            </Alert>
          </Box>
        )}
      </CardContent>

      <QuickAddProductDialog
        open={showQuickAddProduct}
        onClose={() => setShowQuickAddProduct(false)}
        onAdd={(customProduct) => {
          // Convert CustomProduct to Product format for formData.productInputs
          const productForFormData: Product = {
            id: customProduct.id,
            name: customProduct.name,
            category: customProduct.category,
            description: customProduct.description,
            pricing_type: 'unit', // Custom products are always unit-based
            base_price: customProduct.unit_price,
            unit: customProduct.unit,
            requires_equipment: false,
            minimum_order: 1,
            is_seasonal: false,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          // Create ProductInput for the main form data
          const productInput: ProductInput = {
            product: productForFormData,
            quantity: customProduct.quantity,
            isVariable: false,
            customPrice: customProduct.unit_price,
            customReason: customProduct.notes || 'Producto personalizado creado rápidamente'
          }

          // Add to both customProducts (for display) and productInputs (for saving)
          setCustomProducts(prev => [...prev, customProduct])
          
          // Update the main form data to include this product
          const currentProductInputs = formData.productInputs || []
          updateFormData('productInputs', [...currentProductInputs, productInput])
        }}
      />
    </Card>
  )
}

export default PricingMachinerySection