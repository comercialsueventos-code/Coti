import { supabase } from './supabase'
import { Client, CreateClientData, UpdateClientData, ClientFilters, ClientContact } from '../types'

export class ClientsService {
  static async getAll(filters?: ClientFilters): Promise<Client[]> {
    let query = supabase
      .from('clients')
      .select(`
        *,
        contacts:client_contacts(
          id,
          name,
          phone,
          email,
          position,
          is_primary
        ),
        city_data:cities(
          id,
          name,
          department,
          country,
          postal_code
        )
      `)
      .order('name')

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%, contact_person.ilike.%${filters.search}%, email.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async getById(id: number): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        contacts:client_contacts(
          id,
          name,
          phone,
          email,
          position,
          is_primary
        ),
        city_data:cities(
          id,
          name,
          department,
          country,
          postal_code
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async create(clientData: CreateClientData): Promise<Client> {
    // Separate contacts from client data
    const { contacts, ...clientOnly } = clientData
    
    // Set default values based on client type
    const processedData = {
      ...clientOnly,
      // For corporativo clients, default payment terms is 30 days
      payment_terms_days: clientData.type === 'corporativo' 
        ? (clientData.payment_terms_days ?? 30)
        : (clientData.payment_terms_days ?? 0),
      // For social clients, default advance payment is required
      requires_advance_payment: clientData.type === 'social' 
        ? (clientData.requires_advance_payment ?? true)
        : (clientData.requires_advance_payment ?? false),
      // Default advance payment percentage
      advance_payment_percentage: clientData.advance_payment_percentage ?? 50.0
    }

    // Start transaction for client and contacts
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert(processedData)
      .select()
      .single()

    if (clientError) throw clientError

    // Create contacts if provided
    if (contacts && contacts.length > 0) {
      // Ensure only one primary contact
      const contactsWithPrimary = contacts.map((contact, index) => {
        const { id: contactId, ...contactWithoutId } = contact
        return {
          ...contactWithoutId,
          client_id: client.id,
          is_primary: index === 0 || contact.is_primary === true ? true : false
        }
      })

      // If no contact is marked as primary, make the first one primary
      if (!contactsWithPrimary.some(c => c.is_primary)) {
        contactsWithPrimary[0].is_primary = true
      }

      const { error: contactsError } = await supabase
        .from('client_contacts')
        .insert(contactsWithPrimary)

      if (contactsError) throw contactsError
    }

    // Return client with contacts
    return this.getById(client.id)
  }

  static async update(id: number, clientData: UpdateClientData): Promise<Client> {
    // Separate contacts from client data
    const { contacts, ...clientOnly } = clientData

    // Update client data
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .update(clientOnly)
      .eq('id', id)
      .select()
      .single()

    if (clientError) throw clientError

    // Update contacts if provided
    if (contacts && contacts.length > 0) {
      // Get existing contacts
      const { data: existingContacts, error: fetchError } = await supabase
        .from('client_contacts')
        .select('*')
        .eq('client_id', id)

      if (fetchError) throw fetchError

      // Find which contact should be primary
      const primaryContactIndex = contacts.findIndex(contact => contact.is_primary === true)
      const validPrimaryIndex = primaryContactIndex >= 0 ? primaryContactIndex : 0

      // Ensure only one contact is marked as primary
      const contactsWithPrimary = contacts.map((contact, index) => ({
        ...contact,
        client_id: id,
        is_primary: index === validPrimaryIndex
      }))

      // First, set all existing contacts as non-primary
      const { error: resetPrimaryError } = await supabase
        .from('client_contacts')
        .update({ is_primary: false })
        .eq('client_id', id)

      if (resetPrimaryError) throw resetPrimaryError

      // Process each contact individually
      for (const contact of contactsWithPrimary) {
        if (contact.id && contact.id > 0) {
          // Update existing contact
          const { error: updateError } = await supabase
            .from('client_contacts')
            .update({
              name: contact.name,
              phone: contact.phone,
              email: contact.email,
              position: contact.position,
              is_primary: contact.is_primary
            })
            .eq('id', contact.id)

          if (updateError) throw updateError
        } else {
          // Insert new contact
          const { id: contactId, ...contactWithoutId } = contact
          const { error: insertError } = await supabase
            .from('client_contacts')
            .insert(contactWithoutId)

          if (insertError) throw insertError
        }
      }

      // Handle deleted contacts: remove contacts that are not in the updated list
      const updatedContactIds = contactsWithPrimary
        .filter(c => c.id && c.id > 0)
        .map(c => c.id)
      
      const contactsToDelete = existingContacts
        .filter(existing => !updatedContactIds.includes(existing.id))
        .map(c => c.id)

      if (contactsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('client_contacts')
          .delete()
          .in('id', contactsToDelete)

        if (deleteError) throw deleteError
      }
    }

    // Return updated client with contacts
    return this.getById(id)
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async getByType(type: 'social' | 'corporativo'): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        contacts:client_contacts(
          id,
          name,
          phone,
          email,
          position,
          is_primary
        ),
        city_data:cities(
          id,
          name,
          department,
          country,
          postal_code
        )
      `)
      .eq('type', type)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }

  static async getActive(): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        contacts:client_contacts(
          id,
          name,
          phone,
          email,
          position,
          is_primary
        ),
        city_data:cities(
          id,
          name,
          department,
          country,
          postal_code
        )
      `)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }

  static async search(searchTerm: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        contacts:client_contacts(
          id,
          name,
          phone,
          email,
          position,
          is_primary
        ),
        city_data:cities(
          id,
          name,
          department,
          country,
          postal_code
        )
      `)
      .or(`name.ilike.%${searchTerm}%, contact_person.ilike.%${searchTerm}%, email.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('name')
      .limit(10)

    if (error) throw error
    return data || []
  }

  // Validation helpers
  static validateTaxId(taxId: string, clientType: 'social' | 'corporativo'): boolean {
    if (clientType === 'social') {
      return true // Tax ID not required for social clients
    }
    
    // Basic NIT validation for Colombian tax IDs
    if (!taxId || taxId.length < 9) {
      return false
    }
    
    // Should contain only numbers and hyphens
    return /^[0-9\-]+$/.test(taxId)
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validatePhone(phone: string): boolean {
    // Flexible phone number validation - accepts any reasonable format
    if (!phone) return false
    
    // Remove all non-digits to get just the numbers
    const digitsOnly = phone.replace(/\D/g, '')
    
    // Accept any phone number with at least 7 digits (minimum for most phone systems)
    // and maximum 15 digits (international standard)
    return digitsOnly.length >= 7 && digitsOnly.length <= 15
  }

  // Business logic helpers
  static calculatePaymentTerms(client: Client): {
    payment_due_date: string
    requires_advance: boolean
    advance_amount: number
  } {
    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(today.getDate() + client.payment_terms_days)

    return {
      payment_due_date: dueDate.toISOString().split('T')[0],
      requires_advance: client.requires_advance_payment,
      advance_amount: client.advance_payment_percentage
    }
  }

  static getDefaultValues(clientType: 'social' | 'corporativo'): Partial<CreateClientData> {
    if (clientType === 'corporativo') {
      return {
        payment_terms_days: 30,
        requires_advance_payment: false,
        advance_payment_percentage: 0
      }
    } else {
      return {
        payment_terms_days: 0,
        requires_advance_payment: true,
        advance_payment_percentage: 50
      }
    }
  }
}