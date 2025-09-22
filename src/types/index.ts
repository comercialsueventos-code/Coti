// Business types for Sue Events

export type UserRole = 'admin' | 'sales' | 'viewer'
export type EmployeeType = 'operario' | 'chef' | 'mesero' | 'supervisor' | 'conductor'
export type ClientType = 'social' | 'corporativo'
export type QuoteStatus = 'pendiente' | 'aceptado' | 'cancelado'
export type ShiftType = 'morning' | 'afternoon' | 'full_day'
export type QuoteItemType = 'employee' | 'product' | 'resource' | 'furniture' | 'transport' | 'variable' | 'subcontract'

export interface HourlyRateRange {
  id?: string // UUID for frontend management
  min_hours: number // Hora mínima (ej: 0, 1, 3)
  max_hours: number | null // Hora máxima (ej: 1, 2, 8) - null significa "infinito" para rangos como "8h+"
  rate: number // Tarifa por hora en este rango
  description?: string // Descripción opcional como "Servicio básico", "Tarifa extendida"
}

export interface User {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface EmployeeCategory {
  id: number
  name: string // ej: "Chef Senior", "Operario Nivel 1"
  category_type: EmployeeType // Base type
  description?: string
  icon: string // Emoji
  color: string // Hex color
  
  // Pricing configuration
  pricing_type: 'plana' | 'flexible' // Type of pricing structure
  flat_rate?: number // Fixed rate per hour (only for pricing_type = 'plana')
  default_hourly_rates: HourlyRateRange[] // Flexible rates (only for pricing_type = 'flexible')
  
  // Default configurations
  default_has_arl: boolean
  default_arl_provider?: string
  default_certifications: string[]
  
  // Category requirements
  requires_certification: boolean
  required_certifications: string[]
  min_experience_months: number
  
  // Advanced settings
  availability_restrictions: Record<string, any>
  special_skills: string[]
  equipment_access: string[]
  
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Employee {
  id: number
  name: string
  employee_type: EmployeeType
  category_id?: number
  category?: EmployeeCategory // Populated via join
  phone?: string
  email?: string
  identification_number?: string
  address?: string
  hourly_rates?: HourlyRateRange[] // Optional when using category rates
  has_arl: boolean
  arl_provider?: string
  certifications?: string[]
  hire_date?: string
  birth_date?: string
  emergency_contact?: {
    name: string
    phone: string
    relationship: string
  }
  bank_account?: {
    bank: string
    account_type: string
    account_number: string
  }
  is_active: boolean
  notes?: string
  profile_picture_url?: string
  default_extra_cost?: number // Default extra cost for this employee (ARL, bonifications, etc.)
  default_extra_cost_reason?: string // Reason for the extra cost (optional description)
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: number
  name: string
  display_name: string
  icon: string
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  category: string // Deprecated: usar category_id
  category_id?: number
  category_info?: ProductCategory // Populated via join
  subcategory?: string
  name: string
  description?: string
  pricing_type: 'unit' | 'measurement' // 'unit' = precio fijo por producto, 'measurement' = precio por unidad de medida
  base_price: number // Para 'unit': precio total del producto. Para 'measurement': precio por unidad de medida
  unit: string // Para 'unit': ej. "producto", "porción". Para 'measurement': ej. "onza", "gramo", "ml"
  requires_equipment: boolean
  equipment_needed?: string[]
  preparation_time_minutes?: number
  shelf_life_hours?: number
  ingredients?: string[]
  allergens?: string[]
  nutritional_info?: Record<string, any>
  supplier_info?: Record<string, any>
  cost_price?: number
  minimum_order: number
  is_seasonal: boolean
  seasonal_months?: number[]
  is_active: boolean
  image_url?: string
  created_at: string
  updated_at: string
}

export interface ClientContact {
  id?: number
  name: string
  phone?: string
  email?: string
  position?: string
  is_primary: boolean
}

export interface City {
  id: number
  name: string
  department: string
  country: string
  postal_code?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: number
  name: string
  type: ClientType
  contact_person?: string // Deprecated: usar contacts array
  phone?: string // Deprecated: usar contacts array
  email?: string // Deprecated: usar contacts array
  contacts?: ClientContact[]
  city?: string // Deprecated: usar city_id
  city_id?: number // New normalized city reference
  address?: string
  tax_id?: string // NIT para corporativos
  payment_terms_days: number // 0 = inmediato
  requires_advance_payment: boolean
  advance_payment_percentage: number
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  
  // Relations populated by joins
  city_data?: City // Populated city object when joining
}

export interface TransportZone {
  id: number
  name: string
  description?: string
  base_cost: number
  additional_equipment_cost: number
  estimated_travel_time_minutes?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Quote {
  id: number
  quote_number: string
  client_id: number
  client_type: ClientType
  
  // Información del evento
  event_title?: string
  event_date: string
  event_end_date?: string
  event_start_time?: string
  event_end_time?: string
  event_location?: string
  transport_zone_id?: number // Deprecated: usar multiple_transport_zones
  transport_count?: number // Deprecated: usar multiple_transport_zones
  transport_product_ids?: number[] // Manual selection of products for transport distribution
  use_flexible_transport?: boolean // Toggle para distribución manual
  transport_allocations?: any[] // Asignaciones manuales por producto
  multiple_transport_zones?: any[] // Nueva implementación de múltiples zonas
  estimated_attendees?: number
  event_description?: string
  
  // Estado y términos
  status: QuoteStatus
  quote_date: string
  expiration_date?: string
  payment_terms_days: number
  requires_advance_payment: boolean
  advance_payment_percentage: number
  
  // Cálculos financieros
  subtotal: number
  transport_cost: number
  tax_retention_percentage: number
  tax_retention_amount: number
  retention_percentage?: number // Manual retention percentage setting
  margin_percentage: number
  margin_amount: number
  total_cost: number
  
  // Metadatos
  created_by?: string
  approved_by?: string
  approved_at?: string
  notes?: string
  internal_notes?: string
  created_at: string
  updated_at: string
  
  // Textos personalizados para esta cotización específica
  custom_texts?: {
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
    use_custom_texts?: boolean
  }

  // Relaciones populated
  client?: Client
  transport_zone?: TransportZone
  items?: QuoteItem[]
  employee_product_links?: QuoteEmployeeProductLink[]
  daily_schedules?: QuoteDailySchedule[]
}

export interface QuoteItem {
  id: number
  quote_id: number
  item_type: QuoteItemType
  
