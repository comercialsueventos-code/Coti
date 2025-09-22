/**
 * Clients Service - First Migration to BaseEntityService
 * 
 * Demonstrates how BaseEntityService eliminates CRUD duplication
 * BEFORE: ~200 lines of duplicated CRUD patterns
 * AFTER: ~50 lines using generic service
 */

import BaseEntityService from './BaseEntityService'
import { Client, CreateClientData, UpdateClientData, ClientFilters, ClientContact } from '../../types'

/**
 * Extended filters for clients (inherits from BaseEntityFilters)
 */
interface ExtendedClientFilters extends ClientFilters {
  search?: string
  is_active?: boolean
  type?: 'social' | 'corporativo'
  limit?: number
  offset?: number
}

/**
 * Clients Service using BaseEntityService
 * Eliminates ~150 lines of duplicated CRUD code
 */
export class ConsolidatedClientsService extends BaseEntityService<
  Client, 
  CreateClientData, 
  UpdateClientData, 
  ExtendedClientFilters
> {
  
  constructor() {
    super({
      tableName: 'clients',
      defaultSelect: `
        *,
        contacts:client_contacts(
          id, name, phone, email, position, is_primary
        ),
        city_data:cities(
          id, name, department, country, postal_code
        )
      `,
      defaultOrderBy: 'name',
      filterActiveByDefault: true
    })
  }

  /**
   * Custom search logic for clients
   * Searches in name, contact_person, and email fields
   */
  protected applySearchFilter(query: any, search: string): any {
    return query.or(`name.ilike.%${search}%, contact_person.ilike.%${search}%, email.ilike.%${search}%`)
  }

  /**
   * Apply client-specific filters
   */
  protected applyCustomFilters(query: any, filters?: ExtendedClientFilters): any {
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    return query
  }

  /**
   * Process create data with client-specific business logic
   */
  protected async processCreateData(data: CreateClientData): Promise<any> {
    // Separate contacts from client data
    const { contacts, ...clientOnly } = data

    // Apply business logic based on client type
    const processedData = {
      ...clientOnly,
      // For corporativo clients, default payment terms is 30 days
      payment_terms_days: data.type === 'corporativo' 
        ? (data.payment_terms_days ?? 30)
        : (data.payment_terms_days ?? 0),
      // For social clients, default advance payment is required
      requires_advance_payment: data.type === 'social' 
        ? (data.requires_advance_payment ?? true)
        : (data.requires_advance_payment ?? false),
      // Default advance payment percentage
      advance_payment_percentage: data.advance_payment_percentage ?? 50.0,
      is_active: true
    }

    return processedData
  }

  /**
   * Post-creation processing - handle contacts creation
   */
  protected async postCreate(createdClient: Client, originalData: CreateClientData): Promise<void> {
    const { contacts } = originalData

    if (contacts && contacts.length > 0) {
      const { supabase } = require('../../services/supabase')
      
      // Ensure only one primary contact
      const contactsWithPrimary = contacts.map((contact, index) => {
        const { id: contactId, ...contactWithoutId } = contact as any
        return {
          ...contactWithoutId,
          client_id: createdClient.id,
          is_primary: index === 0 || contact.is_primary === true ? true : false
        }
      })

      // If no contact is marked as primary, make the first one primary
      if (!contactsWithPrimary.some(c => c.is_primary)) {
        contactsWithPrimary[0].is_primary = true
      }

      await supabase
        .from('client_contacts')
        .insert(contactsWithPrimary)
    }
  }

  /**
   * Get clients by type (convenience method)
   */
  async getByType(type: 'social' | 'corporativo'): Promise<Client[]> {
    return this.getAll({ type })
  }

  /**
   * Get active clients only (convenience method) 
   */
  async getActiveClients(): Promise<Client[]> {
    return this.getAll({ is_active: true })
  }

  /**
   * Search clients (convenience method)
   */
  async searchClients(searchTerm: string): Promise<Client[]> {
    return this.getAll({ search: searchTerm })
  }
}

// Create and export singleton instance
export const consolidatedClientsService = new ConsolidatedClientsService()

// Export class for testing and extension
export default ConsolidatedClientsService
