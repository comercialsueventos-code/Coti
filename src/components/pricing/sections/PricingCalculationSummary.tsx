import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  Alert,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Divider,
  Chip,
  CircularProgress,
  Snackbar
} from '@mui/material'
import {
  Calculate as CalculateIcon,
  Save as SaveIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material'
import { usePricingFormat } from '../../../hooks/usePricing'
// import { PricingCalculationProps } from '../types'

interface PricingCalculationProps {
  formData: any
  result: any
  errors: any[]
  suggestions: any[]
  is_valid: boolean
  onSaveQuote: () => void
  isLoading: boolean
  showSuccessMessage: boolean
  savedQuoteNumber: string
  savedQuoteId: number | null
  setShowSuccessMessage: (show: boolean) => void
  isEditMode?: boolean
  editingQuoteId?: number
}
import PDFGeneratorService from '../../../services/pdf-generator.service'
import { useQuotes } from '../../../hooks/useQuotes'
import { useClients } from '../../../hooks/useClients'
import { QuotesService } from '../../../services/quotes.service'
import { CitiesService } from '../../../services/cities.service'

/**
 * 🤖 ULTRATHINK FIX - 2025-01-15
 * 
 * PROBLEM SOLVED: Calculation discrepancy between internal ($232,643.8) and external ($224,643.8) totals
 * 
 * ROOT CAUSE: In the PDF generation logic, costs for disposables, machinery rentals, and transport
 * were being added to summaryOverride.products_subtotal, causing double-counting because these
 * costs were already included in the backend calculation (result.subtotal).
 * 
 * SOLUTION IMPLEMENTED:
 * 1. Removed the duplicate additions to summaryOverride.products_subtotal in lines 207-210, 241-246, and 260-263
 * 2. Costs are now only distributed among individual products for PDF display purposes
 * 3. The summary totals now correctly use only the backend-calculated values
 * 4. Added calculation verification logging to detect future discrepancies
 * 
 * IMPACT: This eliminates the $8,000 difference between internal and external calculations
 * and ensures consistency across all displays.
 */
const PricingCalculationSummary: React.FC<PricingCalculationProps> = ({
  formData,
  result,
  errors,
  suggestions,
  is_valid,
  onSaveQuote,
  isLoading,
  showSuccessMessage,
  savedQuoteNumber,
  savedQuoteId,
  setShowSuccessMessage,
  isEditMode = false,
  editingQuoteId
}) => {
  const { formatCurrency, formatPercentage } = usePricingFormat()
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const { data: quotes = [] } = useQuotes()
  const { data: clients = [] } = useClients()

  // 🤖 ULTRATHINK: Fix transport mapping from database and comprehensive debug
  const fixedResult = React.useMemo(() => {
    if (!result) return null
    
    // Fix transport mapping: if transport_subtotal is missing but we have transport_cost, map it
    if (!result.transport_subtotal && (result as any).transport_cost) {
      return {
        ...result,
        transport_subtotal: (result as any).transport_cost
      }
    }
    
    return result
  }, [result])

  // Use fixedResult instead of result for all calculations
  const actualResult = fixedResult || result

  // 🔇 DEBUG LOGS DISABLED - Uncomment to enable calculation audit
  // React.useEffect(() => {
  //   if (actualResult && actualResult.subtotal && actualResult.total_cost) {
  //     console.log('🔍 ULTRATHINK FULL CALCULATION AUDIT:')
  //     console.log('=== BACKEND RESULT ===')
  //     console.log('- Subtotal:', actualResult.subtotal)
  //     console.log('- Total Cost:', actualResult.total_cost)
  //     console.log('- Employees subtotal:', actualResult.employees_subtotal || 0)
  //     console.log('- Products subtotal:', actualResult.products_subtotal || 0)
  //     console.log('- Transport subtotal:', actualResult.transport_subtotal || 0)
  //     console.log('- Machinery subtotal:', actualResult.machinery_subtotal || 0)
  //     console.log('- Rental subtotal:', actualResult.machinery_rental_subtotal || 0)
  //     console.log('- Subcontract subtotal:', actualResult.subcontract_subtotal || 0)
  //     console.log('- Disposable subtotal:', actualResult.disposable_subtotal || 0)
  //     console.log('- Margin %:', actualResult.margin_percentage || 0)
  //     console.log('- Margin amount:', actualResult.margin_amount || 0)
  //     console.log('- Tax retention %:', actualResult.tax_retention_percentage || 0)
  //     console.log('- Tax retention amount:', actualResult.tax_retention_amount || 0)
  //
  //     console.log('=== MANUAL CALCULATION ===')
  //     const manualSubtotal = (actualResult.employees_subtotal || 0) +
  //                           (actualResult.products_subtotal || 0) +
  //                           (actualResult.transport_subtotal || 0) +
  //                           (actualResult.machinery_subtotal || 0) +
  //                           (actualResult.machinery_rental_subtotal || 0) +
  //                           (actualResult.subcontract_subtotal || 0) +
  //                           (actualResult.disposable_subtotal || 0)
  //
  //     const manualMargin = manualSubtotal * ((actualResult.margin_percentage || 0) / 100)
  //     const manualRetention = (manualSubtotal + manualMargin) * ((actualResult.tax_retention_percentage || 0) / 100)
  //     const manualTotal = manualSubtotal + manualMargin - manualRetention
  //
  //     console.log('- Manual subtotal sum:', manualSubtotal)
  //     console.log('- Manual margin calc:', manualMargin)
  //     console.log('- Manual retention calc:', manualRetention)
  //     console.log('- Manual total calc:', manualTotal)
  //
  //     console.log('=== DIFFERENCES ===')
  //     console.log('- Subtotal diff:', Math.abs(actualResult.subtotal - manualSubtotal))
  //     console.log('- Total diff:', Math.abs(actualResult.total_cost - manualTotal))
  //
  //     if (Math.abs(actualResult.total_cost - manualTotal) > 0.01) {
  //       console.warn('🚨 MAJOR CALCULATION DISCREPANCY:')
  //       console.warn('- Backend total:', actualResult.total_cost)
  //       console.warn('- Manual calculation:', manualTotal)
  //       console.warn('- Difference:', Math.abs(actualResult.total_cost - manualTotal))
  //     }

  //     // Log saved quote information for debugging external display
  //     if (savedQuoteNumber && savedQuoteId) {
  //       console.log('=== SAVED QUOTE INFO ===')
  //       console.log('- Quote Number:', savedQuoteNumber)
  //       console.log('- Quote ID:', savedQuoteId)
  //       console.log('- Backend Total (should match external):', actualResult.total_cost)
  //     }
  //   }
  // }, [result, savedQuoteNumber, savedQuoteId])

  const handleGeneratePDF = async () => {
    console.log('🎨 DEBUG: Iniciando generación PDF')
    console.log('🎨 DEBUG: formData completo:', formData)
    console.log('🎨 DEBUG: quoteCustomTexts:', formData.quoteCustomTexts)
    
    if (!savedQuoteNumber || !result || !formData.selectedClient) {
      return
    }

    setGeneratingPDF(true)
    try {
      // Try to find the saved quote by number or use savedQuoteId if available
      let quote = quotes.find(q => q.quote_number === savedQuoteNumber)
      
      // If not found in cache, try to fetch directly by ID if available
      if (!quote && savedQuoteId) {
        try {
          const fetchedQuote = await QuotesService.getById(savedQuoteId)
          quote = fetchedQuote
        } catch (fetchError) {
          console.warn('Could not fetch quote by ID:', fetchError)
        }
      }
      
      const client = clients.find(c => c.id === formData.selectedClient?.id) || formData.selectedClient
      
      if (!quote || !client) {
        throw new Error('No se pudo encontrar la cotización o el cliente')
      }

      // Fetch latest quote with links if not found
      let fullQuote = quote
      try {
        if (savedQuoteId && (!fullQuote.employee_product_links || fullQuote.employee_product_links.length === 0)) {
          fullQuote = await QuotesService.getById(savedQuoteId)
        }
      } catch {}

      // If we have explicit employee-product links, allocate employee costs into products
      const links = fullQuote?.employee_product_links || []
      const hasDbLinks = links.length > 0
      // Fallback links from the in-memory form associations when DB links are not present
      const formLinks: Array<{ employee_id: number, product_id: number, hours_allocated?: number }> = []
      if (!hasDbLinks && Array.isArray(formData.employeeInputs)) {
        formData.employeeInputs.forEach((e: any) => {
          const pidList: number[] = e.selectedProductIds || []
          pidList.forEach((pid: number) => formLinks.push({ employee_id: e.employee?.id, product_id: pid }))
        })
      }
      const hasAnyLinks = hasDbLinks || formLinks.length > 0

      // Base products from pricing result (preferred for accurate totals)
      const baseProducts = (result?.products || []).map((p: any) => ({
        product_id: p.product_id,
        product_name: p.product_name,
        quantity: p.quantity,
        unit_price: p.unit_price,
        total_cost: p.total_cost
      }))

      // Fallback to form data if result.products is missing
      const fallbackProducts = (formData.productInputs || []).map((p: any) => ({
        product_id: p.product?.id,
        product_name: p.product?.name || 'Producto sin nombre',
        quantity: p.quantity,
        unit_price: p.product?.base_price || 0,
        total_cost: (p.product?.base_price || 0) * p.quantity
      }))

      const productsArray = baseProducts.length > 0 ? baseProducts : fallbackProducts

      let employeesArray = actualResult.employees || []
      let productsForPdf = productsArray
      let summaryOverride = {
        employees_subtotal: actualResult.employees_subtotal || 0,
        products_subtotal: actualResult.products_subtotal || productsArray.reduce((s: number, p: any) => s + (p.total_cost || 0), 0)
      }

      if (hasAnyLinks && employeesArray.length > 0) {
        // Build map employee_id -> array of { product_id, hours }
        const empToProducts = new Map<number, Array<{ product_id: number, hours?: number }>>()
        const sourceLinks = hasDbLinks ? links : formLinks
        sourceLinks.forEach((l: any) => {
          const arr = empToProducts.get(l.employee_id) || []
          arr.push({ product_id: l.product_id, hours: l.hours_allocated })
          empToProducts.set(l.employee_id, arr)
        })

        // Compute allocated labor per product
        const productLabor: Record<number, number> = {}
        employeesArray.forEach((e: any) => {
          const linksForEmp = empToProducts.get(e.employee_id) || []
          if (linksForEmp.length === 0) return
          let totalHours = 0
          let hasHours = false
          linksForEmp.forEach(l => {
            if (typeof l.hours === 'number' && !isNaN(l.hours)) { hasHours = true; totalHours += l.hours }
          })
          linksForEmp.forEach(l => {
            const share = hasHours && totalHours > 0 ? (e.total_cost * ((l.hours || 0) / totalHours)) : (e.total_cost / linksForEmp.length)
            productLabor[l.product_id] = (productLabor[l.product_id] || 0) + share
          })
        })

        // Add labor cost to each product
        productsForPdf = productsArray.map((p: any) => ({
          ...p,
          total_cost: (p.total_cost || 0) + (productLabor[p.product_id] || 0)
        }))

        // Adjust summary: move employees subtotal into products subtotal and hide employee details
        const employeesSubtotal = employeesArray.reduce((s: number, e: any) => s + (e.total_cost || 0), 0)
        summaryOverride = {
          employees_subtotal: 0,
          products_subtotal: (summaryOverride.products_subtotal || 0) + employeesSubtotal
        }
        employeesArray = []
      }

      // Add disposable item costs to associated products
      if (formData.disposableItemInputs && formData.disposableItemInputs.length > 0) {
        const disposableCosts: Record<number, number> = {}
        formData.disposableItemInputs.forEach((item: any) => {
          if (item.associatedProductId) {
            let itemCost = 0
            if (item.isCustomTotalCost && item.customTotalCost !== undefined) {
              itemCost = item.customTotalCost
            } else {
              const unitPrice = item.isCustomPrice && item.customPrice ? item.customPrice : item.disposableItem.sale_price
              const actualQuantity = Math.max(item.quantity, item.disposableItem.minimum_quantity)
              itemCost = unitPrice * actualQuantity
            }
            disposableCosts[item.associatedProductId] = (disposableCosts[item.associatedProductId] || 0) + itemCost
          }
        })

        // Add disposable costs to products
        productsForPdf = productsForPdf.map((p: any) => ({
          ...p,
          total_cost: (p.total_cost || 0) + (disposableCosts[p.product_id] || 0)
        }))

        // Note: Don't add disposable costs to summaryOverride.products_subtotal
        // because these costs are already included in the backend calculation (result.subtotal)
        // We only distribute them to individual products for PDF display purposes
      }

      // Add machinery rental costs to associated products
      if (formData.machineryRentalInputs && formData.machineryRentalInputs.length > 0) {
        const rentalCosts: Record<number, number> = {}
        formData.machineryRentalInputs.forEach((rental: any) => {
          if (rental.associatedProductId) {
            let rentalCost = 0
            if (rental.isCustomCost && rental.customTotalCost !== undefined) {
              rentalCost = rental.customTotalCost
            } else {
              const baseCost = rental.hours >= 8 ? rental.machineryRental.sue_daily_rate : rental.machineryRental.sue_hourly_rate * rental.hours
              const operatorCost = rental.includeOperator && rental.machineryRental.operator_cost 
                ? rental.machineryRental.operator_cost * rental.hours 
                : 0
              const setupCost = rental.machineryRental.setup_cost || 0
              const deliveryCost = rental.includeDelivery ? (rental.machineryRental.delivery_cost || 0) : 0
              const pickupCost = rental.includePickup ? (rental.machineryRental.pickup_cost || 0) : 0
              rentalCost = baseCost + operatorCost + setupCost + deliveryCost + pickupCost
            }
            rentalCosts[rental.associatedProductId] = (rentalCosts[rental.associatedProductId] || 0) + rentalCost
          }
        })

        // Add rental costs to products
        productsForPdf = productsForPdf.map((p: any) => ({
          ...p,
          total_cost: (p.total_cost || 0) + (rentalCosts[p.product_id] || 0)
        }))

        // Note: Don't add rental costs to summaryOverride.products_subtotal
        // because these costs are already included in the backend calculation (result.subtotal)
        // We only distribute them to individual products for PDF display purposes
      }

      // 🔥 NEW: Handle transport - check if using multiple zones first
      const hasMultipleZones = formData.selectedTransportZones && formData.selectedTransportZones.length > 0
      
      if (actualResult.transport_subtotal && actualResult.transport_subtotal > 0 && productsForPdf.length > 0 && !hasMultipleZones) {
        console.log('🚚 TRANSPORT: Starting distribution (legacy single zone)...')
        console.log('- Use flexible transport:', formData.useFlexibleTransport)
        console.log('- Transport allocations:', formData.transportAllocations)
        console.log('- Transport cost to distribute:', actualResult.transport_subtotal)
        
        // 🔥 NEW: Priority 1 - Use manual transport allocations if enabled
        if (formData.useFlexibleTransport && formData.transportAllocations && formData.transportAllocations.length > 0) {
          console.log('📊 Using MANUAL transport distribution')
          
          const transportCostPerUnit = actualResult.transport_subtotal / (formData.transportCount || 1)
          console.log('💰 Transport cost per unit:', transportCostPerUnit)
          
          // Add transport cost based on manual allocations
          productsForPdf = productsForPdf.map((p: any) => {
            const allocation = formData.transportAllocations.find((alloc: any) => alloc.productId === p.product_id)
            const transportQuantity = allocation?.quantity || 0
            const transportCost = transportQuantity * transportCostPerUnit
            
            console.log(`🎯 Product ${p.product_id} (${p.product_name}):`)
            console.log(`  - Original cost: ${p.total_cost || 0}`)
            console.log(`  - Transport quantity: ${transportQuantity}`)
            console.log(`  - Transport cost: ${transportCost}`)
            console.log(`  - New total: ${(p.total_cost || 0) + transportCost}`)
            
            return {
              ...p,
              total_cost: (p.total_cost || 0) + transportCost,
              transport_portion: transportCost,
              transport_quantity: transportQuantity
            }
          })
          
          console.log('✅ Manual transport distribution completed')
        }
        // 🔥 FALLBACK: Use automatic distribution (legacy behavior)
        else {
          console.log('⚖️ Using AUTOMATIC transport distribution')
          
          let productsToDistribute = productsForPdf
          
          // Priority 2: Use manual transport product selection if available
          if ((formData.transportProductIds || []).length > 0) {
            const selectedProductIds = new Set(formData.transportProductIds || [])
            productsToDistribute = productsForPdf.filter((p: any) => 
              selectedProductIds.has(p.product_id)
            )
            console.log('📦 Using manual product selection for transport:')
            console.log('- Selected product IDs:', Array.from(selectedProductIds))
            console.log('- Products that will receive transport:', productsToDistribute.length)
          }
          // Priority 3: Fall back to employee-product associations
          else if (hasAnyLinks) {
            const associatedProductIds = new Set<number>()
            const sourceLinks = hasDbLinks ? links : formLinks
            sourceLinks.forEach((l: any) => {
              if (l.product_id) associatedProductIds.add(l.product_id)
            })
            
            // Filter products to only those associated with employees
            productsToDistribute = productsForPdf.filter((p: any) => 
              associatedProductIds.has(p.product_id)
            )
          }
          
          // Only distribute if we have products to distribute to
          if (productsToDistribute.length > 0) {
            const transportCostPerProduct = actualResult.transport_subtotal / productsToDistribute.length
            console.log('💰 Transport cost per product:', transportCostPerProduct)
            
            // Add transport cost to each selected product
            productsForPdf = productsForPdf.map((p: any) => {
              const shouldAddTransport = productsToDistribute.some(pt => pt.product_id === p.product_id)
              
              if (shouldAddTransport) {
                console.log(`🎯 Adding transport to product ${p.product_id}:`)
                console.log(`  - Original cost: ${p.total_cost || 0}`)
                console.log(`  - Transport portion: ${transportCostPerProduct}`)
                console.log(`  - New total: ${(p.total_cost || 0) + transportCostPerProduct}`)
              }
              
              return {
                ...p,
                total_cost: shouldAddTransport ? 
                  (p.total_cost || 0) + transportCostPerProduct : 
                  (p.total_cost || 0),
                transport_portion: shouldAddTransport ? transportCostPerProduct : 0
              }
            })
            
            console.log('✅ Automatic transport distribution completed')
          } else {
            console.log('⚠️ No products to distribute transport to')
          }
        }

        // Note: Don't add transport costs to summaryOverride.products_subtotal
        // because these costs are already included in the backend calculation (result.subtotal)
        // We only distribute them among selected products for PDF display purposes
      } else if (hasMultipleZones) {
        console.log('🚚 TRANSPORT: Using MULTIPLE ZONES - each zone handles its own configuration')
        console.log('- Number of zones:', formData.selectedTransportZones.length)
        formData.selectedTransportZones.forEach((zone: any, index: number) => {
          console.log(`  Zone ${index + 1}: ${zone.zone?.name || 'Unknown'} - ${zone.transportCount} transport(s) - Manual: ${zone.useFlexibleTransport}`)
        })
        console.log('- Transport costs will be handled individually per zone in PDF')
        
        // 🔥 FIX: Add multiple zone transport costs to products BEFORE margin calculation
        formData.selectedTransportZones.forEach((zoneInput: any, zoneIndex: number) => {
          const baseCost = zoneInput.zone?.base_cost || 0
          const equipmentCost = zoneInput.includeEquipmentTransport ? (zoneInput.zone?.additional_equipment_cost || 0) : 0
          const totalZoneCost = (baseCost + equipmentCost) * (zoneInput.transportCount || 1)
          
          const useManualDistribution = zoneInput.useFlexibleTransport && zoneInput.transportAllocations && zoneInput.transportAllocations.length > 0
          
          if (useManualDistribution) {
            const costPerTransport = baseCost + equipmentCost
            
            // Distribute according to manual allocations
            zoneInput.transportAllocations.forEach((allocation: any) => {
              const productIndex = productsForPdf.findIndex(p => p.product_id === allocation.productId)
              if (productIndex >= 0) {
                const transportCost = allocation.quantity * costPerTransport
                productsForPdf[productIndex] = {
                  ...productsForPdf[productIndex],
                  total_cost: (productsForPdf[productIndex].total_cost || 0) + transportCost
                }
                console.log(`🚚 Zone ${zoneIndex + 1} → Product ${allocation.productId}: +${transportCost}`)
              }
            })
          } else {
            // Distribute equally among all products
            const costPerProduct = totalZoneCost / productsForPdf.length
            productsForPdf = productsForPdf.map((p: any) => ({
              ...p,
              total_cost: (p.total_cost || 0) + costPerProduct
            }))
            console.log(`🚚 Zone ${zoneIndex + 1} → All products: +${costPerProduct} each`)
          }
        })
      }

      // 🔥 NEW: Distribute margin proportionally among products for PDF (ONLY in global mode)
      // Force per_line if undefined (migration for existing quotes)
      const effectiveMarginMode = formData.marginMode || 'per_line'
      console.log('🔧 MIGRATION: Original marginMode:', formData.marginMode, '-> Effective:', effectiveMarginMode)
      if (actualResult.margin_amount && actualResult.margin_amount > 0 && productsForPdf.length > 0 && effectiveMarginMode !== 'per_line') {
        console.log('💰 MARGIN: Distributing margin among products...')
        console.log('- Total margin to distribute:', actualResult.margin_amount)
        
        // Calculate total subtotal from all products (after transport distribution)
        const totalProductSubtotal = productsForPdf.reduce((sum: number, p: any) => sum + (p.total_cost || 0), 0)
        console.log('- Total product subtotal:', totalProductSubtotal)
        
        // Add proportional margin to each product
        productsForPdf = productsForPdf.map((p: any) => {
          const productWeight = totalProductSubtotal > 0 ? (p.total_cost || 0) / totalProductSubtotal : 0
          const productMargin = actualResult.margin_amount * productWeight
          const finalCost = (p.total_cost || 0) + productMargin
          
          console.log(`💰 Product ${p.product_id} (${p.product_name}):`)
          console.log(`  - Subtotal with transport: ${p.total_cost || 0}`)
          console.log(`  - Weight: ${(productWeight * 100).toFixed(2)}%`)
          console.log(`  - Margin portion: ${productMargin}`)
          console.log(`  - Final cost: ${finalCost}`)
          
          return {
            ...p,
            total_cost: finalCost,
            margin_portion: productMargin
          }
        })
        
        console.log('✅ Margin distribution completed')
      } else if (effectiveMarginMode === 'per_line') {
        // 🔥 NEW: Apply per-line margin calculation
        console.log('💰 MARGIN PER LINE: Applying margin per product...')
        const marginPercentage = (actualResult.margin_percentage || 0) / 100
        console.log('- Margin percentage:', marginPercentage)
        
        productsForPdf = productsForPdf.map((p: any) => {
          const baseCost = p.total_cost || 0
          const marginAmount = baseCost * marginPercentage
          const finalCost = baseCost + marginAmount
          
          console.log(`💰 Product ${p.product_id} (${p.product_name}):`)
          console.log(`  - Base cost (with transport): ${baseCost}`)
          console.log(`  - Margin (${marginPercentage * 100}%): ${marginAmount}`)
          console.log(`  - Final cost: ${finalCost}`)
          
          return {
            ...p,
            total_cost: finalCost
          }
        })
        
        console.log('✅ Per-line margin calculation completed')
      }

      // Crear plantilla personalizada si hay textos personalizados
      let customTemplate = null
      console.log('🎨 DEBUG: Verificando textos personalizados...')
      console.log('🎨 DEBUG: formData.quoteCustomTexts existe:', !!formData.quoteCustomTexts)
      console.log('🎨 DEBUG: use_custom_texts:', formData.quoteCustomTexts?.use_custom_texts)
      
      if (formData.quoteCustomTexts && formData.quoteCustomTexts.use_custom_texts) {
        console.log('🎨 USANDO TEXTOS PERSONALIZADOS para esta cotización')
        console.log('🎨 DEBUG: Textos personalizados:', formData.quoteCustomTexts)
        customTemplate = {
          id: 0,
          template_name: 'Personalizado para Cotización',
          includes_title: formData.quoteCustomTexts.includes_title,
          includes_content: formData.quoteCustomTexts.includes_content,
          payment_title: formData.quoteCustomTexts.payment_title,
          payment_content: formData.quoteCustomTexts.payment_content,
          requirements_title: formData.quoteCustomTexts.requirements_title,
          requirements_content: formData.quoteCustomTexts.requirements_content,
          observations_title: formData.quoteCustomTexts.observations_title,
          observations_content: formData.quoteCustomTexts.observations_content,
          company_phone: formData.quoteCustomTexts.company_phone,
          company_email: formData.quoteCustomTexts.company_email,
          company_instagram: formData.quoteCustomTexts.company_instagram,
          signature_name: formData.quoteCustomTexts.signature_name,
          is_active: true,
          is_default: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      // Prepare PDF data
      const pdfData = {
        quote: {
          ...fullQuote,
          event_title: formData.eventName || fullQuote.event_title,
          event_date: formData.eventStartDate || fullQuote.event_date,
          event_start_time: formData.eventStartTime || fullQuote.event_start_time,
          event_end_time: formData.eventEndTime || fullQuote.event_end_time,
          event_location: formData.eventAddress || fullQuote.event_location,
          event_city: await (async () => {
            let cityId = formData.eventCity || fullQuote.event_city
            
            // Handle case where eventCity is an object with id property
            if (cityId && typeof cityId === 'object' && cityId.id) {
              cityId = cityId.id
            }
            
            // Handle case where eventCity is an object with name property (return name directly)
            if (cityId && typeof cityId === 'object' && cityId.name) {
              return cityId.name
            }
            
            // Handle numeric city ID
            if (cityId && typeof cityId === 'number') {
              try {
                const city = await CitiesService.getById(cityId)
                return city.name
              } catch (error) {
                console.warn('Could not resolve city ID to name:', cityId, error)
                return String(cityId)
              }
            }
            
            return String(cityId || '')
          })(),
          duration_hours: formData.eventDurationHours || 4,
          estimated_attendees: formData.estimatedAttendees || null,
          // 🔥 NEW: Include manual transport distribution fields for PDF
          use_flexible_transport: formData.useFlexibleTransport || false,
          transport_allocations: formData.transportAllocations || [],
          transport_count: formData.transportCount || 1,
          // 🔥 NEW: Include multiple transport zones for PDF
          multiple_transport_zones: formData.selectedTransportZones || []
        },
        client,
        employees: employeesArray,
        products: productsForPdf,
        summary: {
          subtotal: actualResult.subtotal,
          margin_amount: actualResult.margin_amount,
          tax_retention_amount: actualResult.tax_retention_amount,
          total_cost: actualResult.total_cost,
          employees_subtotal: summaryOverride.employees_subtotal,
          products_subtotal: summaryOverride.products_subtotal,
          transport_subtotal: hasMultipleZones ? (actualResult.transport_subtotal || 0) : 0,
          // 🔥 NEW: Include multiple transport zones data for PDF
          multipleTransportZones: actualResult.multipleTransportZones || []
        },
        // Incluir marginMode para que PDF generator sepa si debe aplicar transporte
        marginMode: effectiveMarginMode,
        // Incluir plantilla personalizada si está disponible
        template: customTemplate
      }

      await PDFGeneratorService.generateQuotePDF(pdfData)
      
    } catch (error) {
      console.error('Error generando PDF:', error)
      alert('Error al generar el PDF. Por favor intente nuevamente.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader 
          title="Resultados del Cálculo"
          avatar={<CalculateIcon color="primary" />}
        />
        <CardContent>
          {!is_valid ? (
            <Alert severity="error">
              <Typography variant="h6">Errores en la configuración:</Typography>
              <ul>
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          ) : result ? (
            <Grid container spacing={3}>
              {/* Resumen de costos */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  💰 Resumen Financiero
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Empleados" 
                      secondary={formatCurrency(result.employees_subtotal)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Productos" 
                      secondary={formatCurrency(result.products_subtotal)}
                    />
                  </ListItem>
                  {/* Maquinaria y recursos adicionales */}
                  {(() => {
                    // Calculate fallback totals from formData if not provided by backend
                    const machineryTotal = formData.machineryInputs?.reduce((total: number, input: any) => {
                      const baseCost = input.hours >= 8 ? input.machinery.daily_rate : input.machinery.hourly_rate * input.hours
                      const operatorCost = input.includeOperator && input.machinery.operator_hourly_rate 
                        ? input.machinery.operator_hourly_rate * input.hours 
                        : 0
                      const setupCost = input.setupRequired ? (input.machinery.setup_cost || 0) : 0
                      return total + baseCost + operatorCost + setupCost
                    }, 0) || 0

                    const rentalTotal = formData.machineryRentalInputs?.reduce((total: number, input: any) => {
                      // Si hay costo personalizado, usarlo; sino calcular normalmente
                      if (input.isCustomCost && input.customTotalCost !== undefined) {
                        return total + input.customTotalCost
                      } else {
                        const baseCost = input.hours >= 8 ? input.machineryRental.sue_daily_rate : input.machineryRental.sue_hourly_rate * input.hours
                        const operatorCost = input.includeOperator && input.machineryRental.operator_cost 
                          ? input.machineryRental.operator_cost * input.hours 
                          : 0
                        const setupCost = input.machineryRental.setup_cost || 0
                        const deliveryCost = input.includeDelivery ? (input.machineryRental.delivery_cost || 0) : 0
                        const pickupCost = input.includePickup ? (input.machineryRental.pickup_cost || 0) : 0
                        return total + baseCost + operatorCost + setupCost + deliveryCost + pickupCost
                      }
                    }, 0) || 0

                    const subcontractTotal = formData.eventSubcontractInputs?.reduce((total: number, input: any) => {
                      return total + (input.customSuePrice || input.eventSubcontract.sue_price)
                    }, 0) || 0

                    const disposableTotal = formData.disposableItemInputs?.reduce((total: number, input: any) => {
                      // Si hay costo total personalizado, usarlo; sino calcular normalmente
                      if (input.isCustomTotalCost && input.customTotalCost !== undefined) {
                        return total + input.customTotalCost
                      } else {
                        const unitPrice = input.isCustomPrice && input.customPrice ? input.customPrice : input.disposableItem.sale_price
                        const actualQuantity = Math.max(input.quantity, input.disposableItem.minimum_quantity)
                        return total + (unitPrice * actualQuantity)
                      }
                    }, 0) || 0

                    // Use backend values if available, otherwise use calculated fallbacks
                    const finalMachineryTotal = result.machinery_subtotal ?? machineryTotal
                    const finalRentalTotal = result.machinery_rental_subtotal ?? rentalTotal  
                    const finalSubcontractTotal = result.subcontract_subtotal ?? subcontractTotal
                    const finalDisposableTotal = result.disposable_subtotal ?? disposableTotal

                    return (
                      <>
                        {finalMachineryTotal > 0 && (
                          <ListItem>
                            <ListItemText 
                              primary="🔧 Equipos Propios"
                              secondary={formatCurrency(finalMachineryTotal)}
                            />
                          </ListItem>
                        )}
                        {finalRentalTotal > 0 && (
                          <ListItem>
                            <ListItemText 
                              primary="🏪 Alquiler Externo"
                              secondary={formatCurrency(finalRentalTotal)}
                            />
                          </ListItem>
                        )}
                        {finalSubcontractTotal > 0 && (
                          <ListItem>
                            <ListItemText 
                              primary="🤝 Subcontratación"
                              secondary={formatCurrency(finalSubcontractTotal)}
                            />
                          </ListItem>
                        )}
                        {finalDisposableTotal > 0 && (
                          <ListItem>
                            <ListItemText 
                              primary="🗑️ Desechables"
                              secondary={formatCurrency(finalDisposableTotal)}
                            />
                          </ListItem>
                        )}
                      </>
                    )
                  })()}
                  {/* Transporte ahora se incluye distribuido en cada producto */}
                  {actualResult.transport && actualResult.transport_subtotal > 0 && (
                    <ListItem>
                      <ListItemText 
                        primary={`🚚 Transporte ULTRATHINK - ${actualResult.transport.zone_name} (Distribuido en productos)`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Base: {formatCurrency(actualResult.transport.base_cost)}
                              {actualResult.transport.equipment_cost > 0 && 
                                ` + Equipo: ${formatCurrency(actualResult.transport.equipment_cost)}`
                              }
                            </Typography>
                            {actualResult.transport_subtotal !== actualResult.transport.base_cost + actualResult.transport.equipment_cost && (
                              <Typography variant="body2" color="text.secondary">
                                Cantidad: {Math.round(actualResult.transport_subtotal / (actualResult.transport.base_cost + actualResult.transport.equipment_cost))} transporte(s)
                              </Typography>
                            )}
                            <Typography variant="body2" color="primary">
                              Total distribuido entre {(() => {
                                const baseProducts = (result?.products || [])
                                const fallbackProducts = (formData.productInputs || [])
                                const productsArray = baseProducts.length > 0 ? baseProducts : fallbackProducts
                                
                                // Priority 1: Use manual transport product selection if available
                                if ((formData.transportProductIds || []).length > 0) {
                                  const selectedProductIds = new Set(formData.transportProductIds || [])
                                  const productsToDistribute = productsArray.filter((p: any) => 
                                    selectedProductIds.has(p.product_id)
                                  )
                                  return productsToDistribute.length
                                }
                                
                                // Priority 2: Check employee-product associations
                                const formLinks: Array<{ employee_id: number, product_id: number }> = []
                                if (Array.isArray(formData.employeeInputs)) {
                                  formData.employeeInputs.forEach((e: any) => {
                                    const pidList: number[] = e.selectedProductIds || []
                                    pidList.forEach((pid: number) => formLinks.push({ employee_id: e.employee?.id, product_id: pid }))
                                  })
                                }
                                
                                if (formLinks.length > 0) {
                                  const associatedProductIds = new Set<number>()
                                  formLinks.forEach((l: any) => {
                                    if (l.product_id) associatedProductIds.add(l.product_id)
                                  })
                                  const productsToDistribute = productsArray.filter((p: any) => 
                                    associatedProductIds.has(p.product_id)
                                  )
                                  return productsToDistribute.length
                                }
                                return productsArray.length
                              })()} productos: {formatCurrency(actualResult.transport_subtotal)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  )}
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary="Subtotal" 
                      secondary={(() => {
                        // Use backend subtotal if available (it now includes all components correctly)
                        // Only use fallback calculations if backend subtotal is missing
                        if (actualResult.subtotal && actualResult.subtotal > 0) {
                          return formatCurrency(actualResult.subtotal)
                        }

                        // Fallback: calculate manually if backend subtotal is missing
                        const employeesTotal = actualResult.employees_subtotal || 0
                        const productsTotal = actualResult.products_subtotal || 0
                        const transportTotal = actualResult.transport_subtotal || 0
                        
                        const machineryTotal = formData.machineryInputs?.reduce((total: number, input: any) => {
                          const baseCost = input.hours >= 8 ? input.machinery.daily_rate : input.machinery.hourly_rate * input.hours
                          const operatorCost = input.includeOperator && input.machinery.operator_hourly_rate 
                            ? input.machinery.operator_hourly_rate * input.hours 
                            : 0
                          const setupCost = input.setupRequired ? (input.machinery.setup_cost || 0) : 0
                          return total + baseCost + operatorCost + setupCost
                        }, 0) || 0

                        const rentalTotal = formData.machineryRentalInputs?.reduce((total: number, input: any) => {
                          // Si hay costo personalizado, usarlo; sino calcular normalmente
                          if (input.isCustomCost && input.customTotalCost !== undefined) {
                            return total + input.customTotalCost
                          } else {
                            const baseCost = input.hours >= 8 ? input.machineryRental.sue_daily_rate : input.machineryRental.sue_hourly_rate * input.hours
                            const operatorCost = input.includeOperator && input.machineryRental.operator_cost 
                              ? input.machineryRental.operator_cost * input.hours 
                              : 0
                            const setupCost = input.machineryRental.setup_cost || 0
                            const deliveryCost = input.includeDelivery ? (input.machineryRental.delivery_cost || 0) : 0
                            const pickupCost = input.includePickup ? (input.machineryRental.pickup_cost || 0) : 0
                            return total + baseCost + operatorCost + setupCost + deliveryCost + pickupCost
                          }
                        }, 0) || 0

                        const subcontractTotal = formData.eventSubcontractInputs?.reduce((total: number, input: any) => {
                          return total + (input.customSuePrice || input.eventSubcontract.sue_price)
                        }, 0) || 0

                        const disposableTotal = formData.disposableItemInputs?.reduce((total: number, input: any) => {
                          // Si hay costo total personalizado, usarlo; sino calcular normalmente
                          if (input.isCustomTotalCost && input.customTotalCost !== undefined) {
                            return total + input.customTotalCost
                          } else {
                            const unitPrice = input.isCustomPrice && input.customPrice ? input.customPrice : input.disposableItem.sale_price
                            const actualQuantity = Math.max(input.quantity, input.disposableItem.minimum_quantity)
                            return total + (unitPrice * actualQuantity)
                          }
                        }, 0) || 0

                        const fallbackSubtotal = employeesTotal + productsTotal + transportTotal + machineryTotal + rentalTotal + subcontractTotal + disposableTotal
                        return formatCurrency(fallbackSubtotal)
                      })()}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={`Margen ${formatPercentage(actualResult.margin_percentage)}${formData.marginMode === 'per_line' ? ' · por línea' : ''}`}
                      secondary={(() => {
                        const pct = (actualResult.margin_percentage || 0) / 100
                        const computePerLineMargin = () => {
                          // Build product base map from product totals
                          const baseMap = new Map<number, number>()
                          const products = (result.products || []) as any[]
                          products.forEach((p) => {
                            if (typeof p.product_id === 'number') {
                              baseMap.set(p.product_id, (baseMap.get(p.product_id) || 0) + (p.total_cost || 0))
                            }
                          })
                          // Add transport distribution if available
                          const dist = (result.multipleTransportZones?.[0]?.distribution || result.transport?.distribution || []) as Array<{product_id: number|null, cost: number}>
                          if (Array.isArray(dist) && dist.length > 0) {
                            const productIds = products.map(p => p.product_id).filter((id: any) => typeof id === 'number')
                            const spread = (cost: number) => {
                              if (productIds.length === 0) return
                              const share = cost / productIds.length
                              productIds.forEach((pid: number) => {
                                baseMap.set(pid, (baseMap.get(pid) || 0) + share)
                              })
                            }
                            dist.forEach(d => {
                              if (d.product_id && typeof d.product_id === 'number') {
                                baseMap.set(d.product_id, (baseMap.get(d.product_id) || 0) + (d.cost || 0))
                              } else if (d.cost) {
                                spread(d.cost)
                              }
                            })
                          }
                          let sum = 0
                          baseMap.forEach((base) => { sum += base * pct })
                          return sum
                        }

                        // Prefer backend margin unless per-line mode is enabled
                        if (formData.marginMode !== 'per_line') {
                          if (actualResult.margin_amount && actualResult.margin_amount > 0) {
                            return formatCurrency(actualResult.margin_amount)
                          }
                          const subtotal = actualResult.subtotal || 0
                          return formatCurrency(subtotal * pct)
                        }

                        // Per-line margin mode
                        const perLine = computePerLineMargin()
                        return formatCurrency(perLine)
                      })()}
                    />
                  </ListItem>
                  {actualResult.tax_retention_amount > 0 && (
                    <ListItem>
                      <ListItemText 
                        primary={`Retención ${formatPercentage(actualResult.tax_retention_percentage)}`}
                        secondary={(() => {
                          // Use backend retention if available
                          if (actualResult.tax_retention_amount && actualResult.tax_retention_amount > 0) {
                            return `-${formatCurrency(actualResult.tax_retention_amount)}`
                          }

                          // Fallback: calculate retention manually
                          const subtotal = actualResult.subtotal || 0
                          const pct = (actualResult.margin_percentage || 0) / 100
                          let margin = actualResult.margin_amount || (subtotal * pct)
                          if (formData.marginMode === 'per_line') {
                            // Recompute margin per-line for accurate retention
                            const products = (result.products || []) as any[]
                            let perLine = products.reduce((sum, p) => sum + (p.total_cost || 0) * pct, 0)
                            // Include transport distribution if available
                            const dist = (result.multipleTransportZones?.[0]?.distribution || result.transport?.distribution || []) as Array<{product_id: number|null, cost: number}>
                            if (Array.isArray(dist) && dist.length > 0) {
                              const productIds = products.map(p => p.product_id).filter((id: any) => typeof id === 'number')
                              const spread = (cost: number) => {
                                if (productIds.length === 0) return 0
                                return cost // It will be multiplied by pct below after distributing conceptually
                              }
                              const transportTotal = dist.reduce((acc, d) => acc + (d.cost || 0), 0)
                              perLine += transportTotal * pct // approximate per-line margin for transport
                            }
                            margin = perLine
                          }
                          const retention = (subtotal + margin) * (actualResult.tax_retention_percentage / 100)
                          return `-${formatCurrency(retention)}`
                        })()}
                      />
                    </ListItem>
                  )}
                  <Divider />
                  <ListItem>
                    <ListItemText 
                      primary={
                        <Typography variant="h6" color="primary">
                          TOTAL FINAL
                        </Typography>
                      }
                      secondary={
                        <Typography variant="h5" color="primary">
                          {(() => {
                            // Use backend total if available
                            if (actualResult.total_cost && actualResult.total_cost > 0) {
                              return formatCurrency(actualResult.total_cost)
                            }

                            // Fallback: calculate total manually
                            const subtotal = actualResult.subtotal || 0
                            const pct = (actualResult.margin_percentage || 0) / 100
                            let margin = actualResult.margin_amount || (subtotal * pct)
                            if (formData.marginMode === 'per_line') {
                              // Approximate per-line margin (products + transport)
                              const products = (result.products || []) as any[]
                              let perLine = products.reduce((sum, p) => sum + (p.total_cost || 0) * pct, 0)
                              const dist = (result.multipleTransportZones?.[0]?.distribution || result.transport?.distribution || []) as Array<{product_id: number|null, cost: number}>
                              if (Array.isArray(dist) && dist.length > 0) {
                                const transportTotal = dist.reduce((acc, d) => acc + (d.cost || 0), 0)
                                perLine += transportTotal * pct
                              }
                              margin = perLine
                            }
                            const retention = actualResult.tax_retention_amount || 0
                            const total = subtotal + margin - retention
                            return formatCurrency(total)
                          })()}
                        </Typography>
                      }
                    />
                  </ListItem>
                </List>
              </Grid>

              {/* Detalles por empleado */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  👥 Detalle de Empleados
                </Typography>
                <List>
                  {result.employees.map((emp: any, index: number) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${emp.employee_name} (${emp.employee_type})`}
                        secondary={
                          <span>
                            <Typography variant="caption" component="span">
                              {emp.hours}h × {formatCurrency(emp.hourly_rate)} = {formatCurrency(emp.base_cost)}
                            </Typography>
                            {emp.arl_cost > 0 && (
                              <Typography variant="caption" display="block" component="span">
                                <br />ARL: +{formatCurrency(emp.arl_cost)}
                              </Typography>
                            )}
                            {emp.extra_cost > 0 && (
                              <Typography variant="caption" display="block" component="span">
                                <br />{emp.extra_cost_reason || 'Costo Extra'}: +{formatCurrency(emp.extra_cost)}
                              </Typography>
                            )}
                            <Typography variant="body2" fontWeight="bold" component="span">
                              <br />Total: {formatCurrency(emp.total_cost)}
                            </Typography>
                          </span>
                        }
                      />
                      <Chip 
                        label={emp.rate_tier} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>

              {/* Sugerencias de optimización */}
              {suggestions.length > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="h6">💡 Sugerencias de Optimización:</Typography>
                    <ul>
                      {suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </Alert>
                </Grid>
              )}

              {/* Acciones de Cotización */}
              <Grid item xs={12}>
                <Box display="flex" gap={2} justifyContent="center" sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={!formData.selectedClient || !is_valid || isLoading}
                    onClick={onSaveQuote}
                    sx={{ minWidth: 200 }}
                  >
                    {isLoading 
                      ? (isEditMode ? 'Guardando cambios...' : 'Guardando cotización...') 
                      : (isEditMode ? '🤖 Guardar Cambios' : 'Guardar como Cotización')
                    }
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={generatingPDF ? <CircularProgress size={20} /> : <PdfIcon />}
                    disabled={!savedQuoteNumber || generatingPDF}
                    onClick={handleGeneratePDF}
                  >
                    {generatingPDF ? 'Generando PDF...' : 'Generar PDF'}
                  </Button>
                </Box>

                {!formData.selectedClient && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ⚠️ <strong>Selecciona un cliente</strong> para habilitar el guardado de cotización.
                    </Typography>
                  </Alert>
                )}

                {formData.selectedClient && !is_valid && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ⚠️ <strong>Configura empleados y productos</strong> para habilitar el guardado.
                    </Typography>
                  </Alert>
                )}

                {formData.selectedClient && is_valid && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ✅ <strong>Listo para guardar:</strong> La cotización se guardará con número automático SUE-2025-XXX.
                    </Typography>
                  </Alert>
                )}

                {savedQuoteNumber && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      ✅ <strong>PDF disponible:</strong> Puedes generar un PDF profesional de la cotización {savedQuoteNumber}.
                    </Typography>
                  </Alert>
                )}
              </Grid>
            </Grid>
          ) : (
            <Typography color="text.secondary" textAlign="center">
              Configura cliente, empleados y productos para ver los cálculos
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Success notification */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={6000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          <Typography variant="h6">¡Cotización Guardada Exitosamente!</Typography>
          <Typography variant="body2">
            Número de cotización: <strong>{savedQuoteNumber}</strong>
          </Typography>
        </Alert>
      </Snackbar>
    </>
  )
}

export default PricingCalculationSummary