  // Referencias
  employee_id?: number
  product_id?: number
  resource_id?: number
  
  // Información del item
  description: string
  quantity: number
  unit_price: number
  total_price: number
  
  // Detalles específicos
  hours_worked?: number // Para empleados
  extra_cost?: number // Manual extra cost for employees (ARL, bonifications, etc.)
  extra_cost_reason?: string // Reason for the extra cost (optional description)
  shift_type?: ShiftType // Para empleados
  units_per_product?: number // For measurement products: how many measurement units per product
  is_subcontracted: boolean
  subcontractor_name?: string
  subcontractor_cost?: number
  
  // Para productos variables
  variable_cost_reason?: string
  notes?: string // Additional notes for the item
  created_at: string

  // Relaciones populated
  employee?: Employee
  product?: Product
}

export interface QuoteEmployeeProductLink {
  id: number
  quote_id: number
  employee_id: number
  product_id: number
  hours_allocated?: number
  notes?: string
  created_at: string

  // Relations (optional)
  employee?: Employee
  product?: Product
}

export interface QuoteDailySchedule {
  id: number
  quote_id: number
  event_date: string
  start_time: string
  end_time: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface EmployeeShift {
  id: number
  employee_id: number
  date: string
  shift_type: ShiftType
  shift_start_time?: string  // Horario específico de inicio (ej: "02:00:00")
  shift_end_time?: string    // Horario específico de fin (ej: "05:30:00")
  status: 'available' | 'booked' | 'vacation' | 'sick' | 'maintenance'
  quote_id?: number
  quote_item_id?: number
  replacement_for_employee_id?: number
  notes?: string
  created_by?: string
  created_at: string

  // Relaciones populated
  employee?: Employee
  quote?: Quote
  replacement_for_employee?: Employee
}

// Form types for creating/updating entities
export interface CreateClientData {
  name: string
  type: ClientType
  contact_person?: string // Deprecated: usar contacts array
  phone?: string // Deprecated: usar contacts array
  email?: string // Deprecated: usar contacts array
  contacts?: ClientContact[]
  city?: string // Deprecated: usar city_id
  city_id?: number // New normalized city reference
  address?: string
  tax_id?: string
  payment_terms_days?: number
  requires_advance_payment?: boolean
  advance_payment_percentage?: number
  notes?: string
}

export interface UpdateClientData extends Partial<CreateClientData> {
  is_active?: boolean
}

export interface CreateQuoteData {
  client_id: number
  client_type: ClientType
  event_title?: string
  event_date: string
  event_end_date?: string
  event_start_time?: string
  event_end_time?: string
  event_location?: string
  transport_zone_id?: number // Deprecated
  transport_count?: number // Deprecated
  multiple_transport_zones?: any[] // Nueva implementación
  estimated_attendees?: number
  event_description?: string
  subtotal: number
  transport_cost: number
  margin_percentage: number
  margin_amount: number
  tax_retention_percentage: number
  tax_retention_amount: number
  // Manual retention percentage setting persisted with the quote (used to rehydrate UI)
  retention_percentage?: number
  total_cost: number
  quote_items: CreateQuoteItemData[]
  notes?: string
  internal_notes?: string
  // Textos personalizados para esta cotización
  custom_texts?: {
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
    use_custom_texts?: boolean
  }
  // Optional: direct mapping of employees to products for this quote
  employee_product_links?: Array<{
    employee_id: number
    product_id: number
    hours_allocated?: number
    notes?: string
  }>
  // Optional: daily schedules for multi-day events
  daily_schedules?: Array<{
    event_date: string
    start_time: string
    end_time: string
    notes?: string
  }>
}

export interface UpdateQuoteData extends Partial<CreateQuoteData> {
  status?: QuoteStatus
  expiration_date?: string
  transport_cost?: number
}

export interface CreateQuoteItemData {
  quote_id?: number
  item_type: QuoteItemType
  employee_id?: number
  product_id?: number
  resource_id?: number
  description: string
  quantity: number
  unit_price: number
  total_price: number
  hours_worked?: number
  extra_cost?: number
  extra_cost_reason?: string
  shift_type?: ShiftType
  is_subcontracted?: boolean
  subcontractor_name?: string
  subcontractor_cost?: number
  variable_cost_reason?: string
}

// Filter and search types
export interface EmployeeFilters {
  employee_type?: EmployeeType
  is_active?: boolean
  has_arl?: boolean
  search?: string
}

export interface QuoteFilters {
  status?: QuoteStatus
  client_type?: ClientType
  date_from?: string
  date_to?: string
  client_id?: number
  search?: string
}

export interface ClientFilters {
  type?: ClientType
  is_active?: boolean
  search?: string
}

export interface TransportFilters {
  is_active?: boolean
  search?: string
  max_cost?: number
  max_travel_time?: number
}

export interface CreateTransportZoneData {
  name: string
  description?: string
  base_cost: number
  additional_equipment_cost?: number
  estimated_travel_time_minutes?: number
}

export interface UpdateTransportZoneData extends Partial<CreateTransportZoneData> {
  is_active?: boolean
}

// Maquinaria y Equipos
export interface Machinery {
  id: number
  name: string
  category: 'sonido' | 'iluminacion' | 'cocina' | 'refrigeracion' | 'mobiliario' | 'decoracion' | 'transporte' | 'otros'
  description?: string
  hourly_rate: number
  daily_rate: number
  setup_cost?: number
  requires_operator: boolean
  operator_hourly_rate?: number
  specifications?: Record<string, any>
  maintenance_cost_per_use?: number
  fuel_cost_per_hour?: number
  insurance_required: boolean
  is_available: boolean
  last_maintenance_date?: string
  next_maintenance_date?: string
  purchase_date?: string
  depreciation_rate?: number
  supplier_info?: Record<string, any>
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateMachineryData {
  name: string
  category: 'sonido' | 'iluminacion' | 'cocina' | 'refrigeracion' | 'mobiliario' | 'decoracion' | 'transporte' | 'otros'
  description?: string
  hourly_rate: number
  daily_rate: number
  setup_cost?: number
  requires_operator?: boolean
  operator_hourly_rate?: number
  specifications?: Record<string, any>
  maintenance_cost_per_use?: number
  fuel_cost_per_hour?: number
  insurance_required?: boolean
  last_maintenance_date?: string
  next_maintenance_date?: string
  purchase_date?: string
  depreciation_rate?: number
  supplier_info?: Record<string, any>
  image_url?: string
}

export interface UpdateMachineryData extends Partial<CreateMachineryData> {
  is_available?: boolean
  is_active?: boolean
}

export interface MachineryFilters {
  category?: 'sonido' | 'iluminacion' | 'cocina' | 'refrigeracion' | 'mobiliario' | 'decoracion' | 'transporte' | 'otros'
  is_available?: boolean
  is_active?: boolean
  requires_operator?: boolean
  search?: string
  max_hourly_rate?: number
  max_daily_rate?: number
}

// Proveedores y Subcontratistas
export interface Supplier {
  id: number
  name: string
  type: 'machinery_rental' | 'event_subcontractor' | 'catering' | 'decoration' | 'entertainment' | 'transport' | 'otros'
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  tax_id?: string
  payment_terms_days: number
  requires_advance_payment: boolean
  advance_payment_percentage: number
  commission_percentage: number // Margen que Sue Events aplica
  specialties?: string[] // Especialidades del proveedor
  equipment_categories?: string[] // Para proveedores de maquinaria
  service_areas?: string[] // Zonas de servicio
  quality_rating: number // 1-5 estrellas
  reliability_rating: number // 1-5 estrellas
  price_rating: number // 1-5 (1=caro, 5=económico)
  last_collaboration_date?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateSupplierData {
  name: string
  type: 'machinery_rental' | 'event_subcontractor' | 'catering' | 'decoration' | 'entertainment' | 'transport' | 'otros'
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  tax_id?: string
  payment_terms_days?: number
  requires_advance_payment?: boolean
  advance_payment_percentage?: number
  commission_percentage?: number
  specialties?: string[]
  equipment_categories?: string[]
  service_areas?: string[]
  quality_rating?: number
  reliability_rating?: number
  price_rating?: number
  notes?: string
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {
  is_active?: boolean
}

// Alquiler de Maquinaria Externa
export interface MachineryRental {
  id: number
  supplier_id: number
  machinery_name: string
  category: 'sonido' | 'iluminacion' | 'cocina' | 'refrigeracion' | 'mobiliario' | 'decoracion' | 'transporte' | 'otros'
  description?: string
  supplier_hourly_rate: number
  supplier_daily_rate: number
  sue_hourly_rate: number // Precio que Sue Events cobra al cliente
  sue_daily_rate: number
  setup_cost?: number
  requires_operator: boolean
  operator_cost?: number
  minimum_rental_hours: number
  delivery_cost?: number
  pickup_cost?: number
  insurance_cost?: number
  damage_deposit?: number
  is_available: boolean
  created_at: string
  updated_at: string
  
  // Relación
  supplier?: Supplier
}

// Subcontratación Completa
export interface EventSubcontract {
  id: number
  supplier_id: number
  service_name: string
  service_type: 'event_complete' | 'catering_only' | 'decoration_only' | 'entertainment_only' | 'transport_only'
  description?: string
  supplier_cost: number // Lo que Sue Events paga al subcontratista
  sue_price: number // Lo que Sue Events cobra al cliente
  includes_setup: boolean
  includes_cleanup: boolean
  includes_staff: boolean
  includes_equipment: boolean
  minimum_attendees?: number
  maximum_attendees?: number
  service_duration_hours?: number
  advance_notice_days: number
  cancellation_policy?: string
  quality_guarantees?: string[]
  is_available: boolean
  created_at: string
  updated_at: string
  
  // Relación  
  supplier?: Supplier
}

export interface SupplierFilters {
  type?: 'machinery_rental' | 'event_subcontractor' | 'catering' | 'decoration' | 'entertainment' | 'transport' | 'otros'
  is_active?: boolean
  service_area?: string
  specialty?: string
  min_quality_rating?: number
  search?: string
}

// Elementos Desechables e Independientes
export interface DisposableItem {
  id: number
  name: string
  category: string
  subcategory?: string
  description?: string
  unit: string
  cost_price: number
  sale_price: number
  minimum_quantity: number
  supplier_info?: Record<string, any>
  is_recyclable: boolean
  is_biodegradable: boolean
  storage_requirements?: string
  shelf_life_days?: number
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateDisposableItemData {
  name: string
  category?: string
  subcategory?: string
  description?: string
  unit?: string
  cost_price: number
  sale_price: number
  minimum_quantity?: number
  supplier_info?: Record<string, any>
  is_recyclable?: boolean
  is_biodegradable?: boolean
  storage_requirements?: string
  shelf_life_days?: number
  image_url?: string
}

export interface UpdateDisposableItemData extends Partial<CreateDisposableItemData> {
  is_active?: boolean
}

export interface DisposableItemFilters {
  category?: string
  subcategory?: string
  is_active?: boolean
  is_recyclable?: boolean
  is_biodegradable?: boolean
  search?: string
  max_price?: number
}

// City types
export interface CreateCityData {
  name: string
  department: string
  country?: string
  postal_code?: string
  is_active?: boolean
}

export interface UpdateCityData extends Partial<CreateCityData> {}

export interface CityFilters {
  department?: string
  is_active?: boolean
  search?: string
}
