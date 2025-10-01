import React, { useEffect, useState } from 'react'
import {
  Box,
  Alert,
  Typography,
  CircularProgress,
  Button,
  Paper
} from '@mui/material'
import { Save as SaveIcon, Close as CloseIcon, ContentCopy as CopyIcon } from '@mui/icons-material'
import { useQuote, useUpdateQuote, useDuplicateQuote } from '../../hooks/useQuotes'
import { useActiveClients } from '../../hooks/useClients'
import { useActiveProducts } from '../../hooks/useProducts'
import { useActiveEmployees } from '../../hooks/useEmployees'
import { useTransportZones } from '../../hooks/useTransport'
import { useCities } from '../../hooks/useCities'
import { useMachinery } from '../../hooks/useMachinery'
import { useMachineryRentals } from '../../hooks/useMachineryRental'
import { useEventSubcontracts } from '../../hooks/useEventSubcontract'
import { useActiveDisposableItems } from '../../hooks/useDisposableItems'
import PricingCalculator from '../pricing/PricingCalculator'
import { PricingFormData, EmployeeInput, ProductInput, DaySchedule, MachineryInput, MachineryRentalInput, EventSubcontractInput, DisposableItemInput, TransportZoneInput } from '../pricing/types'
import { Quote } from '../../types'

interface QuoteEditorProps {
  quoteId: number
  onClose: () => void
}

