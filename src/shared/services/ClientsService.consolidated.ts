import { BaseEntityService } from './BaseEntityService'
import { Client, CreateClientData, UpdateClientData, ClientContact } from '../../types'

/**
 * Extended Client Filters
 */
export interface ClientFilters {
  search?: string
  type?: 'social' | 'corporativo'
  is_active?: boolean
  city_id?: number
  has_contacts?: boolean
  payment_terms_days?: number
}

/**
 * Consolidated Clients Service
 * 
 * Extends BaseEntityService with client-specific functionality.
 * Demonstrates how to migrate existing services to the consolidated pattern.
 * 
 * @example
 * ```typescript
 * const clientsService = new ConsolidatedClientsService()
 * 
 * // Standard CRUD operations (inherited from base)
 * const clients = await clientsService.getAll({ is_active: true })
 * const client = await clientsService.getById(123)
 * const newClient = await clientsService.create(clientData)
 * 
 * // Client-specific operations
 * const corporateClients = await clientsService.getCorporateClients()
 * const clientsWithContacts = await clientsService.getClientsWithContacts()
 * ```
 */
export class ConsolidatedClientsService extends BaseEntityService<
  Client,
  CreateClientData,
  UpdateClientData,
  ClientFilters
> {
  
  constructor() {
    super({
      tableName: 'clients',
      defaultSelect: `
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
      `,
      defaultOrderBy: 'name',
      searchFields: ['name', 'contact_person', 'email', 'tax_id']
    })
  }
  
  // --- Custom Client-Specific Methods ---
  
  /**
   * Get corporate clients only
   */
  async getCorporateClients(): Promise<Client[]> {
    return this.getAll({ type: 'corporativo', is_active: true })
  }
  
  /**
   * Get social clients only
   */
  async getSocialClients(): Promise<Client[]> {
    return this.getAll({ type: 'social', is_active: true })
  }
  
  /**
   * Get clients with contact information
   */
  async getClientsWithContacts(): Promise<Client[]> {
    return this.getAll({ has_contacts: true })
  }
  
  /**
   * Get clients by payment terms
   */
  async getClientsByPaymentTerms(days: number): Promise<Client[]> {
    return this.getAll({ payment_terms_days: days })
  }
  
  /**
   * Get clients by city
   */
  async getClientsByCity(cityId: number): Promise<Client[]> {
    return this.getAll({ city_id: cityId })
  }
  
  /**
   * Search clients with enhanced logic
   */
  async searchClients(term: string, includeInactive = false): Promise<Client[]> {
    const filters: ClientFilters = {
      search: term
    }
    
    if (!includeInactive) {
      filters.is_active = true
    }
    
    return this.getAll(filters)
  }
  
  // --- Protected Method Overrides ---
  
  /**
   * Apply client-specific filters
   */
  protected applyCustomFilters(query: any, filters: ClientFilters): any {
    // Type filter
    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    
    // City filter
    if (filters.city_id) {
      query = query.eq('city_id', filters.city_id)
    }
    
    // Payment terms filter
    if (filters.payment_terms_days !== undefined) {
      query = query.eq('payment_terms_days', filters.payment_terms_days)
    }
    
    // Has contacts filter
    if (filters.has_contacts) {
      query = query.not('contacts', 'is', null)
    }
    
    return query
  }
  
  /**
   * Pre-create processing for client data
   */
  protected async beforeCreate(data: CreateClientData): Promise<any> {
    // Separate contacts from client data
    const { contacts, ...clientOnly } = data
    
    // Set default values based on client type
    const processedData = {
      ...clientOnly,
      // Set defaults for corporate clients
      ...(clientOnly.type === 'corporativo' && {
        payment_terms_days: clientOnly.payment_terms_days || 30,
        requires_purchase_order: clientOnly.requires_purchase_order ?? true
      }),
      // Set defaults for social clients
      ...(clientOnly.type === 'social' && {
        payment_terms_days: 0,
        requires_purchase_order: false
      }),
      // Ensure created/updated timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    return processedData
  }
  
  /**
   * Post-create processing to handle contacts
   */
  protected async afterCreate(client: Client): Promise<Client> {
    // Handle contacts creation if they were provided
    // This would need access to the original create data
    // For now, we'll return the client as-is
    // In a real implementation, you might store contacts in a separate operation
    
    return client
  }
  
  /**
   * Pre-update processing
   */
  protected async beforeUpdate(id: number, data: UpdateClientData): Promise<any> {
    const processedData = {
      ...data,
      updated_at: new Date().toISOString()
    }
    
    // Remove contacts from update data if present
    // Contacts would be handled separately
    const { contacts, ...clientOnly } = processedData
    
    return clientOnly
  }
  
  /**
   * Pre-delete validation
   */
  protected async beforeDelete(id: number): Promise<void> {
    // Check if client has any active quotes or orders
    // This would require additional queries to related tables
    
    // For now, we'll just log the deletion
    console.log(`Preparing to delete client ${id}`)
  }
  
  // --- Client-Specific Contact Management ---
  
  /**
   * Add contact to client
   */
  async addContact(clientId: number, contact: Omit<ClientContact, 'id' | 'client_id'>): Promise<ClientContact> {
    const { data, error } = await this.client
      .from('client_contacts')
      .insert({
        ...contact,
        client_id: clientId
      })
      .select()
      .single()
    
    if (error) {
      throw this.createServiceError('Failed to add contact to client', error)
    }
    
    return data
  }
  
  /**
   * Update client contact
   */
  async updateContact(contactId: number, contact: Partial<ClientContact>): Promise<ClientContact> {
    const { data, error } = await this.client
      .from('client_contacts')
      .update(contact)
      .eq('id', contactId)
      .select()
      .single()
    
    if (error) {
      throw this.createServiceError('Failed to update client contact', error)
    }
    
    return data
  }
  
  /**
   * Remove contact from client
   */
  async removeContact(contactId: number): Promise<void> {
    const { error } = await this.client
      .from('client_contacts')
      .delete()
      .eq('id', contactId)
    
    if (error) {
      throw this.createServiceError('Failed to remove client contact', error)
    }
  }
  
  /**
   * Get client contacts
   */
  async getClientContacts(clientId: number): Promise<ClientContact[]> {
    const { data, error } = await this.client
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false })
      .order('name')
    
    if (error) {
      throw this.createServiceError('Failed to get client contacts', error)
    }
    
    return data || []
  }
}