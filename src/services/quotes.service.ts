import { supabase } from './supabase'
import { Quote, QuoteItem, CreateQuoteData, UpdateQuoteData, CreateQuoteItemData, QuoteFilters } from '../types'

// ULTRATHINK: Map client types to database enum values
const mapClientType = (clientType?: string): 'social' | 'corporativo' => {
  if (!clientType) return 'social'
  
  const normalizedType = clientType.toLowerCase()
  
  // Handle various input formats
  switch (normalizedType) {
    case 'corporativo':
    case 'corporate':
    case 'empresa':
    case 'business':
      return 'corporativo'
    case 'social':
    case 'individual':
    case 'personal':
    case 'particular':
    default:
      return 'social'
  }
}

export class QuotesService {
  /**
   * Generate next quote number in format SUE-YYYY-XXX
   */
  static async generateQuoteNumber(): Promise<string> {
    const currentYear = new Date().getFullYear()
    const prefix = `SUE-${currentYear}-`
    
    // Get all quote numbers for current year and find the highest numeric value
    const { data, error } = await supabase
      .from('quotes')
      .select('quote_number')
      .ilike('quote_number', `${prefix}%`)

    if (error) throw error

    if (!data || data.length === 0) {
      return `${prefix}001`
    }

    // Extract all numbers and find the maximum
    let maxNumber = 0
    data.forEach(quote => {
      const numberPart = quote.quote_number.split('-')[2]
      const num = parseInt(numberPart, 10)
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num
      }
    })
    