const QuoteEditor: React.FC<QuoteEditorProps> = ({ quoteId, onClose }) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const [editFormData, setEditFormData] = useState<PricingFormData | null>(null)
  
  // Load quote data and related entities
  const { data: quote, isLoading: quoteLoading, error: quoteError } = useQuote(quoteId)
  const { data: clients = [] } = useActiveClients()
  const { data: products = [] } = useActiveProducts()  
  const { data: employees = [] } = useActiveEmployees()
  const { data: transportZones = [] } = useTransportZones()
  const { data: cities = [] } = useCities()
  const { data: machinery = [] } = useMachinery({ is_active: true, is_available: true })
  const { data: machineryRentals = [] } = useMachineryRentals({ is_available: true })
  const { data: eventSubcontracts = [] } = useEventSubcontracts({ is_available: true })
  const { data: disposableItems = [] } = useActiveDisposableItems()
  const updateQuoteMutation = useUpdateQuote()
  const duplicateQuoteMutation = useDuplicateQuote()

  // Helper functions for multi-day events
  const generateSelectedDays = (startDate: string, endDate: string): string[] => {
    const start = new Date(startDate + 'T12:00:00')
    const end = new Date(endDate + 'T12:00:00')
    const days: string[] = []
    
    const currentDate = new Date(start)
    while (currentDate <= end) {
      days.push(currentDate.toISOString().split('T')[0])
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  const generateDailySchedules = (startDate: string, endDate: string, startTime?: string, endTime?: string, existingSchedules?: any[]) => {
    const selectedDays = generateSelectedDays(startDate, endDate)
    
    return selectedDays.map(date => {
      // Check if there's an existing schedule for this date
      const existingSchedule = existingSchedules?.find(schedule => schedule.event_date === date)
      
      return {
        date,
        startTime: existingSchedule?.start_time || startTime || '08:00:00',
        endTime: existingSchedule?.end_time || endTime || '20:00:00'
      }
    })
  }

  // 🤖 ULTRATHINK: Convert existing quote to form data
  // ✅ COMPLETE CRUD RECOVERY: All item types (machinery, rentals, subcontracts, disposables, products)
  const convertQuoteToFormData = (quote: Quote): PricingFormData => {
    // Converting quote to form data
    
    // ULTRATHINK FIX: Find client or use quote's client data if clients array not loaded yet
    const selectedClient = clients.find(c => c.id === quote.client_id) || quote.client || null
    
    // Find primary contact for the client
    const selectedContact = selectedClient?.contacts?.find(c => c.is_primary) || 
                           (selectedClient?.contacts && selectedClient.contacts[0]) ||
                           null
    
    // Find transport zone (legacy single zone)
    const selectedTransportZone = transportZones.find(z => z.id === quote.transport_zone_id) || null
    
    // 🔥 NEW: Load multiple transport zones with validation
    const selectedTransportZones = quote.multiple_transport_zones ? 
      quote.multiple_transport_zones.map((zoneData: any) => {
        // 🛡️ ULTRATHINK: Validate and clean transport allocations
        const validatedAllocations = (zoneData.transportAllocations || []).map((allocation: any) => {
          const productExists = products.find(p => p.id === allocation.productId)
          
          // 🚨 Log data corruption detection
          if (!productExists && allocation.productId) {
            console.warn(`🔍 BUG DETECTED: Invalid productId ${allocation.productId} in transport allocation for zone ${zoneData.zone?.name || zoneData.zone?.id}`)
            console.warn('Available product IDs:', products.map(p => p.id))
            return null // Remove corrupted allocation
          }
          
          return productExists ? allocation : null
        }).filter(Boolean) // Remove null entries
        
        return {
          ...zoneData,
          zone: transportZones.find(z => z.id === zoneData.zone?.id) || zoneData.zone,
          transportAllocations: validatedAllocations
        }
      }) : []
    
    // Find event city
    const selectedEventCity = cities.find(c => c.id === quote.event_city) || null
    // Event city found
    
    // Extract employee-product associations from quote_items
    const employeeProductMap = new Map<number, number[]>()
    const productQuantityMap = new Map<number, number>()
    
    quote.items?.forEach(item => {
      // Skip non-product items (disposables, machinery, rentals, subcontracts)
      // These items use product_id for association but shouldn't be counted in product quantities
      const isNonProductItem = item.item_type === 'variable' ||
                               item.item_type === 'subcontract' ||
                               item.variable_cost_reason === 'Maquinaria propia' ||
                               item.variable_cost_reason === 'Alquiler de maquinaria externa' ||
                               item.variable_cost_reason === 'Item desechable' ||
                               (item.variable_cost_reason && item.variable_cost_reason.includes('Desechable'))

      if (isNonProductItem) {
        return // Skip this item, don't count it in product quantities
      }

      // Use item.id as unique identifier for quick products (when product_id is null)
      const productKey = item.product_id || item.id

      if (item.employee_id && productKey) {
        // Map employee to products
        if (!employeeProductMap.has(item.employee_id)) {
          employeeProductMap.set(item.employee_id, [])
        }
        if (!employeeProductMap.get(item.employee_id)!.includes(productKey)) {
          employeeProductMap.get(item.employee_id)!.push(productKey)
        }

        // Track product quantities
        productQuantityMap.set(productKey, (productQuantityMap.get(productKey) || 0) + item.quantity)
      } else if (productKey && !item.employee_id) {
        // Product without employee assignment
        productQuantityMap.set(productKey, (productQuantityMap.get(productKey) || 0) + item.quantity)
      }
    })
    
    // Employee-product mapping completed
    
    // Build employee inputs with associations
    const employeeInputs: EmployeeInput[] = Array.from(employeeProductMap.entries()).map(([employeeId, productIds]) => {
      const employee = employees.find(e => e.id === employeeId)
      if (!employee) return null
      
      const employeeItem = quote.items?.find(item => item.employee_id === employeeId)
      return {
        employee,
        hours: employeeItem?.hours_worked || 8,
        includeARL: false,
        extraCost: employeeItem?.extra_cost || undefined,
        extraCostReason: employeeItem?.extra_cost_reason || undefined,
        selectedProductIds: productIds
      }
    }).filter(Boolean) as EmployeeInput[]
    
    // Separate quote items by type based on variable_cost_reason and item_type
    const machineryItems = quote.items?.filter(item => item.variable_cost_reason === 'Maquinaria propia') || []
    const rentalItems = quote.items?.filter(item => item.variable_cost_reason === 'Alquiler de maquinaria externa') || []
    const subcontractItems = quote.items?.filter(item => item.item_type === 'subcontract') || []
    const disposableQuoteItems = quote.items?.filter(item => item.variable_cost_reason === 'Item desechable' || 
      (item.variable_cost_reason && item.variable_cost_reason.includes('Desechable'))) || []
    
    // Regular products are those without these specific variable_cost_reasons
    const productItems = quote.items?.filter(item => 
      !item.variable_cost_reason || 
      (item.variable_cost_reason !== 'Maquinaria propia' && 
       item.variable_cost_reason !== 'Alquiler de maquinaria externa' &&
       item.variable_cost_reason !== 'Subcontratación de eventos' &&
       item.variable_cost_reason !== 'Item desechable' &&
       !item.variable_cost_reason.includes('Desechable'))
    ) || []

    // Build product inputs (only real products, not machinery/rental/disposables)
    const productInputs: ProductInput[] = Array.from(productQuantityMap.entries())
      .map(([productKey, quantity]) => {
        const quoteItem = quote.items?.find(item => (item.product_id || item.id) === productKey)
        
        // Skip if this item is actually machinery/rental/disposable
        if (quoteItem && (
          quoteItem.variable_cost_reason === 'Maquinaria propia' ||
          quoteItem.variable_cost_reason === 'Alquiler de maquinaria externa' ||
          quoteItem.variable_cost_reason === 'Subcontratación de eventos' ||
          quoteItem.variable_cost_reason === 'Item desechable' ||
          (quoteItem.variable_cost_reason && quoteItem.variable_cost_reason.includes('Desechable'))
        )) {
          return null
        }
        
        const product = products.find(p => p.id === productKey)
        
        if (!product && !quoteItem) return null
        
        // If product doesn't exist in products table, it might be a quick-added product
        // Reconstruct it from the quote item data
        const reconstructedProduct = product || {
          id: productKey,
          name: quoteItem?.description?.split(' - Operario:')[0] || `Producto ${productKey}`,
          category: 'productos_rapidos',
          description: 'Producto creado rápidamente en cotización',
          pricing_type: 'unit' as const,
          base_price: quoteItem?.unit_price || 0,
          unit: 'unidad',
          requires_equipment: false,
          minimum_order: 1,
          is_seasonal: false,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const isVariable = quoteItem?.variable_cost_reason ? true : false
        
        return {
          product: reconstructedProduct,
          quantity,
          unitsPerProduct: quoteItem?.units_per_product || (reconstructedProduct.pricing_type === 'measurement' ? 1 : 1),
          isVariable,
          customPrice: isVariable ? quoteItem?.unit_price : undefined,
          customReason: quoteItem?.variable_cost_reason || 'Producto personalizado creado rápidamente'
        }
      })
      .filter(Boolean) as ProductInput[]

    // 🔧 Convert machinery items back to proper inputs
    const machineryInputs: MachineryInput[] = machineryItems.map(item => {
      // Extract machinery name from description (format: "MachineryName - Xh")
      const machineryName = item.description.split(' - ')[0]
      const foundMachinery = machinery.find(m => m.name === machineryName)
      
      if (!foundMachinery) {
        console.warn(`Machinery not found: ${machineryName}`)
        return null
      }
      
      // Extract hours from description or use hours_worked
      const hours = item.hours_worked || 8
      
      // Determine if operator was included based on notes
      const includeOperator = item.notes?.includes('+ operador') || false
      
      // Determine if setup was required based on notes
      const setupRequired = item.notes?.includes('+ instalación') || false
      
      return {
        machinery: foundMachinery,
        hours,
        includeOperator,
        setupRequired
      }
    }).filter(Boolean) as MachineryInput[]
    
    // 🏪 Convert machinery rental items back to proper inputs (normal + quick)
    const machineryRentalInputs: MachineryRentalInput[] = rentalItems.map(item => {
      // Extract machinery name from description (format: "MachineryName - Alquiler Xh")
      const machineryName = item.description.split(' - Alquiler ')[0]
      const hours = item.hours_worked || 8
      
      // Try to find normal rental first
      let foundRental = machineryRentals.find(r => r.machinery_name === machineryName)
      
      if (!foundRental) {
        // Create a mock rental for Quick Add items (supplier_id = 0)
        // Para alquileres rápidos, el unit_price es el costo total fijo que puso el usuario
        const isQuickRental = item.notes?.includes('(RÁPIDO)') || true // Asumimos que es rápido si no se encontró
        foundRental = {
          id: Date.now(), // Temporary ID
          supplier_id: 0, // Identifier for Quick Add
          machinery_name: machineryName,
          category: 'otros' as any,
          description: 'Alquiler rápido recuperado',
          supplier_hourly_rate: isQuickRental ? item.unit_price / 8 : item.unit_price,
          supplier_daily_rate: isQuickRental ? item.unit_price : item.unit_price * 8,
          sue_hourly_rate: isQuickRental ? item.unit_price / 8 : item.unit_price,
          sue_daily_rate: isQuickRental ? item.unit_price : item.unit_price * 8,
          setup_cost: 0,
          requires_operator: item.notes?.includes('+ operador') || false,
          operator_cost: 0, // Can't recover exact operator cost
          minimum_rental_hours: 4,
          delivery_cost: item.notes?.includes('+ entrega') ? 50000 : 0, // Estimate
          pickup_cost: item.notes?.includes('+ recogida') ? 50000 : 0, // Estimate
          insurance_cost: 0,
          damage_deposit: 0,
          is_available: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          supplier: {
            id: 0,
            name: 'Proveedor Externo',
            type: 'machinery_rental',
            payment_terms_days: 0,
            requires_advance_payment: false,
            advance_payment_percentage: 0,
            commission_percentage: 0,
            quality_rating: 0,
            reliability_rating: 0,
            price_rating: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }
      
      // Extract options from notes
      const includeOperator = item.notes?.includes('+ operador') || false
      const includeDelivery = item.notes?.includes('+ entrega') || false
      const includePickup = item.notes?.includes('+ recogida') || false
      
      // Detectar si hay costo editado
      const isCustomCost = item.notes?.includes('(COSTO EDITADO)') || false
      
      return {
        machineryRental: foundRental,
        hours,
        includeOperator,
        includeDelivery,
        includePickup,
        customMarginPercentage: undefined,
        isCustomCost,
        customTotalCost: isCustomCost ? item.unit_price : undefined
      }
    }).filter(Boolean) as MachineryRentalInput[]
    
    // 🤝 Convert subcontract items back to proper inputs (normal + quick)
    const eventSubcontractInputs: EventSubcontractInput[] = subcontractItems.map(item => {
      // Extract service name from description
      const serviceName = item.description
      
      // Try to find normal subcontract first
      let foundSubcontract = eventSubcontracts.find(s => s.service_name === serviceName)
      
      if (!foundSubcontract) {
        // Create a mock subcontract for Quick Add items
        foundSubcontract = {
          id: Date.now(), // Temporary ID
          supplier_id: 0, // Identifier for Quick Add
          service_name: serviceName,
          service_type: 'event_complete' as any,
          description: 'Subcontratación rápida recuperada',
          supplier_cost: item.subcontractor_cost || item.unit_price,
          sue_price: item.unit_price,
          minimum_attendees: 1,
          maximum_attendees: 1000,
          is_available: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          supplier: {
            id: 0,
            name: item.subcontractor_name || 'Subcontratista Externo',
            type: 'event_subcontractor',
            payment_terms_days: 0,
            requires_advance_payment: false,
            advance_payment_percentage: 0,
            commission_percentage: 0,
            quality_rating: 0,
            reliability_rating: 0,
            price_rating: 0,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      }
      
      return {
        eventSubcontract: foundSubcontract,
        attendees: undefined,
        customSupplierCost: item.subcontractor_cost !== foundSubcontract.supplier_cost ? item.subcontractor_cost : undefined,
        customSuePrice: item.unit_price !== foundSubcontract.sue_price ? item.unit_price : undefined,
        customMarginPercentage: undefined,
        notes: item.notes || undefined
      }
    }).filter(Boolean) as EventSubcontractInput[]
    
    // 📦 Convert disposable items back to proper inputs (normal + quick)
    const disposableItemInputs: DisposableItemInput[] = disposableQuoteItems.map(item => {
      // Extract item name from description (format: "ItemName - Quantity Unit")
      const itemName = item.description.split(' - ')[0]
      
      // Try to find normal disposable item first (using the hook data)
      let foundItem = disposableItems.find(d => d.name === itemName)
      
      if (!foundItem) {
        // Create a mock disposable item for Quick Add items
        foundItem = {
          id: Date.now(), // Temporary ID
          name: itemName,
          category: 'desechables',
          subcategory: 'packaging',
          description: 'Elemento desechable rápido recuperado',
          unit: 'unidad',
          cost_price: item.unit_price * 0.7, // Estimate 30% margin
          sale_price: item.unit_price,
          minimum_quantity: 1,
          is_recyclable: false,
          is_biodegradable: false,
          is_active: true,
          created_at: new Date().toISOString(), // Recent timestamp for Quick Add detection
          updated_at: new Date().toISOString()
        }
      }
      
      // Detectar si hay costo editado
      const isCustomTotalCost = item.notes?.includes('(COSTO TOTAL EDITADO)') || false
      const isCustomPrice = !isCustomTotalCost && item.variable_cost_reason && item.variable_cost_reason !== 'Item desechable'
      
      // Recuperar asociación con producto si existe
      const associatedProductId = item.product_id || undefined
      
      return {
        disposableItem: foundItem,
        quantity: item.quantity,
        isCustomPrice,
        customPrice: isCustomPrice ? item.unit_price : undefined,
        customReason: isCustomPrice || isCustomTotalCost ? item.variable_cost_reason : undefined,
        isCustomTotalCost,
        customTotalCost: isCustomTotalCost ? item.total_price : undefined,
        associatedProductId
      }
    }).filter(Boolean) as DisposableItemInput[]
    
    // Quote items recovery completed
    console.log(`  ✅ Product items: ${productInputs.length} recovered`)
    console.log(`  ✅ Employee inputs: ${employeeInputs.length} recovered`)
    
    return {
      selectedClient,
      selectedContact,
      eventName: quote.event_title || '',
      eventStartDate: quote.event_date,
      eventEndDate: quote.event_end_date || quote.event_date,
      eventStartTime: quote.event_start_time || '08:00:00',
      eventEndTime: quote.event_end_time || '20:00:00',
      selectedDays: generateSelectedDays(quote.event_date, quote.event_end_date || quote.event_date),
      dailySchedules: generateDailySchedules(quote.event_date, quote.event_end_date || quote.event_date, quote.event_start_time, quote.event_end_time, quote.daily_schedules),
      eventAddress: quote.event_location || '',
      eventCity: selectedEventCity,
      eventDescription: quote.event_title || quote.event_description || '',
      selectedTransportZone, // Deprecated - for compatibility
      selectedTransportZones, // 🔥 NEW: Multiple zones support
      includeEquipmentTransport: false, // Default to base transport cost (legacy)
      transportCount: quote.transport_count || 1, // Legacy
      transportProductIds: quote.transport_product_ids || [], // Manual product selection for transport (legacy)
      useFlexibleTransport: quote.use_flexible_transport || false, // Legacy
      transportAllocations: quote.transport_allocations || [], // Legacy
      marginPercentage: quote.margin_percentage ?? 30,
      // Enable retention only if it was actually applied (avoid re-enabling from stored manual percentage)
      enableRetention: (quote.tax_retention_percentage || 0) > 0,
      // FIX: Ensure retention percentage consistency - when retention is disabled, show 0%
      retentionPercentage: (quote.tax_retention_percentage || 0) > 0
        ? (typeof quote.retention_percentage === 'number' ? quote.retention_percentage : 0)
        : 0,
      employeeInputs,
      productInputs,
      machineryInputs,
      machineryRentalInputs,
      eventSubcontractInputs,
      disposableItemInputs
    }
  }

  // Initialize form data when quote loads
  useEffect(() => {
    // ULTRATHINK FIX: Initialize as soon as quote is available, don't wait for all arrays
    // The quote data itself contains the necessary IDs for proper initialization
    if (quote && !isInitialized) {
      console.log('🤖 ULTRATHINK: Initializing quote editor for quote:', quote.quote_number)
      console.log('🤖 ULTRATHINK: Quote data:', { client_id: quote.client_id, event_title: quote.event_title, total_cost: quote.total_cost })
      const formData = convertQuoteToFormData(quote)
      setEditFormData(formData)
      setIsInitialized(true)
    }
  }, [quote, clients, products, employees, transportZones, cities, isInitialized])

  if (quoteLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Cargando cotización...</Typography>
      </Box>
    )
  }

  if (quoteError) {
    return (
      <Alert severity="error">
        Error al cargar la cotización: {quoteError.message}
      </Alert>
    )
  }

  if (!quote) {
    return (
      <Alert severity="warning">
        Cotización no encontrada
      </Alert>
    )
  }

  if (!isInitialized || !editFormData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>🤖 Inicializando editor ULTRATHINK...</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="h6">
          🤖 Editando: {quote.quote_number}
        </Typography>
        <Typography variant="body2">
          Cliente: {quote.client?.name} • Total actual: {new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
          }).format(quote.total_cost)}
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Las asociaciones empleado-producto existentes han sido cargadas automáticamente.
          Modifica lo necesario y guarda los cambios.
        </Typography>
      </Alert>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" color="primary">
            🤖 ULTRATHINK Quote Editor
          </Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<CloseIcon />}
              onClick={onClose}
              sx={{ mr: 1 }}
            >
              Cerrar sin Guardar
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<CopyIcon />}
              onClick={() => {
                if (quote) {
                  duplicateQuoteMutation.mutate(quote.id, {
                    onSuccess: (duplicatedQuote) => {
                      alert(`🎉 Cotización duplicada exitosamente: ${duplicatedQuote.quote_number}`)
                    },
                    onError: (error) => {
                      console.error('Error duplicating quote:', error)
                      alert('❌ Error al duplicar la cotización')
                    }
                  })
                }
              }}
              sx={{ mr: 1 }}
              disabled={!quote || duplicateQuoteMutation.isPending}
            >
              {duplicateQuoteMutation.isPending ? 'Duplicando...' : 'Duplicar'}
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => {
                // Save functionality is handled by the PricingCalculator in edit mode
                // The save button will be inside the PricingCalculationSummary component
                alert('🤖 Usa el botón "Guardar Cambios" dentro del calculador para guardar.')
              }}
              disabled={updateQuoteMutation.isPending}
            >
              Guardar Cambios
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 🤖 ULTRATHINK: Embedded Pricing Calculator with pre-loaded data */}
      <PricingCalculator 
        initialData={editFormData}
        isEditMode={true}
        editingQuoteId={quoteId}
      />

    </Box>
  )
}

export default QuoteEditor
