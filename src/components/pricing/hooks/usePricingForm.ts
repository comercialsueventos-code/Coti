import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebounce } from '../../../hooks/useDebounce'
import { useQueryClient } from '@tanstack/react-query'
import { useQuotePricing, usePricingOptimization } from '../../../hooks/usePricing'
import { useCreateQuote, QUOTES_QUERY_KEYS } from '../../../hooks/useQuotes'
import { useActiveEmployees } from '../../../hooks/useEmployees'
import { useActiveProducts } from '../../../hooks/useProducts'
import { useMachinery } from '../../../hooks/useMachinery'
import { useSuppliers } from '../../../hooks/useSuppliers'
import { useMachineryRentals } from '../../../hooks/useMachineryRental'
import { useEventSubcontracts } from '../../../hooks/useEventSubcontract'
import { useActiveDisposableItems } from '../../../hooks/useDisposableItems'
import { generateIntelligentQuoteTitle, validateEmployeeProductAssociation, PricingService } from '../../../services/pricing.service'
import { QuotesService } from '../../../services/quotes.service'
import { EmployeeSchedulingService } from '../../../services/employee-scheduling.service'
import { mockEmployees, mockProducts } from '../constants/mockData'
import { PricingFormData, EmployeeInput, ProductInput, MachineryInput, MachineryRentalInput, EventSubcontractInput, DisposableItemInput, TransportZoneInput } from '../types'
import { CreateQuoteData, CreateQuoteItemData, ShiftType } from '../../../types'
import { useUpdateQuote } from '../../../hooks/useQuotes'
import moment from 'moment'

const initialFormData: PricingFormData = {
  selectedClient: null,
  selectedContact: null,
  eventName: '',
  eventStartDate: '',
  eventEndDate: '',
  eventStartTime: '',
  eventEndTime: '',
  selectedDays: [],
  dailySchedules: [],
  eventAddress: '',
  eventCity: '',
  eventDescription: '',
  selectedTransportZone: null, // Deprecated
  selectedTransportZones: [], // Nueva implementación de múltiples zonas
  includeEquipmentTransport: false,
  transportCount: 1,
  transportProductIds: [],
  useFlexibleTransport: false, // Toggle para distribución manual
  transportAllocations: [], // Asignaciones manuales por producto
  marginPercentage: 20,
  marginMode: 'per_line',
  enableRetention: false, // Por defecto no aplicar retención
  retentionPercentage: 4, // Valor por defecto del 4%
  employeeInputs: [],
  productInputs: [],
  machineryInputs: [],
  machineryRentalInputs: [],
  eventSubcontractInputs: [],
  disposableItemInputs: [],
  // Campo para textos personalizados por cotización
  quoteCustomTexts: undefined
}

interface UsePricingFormOptions {
  initialData?: PricingFormData
  isEditMode?: boolean  
  editingQuoteId?: number
}