    const nextNumber = (maxNumber + 1).toString().padStart(3, '0')
    return `${prefix}${nextNumber}`
  }

  /**
   * Create a new quote with items
   */
  static async create(quoteData: CreateQuoteData, items: CreateQuoteItemData[] = []): Promise<Quote> {
    // Generate quote number
    const quoteNumber = await this.generateQuoteNumber()
    
    // Prepare quote data with ultrathink protection and correct field mapping
    const processedQuoteData = {
      quote_number: quoteNumber,
      quote_date: new Date().toISOString().split('T')[0],
      status: 'pendiente' as const,
      client_type: mapClientType(quoteData?.client_type), // ULTRATHINK: Map to correct DB values
      event_title: quoteData?.event_title || 'Evento sin título', // ULTRATHINK: Protect event_title
      event_date: quoteData?.event_start_date || quoteData?.event_date || new Date().toISOString().split('T')[0], // ULTRATHINK: Map to correct DB field
      client_id: quoteData?.client_id,
      event_start_time: quoteData?.event_start_time || null,
      event_end_time: quoteData?.event_end_time || null,
      event_location: quoteData?.event_location || null,
      transport_zone_id: quoteData?.transport_zone_id || null, // Deprecated
      transport_count: quoteData?.transport_count || null, // Deprecated
      transport_product_ids: quoteData?.transport_product_ids || null, // ULTRATHINK: Map transport product selection
      multiple_transport_zones: quoteData?.multiple_transport_zones || null, // Nueva implementación
      estimated_attendees: quoteData?.estimated_attendees || null,
      event_description: quoteData?.event_description || null,
      subtotal: quoteData?.subtotal || 0,
      transport_cost: quoteData?.transport_cost || 0,
      tax_retention_percentage: quoteData?.retention_percentage || quoteData?.tax_retention_percentage || 0, // ULTRATHINK: Map retention_percentage to tax_retention_percentage
      tax_retention_amount: quoteData?.tax_retention_amount || 0,
      retention_percentage: quoteData?.retention_percentage || 0, // ULTRATHINK: Also save as retention_percentage for compatibility
      margin_percentage: quoteData?.margin_percentage ?? 30,
      margin_amount: quoteData?.margin_amount || 0,
      total_cost: quoteData?.total_cost || 0,
      // Ultrathink payment terms defaults
      payment_terms_days: quoteData?.payment_terms_days || 30,
      requires_advance_payment: quoteData?.requires_advance_payment || false,
      advance_payment_percentage: quoteData?.advance_payment_percentage || 0,
      notes: quoteData?.notes || null,
      internal_notes: quoteData?.internal_notes || null,
      // Guardar textos personalizados como JSON
      custom_texts: quoteData?.custom_texts ? JSON.stringify(quoteData.custom_texts) : null
    }


    // Create quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert(processedQuoteData)
      .select()
      .single()

    if (quoteError) throw quoteError

    // Create quote items if provided
    if (items.length > 0) {
      const itemsWithQuoteId = items.map(item => ({
        ...item,
        quote_id: quote.id
      }))

      // Inserting quote items to database

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(itemsWithQuoteId)

      if (itemsError) throw itemsError

      // Recalculate totals
      await this.recalculateQuoteTotals(quote.id)
    }

    // Create daily schedules if provided
    if (quoteData.daily_schedules && quoteData.daily_schedules.length > 0) {
      const schedulesWithQuoteId = quoteData.daily_schedules.map(schedule => ({
        ...schedule,
        quote_id: quote.id
      }))

      const { error: schedulesError } = await supabase
        .from('quote_daily_schedules')
        .insert(schedulesWithQuoteId)

      if (schedulesError) throw schedulesError
    }
      
    // Return updated quote
    return await this.getById(quote.id)
  }

  /**
   * Get quote by ID with related data
   */
  static async getById(id: number): Promise<Quote> {
    // Base fetch without requiring relationships to exist in PostgREST
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:clients(*),
        transport_zone:transport_zones(*),
        items:quote_items(
          *,
          employee:employees!quote_items_employee_id_fkey(*),
          product:products(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    
    // Fetch daily schedules separately to avoid PostgREST schema cache issues
    const { data: dailySchedules } = await supabase
      .from('quote_daily_schedules')
      .select('*')
      .eq('quote_id', id)
      .order('event_date', { ascending: true })
    
    // Add daily schedules to the quote
    data.daily_schedules = dailySchedules || []

    // 🤖 ULTRATHINK: Employee-product associations are now stored directly 
    // in quote_items.employee_id - no separate table needed

    // Parsear textos personalizados desde JSON
    if (data.custom_texts && typeof data.custom_texts === 'string') {
      try {
        data.custom_texts = JSON.parse(data.custom_texts)
      } catch (error) {
        console.warn('Error parsing custom_texts JSON:', error)
        data.custom_texts = null
      }
    }

    return data
  }

  // 🤖 ULTRATHINK: Método eliminado - las asociaciones empleado-producto 
  // ahora se manejan directamente en quote_items.employee_id

  /**
   * Get all quotes with filters
   */
  static async getAll(filters?: QuoteFilters): Promise<Quote[]> {
    let query = supabase
      .from('quotes')
      .select(`
        *,
        client:clients(*),
        transport_zone:transport_zones(*),
        items:quote_items(
          *,
          employee:employees!quote_items_employee_id_fkey(*),
          product:products(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.client_type) {
      query = query.eq('client_type', filters.client_type)
    }

    if (filters?.client_id) {
      query = query.eq('client_id', filters.client_id)
    }

    if (filters?.date_from) {
      query = query.gte('event_date', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('event_date', filters.date_to)
    }

    if (filters?.search) {
      query = query.or(`quote_number.ilike.%${filters.search}%,event_title.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    
    // Parsear textos personalizados desde JSON para todas las cotizaciones
    const quotesWithParsedTexts = (data || []).map(quote => {
      if (quote.custom_texts && typeof quote.custom_texts === 'string') {
        try {
          quote.custom_texts = JSON.parse(quote.custom_texts)
        } catch (error) {
          console.warn('Error parsing custom_texts JSON for quote', quote.id, error)
          quote.custom_texts = null
        }
      }
      return quote
    })
    
    return quotesWithParsedTexts
  }

  /**
   * Update quote
   */
  static async update(id: number, updateData: UpdateQuoteData): Promise<Quote> {
    // Preparar datos de actualización - convertir custom_texts a JSON string si es necesario
    const processedUpdateData = { ...updateData }
    
    try {
      // Intentar convertir custom_texts a JSON string
      if (processedUpdateData.custom_texts) {
        processedUpdateData.custom_texts = JSON.stringify(processedUpdateData.custom_texts)
      }
    } catch (jsonError) {
      console.warn('Error al convertir custom_texts a JSON:', jsonError)
      delete processedUpdateData.custom_texts
    }

    // Processing update data

    const { data, error } = await supabase
      .from('quotes')
      .update(processedUpdateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Error de Supabase en update:', error)
      
      // Si el error es por campo custom_texts que no existe, intentar sin ese campo
      if (error.message && error.message.includes('custom_texts')) {
        console.warn('⚠️ Campo custom_texts no existe en BD, reintentando sin ese campo...')
        const { custom_texts, ...dataWithoutCustomTexts } = processedUpdateData
        
        const { data: retryData, error: retryError } = await supabase
          .from('quotes')
          .update(dataWithoutCustomTexts)
          .eq('id', id)
          .select()
          .single()
          
        if (retryError) throw retryError
        // Update successful without custom texts
        return retryData
      }
      
      throw error
    }

    // Update daily schedules if provided
    if (updateData.daily_schedules) {
      await this.updateDailySchedules(id, updateData.daily_schedules)
    }

    // Parsear textos personalizados desde JSON
    if (data.custom_texts && typeof data.custom_texts === 'string') {
      try {
        data.custom_texts = JSON.parse(data.custom_texts)
      } catch (error) {
        console.warn('Error parsing custom_texts JSON:', error)
        data.custom_texts = null
      }
    }

    return data
  }

  /**
   * Update daily schedules for a quote
   */
  static async updateDailySchedules(quoteId: number, schedules: Array<{
    event_date: string
    start_time: string
    end_time: string
    notes?: string
  }>): Promise<void> {
    // Delete existing schedules
    await supabase
      .from('quote_daily_schedules')
      .delete()
      .eq('quote_id', quoteId)

    // Insert new schedules
    if (schedules.length > 0) {
      const schedulesWithQuoteId = schedules.map(schedule => ({
        ...schedule,
        quote_id: quoteId
      }))

      const { error } = await supabase
        .from('quote_daily_schedules')
        .insert(schedulesWithQuoteId)

      if (error) throw error
    }
  }

  /**
   * Update quote items for a quote (replaces all existing items)
   */
  static async updateQuoteItems(quoteId: number, items: CreateQuoteItemData[]): Promise<void> {
    // Delete existing quote items
    const { error: deleteError } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', quoteId)

    if (deleteError) throw deleteError

    // Insert new quote items
    if (items.length > 0) {
      const itemsWithQuoteId = items.map(item => ({
        ...item,
        quote_id: quoteId
      }))

      // Updating quote items in database

      const { error: insertError } = await supabase
        .from('quote_items')
        .insert(itemsWithQuoteId)

      if (insertError) throw insertError

      // Recalculate totals after updating items
      await this.recalculateQuoteTotals(quoteId)
    }
  }

  /**
   * Delete quote
   */
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Add item to quote
   */
  static async addItem(quoteId: number, itemData: Omit<CreateQuoteItemData, 'quote_id'>): Promise<QuoteItem> {
    const { data, error } = await supabase
      .from('quote_items')
      .insert({ ...itemData, quote_id: quoteId })
      .select(`
        *,
        employee:employees!quote_items_employee_id_fkey(*),
        product:products(*)
      `)
      .single()

    if (error) throw error

    // Recalculate quote totals
    await this.recalculateQuoteTotals(quoteId)

    return data
  }

  /**
   * Update quote item
   */
  static async updateItem(itemId: number, updateData: Partial<CreateQuoteItemData>): Promise<QuoteItem> {
    const { data, error } = await supabase
      .from('quote_items')
      .update(updateData)
      .eq('id', itemId)
      .select(`
        *,
        employee:employees!quote_items_employee_id_fkey(*),
        product:products(*)
      `)
      .single()

    if (error) throw error

    // Get quote_id to recalculate totals
    const quoteId = data.quote_id
    await this.recalculateQuoteTotals(quoteId)

    return data
  }

  /**
   * Remove item from quote
   */
  static async removeItem(itemId: number): Promise<void> {
    // Get quote_id before deletion
    const { data: item } = await supabase
      .from('quote_items')
      .select('quote_id')
      .eq('id', itemId)
      .single()

    const { error } = await supabase
      .from('quote_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error

    // Recalculate quote totals
    if (item) {
      await this.recalculateQuoteTotals(item.quote_id)
    }
  }

  /**
   * Recalculate quote totals based on items
   */
  static async recalculateQuoteTotals(quoteId: number): Promise<void> {
    // Get quote and items
    const quote = await this.getById(quoteId)
    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)

    if (itemsError) throw itemsError

    // Calculate subtotal from items + transport cost (transport should be included in subtotal for margin calculation)
    const itemsSubtotal = (items || []).reduce((sum, item) => sum + item.total_price, 0)
    const subtotal = itemsSubtotal + (quote.transport_cost || 0)
    
    // Calculate margin
    const marginPercentage = quote.margin_percentage ?? 30
    const marginAmount = subtotal * (marginPercentage / 100)
    
    // Calculate tax retention (4% for corporativos) - FIXED: Apply over subtotal + margin
    const taxRetentionPercentage = quote.client_type === 'corporativo' ? 4.0 : 0.0
    const baseForRetention = subtotal + marginAmount
    const taxRetentionAmount = baseForRetention * (taxRetentionPercentage / 100)
    
    // Calculate total (no need to add transport again since it's already in subtotal)
    const totalCost = subtotal + marginAmount - taxRetentionAmount

    // Update quote
    const { error: updateError } = await supabase
      .from('quotes')
      .update({
        subtotal,
        margin_amount: marginAmount,
        tax_retention_percentage: taxRetentionPercentage,
        tax_retention_amount: taxRetentionAmount,
        total_cost: totalCost
      })
      .eq('id', quoteId)

    if (updateError) throw updateError
  }

  /**
   * Approve quote
   */
  static async approve(id: number, approvedBy: string): Promise<Quote> {
    return await this.update(id, {
      status: 'aceptado',
      approved_by: approvedBy,
      approved_at: new Date().toISOString()
    })
  }

  /**
   * Cancel quote
   */
  static async cancel(id: number): Promise<Quote> {
    return await this.update(id, {
      status: 'cancelado'
    })
  }

  /**
   * Get quotes summary statistics
   */
  static async getStatistics(): Promise<{
    total_quotes: number
    pending_quotes: number
    accepted_quotes: number
    cancelled_quotes: number
    total_value: number
    average_value: number
    by_client_type: Record<string, { count: number; value: number }>
  }> {
    const { data: quotes, error } = await supabase
      .from('quotes')
      .select('status, client_type, total_cost')

    if (error) throw error

    const stats = {
      total_quotes: quotes?.length || 0,
      pending_quotes: quotes?.filter(q => q.status === 'pendiente').length || 0,
      accepted_quotes: quotes?.filter(q => q.status === 'aceptado').length || 0,
      cancelled_quotes: quotes?.filter(q => q.status === 'cancelado').length || 0,
      total_value: quotes?.reduce((sum, q) => sum + q.total_cost, 0) || 0,
      average_value: 0,
      by_client_type: {} as Record<string, { count: number; value: number }>
    }

    stats.average_value = stats.total_quotes > 0 ? stats.total_value / stats.total_quotes : 0

    // Group by client type
    quotes?.forEach(quote => {
      if (!stats.by_client_type[quote.client_type]) {
        stats.by_client_type[quote.client_type] = { count: 0, value: 0 }
      }
      stats.by_client_type[quote.client_type].count++
      stats.by_client_type[quote.client_type].value += quote.total_cost
    })

    return stats
  }

  /**
   * Search quotes
   */
  static async search(searchTerm: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:clients(*)
      `)
      .or(`quote_number.ilike.%${searchTerm}%,event_title.ilike.%${searchTerm}%,client.name.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data || []
  }

  /**
   * Get quotes by date range
   */
  static async getByDateRange(startDate: string, endDate: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        client:clients(*)
      `)
      .gte('event_date', startDate)
      .lte('event_date', endDate)
      .order('event_date', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  /**
   * Validation helpers
   */
  static validateQuoteData(data: CreateQuoteData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.client_id) {
      errors.push('Cliente es requerido')
    }

    if (!data.event_title || data.event_title.trim().length < 3) {
      errors.push('Título del evento debe tener al menos 3 caracteres')
    }

    if (!data.event_date) {
      errors.push('Fecha del evento es requerida')
    }

    if (data.event_date) {
      // Evitar problemas de zona horaria usando fecha local con hora del mediodía
      const eventDate = new Date(data.event_date + 'T12:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Resetear a medianoche para comparar solo fechas
      
      if (eventDate < today) {
        errors.push('La fecha del evento no puede ser en el pasado')
      }
    }

    if (data.margin_percentage !== undefined && (data.margin_percentage < 0 || data.margin_percentage > 200)) {
      errors.push('El margen debe estar entre 0% y 200%')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Duplicate an existing quote - complete copy with only title change
   * Duplicates everything exactly as-is including employees and dates, only changes title to "(copia)"
   */
  static async duplicate(originalQuoteId: number): Promise<Quote> {
    // Step 1: Fetch the original quote with all its data
    const originalQuote = await this.getById(originalQuoteId)
    
    if (!originalQuote) {
      throw new Error('Cotización original no encontrada')
    }

    // Step 2: Prepare new quote data - keep everything exactly the same except title
    const newQuoteData: CreateQuoteData = {
      client_id: originalQuote.client_id,
      client_type: originalQuote.client_type,
      event_title: `${originalQuote.event_title} (copia)`,
      event_date: originalQuote.event_date,
      event_end_date: originalQuote.event_end_date,
      event_start_time: originalQuote.event_start_time,
      event_end_time: originalQuote.event_end_time,
      event_location: originalQuote.event_location,
      transport_zone_id: originalQuote.transport_zone_id,
      transport_count: originalQuote.transport_count,
      transport_product_ids: originalQuote.transport_product_ids, // ULTRATHINK: Copy transport product selection
      estimated_attendees: originalQuote.estimated_attendees,
      event_description: originalQuote.event_description,
      
      // Copy pricing structure exactly
      subtotal: originalQuote.subtotal,
      transport_cost: originalQuote.transport_cost,
      tax_retention_percentage: originalQuote.tax_retention_percentage,
      tax_retention_amount: originalQuote.tax_retention_amount,
      retention_percentage: originalQuote.retention_percentage, // ULTRATHINK: Copy manual retention percentage
      margin_percentage: originalQuote.margin_percentage,
      margin_amount: originalQuote.margin_amount,
      total_cost: originalQuote.total_cost,
      
      // Copy payment terms exactly
      payment_terms_days: originalQuote.payment_terms_days,
      requires_advance_payment: originalQuote.requires_advance_payment,
      advance_payment_percentage: originalQuote.advance_payment_percentage,
      
      // Copy notes
      notes: originalQuote.notes,
      internal_notes: `Duplicado de ${originalQuote.quote_number} - ${originalQuote.internal_notes || ''}`,
      
      // Copy daily schedules exactly
      daily_schedules: originalQuote.daily_schedules || []
    }

    // Step 3: Prepare quote items data with ALL data including employees
    const newQuoteItems: CreateQuoteItemData[] = (originalQuote.items || []).map(item => ({
      item_type: item.item_type,
      employee_id: item.employee_id, // Keep employee assignment
      product_id: item.product_id,
      resource_id: item.resource_id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      hours_worked: item.hours_worked,
      extra_cost: item.extra_cost,
      extra_cost_reason: item.extra_cost_reason,
      shift_type: item.shift_type,
      units_per_product: item.units_per_product,
      is_subcontracted: item.is_subcontracted,
      subcontractor_name: item.subcontractor_name,
      subcontractor_cost: item.subcontractor_cost,
      variable_cost_reason: item.variable_cost_reason,
      notes: item.notes
    }))

    // Step 4: Create the new quote with all original data
    const newQuote = await this.create(newQuoteData, newQuoteItems)

    // Step 5: Return the new quote
    return newQuote
  }
}
