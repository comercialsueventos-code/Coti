import { supabase } from './supabase'

export interface QuoteTemplate {
  id: number
  template_name: string
  includes_title: string
  includes_content: string
  payment_title: string
  payment_content: string
  requirements_title: string
  requirements_content: string
  observations_title: string
  observations_content: string
  company_phone: string
  company_email: string
  company_instagram: string
  signature_name: string
  is_active: boolean
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface QuoteTemplateInsert {
  template_name: string
  includes_title?: string
  includes_content?: string
  payment_title?: string
  payment_content?: string
  requirements_title?: string
  requirements_content?: string
  observations_title?: string
  observations_content?: string
  company_phone?: string
  company_email?: string
  company_instagram?: string
  signature_name?: string
  is_active?: boolean
  is_default?: boolean
}

export interface QuoteTemplateUpdate {
  template_name?: string
  includes_title?: string
  includes_content?: string
  payment_title?: string
  payment_content?: string
  requirements_title?: string
  requirements_content?: string
  observations_title?: string
  observations_content?: string
  company_phone?: string
  company_email?: string
  company_instagram?: string
  signature_name?: string
  is_active?: boolean
  is_default?: boolean
}

export class QuoteTemplatesService {
  /**
   * Obtener todas las plantillas
   */
  static async getAll(): Promise<QuoteTemplate[]> {
    try {
      const { data, error } = await supabase
        .from('quote_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error obteniendo plantillas de cotización:', error)
        // Si la tabla no existe, devolver plantilla por defecto
        if (error.code === '42P01') {
          console.warn('🔧 Tabla quote_templates no existe, devolviendo plantilla por defecto')
          return [this.getDefaultFallback()]
        }
        throw error
      }

      return data || []
    } catch (error: any) {
      // Manejo de errores de tabla inexistente
      if (error.code === '42P01') {
        console.warn('🔧 Tabla quote_templates no existe, devolviendo plantilla por defecto')
        return [this.getDefaultFallback()]
      }
      console.error('Error inesperado obteniendo todas las plantillas:', error)
      return [this.getDefaultFallback()]
    }
  }

  /**
   * Obtener plantilla activa (la predeterminada)
   */
  static async getDefault(): Promise<QuoteTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('quote_templates')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No hay plantilla predeterminada, intentar obtener la primera activa
          const { data: firstActive, error: firstError } = await supabase
            .from('quote_templates')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

          if (firstError || !firstActive) {
            console.warn('No se encontró ninguna plantilla activa, usando plantilla por defecto')
            return this.getDefaultFallback()
          }

          return firstActive
        }
        // Si hay otro tipo de error, podría ser que la tabla no existe
        console.error('Error obteniendo plantilla predeterminada:', error)
        return this.getDefaultFallback()
      }

      return data
    } catch (error: any) {
      // Si la tabla no existe (error 42P01), usar plantilla por defecto
      if (error.code === '42P01') {
        console.warn('🔧 Tabla quote_templates no existe, usando plantilla predeterminada hardcodeada')
        return this.getDefaultFallback()
      }
      console.error('Error inesperado obteniendo plantilla:', error)
      return this.getDefaultFallback()
    }
  }

  /**
   * Plantilla predeterminada cuando no existe la tabla o no hay datos
   */
  private static getDefaultFallback(): QuoteTemplate {
    return {
      id: 0,
      template_name: 'Plantilla Predeterminada (Fallback)',
      includes_title: 'INCLUYE',
      includes_content: 'Show culinario con equipos profesionales y utensilios especializados\nIngredientes premium para degustación. Menú personalizado según preferencias del cliente.\nChef especializado con experiencia en eventos corporativos\nTransporte de equipos y logística completa',
      payment_title: 'FORMA DE PAGO',
      payment_content: 'Anticipo: 50% - tres (3) semanas antes, para reservar la fecha del evento.\nSaldo: 50% - el primer día del evento\nCuenta de ahorros de Bancolombia No. 10743399787 - Peggy Cervantes - CC. 22.461.151\nElaboramos cuenta de cobro como documento para solicitar el pago del servicio.',
      requirements_title: 'REQUERIMIENTOS DE INSTALACIÓN PARA EQUIPOS',
      requirements_content: 'La instalación se realiza dos horas antes de iniciar el evento.\nCada equipo de cocción debe estar conectado a un punto de 110v, por separado.\nPara eventos en hoteles o centros de convenciones, el cliente nos debe suministrar el punto eléctrico del equipo dentro del área asignada para su mejor funcionamiento.\nEn el caso de algún daño eléctrico en el lugar del evento que ocasioné daños a nuestros equipos, o que su personal los conecten en puntos 220 v, el cliente debe pagar el arreglo de este.\nNinguno de los equipos se puede brandear o pegar algún adhesivo. Se puede adherir con cinta de enmascarar la etiqueta del logo de su empresa o del cliente.',
      observations_title: 'OBSERVACIONES',
      observations_content: 'Para requerir el servicio por favor enviar una orden de compra que contenga el tipo de servicio, cantidad, fecha, lugar, horario del evento, y las fechas de pago.\nSi en el lugar del evento (Centros de Convenciones, Hoteles, etc.) solicitan descorche por nuestros productos y/o servicios, el cliente debe realizar este pago.\nLa cantidad de servicios contratados, es independiente al número de personas que asisten a su evento\nLos servicios acordados de esta oferta deben ser prestados durante el horario del evento, ya que al ser servicios personalizados no se realizaran devoluciones o disminuciones de las cantidades solicitadas inicialmente.',
      company_phone: '3174421013',
      company_email: 'comercial@sue-events.com',
      company_instagram: '@sueevents',
      signature_name: 'PEGGY CERVANTES G.',
      is_active: true,
      is_default: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }

  /**
   * Obtener plantilla por ID
   */
  static async getById(id: number): Promise<QuoteTemplate> {
    const { data, error } = await supabase
      .from('quote_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error obteniendo plantilla por ID:', error)
      throw error
    }

    return data
  }

  /**
   * Crear nueva plantilla
   */
  static async create(template: QuoteTemplateInsert): Promise<QuoteTemplate> {
    const { data, error } = await supabase
      .from('quote_templates')
      .insert(template)
      .select()
      .single()

    if (error) {
      console.error('Error creando plantilla:', error)
      throw error
    }

    return data
  }

  /**
   * Actualizar plantilla existente
   */
  static async update(id: number, updates: QuoteTemplateUpdate): Promise<QuoteTemplate> {
    const { data, error } = await supabase
      .from('quote_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error actualizando plantilla:', error)
      throw error
    }

    return data
  }

  /**
   * Marcar una plantilla como predeterminada
   */
  static async setAsDefault(id: number): Promise<QuoteTemplate> {
    const { data, error } = await supabase
      .from('quote_templates')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error marcando plantilla como predeterminada:', error)
      throw error
    }

    return data
  }

  /**
   * Eliminar plantilla (soft delete - marcar como inactiva)
   */
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('quote_templates')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error eliminando plantilla:', error)
      throw error
    }
  }

  /**
   * Restaurar plantilla eliminada
   */
  static async restore(id: number): Promise<QuoteTemplate> {
    const { data, error } = await supabase
      .from('quote_templates')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error restaurando plantilla:', error)
      throw error
    }

    return data
  }
}

export default QuoteTemplatesService