export const usePricingForm = (options: UsePricingFormOptions = {}) => {
  const { initialData, isEditMode = false, editingQuoteId } = options
  const [formData, setFormData] = useState<PricingFormData>(initialFormData)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [savedQuoteNumber, setSavedQuoteNumber] = useState('')
  const [savedQuoteId, setSavedQuoteId] = useState<number | null>(null)
  const [generatedTitle, setGeneratedTitle] = useState<string>('Evento sin título')

  const createQuoteMutation = useCreateQuote()
  const updateQuoteMutation = useUpdateQuote()
  const queryClient = useQueryClient()

  // 🤖 ULTRATHINK: Initialize form with existing quote data in edit mode
  useEffect(() => {
    if (isEditMode && initialData) {
      // Initializing form with quote data
      setFormData(initialData)
    }
  }, [isEditMode, initialData])

  // 🤖 ULTRATHINK: Auto-generar título inteligente cuando cambien datos relevantes
  useEffect(() => {
    // Solo auto-generar si no hay nombre personalizado
    if (!formData.eventName || formData.eventName === 'Evento sin título') {
      const intelligentTitle = generateIntelligentQuoteTitle({
        client: formData.selectedClient,
        products: formData.productInputs,
        employeeCount: formData.employeeInputs.length,
        eventStartDate: formData.eventStartDate,
        estimatedAttendees: formData.estimatedAttendees,
        eventDescription: formData.eventName
      })
      
      if (intelligentTitle !== generatedTitle) {
        setGeneratedTitle(intelligentTitle)
        // Auto-actualizar el eventName si está vacío o es el default
        if (!formData.eventName || formData.eventName === 'Evento sin título') {
          updateFormData('eventName', intelligentTitle)
        }
      }
    }
  }, [
    formData.selectedClient, 
    formData.productInputs, 
    formData.employeeInputs.length, 
    formData.eventStartDate, 
    formData.estimatedAttendees
  ])
  
  // Get real data from hooks
  const { data: employees = [] } = useActiveEmployees()
  const { data: products = [] } = useActiveProducts()
  const { data: machinery = [] } = useMachinery({ is_active: true, is_available: true })
  const { data: suppliers = [] } = useSuppliers({ is_active: true })
  const { data: machineryRentals = [] } = useMachineryRentals({ is_available: true })
  const { data: eventSubcontracts = [] } = useEventSubcontracts({ is_available: true })
  const { data: disposableItems = [] } = useActiveDisposableItems()

  // ⚡ PERFORMANCE: Memoized updateFormData to prevent unnecessary re-renders
  const updateFormData = useCallback((field: keyof PricingFormData, value: any) => {
    // Guard retention toggle to avoid stale percentages re-enabling on reload
    if (field === 'enableRetention') {
      const enable = Boolean(value)
      setFormData(prev => ({
        ...prev,
        enableRetention: enable,
        retentionPercentage: enable ? (prev.retentionPercentage ?? 0) : 0
      }))
      return
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // ⚡ PERFORMANCE: Debounced time data for auto-updating employee hours
  const debouncedTimeData = useDebounce({
    eventStartDate: formData.eventStartDate,
    eventEndDate: formData.eventEndDate,
    eventStartTime: formData.eventStartTime,
    eventEndTime: formData.eventEndTime,
    selectedDays: formData.selectedDays,
    dailySchedules: formData.dailySchedules
  }, 500)

  // Auto-update employee hours when event dates/times change (debounced)
  useEffect(() => {
    const eventHours = calculateEventHours()
    const selectedDaysCount = debouncedTimeData.selectedDays?.length || 0
    const isMultiDay = debouncedTimeData.eventStartDate && debouncedTimeData.eventEndDate &&
      new Date(debouncedTimeData.eventEndDate) > new Date(debouncedTimeData.eventStartDate)

    // Check if we have the required time information
    const hasValidTimes = isMultiDay
      ? selectedDaysCount > 0 && debouncedTimeData.dailySchedules.length > 0 && debouncedTimeData.dailySchedules.every(day => day.startTime && day.endTime)
      : debouncedTimeData.eventStartTime && debouncedTimeData.eventEndTime

    if (debouncedTimeData.eventStartDate && debouncedTimeData.eventEndDate && hasValidTimes && eventHours > 0) {
      setFormData(prev => ({
        ...prev,
        employeeInputs: prev.employeeInputs.map(emp => ({
          ...emp,
          hours: eventHours
        }))
      }))
    }
  }, [debouncedTimeData])

  // 🔥 FIX: Calculate hours per day (not total hours for multi-day events)
  const calculateHoursPerDay = () => {
    if (!formData.eventStartDate || !formData.eventEndDate) {
      return 0 // Can't calculate without dates
    }
    
    const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    // For multi-day events with individual daily schedules
    if (isMultiDay && formData.dailySchedules.length > 0) {
      let totalHours = 0
      let daysWithSchedule = 0
      
      formData.dailySchedules.forEach(daySchedule => {
        if (daySchedule.startTime && daySchedule.endTime) {
          const [startHour, startMinute] = daySchedule.startTime.split(':').slice(0, 2).map(Number)
          const [endHour, endMinute] = daySchedule.endTime.split(':').slice(0, 2).map(Number)
          
          const startMinutes = startHour * 60 + startMinute
          const endMinutes = endHour * 60 + endMinute
          
          let hoursPerDay = (endMinutes - startMinutes) / 60
          
          // Handle overnight events
          if (hoursPerDay < 0) {
            hoursPerDay += 24
          }
          
          totalHours += Math.max(0.5, hoursPerDay)
          daysWithSchedule++
        }
      })
      
      // Fix: Return total hours for multiday events, not average per day
      return Math.round(totalHours * 2) / 2 // Round total hours to nearest 0.5 hour
    }
    
    // For single-day events
    if (!formData.eventStartTime || !formData.eventEndTime) {
      return 0 // Can't calculate without times
    }
    
    const [startHour, startMinute] = formData.eventStartTime.split(':').slice(0, 2).map(Number)
    const [endHour, endMinute] = formData.eventEndTime.split(':').slice(0, 2).map(Number)
    
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    
    let hoursPerDay = (endMinutes - startMinutes) / 60
    
    // Handle overnight events
    if (hoursPerDay < 0) {
      hoursPerDay += 24
    }
    
    return Math.max(0.5, Math.round(hoursPerDay * 2) / 2) // Round to nearest 0.5 hour
  }

  // Calculate number of event days
  const calculateEventDays = () => {
    if (!formData.eventStartDate || !formData.eventEndDate) {
      return 1 // Default to 1 day if no dates
    }
    
    const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    if (isMultiDay && formData.dailySchedules.length > 0) {
      return formData.dailySchedules.filter(daySchedule => 
        daySchedule.startTime && daySchedule.endTime
      ).length
    }
    
    return 1 // Single day event
  }

  // 🔥 FIX: Calculate event hours for display (backward compatibility)
  const calculateEventHours = () => {
    const isMultiDay = formData.eventStartDate && formData.eventEndDate && 
      new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    // For multiday events with individual schedules, calculateHoursPerDay() already returns total
    if (isMultiDay && formData.dailySchedules.length > 0) {
      return calculateHoursPerDay() // Already returns total hours, don't multiply
    }
    
    // For single-day events, multiply hours by days (backward compatibility)
    return calculateHoursPerDay() * calculateEventDays()
  }

  // 🤖 ULTRATHINK: Helper functions for quote item creation
  const getEmployeeRateForHours = (employee: any, hours: number): number => {
    // First try category rates (new system)
    if (employee.category?.default_hourly_rates) {
      const applicableRate = employee.category.default_hourly_rates.find((rate: any) => 
        hours >= rate.min_hours && (rate.max_hours === null || hours <= rate.max_hours)
      )
      if (applicableRate) return applicableRate.rate
    }
    
    // Fallback to individual rates (legacy system)
    if (employee.hourly_rates) {
      if (Array.isArray(employee.hourly_rates)) {
        // New array format
        const applicableRate = employee.hourly_rates.find((rate: any) => 
          hours >= rate.min_hours && (rate.max_hours === null || hours <= rate.max_hours)
        )
        return applicableRate?.rate || 0
      } else {
        // Legacy object format
        if (hours <= 4) return employee.hourly_rates['1-4h'] || 0
        if (hours <= 8) return employee.hourly_rates['4-8h'] || 0
        return employee.hourly_rates['8h+'] || 0
      }
    }
    
    return 0
  }

  const calculateEmployeeCost = (employee: any, hours: number): number => {
    const rate = getEmployeeRateForHours(employee, hours)
    return rate * hours
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // ⚡ PERFORMANCE: Memoized addEmployee to prevent unnecessary re-renders
  const addEmployee = useCallback(() => {
    const eventHours = calculateEventHours()
    // Use the first available employee, fallback to mock if no real employees
    const defaultEmployee = employees.length > 0 ? employees[0] : mockEmployees[0]

    const newEmployee: EmployeeInput = {
      employee: defaultEmployee,
      hours: eventHours > 0 ? eventHours : 1, // Default to 1 if no event hours calculated
      includeARL: defaultEmployee.has_arl || false, // Default to employee's ARL status
      extraCost: defaultEmployee.default_extra_cost || undefined,
      extraCostReason: defaultEmployee.default_extra_cost_reason || undefined,
      selectedProductIds: []
    }
    setFormData(prev => ({
      ...prev,
      employeeInputs: [...prev.employeeInputs, newEmployee]
    }))
  }, [employees, formData.eventStartDate, formData.eventEndDate, formData.eventStartTime, formData.eventEndTime, formData.selectedDays])

  // ⚡ PERFORMANCE: Memoized removeEmployee to prevent unnecessary re-renders
  const removeEmployee = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      employeeInputs: prev.employeeInputs.filter((_, i) => i !== index)
    }))
  }, [])

  // ⚡ PERFORMANCE: Memoized updateEmployee to prevent unnecessary re-renders
  const updateEmployee = useCallback((index: number, field: keyof EmployeeInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      employeeInputs: prev.employeeInputs.map((emp, i) =>
        i === index ? { ...emp, [field]: value } : emp
      )
    }))
  }, [])

  // ⚡ PERFORMANCE: Memoized addProduct to prevent unnecessary re-renders
  const addProduct = useCallback(() => {
    // Use the first available product, fallback to mock if no real products
    const defaultProduct = products.length > 0 ? products[0] : mockProducts[0]

    const newProduct: ProductInput = {
      product: defaultProduct,
      quantity: defaultProduct.minimum_order || 1,
      unitsPerProduct: defaultProduct.pricing_type === 'measurement' ? 1 : undefined,
      isVariable: false
    }
    setFormData(prev => ({
      ...prev,
      productInputs: [...prev.productInputs, newProduct]
    }))
  }, [products])

  // ⚡ PERFORMANCE: Memoized removeProduct to prevent unnecessary re-renders
  const removeProduct = useCallback((index: number) => {
    setFormData(prev => {
      const removedProduct = prev.productInputs[index]
      const removedProductId = removedProduct?.product.id

      return {
        ...prev,
        productInputs: prev.productInputs.filter((_, i) => i !== index),
        // Limpiar asociaciones de desechables con el producto eliminado
        disposableItemInputs: prev.disposableItemInputs.map(item =>
          item.associatedProductId === removedProductId
            ? { ...item, associatedProductId: undefined }
            : item
        ),
        // Limpiar asociaciones de alquileres con el producto eliminado
        machineryRentalInputs: prev.machineryRentalInputs.map(rental =>
          rental.associatedProductId === removedProductId
            ? { ...rental, associatedProductId: undefined }
            : rental
        )
      }
    })
  }, [])

  // ⚡ PERFORMANCE: Memoized updateProduct to prevent unnecessary re-renders
  const updateProduct = useCallback((index: number, field: keyof ProductInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      productInputs: prev.productInputs.map((prod, i) =>
        i === index ? { ...prod, [field]: value } : prod
      )
    }))
  }, [])

  // Keep employee->product associations in sync when products list changes
  useEffect(() => {
    const validIds = new Set(formData.productInputs.map(p => p.product.id))
    const updatedEmployees = formData.employeeInputs.map(e => ({
      ...e,
      selectedProductIds: (e.selectedProductIds || []).filter(id => validIds.has(id))
    }))
    // only update if changed
    const changed = JSON.stringify(updatedEmployees.map(e => e.selectedProductIds || [])) !== JSON.stringify(formData.employeeInputs.map(e => e.selectedProductIds || []))
    if (changed) {
      setFormData(prev => ({ ...prev, employeeInputs: updatedEmployees }))
    }
  }, [formData.productInputs])

  // Keep disposable->product associations in sync when products list changes
  useEffect(() => {
    const validIds = new Set(formData.productInputs.map(p => p.product.id))
    const updatedDisposables = formData.disposableItemInputs.map(item => ({
      ...item,
      associatedProductId: item.associatedProductId && validIds.has(item.associatedProductId) 
        ? item.associatedProductId 
        : undefined
    }))
    // only update if changed
    const changed = JSON.stringify(updatedDisposables.map(d => d.associatedProductId)) !== JSON.stringify(formData.disposableItemInputs.map(d => d.associatedProductId))
    if (changed) {
      setFormData(prev => ({ ...prev, disposableItemInputs: updatedDisposables }))
    }
  }, [formData.productInputs])

  // Keep machinery rental->product associations in sync when products list changes
  useEffect(() => {
    const validIds = new Set(formData.productInputs.map(p => p.product.id))
    const updatedRentals = formData.machineryRentalInputs.map(rental => ({
      ...rental,
      associatedProductId: rental.associatedProductId && validIds.has(rental.associatedProductId) 
        ? rental.associatedProductId 
        : undefined
    }))
    // only update if changed
    const changed = JSON.stringify(updatedRentals.map(r => r.associatedProductId)) !== JSON.stringify(formData.machineryRentalInputs.map(r => r.associatedProductId))
    if (changed) {
      setFormData(prev => ({ ...prev, machineryRentalInputs: updatedRentals }))
    }
  }, [formData.productInputs])

  // Machinery functions
  const addMachinery = () => {
    const eventHours = calculateEventHours()
    const defaultMachinery = machinery.length > 0 ? machinery[0] : null
    
    if (!defaultMachinery) return
    
    const newMachineryInput: MachineryInput = {
      machinery: defaultMachinery,
      hours: eventHours > 0 ? eventHours : 1,
      includeOperator: defaultMachinery.requires_operator,
      setupRequired: (defaultMachinery.setup_cost || 0) > 0
    }
    setFormData(prev => ({
      ...prev,
      machineryInputs: [...prev.machineryInputs, newMachineryInput]
    }))
  }

  const removeMachinery = (index: number) => {
    setFormData(prev => ({
      ...prev,
      machineryInputs: prev.machineryInputs.filter((_, i) => i !== index)
    }))
  }

  const updateMachinery = (index: number, field: keyof MachineryInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      machineryInputs: prev.machineryInputs.map((mach, i) => 
        i === index ? { ...mach, [field]: value } : mach
      )
    }))
  }

  // Machinery Rental functions
  const addMachineryRental = () => {
    const eventHours = calculateEventHours()
    const defaultRental = machineryRentals.length > 0 ? machineryRentals[0] : null
    
    if (!defaultRental) return
    
    const newRentalInput: MachineryRentalInput = {
      machineryRental: defaultRental,
      hours: eventHours > 0 ? eventHours : defaultRental.minimum_rental_hours,
      includeOperator: defaultRental.requires_operator,
      includeDelivery: (defaultRental.delivery_cost || 0) > 0,
      includePickup: (defaultRental.pickup_cost || 0) > 0,
      customMarginPercentage: undefined,
      isCustomCost: false,
      customTotalCost: undefined,
      associatedProductId: undefined
    }
    setFormData(prev => ({
      ...prev,
      machineryRentalInputs: [...prev.machineryRentalInputs, newRentalInput]
    }))
  }

  const removeMachineryRental = (index: number) => {
    setFormData(prev => ({
      ...prev,
      machineryRentalInputs: prev.machineryRentalInputs.filter((_, i) => i !== index)
    }))
  }

  const updateMachineryRental = (index: number, field: keyof MachineryRentalInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      machineryRentalInputs: prev.machineryRentalInputs.map((rental, i) => 
        i === index ? { ...rental, [field]: value } : rental
      )
    }))
  }

  // Event Subcontract functions
  const addEventSubcontract = () => {
    const defaultSubcontract = eventSubcontracts.length > 0 ? eventSubcontracts[0] : null
    
    if (!defaultSubcontract) return
    
    const newSubcontractInput: EventSubcontractInput = {
      eventSubcontract: defaultSubcontract,
      attendees: undefined,
      customSupplierCost: undefined,
      customSuePrice: undefined,
      customMarginPercentage: undefined,
      notes: undefined
    }
    setFormData(prev => ({
      ...prev,
      eventSubcontractInputs: [...prev.eventSubcontractInputs, newSubcontractInput]
    }))
  }

  const removeEventSubcontract = (index: number) => {
    setFormData(prev => ({
      ...prev,
      eventSubcontractInputs: prev.eventSubcontractInputs.filter((_, i) => i !== index)
    }))
  }

  const updateEventSubcontract = (index: number, field: keyof EventSubcontractInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      eventSubcontractInputs: prev.eventSubcontractInputs.map((subcontract, i) => 
        i === index ? { ...subcontract, [field]: value } : subcontract
      )
    }))
  }

  // Disposable Item functions
  const addDisposableItem = () => {
    const defaultItem = disposableItems.length > 0 ? disposableItems[0] : null
    
    if (!defaultItem) return
    
    const newItemInput: DisposableItemInput = {
      disposableItem: defaultItem,
      quantity: defaultItem.minimum_quantity,
      isCustomPrice: false,
      customPrice: undefined,
      customReason: undefined,
      isCustomTotalCost: false,
      customTotalCost: undefined,
      associatedProductId: undefined
    }
    setFormData(prev => ({
      ...prev,
      disposableItemInputs: [...prev.disposableItemInputs, newItemInput]
    }))
  }

  const removeDisposableItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      disposableItemInputs: prev.disposableItemInputs.filter((_, i) => i !== index)
    }))
  }

  const updateDisposableItem = (index: number, field: keyof DisposableItemInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      disposableItemInputs: prev.disposableItemInputs.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const buildPricingInput = () => {
    if (!formData.selectedClient || !formData.eventStartDate || !formData.eventEndDate || 
        formData.employeeInputs.length === 0 || formData.productInputs.length === 0) {
      return null
    }

    // Check time requirements based on event type
    const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    const hasValidTimes = isMultiDay
      ? formData.selectedDays && formData.selectedDays.length > 0 && 
        formData.dailySchedules.length === formData.selectedDays.length && 
        formData.dailySchedules.every(day => day.startTime && day.endTime)
      : formData.eventStartTime && formData.eventEndTime
    
    if (!hasValidTimes) {
      return null
    }

    // Sanitize retention inputs based on toggle
    const enableRetention = !!formData.enableRetention
    const retentionPct = enableRetention ? Number(formData.retentionPercentage || 0) : 0

    return {
      client: formData.selectedClient,
      event_title: formData.eventName || 'Evento sin título',
      event_date: formData.eventStartDate, // Campo requerido por la validación
      event_start_date: formData.eventStartDate,
      event_end_date: formData.eventEndDate,
      event_start_time: formData.eventStartTime || undefined,
      event_end_time: formData.eventEndTime || undefined,
      event_location: formData.eventAddress || undefined,
      event_description: formData.eventDescription || undefined,
      transport: formData.selectedTransportZone ? {
        zone_id: formData.selectedTransportZone.id,
        requires_equipment: formData.includeEquipmentTransport || false,
        equipment_count: formData.transportCount || 1
      } : undefined,
      // Nueva implementación de múltiples zonas
      transportZones: formData.selectedTransportZones || [],
      transport_product_ids: formData.transportProductIds, // Manual selection of products for transport
      use_flexible_transport: formData.useFlexibleTransport, // Toggle para distribución manual
      transport_allocations: formData.transportAllocations, // Asignaciones manuales por producto
      margin_percentage: formData.marginPercentage,
      // Respect enableRetention; zero percentage when disabled
      enable_retention: (() => {
        const payload = {
          enable_retention: enableRetention,
          retention_percentage: retentionPct,
          margin_percentage: formData.marginPercentage
        }
        // console.log('🔍 INPUT TO PRICING SERVICE:', payload) // Debug log disabled
        return enableRetention
      })(),
      retention_percentage: retentionPct,
      employees: formData.employeeInputs.map(emp => ({
        employee: emp.employee,
        hours: emp.hours,
        includeARL: emp.includeARL,
        extraCost: emp.extraCost,
        extraCostReason: emp.extraCostReason
      })),
      products: formData.productInputs.map(prod => ({
        product: prod.product,
        quantity: prod.quantity,
        measurement_per_unit: prod.unitsPerProduct,
        custom_price: prod.isVariable ? prod.customPrice : undefined,
        custom_reason: prod.isVariable ? prod.customReason : undefined
      })),
      machinery: formData.machineryInputs.map(mach => ({
        machinery: mach.machinery,
        hours: mach.hours,
        includeOperator: mach.includeOperator,
        setupRequired: mach.setupRequired
      })),
      machineryRentals: formData.machineryRentalInputs.map(rental => ({
        machineryRental: rental.machineryRental,
        hours: rental.hours,
        includeOperator: rental.includeOperator,
        includeDelivery: rental.includeDelivery,
        includePickup: rental.includePickup,
        customMarginPercentage: rental.customMarginPercentage,
        isCustomCost: rental.isCustomCost,
        customTotalCost: rental.customTotalCost
      })),
      eventSubcontracts: formData.eventSubcontractInputs.map(sub => ({
        eventSubcontract: sub.eventSubcontract,
        attendees: sub.attendees,
        customSupplierCost: sub.customSupplierCost,
        customSuePrice: sub.customSuePrice,
        customMarginPercentage: sub.customMarginPercentage,
        notes: sub.notes
      })),
      disposableItems: formData.disposableItemInputs.map(item => ({
        disposableItem: item.disposableItem,
        quantity: item.quantity,
        isCustomPrice: item.isCustomPrice,
        customPrice: item.customPrice,
        customReason: item.customReason,
        isCustomTotalCost: item.isCustomTotalCost,
        customTotalCost: item.customTotalCost,
        associatedProductId: item.associatedProductId
      })),
      // FIX: Send daily schedules for multiday events (Story 1.4) 
      daily_schedules: isMultiDay && formData.dailySchedules && formData.dailySchedules.length > 0 
        ? formData.dailySchedules.map(schedule => ({
            date: schedule.date,
            startTime: schedule.startTime,
            endTime: schedule.endTime
          }))
        : undefined
    }
  }

  // 🚀 PERFORMANCE: Memoize pricing input to prevent excessive recalculations
  const pricingInput = useMemo(() => {
    return buildPricingInput()
  }, [
    formData.selectedClient,
    formData.eventStartDate,
    formData.eventEndDate,
    formData.eventStartTime,
    formData.eventEndTime,
    formData.eventAddress,
    formData.eventDescription,
    formData.selectedTransportZone,
    formData.selectedTransportZones, // Nueva dependencia para múltiples zonas
    formData.includeEquipmentTransport,
    formData.transportCount,
    formData.transportProductIds, // 🔥 FIXED: Missing transport product selection dependency
    formData.useFlexibleTransport, // 🔥 FIXED: Missing manual distribution toggle dependency
    formData.transportAllocations, // 🔥 FIXED: Missing transport allocations dependency
    formData.marginPercentage,
    formData.enableRetention, // 🔥 FIXED: Missing retention enable dependency
    formData.retentionPercentage, // 🔥 FIXED: Missing retention percentage dependency
    formData.employeeInputs,
    formData.productInputs,
    formData.machineryInputs,
    formData.machineryRentalInputs,
    formData.eventSubcontractInputs,
    formData.disposableItemInputs,
    formData.selectedDays,
    formData.dailySchedules
  ])
  
  const pricingQuery = useQuotePricing(pricingInput || undefined)
  const { suggestions } = usePricingOptimization(pricingQuery.result)
  
  // Additional validation for date range and time validation
  const dateRangeError = formData.eventStartDate && formData.eventEndDate && 
    new Date(formData.eventEndDate) < new Date(formData.eventStartDate) ? 
    'La fecha de fin no puede ser anterior a la fecha de inicio' : null

  const timeRangeError = formData.eventStartTime && formData.eventEndTime && 
    formData.eventStartDate === formData.eventEndDate &&
    formData.eventStartTime >= formData.eventEndTime ? 
    'La hora de fin debe ser posterior a la hora de inicio (para eventos del mismo día)' : null
  
  // Generate time validation errors based on event type
  const getTimeValidationErrors = () => {
    if (!formData.eventStartDate || !formData.eventEndDate) return []
    
    const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    if (isMultiDay) {
      // Multi-day event validation
      if (!formData.selectedDays || formData.selectedDays.length === 0) {
        return ['Selecciona días específicos para el evento multi-día']
      }
      if (formData.dailySchedules.length === 0) {
        return ['Genera horarios para los días seleccionados del evento']
      }
      if (formData.dailySchedules.length !== formData.selectedDays.length) {
        return [`Configura horarios para los ${formData.selectedDays.length} días seleccionados`]
      }
      const incompleteSchedules = formData.dailySchedules.filter(day => !day.startTime || !day.endTime)
      if (incompleteSchedules.length > 0) {
        return [`Completa horarios para ${incompleteSchedules.length} día(s) faltante(s)`]
      }
    } else {
      // Single-day event validation
      const errors = []
      if (!formData.eventStartTime) errors.push('Selecciona hora de inicio del evento')
      if (!formData.eventEndTime) errors.push('Selecciona hora de fin del evento')
      return errors
    }
    
    return []
  }

  // 🚀 PERFORMANCE: Memoize validation to prevent excessive recalculations  
  const validation = useMemo(() => {
    return pricingInput && !dateRangeError && !timeRangeError ? PricingService.validatePricingInput(pricingInput) : { 
      isValid: false, 
      errors: [
        ...(!formData.selectedClient ? ['Cliente es requerido'] : []),
        ...(!formData.eventStartDate ? ['Selecciona fecha de inicio del evento'] : []),
        ...(!formData.eventEndDate ? ['Selecciona fecha de fin del evento'] : []),
        ...getTimeValidationErrors(),
        ...(dateRangeError ? [dateRangeError] : []),
        ...(timeRangeError ? [timeRangeError] : []),
        ...(formData.employeeInputs.length === 0 ? ['Agrega al menos un empleado'] : []),
        ...(formData.productInputs.length === 0 ? ['Agrega al menos un producto'] : [])
      ]
    }
  }, [pricingInput, dateRangeError, timeRangeError, formData.selectedClient, formData.eventStartDate, formData.eventEndDate, formData.employeeInputs.length, formData.productInputs.length])
  const is_valid = validation.isValid && pricingQuery.is_valid
  const errors = [...validation.errors, ...pricingQuery.errors]

  // El hook ya calcula automáticamente con pricingInput
  const result = pricingQuery.result

  const handleSaveQuote = async () => {
    const actionType = isEditMode && editingQuoteId ? 'UPDATE' : 'CREATE'
    // Quote action initiated
    
    // 🤖 ULTRATHINK VALIDATION: Ensure all data is ready before saving
    if (!pricingInput || !result || !formData.selectedClient) {
      console.warn('🤖 Quote save cancelled: Missing required data', { pricingInput: !!pricingInput, result: !!result, selectedClient: !!formData.selectedClient })
      alert('⚠️ Debe seleccionar un cliente antes de guardar la cotización')
      return
    }

    // Extra validation for result completeness
    if (typeof result.margin_percentage === 'undefined' || typeof result.total_cost === 'undefined') {
      console.warn('🤖 Quote save cancelled: Result data incomplete', result)
      alert('⚠️ Hay errores en la cotización. Por favor revise los campos')
      return
    }

    // 🤖 ULTRATHINK: Validar asociación empleado-producto requerida
    const employeesWithoutProducts = formData.employeeInputs.filter(emp => 
      !emp.selectedProductIds || emp.selectedProductIds.length === 0
    )
    
    if (employeesWithoutProducts.length > 0) {
      const missingNames = employeesWithoutProducts.map(emp => emp.employee.name).join(', ')
      alert(`⚠️ Asociación Requerida:\n\nLos siguientes operarios deben estar asociados a al menos un producto:\n${missingNames}\n\nPor favor asigne productos a cada operario antes de guardar.`)
      return
    }
    
    // Validating employee-product associations
    const totalAssociations = formData.employeeInputs.reduce((total, emp) => 
      total + (emp.selectedProductIds?.length || 0), 0)
    // Employee-product associations validated
    
    // Log detailed associations for debugging
    formData.employeeInputs.forEach(emp => {
      if (emp.selectedProductIds && emp.selectedProductIds.length > 0) {
        const productNames = emp.selectedProductIds.map(pid => {
          const prod = formData.productInputs.find(p => p.product.id === pid)
          return prod?.product.name || `Producto ${pid}`
        }).join(', ')
        // Employee-product association mapped
      }
    })

    try {
      // Processing quote with complete data
      
      // Calculate event hours for quote items
      const eventHours = calculateEventHours()
      
      let response: any
      
      if (actionType === 'UPDATE' && editingQuoteId) {
        // 🤖 ULTRATHINK: UPDATE existing quote
        // Updating existing quote

        // Calculate totals from formData (same as financial summary)
        const employeesTotal = formData.employeeInputs?.reduce((total, input) => {
          const baseCost = calculateEmployeeCost(input.employee, eventHours)
          return total + baseCost + (input.extraCost || 0)
        }, 0) || 0

        const productsTotal = formData.productInputs?.reduce((total, input) => {
          const unitPrice = input.isVariable && input.customPrice ? input.customPrice : input.product.base_price
          if (input.product.pricing_type === 'measurement') {
            return total + (unitPrice * input.quantity * (input.unitsPerProduct || 1))
          }
          return total + (unitPrice * input.quantity)
        }, 0) || 0

        const transportTotal = formData.selectedTransportZones?.reduce((total, zone) => {
          return total + zone.base_cost
        }, 0) || (formData.selectedTransportZone ? formData.selectedTransportZone.base_cost : 0)

        const machineryTotal = formData.machineryInputs?.reduce((total, input) => {
          const baseCost = input.hours >= 8 ? input.machinery.daily_rate : input.machinery.hourly_rate * input.hours
          const operatorCost = input.includeOperator && input.machinery.operator_hourly_rate ? input.machinery.operator_hourly_rate * input.hours : 0
          const setupCost = input.setupRequired ? (input.machinery.setup_cost || 0) : 0
          return total + baseCost + operatorCost + setupCost
        }, 0) || 0

        const rentalTotal = formData.machineryRentalInputs?.reduce((total, input) => {
          if (input.isCustomCost && input.customTotalCost !== undefined) return total + input.customTotalCost
          const baseCost = input.hours >= 8 ? input.machineryRental.sue_daily_rate : input.machineryRental.sue_hourly_rate * input.hours
          const operatorCost = input.includeOperator && input.machineryRental.operator_cost ? input.machineryRental.operator_cost * input.hours : 0
          const setupCost = input.machineryRental.setup_cost || 0
          const deliveryCost = input.includeDelivery ? (input.machineryRental.delivery_cost || 0) : 0
          const pickupCost = input.includePickup ? (input.machineryRental.pickup_cost || 0) : 0
          return total + baseCost + operatorCost + setupCost + deliveryCost + pickupCost
        }, 0) || 0

        const subcontractTotal = formData.eventSubcontractInputs?.reduce((total, input) => {
          return total + (input.customSuePrice || input.eventSubcontract.sue_price)
        }, 0) || 0

        const disposableTotal = formData.disposableItemInputs?.reduce((total, input) => {
          if (input.isCustomTotalCost && input.customTotalCost !== undefined) return total + input.customTotalCost
          const unitPrice = input.isCustomPrice && input.customPrice ? input.customPrice : input.disposableItem.sale_price
          const actualQuantity = Math.max(input.quantity, input.disposableItem.minimum_quantity)
          return total + (unitPrice * actualQuantity)
        }, 0) || 0

        const correctSubtotal = employeesTotal + productsTotal + transportTotal + machineryTotal + rentalTotal + subcontractTotal + disposableTotal
        const marginPct = (formData.marginPercentage ?? 0) / 100
        const correctMarginAmount = correctSubtotal * marginPct
        const subtotalWithMargin = correctSubtotal + correctMarginAmount
        const retentionPct = (result.tax_retention_percentage || 0) / 100
        const correctRetentionAmount = subtotalWithMargin * retentionPct
        const correctTotalCost = subtotalWithMargin - correctRetentionAmount

        // Create quote data for update (subset of fields)
        const updateData = {
          client_id: formData.selectedClient.id,
          contact_id: formData.selectedContact?.id || null,
          client_type: formData.selectedClient.type || 'social',
          event_title: formData.eventName || 'Evento sin título',
          event_date: formData.eventStartDate,
          event_end_date: formData.eventEndDate || formData.eventStartDate,
          event_start_time: formData.eventStartTime || undefined,
          event_end_time: formData.eventEndTime || undefined,
          event_location: formData.eventAddress || undefined,
          event_city: formData.eventCity?.id || undefined,
          event_description: formData.eventDescription || undefined,
          transport_zone_id: formData.selectedTransportZone?.id, // Deprecated
          transport_count: formData.selectedTransportZone ? (formData.transportCount || 1) : null, // Deprecated
          transport_product_ids: formData.transportProductIds || [], // Manual product selection for transport
          use_flexible_transport: formData.useFlexibleTransport || false, // Toggle para distribución manual
          transport_allocations: formData.transportAllocations || [], // Asignaciones manuales por producto
          multiple_transport_zones: formData.selectedTransportZones?.length > 0 ? formData.selectedTransportZones : null, // Nueva implementación
          subtotal: correctSubtotal,
          transport_cost: transportTotal,
          margin_percentage: formData.marginPercentage ?? 30,
          margin_amount: correctMarginAmount,
          tax_retention_percentage: result.tax_retention_percentage || 0,
          tax_retention_amount: correctRetentionAmount,
          // Persist manual retention only when enabled; otherwise store 0 to avoid re-enabling on edit
          retention_percentage: formData.enableRetention ? (formData.retentionPercentage || 0) : 0,
          total_cost: correctTotalCost,
          // Guardar textos personalizados si existen
          custom_texts: formData.quoteCustomTexts && formData.quoteCustomTexts.use_custom_texts ? formData.quoteCustomTexts : undefined
        }
        
        // 📅 ULTRATHINK: Daily schedules are handled separately in update
        const dailySchedulesData = (() => {
          const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
          if (isMultiDay && formData.dailySchedules && formData.dailySchedules.length > 0) {
            return formData.dailySchedules.map(schedule => ({
              event_date: schedule.date,
              start_time: schedule.startTime,
              end_time: schedule.endTime,
              notes: undefined
            }))
          }
          return []
        })()
        
        // Sending update to database
        
        response = await updateQuoteMutation.mutateAsync({ id: editingQuoteId, updateData })
        // Quote updated successfully
        
        // 📅 Update daily schedules separately after quote update
        if (editingQuoteId && dailySchedulesData.length > 0) {
          // Updating daily schedules
          await QuotesService.updateDailySchedules(editingQuoteId, dailySchedulesData)
        }
        
        // 🔄 Update quote items with new employee-product associations and units_per_product
        const updatedQuoteItems = [
          // Crear quote_items para asociaciones empleado-producto
          ...formData.employeeInputs.flatMap(empInput => 
            (empInput.selectedProductIds || []).map(productId => {
              const product = formData.productInputs.find(p => p.product.id === productId)
              if (!product) return null
              
              const employeesForThisProduct = formData.employeeInputs.filter(emp => 
                emp.selectedProductIds?.includes(productId)
              ).length
              const quantityPerEmployee = Math.max(1, Math.floor(product.quantity / employeesForThisProduct))
              
              const unitPrice = product.isVariable && product.customPrice ? product.customPrice : product.product.base_price
              const employeeCost = calculateEmployeeCost(empInput.employee, eventHours)
              
              return {
                item_type: 'product',
                product_id: product.product.id >= 1000000000000 ? null : productId, // Use null for quick products (temp IDs)
                employee_id: empInput.employee.id,
                description: `${product.product.name} - Operario: ${empInput.employee.name}`,
                quantity: quantityPerEmployee,
                units_per_product: product.unitsPerProduct,
                unit_price: unitPrice,
                total_price: (unitPrice * quantityPerEmployee) + employeeCost + (empInput.extraCost || 0),
                hours_worked: eventHours,
                shift_type: eventHours > 12 ? 'full_day' : eventHours > 4 ? 'afternoon' : 'morning',
                variable_cost_reason: product.isVariable ? product.customReason : undefined,
                extra_cost: empInput.extraCost || 0,
                extra_cost_reason: empInput.extraCostReason || undefined
              } as CreateQuoteItemData
            }).filter(Boolean)
          ),
          // Productos sin empleados asignados
          ...formData.productInputs.filter(prod => {
            const hasEmployeeAssigned = formData.employeeInputs.some(emp =>
              emp.selectedProductIds?.includes(prod.product.id)
            )
            return !hasEmployeeAssigned
          }).map(prod => ({
              item_type: 'product',
              product_id: prod.product.id >= 1000000000000 ? null : prod.product.id, // Use null for quick products (temp IDs)
              description: `${prod.product.name} - ${prod.quantity} ${prod.product.unit}`,
              quantity: prod.quantity,
              units_per_product: prod.unitsPerProduct,
              unit_price: prod.isVariable && prod.customPrice ? prod.customPrice : prod.product.base_price,
              total_price: (prod.isVariable && prod.customPrice ? prod.customPrice : prod.product.base_price) * prod.quantity,
              variable_cost_reason: prod.isVariable ? prod.customReason : undefined
          } as CreateQuoteItemData)),
          // Maquinaria propia
          ...formData.machineryInputs.map(mach => ({
            item_type: 'variable' as const,
            description: `${mach.machinery.name} - ${mach.hours}h`,
            quantity: 1,
            unit_price: mach.hours >= 8 ? mach.machinery.daily_rate : mach.machinery.hourly_rate * mach.hours,
            total_price: (() => {
              const baseCost = mach.hours >= 8 ? mach.machinery.daily_rate : mach.machinery.hourly_rate * mach.hours
              const operatorCost = mach.includeOperator && mach.machinery.operator_hourly_rate 
                ? mach.machinery.operator_hourly_rate * mach.hours 
                : 0
              const setupCost = mach.setupRequired ? (mach.machinery.setup_cost || 0) : 0
              return baseCost + operatorCost + setupCost
            })(),
            hours_worked: mach.hours,
            variable_cost_reason: 'Maquinaria propia',
            notes: `Equipo propio ${mach.includeOperator ? '+ operador' : ''} ${mach.setupRequired ? '+ instalación' : ''}`
          } as CreateQuoteItemData)),
          // Alquiler de maquinaria
          ...formData.machineryRentalInputs.map(rental => ({
            item_type: 'variable' as const,
            description: `${rental.machineryRental.machinery_name} - Alquiler ${rental.hours}h`,
            quantity: 1,
            unit_price: (() => {
              // Si hay costo personalizado, usarlo
              if (rental.isCustomCost && rental.customTotalCost !== undefined) {
                return rental.customTotalCost
              }
              // Para alquileres rápidos (supplier_id === 0), usar el costo fijo del sue_daily_rate
              if (rental.machineryRental.supplier_id === 0) {
                return rental.machineryRental.sue_daily_rate // Costo total fijo que puso el usuario
              }
              // Para alquileres normales, usar lógica normal
              return rental.hours >= 8 ? rental.machineryRental.sue_daily_rate : rental.machineryRental.sue_hourly_rate * rental.hours
            })(),
            total_price: (() => {
              // Si hay costo personalizado, usarlo directamente
              if (rental.isCustomCost && rental.customTotalCost !== undefined) {
                return rental.customTotalCost
              }
              
              let baseCost
              // Para alquileres rápidos (supplier_id === 0), usar el costo fijo
              if (rental.machineryRental.supplier_id === 0) {
                baseCost = rental.machineryRental.sue_daily_rate // Costo total fijo que puso el usuario
              } else {
                // Para alquileres normales, usar lógica normal  
                baseCost = rental.hours >= 8 ? rental.machineryRental.sue_daily_rate : rental.machineryRental.sue_hourly_rate * rental.hours
              }
              const operatorCost = rental.includeOperator && rental.machineryRental.operator_cost 
                ? rental.machineryRental.operator_cost * rental.hours 
                : 0
              const setupCost = rental.machineryRental.setup_cost || 0
              const deliveryCost = rental.includeDelivery ? (rental.machineryRental.delivery_cost || 0) : 0
              const pickupCost = rental.includePickup ? (rental.machineryRental.pickup_cost || 0) : 0
              return baseCost + operatorCost + setupCost + deliveryCost + pickupCost
            })(),
            hours_worked: rental.hours,
            variable_cost_reason: 'Alquiler de maquinaria externa',
            notes: `Alquiler externo ${rental.includeOperator ? '+ operador' : ''} ${rental.includeDelivery ? '+ entrega' : ''} ${rental.includePickup ? '+ recogida' : ''} ${rental.machineryRental.supplier_id === 0 ? '(RÁPIDO)' : ''} ${rental.isCustomCost ? '(COSTO EDITADO)' : ''}`
          } as CreateQuoteItemData)),
          // Subcontratación
          ...formData.eventSubcontractInputs.map(sub => ({
            item_type: 'subcontract' as const,
            description: `${sub.eventSubcontract.service_name}`,
            quantity: 1,
            unit_price: sub.customSuePrice || sub.eventSubcontract.sue_price,
            total_price: sub.customSuePrice || sub.eventSubcontract.sue_price,
            subcontractor_name: sub.eventSubcontract.supplier?.name,
            subcontractor_cost: sub.customSupplierCost || sub.eventSubcontract.supplier_cost,
            notes: sub.notes || `Subcontrato: ${sub.eventSubcontract.service_name}`
          } as CreateQuoteItemData)),
          // Items desechables
          ...formData.disposableItemInputs.map(item => ({
            item_type: 'variable' as const,
            description: `${item.disposableItem.name} - ${item.quantity} ${item.disposableItem.unit}`,
            quantity: item.quantity,
            unit_price: (() => {
              // Si hay costo total personalizado, calcular precio unitario equivalente
              if (item.isCustomTotalCost && item.customTotalCost !== undefined) {
                return item.customTotalCost / item.quantity
              }
              return item.isCustomPrice && item.customPrice ? item.customPrice : item.disposableItem.sale_price
            })(),
            total_price: (() => {
              // Si hay costo total personalizado, usarlo directamente
              if (item.isCustomTotalCost && item.customTotalCost !== undefined) {
                return item.customTotalCost
              }
              const unitPrice = item.isCustomPrice && item.customPrice ? item.customPrice : item.disposableItem.sale_price
              const actualQuantity = Math.max(item.quantity, item.disposableItem.minimum_quantity)
              return unitPrice * actualQuantity
            })(),
            product_id: item.associatedProductId || null, // Asociar con producto si está definido
            variable_cost_reason: (() => {
              if (item.isCustomTotalCost) return item.customReason || 'Costo total editado'
              if (item.isCustomPrice) return item.customReason || 'Precio personalizado'
              return 'Item desechable'
            })(),
            notes: (() => {
              const parts = ['Desechable']
              if (item.isCustomTotalCost) parts.push('(COSTO TOTAL EDITADO)')
              else if (item.isCustomPrice) parts.push('(PRECIO PERSONALIZADO)')
              if (item.associatedProductId) {
                const associatedProduct = formData.productInputs.find(p => p.product.id === item.associatedProductId)
                if (associatedProduct) parts.push(`Asociado a: ${associatedProduct.product.name}`)
              }
              return parts.join(' ')
            })()
          } as CreateQuoteItemData))
        ]
        
        if (updatedQuoteItems.length > 0) {
          // Updating quote items
          await QuotesService.updateQuoteItems(editingQuoteId, updatedQuoteItems)
        }
        
        // 🔄 INTELLIGENT EMPLOYEE SCHEDULING: Update employee reservations for edited quote
        if (formData.employeeInputs.length > 0 && formData.eventStartDate) {
          try {
            // Updating employee reservations
            
            // 1. First, release all existing reservations for this quote
            // Releasing existing reservations
            await EmployeeSchedulingService.releaseQuoteReservations(editingQuoteId)
            
            // 2. Determine event days and shift types for multi-day events
            const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
            const eventDays = []
            
            if (isMultiDay && formData.dailySchedules && formData.dailySchedules.length > 0) {
              // Multi-day event: use daily schedules for each day
              for (const daySchedule of formData.dailySchedules) {
                const dayStart = moment(`${daySchedule.date} ${daySchedule.startTime}`)
                const dayEnd = moment(`${daySchedule.date} ${daySchedule.endTime}`)
                const dayHours = dayEnd.diff(dayStart, 'hours', true)
                const shiftType: ShiftType = dayHours > 12 ? 'full_day' : dayHours > 4 ? 'afternoon' : 'morning'
                
                // Day calculation performed
                
                eventDays.push({
                  date: daySchedule.date,
                  shiftType,
                  hours: dayHours,
                  startTime: daySchedule.startTime,
                  endTime: daySchedule.endTime
                })
              }
            } else {
              // Single-day event: use main event date and times
              const eventStart = moment(`${formData.eventStartDate} ${formData.eventStartTime || '08:00'}`)
              const eventEnd = moment(`${formData.eventStartDate} ${formData.eventEndTime || '20:00'}`)
              const eventHours = eventEnd.diff(eventStart, 'hours', true)
              const shiftType: ShiftType = eventHours > 12 ? 'full_day' : eventHours > 4 ? 'afternoon' : 'morning'
              
              eventDays.push({
                date: formData.eventStartDate,
                shiftType,
                hours: eventHours,
                startTime: formData.eventStartTime || '08:00:00',
                endTime: formData.eventEndTime || '20:00:00'
              })
            }
            
            // Multi-day event detected
            
            // 3. Book employees for ALL event days
            const totalBookingsNeeded = formData.employeeInputs.length * eventDays.length
            // Booking employees for event days
            
            const allBookingPromises = []
            
            for (const day of eventDays) {
              for (const employeeInput of formData.employeeInputs) {
                allBookingPromises.push(
                  (async () => {
                    try {
                      // Booking employee for day
                      
                      const shift = await EmployeeSchedulingService.bookEmployeeForQuote(
                        employeeInput.employee.id,
                        day.date,
                        day.shiftType,
                        editingQuoteId,
                        undefined, // quote_item_id
                        `Updated booking for quote ${response.quote_number} - ${formData.eventName || 'Event'} (Day ${day.date})`,
                        day.startTime, // shift_start_time
                        day.endTime    // shift_end_time
                      )
                      
                      // Employee successfully re-booked
                      return { success: true, employee: employeeInput.employee.name, date: day.date, shift }
                      
                    } catch (bookingError: any) {
                      console.warn(`⚠️ Could not re-book ${employeeInput.employee.name} for ${day.date}:`, bookingError.message)
                      return { success: false, employee: employeeInput.employee.name, date: day.date, error: bookingError.message }
                    }
                  })()
                )
              }
            }
            
            const bookingResults = await Promise.allSettled(allBookingPromises)
            
            const successfulBookings = bookingResults.filter(result => 
              result.status === 'fulfilled' && result.value.success
            ).length
            
            // Employee reservations updated
            
          } catch (schedulingError) {
            console.error('⚠️ Error updating employee reservations:', schedulingError)
            // Don't throw - scheduling errors shouldn't prevent quote updates
          }
        }
        
        // 🎯 CACHE INVALIDATION: Ensure all quote data is refreshed after complete update
        // Invalidating caches
        await queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.detail(editingQuoteId) })
        await queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.lists() })
        await queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.statistics() })
        // Cache invalidation complete
      } else {
        // 🤖 ULTRATHINK: CREATE new quote
        // Creating new quote

        // Calculate totals from formData (same as financial summary)
        const employeesTotal = formData.employeeInputs?.reduce((total, input) => {
          const baseCost = calculateEmployeeCost(input.employee, eventHours)
          return total + baseCost + (input.extraCost || 0)
        }, 0) || 0

        const productsTotal = formData.productInputs?.reduce((total, input) => {
          const unitPrice = input.isVariable && input.customPrice ? input.customPrice : input.product.base_price
          if (input.product.pricing_type === 'measurement') {
            return total + (unitPrice * input.quantity * (input.unitsPerProduct || 1))
          }
          return total + (unitPrice * input.quantity)
        }, 0) || 0

        const transportTotal = formData.selectedTransportZones?.reduce((total, zone) => {
          return total + zone.base_cost
        }, 0) || (formData.selectedTransportZone ? formData.selectedTransportZone.base_cost : 0)

        const machineryTotal = formData.machineryInputs?.reduce((total, input) => {
          const baseCost = input.hours >= 8 ? input.machinery.daily_rate : input.machinery.hourly_rate * input.hours
          const operatorCost = input.includeOperator && input.machinery.operator_hourly_rate ? input.machinery.operator_hourly_rate * input.hours : 0
          const setupCost = input.setupRequired ? (input.machinery.setup_cost || 0) : 0
          return total + baseCost + operatorCost + setupCost
        }, 0) || 0

        const rentalTotal = formData.machineryRentalInputs?.reduce((total, input) => {
          if (input.isCustomCost && input.customTotalCost !== undefined) return total + input.customTotalCost
          const baseCost = input.hours >= 8 ? input.machineryRental.sue_daily_rate : input.machineryRental.sue_hourly_rate * input.hours
          const operatorCost = input.includeOperator && input.machineryRental.operator_cost ? input.machineryRental.operator_cost * input.hours : 0
          const setupCost = input.machineryRental.setup_cost || 0
          const deliveryCost = input.includeDelivery ? (input.machineryRental.delivery_cost || 0) : 0
          const pickupCost = input.includePickup ? (input.machineryRental.pickup_cost || 0) : 0
          return total + baseCost + operatorCost + setupCost + deliveryCost + pickupCost
        }, 0) || 0

        const subcontractTotal = formData.eventSubcontractInputs?.reduce((total, input) => {
          return total + (input.customSuePrice || input.eventSubcontract.sue_price)
        }, 0) || 0

        const disposableTotal = formData.disposableItemInputs?.reduce((total, input) => {
          if (input.isCustomTotalCost && input.customTotalCost !== undefined) return total + input.customTotalCost
          const unitPrice = input.isCustomPrice && input.customPrice ? input.customPrice : input.disposableItem.sale_price
          const actualQuantity = Math.max(input.quantity, input.disposableItem.minimum_quantity)
          return total + (unitPrice * actualQuantity)
        }, 0) || 0

        const correctSubtotal = employeesTotal + productsTotal + transportTotal + machineryTotal + rentalTotal + subcontractTotal + disposableTotal
        const marginPct = (formData.marginPercentage ?? 0) / 100
        const correctMarginAmount = correctSubtotal * marginPct
        const subtotalWithMargin = correctSubtotal + correctMarginAmount
        const retentionPct = (result.tax_retention_percentage || 0) / 100
        const correctRetentionAmount = subtotalWithMargin * retentionPct
        const correctTotalCost = subtotalWithMargin - correctRetentionAmount

        const quoteData: CreateQuoteData = {
          client_id: formData.selectedClient.id,
          contact_id: formData.selectedContact?.id || null,
          client_type: formData.selectedClient.type || 'social',
          event_title: formData.eventName || 'Evento sin título',
          event_date: formData.eventStartDate,
          event_end_date: formData.eventEndDate || formData.eventStartDate,
        event_start_time: formData.eventStartTime || undefined,
        event_end_time: formData.eventEndTime || undefined,
        event_location: formData.eventAddress || undefined,
        event_city: formData.eventCity?.id || undefined,
        event_description: formData.eventDescription || undefined,
        transport_zone_id: formData.selectedTransportZone?.id, // Deprecated
        transport_count: formData.selectedTransportZone ? (formData.transportCount || 1) : null, // Deprecated
        transport_product_ids: formData.transportProductIds || [], // Manual product selection for transport
        use_flexible_transport: formData.useFlexibleTransport || false, // Toggle para distribución manual
        transport_allocations: formData.transportAllocations || [], // Asignaciones manuales por producto
        multiple_transport_zones: formData.selectedTransportZones?.length > 0 ? formData.selectedTransportZones : null, // Nueva implementación
        subtotal: correctSubtotal,
        transport_cost: transportTotal,
        margin_percentage: formData.marginPercentage ?? 30,
        margin_amount: correctMarginAmount,
        tax_retention_percentage: result.tax_retention_percentage || 0,
        tax_retention_amount: correctRetentionAmount,
        // Persist manual retention only when enabled; otherwise store 0 to avoid re-enabling on edit
        retention_percentage: formData.enableRetention ? (formData.retentionPercentage || 0) : 0,
        total_cost: correctTotalCost,
        quote_items: [
          // 🤖 ULTRATHINK: Crear quote_items para asociaciones empleado-producto
          ...formData.employeeInputs.flatMap(empInput => 
            (empInput.selectedProductIds || []).map(productId => {
              const product = formData.productInputs.find(p => p.product.id === productId)
              if (!product) return null
              
              // Calcular proporción del producto para este empleado
              const employeesForThisProduct = formData.employeeInputs.filter(emp => 
                emp.selectedProductIds?.includes(productId)
              ).length
              const quantityPerEmployee = Math.max(1, Math.floor(product.quantity / employeesForThisProduct))
              
              const unitPrice = product.isVariable && product.customPrice ? product.customPrice : product.product.base_price
              const employeeCost = calculateEmployeeCost(empInput.employee, eventHours)
              
              return {
                item_type: 'product',
                product_id: product.product.id >= 1000000000000 ? null : productId, // Use null for quick products (temp IDs)
                employee_id: empInput.employee.id, // 🚀 ULTRATHINK: Asociación directa
                description: `${product.product.name} - Operario: ${empInput.employee.name}`,
                quantity: quantityPerEmployee,
                units_per_product: product.unitsPerProduct,
                unit_price: unitPrice,
                total_price: (unitPrice * quantityPerEmployee) + employeeCost + (empInput.extraCost || 0),
                hours_worked: eventHours,
                extra_cost: empInput.extraCost || 0,
                extra_cost_reason: empInput.extraCostReason || undefined,
                shift_type: eventHours > 12 ? 'full_day' : eventHours > 4 ? 'afternoon' : 'morning',
                variable_cost_reason: product.isVariable ? product.customReason : undefined
              } as CreateQuoteItemData
            }).filter(Boolean)
          ),
          // Crear items de productos sin asociaciones específicas (si los hay)
          ...formData.productInputs.filter(prod => {
            // Solo incluir productos que NO tienen ningún empleado asignado
            const hasEmployeeAssigned = formData.employeeInputs.some(emp =>
              emp.selectedProductIds?.includes(prod.product.id)
            )
            return !hasEmployeeAssigned
          }).map(prod => ({
              item_type: 'product',
              product_id: prod.product.id >= 1000000000000 ? null : prod.product.id, // Use null for quick products (temp IDs)
              description: `${prod.product.name} - ${prod.quantity} ${prod.product.unit}`,
              quantity: prod.quantity,
              units_per_product: prod.unitsPerProduct,
              unit_price: prod.isVariable && prod.customPrice ? prod.customPrice : prod.product.base_price,
              total_price: (prod.isVariable && prod.customPrice ? prod.customPrice : prod.product.base_price) * prod.quantity,
              variable_cost_reason: prod.isVariable ? prod.customReason : undefined
          } as CreateQuoteItemData)),
          // Maquinaria propia
          ...formData.machineryInputs.map(mach => ({
            item_type: 'variable' as const,
            description: `${mach.machinery.name} - ${mach.hours}h`,
            quantity: 1,
            unit_price: mach.hours >= 8 ? mach.machinery.daily_rate : mach.machinery.hourly_rate * mach.hours,
            total_price: (() => {
              const baseCost = mach.hours >= 8 ? mach.machinery.daily_rate : mach.machinery.hourly_rate * mach.hours
              const operatorCost = mach.includeOperator && mach.machinery.operator_hourly_rate 
                ? mach.machinery.operator_hourly_rate * mach.hours 
                : 0
              const setupCost = mach.setupRequired ? (mach.machinery.setup_cost || 0) : 0
              return baseCost + operatorCost + setupCost
            })(),
            hours_worked: mach.hours,
            variable_cost_reason: 'Maquinaria propia',
            notes: `Equipo propio ${mach.includeOperator ? '+ operador' : ''} ${mach.setupRequired ? '+ instalación' : ''}`
          } as CreateQuoteItemData)),
          // Alquiler de maquinaria
          ...formData.machineryRentalInputs.map(rental => ({
            item_type: 'variable' as const,
            description: `${rental.machineryRental.machinery_name} - Alquiler ${rental.hours}h`,
            quantity: 1,
            unit_price: (() => {
              // Si hay costo personalizado, usarlo
              if (rental.isCustomCost && rental.customTotalCost !== undefined) {
                return rental.customTotalCost
              }
              // Para alquileres rápidos (supplier_id === 0), usar el costo fijo del sue_daily_rate
              if (rental.machineryRental.supplier_id === 0) {
                return rental.machineryRental.sue_daily_rate // Costo total fijo que puso el usuario
              }
              // Para alquileres normales, usar lógica normal
              return rental.hours >= 8 ? rental.machineryRental.sue_daily_rate : rental.machineryRental.sue_hourly_rate * rental.hours
            })(),
            total_price: (() => {
              // Si hay costo personalizado, usarlo directamente
              if (rental.isCustomCost && rental.customTotalCost !== undefined) {
                return rental.customTotalCost
              }
              
              let baseCost
              // Para alquileres rápidos (supplier_id === 0), usar el costo fijo
              if (rental.machineryRental.supplier_id === 0) {
                baseCost = rental.machineryRental.sue_daily_rate // Costo total fijo que puso el usuario
              } else {
                // Para alquileres normales, usar lógica normal  
                baseCost = rental.hours >= 8 ? rental.machineryRental.sue_daily_rate : rental.machineryRental.sue_hourly_rate * rental.hours
              }
              const operatorCost = rental.includeOperator && rental.machineryRental.operator_cost 
                ? rental.machineryRental.operator_cost * rental.hours 
                : 0
              const setupCost = rental.machineryRental.setup_cost || 0
              const deliveryCost = rental.includeDelivery ? (rental.machineryRental.delivery_cost || 0) : 0
              const pickupCost = rental.includePickup ? (rental.machineryRental.pickup_cost || 0) : 0
              return baseCost + operatorCost + setupCost + deliveryCost + pickupCost
            })(),
            hours_worked: rental.hours,
            variable_cost_reason: 'Alquiler de maquinaria externa',
            notes: `Alquiler externo ${rental.includeOperator ? '+ operador' : ''} ${rental.includeDelivery ? '+ entrega' : ''} ${rental.includePickup ? '+ recogida' : ''} ${rental.machineryRental.supplier_id === 0 ? '(RÁPIDO)' : ''} ${rental.isCustomCost ? '(COSTO EDITADO)' : ''}`
          } as CreateQuoteItemData)),
          // Subcontratación
          ...formData.eventSubcontractInputs.map(sub => ({
            item_type: 'subcontract' as const,
            description: `${sub.eventSubcontract.service_name}`,
            quantity: 1,
            unit_price: sub.customSuePrice || sub.eventSubcontract.sue_price,
            total_price: sub.customSuePrice || sub.eventSubcontract.sue_price,
            subcontractor_name: sub.eventSubcontract.supplier?.name,
            subcontractor_cost: sub.customSupplierCost || sub.eventSubcontract.supplier_cost,
            notes: sub.notes || `Subcontrato: ${sub.eventSubcontract.service_name}`
          } as CreateQuoteItemData)),
          // Items desechables
          ...formData.disposableItemInputs.map(item => ({
            item_type: 'variable' as const,
            description: `${item.disposableItem.name} - ${item.quantity} ${item.disposableItem.unit}`,
            quantity: item.quantity,
            unit_price: (() => {
              // Si hay costo total personalizado, calcular precio unitario equivalente
              if (item.isCustomTotalCost && item.customTotalCost !== undefined) {
                return item.customTotalCost / item.quantity
              }
              return item.isCustomPrice && item.customPrice ? item.customPrice : item.disposableItem.sale_price
            })(),
            total_price: (() => {
              // Si hay costo total personalizado, usarlo directamente
              if (item.isCustomTotalCost && item.customTotalCost !== undefined) {
                return item.customTotalCost
              }
              const unitPrice = item.isCustomPrice && item.customPrice ? item.customPrice : item.disposableItem.sale_price
              const actualQuantity = Math.max(item.quantity, item.disposableItem.minimum_quantity)
              return unitPrice * actualQuantity
            })(),
            product_id: item.associatedProductId || null, // Asociar con producto si está definido
            variable_cost_reason: (() => {
              if (item.isCustomTotalCost) return item.customReason || 'Costo total editado'
              if (item.isCustomPrice) return item.customReason || 'Precio personalizado'
              return 'Item desechable'
            })(),
            notes: (() => {
              const parts = ['Desechable']
              if (item.isCustomTotalCost) parts.push('(COSTO TOTAL EDITADO)')
              else if (item.isCustomPrice) parts.push('(PRECIO PERSONALIZADO)')
              if (item.associatedProductId) {
                const associatedProduct = formData.productInputs.find(p => p.product.id === item.associatedProductId)
                if (associatedProduct) parts.push(`Asociado a: ${associatedProduct.product.name}`)
              }
              return parts.join(' ')
            })()
          } as CreateQuoteItemData))
        ],
        // Guardar textos personalizados si existen  
        custom_texts: formData.quoteCustomTexts && formData.quoteCustomTexts.use_custom_texts ? formData.quoteCustomTexts : undefined
      }
      
      // 📅 ULTRATHINK: Daily schedules are handled separately after quote creation
      const dailySchedulesData = (() => {
        const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
        if (isMultiDay && formData.dailySchedules && formData.dailySchedules.length > 0) {
          return formData.dailySchedules.map(schedule => ({
            event_date: schedule.date,
            start_time: schedule.startTime,
            end_time: schedule.endTime,
            notes: undefined
          }))
        }
        return []
      })()
      
      // Log the quote items with employee associations for debugging (DISABLED)
      // console.log('Quote items with employee-product associations:',
      //   quoteData.quote_items.map(item => ({
      //     product_id: item.product_id,
      //     employee_id: item.employee_id,
      //     description: item.description,
      //     quantity: item.quantity,
      //     total_price: item.total_price
      //   }))
      // )

        // 🤖 ULTRATHINK FIX: Pass data in correct format expected by useCreateQuote hook
        // Sending new quote to database
        
        response = await createQuoteMutation.mutateAsync({ 
          quoteData, 
          items: quoteData.quote_items 
        })
        
        // 📅 Save daily schedules separately after quote creation
        if (response?.id && dailySchedulesData.length > 0) {
          // Saving daily schedules
          await QuotesService.updateDailySchedules(response.id, dailySchedulesData)
        }
      }
      
      // 🤖 ULTRATHINK: Las asociaciones empleado-producto ya están guardadas 
      // directamente en quote_items con employee_id - no necesitamos tabla separada
      // Employee-product associations saved
      
      // 🤖 INTELLIGENT AUTO-BOOKING: Reserve employees automatically (only for new quotes)
      if (actionType === 'CREATE' && formData.employeeInputs.length > 0 && formData.eventStartDate) {
        try {
          // Determine event days and shift types for multi-day events
          const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
          const eventDays = []
          
          if (isMultiDay && formData.dailySchedules && formData.dailySchedules.length > 0) {
            // Multi-day event: use daily schedules for each day
            for (const daySchedule of formData.dailySchedules) {
              const dayStart = moment(`${daySchedule.date} ${daySchedule.startTime}`)
              const dayEnd = moment(`${daySchedule.date} ${daySchedule.endTime}`)
              const dayHours = dayEnd.diff(dayStart, 'hours', true)
              const shiftType: ShiftType = dayHours > 12 ? 'full_day' : dayHours > 4 ? 'afternoon' : 'morning'
              
              eventDays.push({
                date: daySchedule.date,
                shiftType,
                hours: dayHours,
                startTime: daySchedule.startTime,
                endTime: daySchedule.endTime
              })
            }
          } else {
            // Single-day event: use main event date and times
            const eventStart = moment(`${formData.eventStartDate} ${formData.eventStartTime || '08:00'}`)
            const eventEnd = formData.eventEndDate 
              ? moment(`${formData.eventEndDate} ${formData.eventEndTime || '20:00'}`)
              : eventStart.clone().add(8, 'hours')
            
            const durationHours = eventEnd.diff(eventStart, 'hours')
            const shiftType: ShiftType = durationHours > 12 
              ? 'full_day' 
              : eventStart.hour() < 14 
                ? 'morning' 
                : 'afternoon'
            
            eventDays.push({
              date: formData.eventStartDate,
              shiftType,
              hours: durationHours,
              startTime: formData.eventStartTime || '08:00:00',
              endTime: formData.eventEndTime || '20:00:00'
            })
          }
          
          // Auto-booking employees for multi-day event
          
          // Book employees for ALL event days
          const totalBookingsNeeded = formData.employeeInputs.length * eventDays.length
          // Processing auto-booking requests
          
          const allBookingPromises = []
          
          for (const day of eventDays) {
            for (const employeeInput of formData.employeeInputs) {
              allBookingPromises.push(
                (async () => {
                  try {
                    // Auto-booking employee
                    
                    const shift = await EmployeeSchedulingService.bookEmployeeForQuote(
                      employeeInput.employee.id,
                      day.date,
                      day.shiftType,
                      response.id,
                      undefined, // quote_item_id
                      `Auto-booked for quote ${response.quote_number} - ${formData.eventName || 'Event'} (Day ${day.date})`,
                      day.startTime, // shift_start_time
                      day.endTime    // shift_end_time
                    )
                    
                    // Employee auto-booked successfully
                    return { success: true, employee: employeeInput.employee.name, date: day.date, shift }
                    
                  } catch (bookingError: any) {
                    console.warn(`⚠️ Could not auto-book ${employeeInput.employee.name} for ${day.date}:`, bookingError.message)
                    return { success: false, employee: employeeInput.employee.name, date: day.date, error: bookingError.message }
                  }
                })()
              )
            }
          }
          
          // Wait for all bookings
          const bookingResults = await Promise.all(allBookingPromises)
          const successful = bookingResults.filter(result => result.success)
          const failed = bookingResults.filter(result => !result.success)
          
          // Auto-booking complete
          
          if (failed.length > 0) {
            // Some bookings failed
          }
          
        } catch (schedulingError) {
          console.error('❌ Auto-booking failed:', schedulingError)
          // Don't fail the quote save if scheduling fails
        }
      }
      
      // Update success state (common for both create and update)
      setSavedQuoteNumber(response.quote_number || 'Updated')
      setSavedQuoteId(response.id)
      setShowSuccessMessage(true)
      
      if (actionType === 'CREATE') {
        // Quote created successfully
      } else {
        // Quote updated successfully
      }
      
    } catch (error) {
      console.error('Error saving quote:', error)
    }
  }

  return {
    formData,
    updateFormData,
    addEmployee,
    removeEmployee,
    updateEmployee,
    addProduct,
    removeProduct,
    updateProduct,
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
    updateDisposableItem,
    result,
    errors,
    suggestions,
    is_valid,
    handleSaveQuote,
    isLoading: createQuoteMutation.isPending || updateQuoteMutation.isPending,
    showSuccessMessage,
    setShowSuccessMessage,
    savedQuoteNumber,
    savedQuoteId,
    generatedTitle
  }
}
