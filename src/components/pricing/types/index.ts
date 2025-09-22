import { Employee, Product, Client, ClientContact, TransportZone, Machinery, MachineryRental, EventSubcontract, DisposableItem, City } from '../../../types'

// Textos personalizables para cada cotización individual
export interface QuoteCustomTexts {
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
  use_custom_texts: boolean
}

export interface DaySchedule {
  date: string
  startTime: string
  endTime: string
}

export interface EmployeeInput {
  employee: Employee
  hours: number
  includeARL: boolean
  // Manual extra cost (ARL, etc.)
  extraCost?: number
  extraCostReason?: string
  // Explicit association to selected products in the quote
  selectedProductIds?: number[]
}

export interface ProductInput {
  product: Product
  quantity: number // For 'unit': number of complete products. For 'measurement': number of products
  unitsPerProduct?: number // For 'measurement': units per product (e.g. 7 onzas per frappe)
  isVariable: boolean
  customPrice?: number
  customReason?: string
}

export interface MachineryInput {
  machinery: Machinery
  hours: number
  includeOperator: boolean
  setupRequired: boolean
}

export interface MachineryRentalInput {
  machineryRental: MachineryRental
  hours: number
  includeOperator: boolean
  includeDelivery: boolean
  includePickup: boolean
  customMarginPercentage?: number
  customTotalCost?: number // Para editar el costo total directamente
  isCustomCost?: boolean // Indica si se está usando costo personalizado
  associatedProductId?: number // Para asociar con un producto específico
}

export interface EventSubcontractInput {
  eventSubcontract: EventSubcontract
  attendees?: number
  customSupplierCost?: number
  customSuePrice?: number
  customMarginPercentage?: number
  notes?: string
}

export interface DisposableItemInput {
  disposableItem: DisposableItem
  quantity: number
  isCustomPrice: boolean
  customPrice?: number
  customReason?: string
  isCustomTotalCost?: boolean // Para editar el costo total directamente
  customTotalCost?: number // Costo total editado
  associatedProductId?: number // ID del producto al que se asocia este desechable
}

export interface TransportAllocation {
  productId: number
  quantity: number
}

export interface TransportZoneInput {
  zone: TransportZone
  transportCount: number
  includeEquipmentTransport: boolean
  useFlexibleTransport?: boolean
  transportProductIds?: number[]
  transportAllocations?: TransportAllocation[]
}

export type MarginMode = 'global' | 'per_line'

export interface PricingFormData {
  selectedClient: Client | null
  selectedContact: ClientContact | null
  eventName: string
  eventStartDate: string
  eventEndDate: string
  eventStartTime: string // Used for single-day events
  eventEndTime: string   // Used for single-day events
  selectedDays: string[] // Array of selected date strings (YYYY-MM-DD) for non-consecutive events
  dailySchedules: DaySchedule[] // Used for multi-day events - generated only for selectedDays
  eventAddress: string
  eventCity: string | City | null
  eventDescription: string
  selectedTransportZone: TransportZone | null // Deprecated: usar selectedTransportZones
  selectedTransportZones: TransportZoneInput[] // Múltiples zonas de transporte
  includeEquipmentTransport: boolean // Whether to include additional equipment cost
  transportCount: number // Number of transport vehicles/trips needed
  transportProductIds: number[] // Manual selection of products for transport distribution
  useFlexibleTransport: boolean // Toggle for manual vs automatic distribution
  transportAllocations: TransportAllocation[] // Manual allocation per product
  marginPercentage: number
  marginMode?: MarginMode // 'per_line' (default)
  enableRetention: boolean // Whether to apply tax retention (manual control)
  retentionPercentage: number // Manual retention percentage value
  employeeInputs: EmployeeInput[]
  productInputs: ProductInput[]
  machineryInputs: MachineryInput[]
  machineryRentalInputs: MachineryRentalInput[]
  eventSubcontractInputs: EventSubcontractInput[]
  disposableItemInputs: DisposableItemInput[]
  // Textos personalizados para esta cotización específica
  quoteCustomTexts?: QuoteCustomTexts
}

export interface PricingFormProps {
  formData: PricingFormData
  updateFormData: (field: keyof PricingFormData, value: any) => void
}

export interface EmployeeManagementProps extends PricingFormProps {
  addEmployee: () => void
  removeEmployee: (index: number) => void
  updateEmployee: (index: number, field: keyof EmployeeInput, value: any) => void
}

export interface ProductManagementProps extends PricingFormProps {
  addProduct: () => void
  removeProduct: (index: number) => void
  updateProduct: (index: number, field: keyof ProductInput, value: any) => void
}

export interface MachineryManagementProps extends PricingFormProps {
  addMachinery: () => void
  removeMachinery: (index: number) => void
  updateMachinery: (index: number, field: keyof MachineryInput, value: any) => void
  addMachineryRental: () => void
  removeMachineryRental: (index: number) => void
  updateMachineryRental: (index: number, field: keyof MachineryRentalInput, value: any) => void
  addEventSubcontract: () => void
  removeEventSubcontract: (index: number) => void
  updateEventSubcontract: (index: number, field: keyof EventSubcontractInput, value: any) => void
  addDisposableItem: () => void
  removeDisposableItem: (index: number) => void
  updateDisposableItem: (index: number, field: keyof DisposableItemInput, value: any) => void
}

export interface PricingCalculationProps {
  formData: PricingFormData
  result: any
  errors: string[]
  suggestions: string[]
  is_valid: boolean
  onSaveQuote: () => void
  isLoading: boolean
  showSuccessMessage: boolean
  savedQuoteNumber: string
  setShowSuccessMessage: (show: boolean) => void
}
