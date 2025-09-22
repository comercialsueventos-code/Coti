/**
 * Product-specific Constants
 * 
 * Consolidated constants for product management across the application
 */

import { SelectOption } from '../types'

/**
 * Product categories with display labels and icons
 */
export const PRODUCT_CATEGORIES: SelectOption[] = [
  { value: 'bebidas', label: 'Bebidas', icon: '🥤' },
  { value: 'snacks', label: 'Snacks', icon: '🍿' },
  { value: 'dulces', label: 'Dulces', icon: '🍭' },
  { value: 'postres', label: 'Postres', icon: '🧇' },
  { value: 'comida', label: 'Comida', icon: '🍽️' },
  { value: 'decoracion', label: 'Decoración', icon: '🎈' },
  { value: 'equipos', label: 'Equipos', icon: '🔧' },
  { value: 'mobiliario', label: 'Mobiliario', icon: '🪑' },
  { value: 'otros', label: 'Otros', icon: '📦' }
]

/**
 * Pricing types for products
 */
export const PRICING_TYPES: SelectOption[] = [
  { value: 'unit', label: 'Por Unidad' },
  { value: 'weight', label: 'Por Peso' },
  { value: 'volume', label: 'Por Volumen' },
  { value: 'time', label: 'Por Tiempo' },
  { value: 'service', label: 'Por Servicio' }
]

/**
 * Product units organized by type
 */
export const PRODUCT_UNITS = {
  unit: [
    { value: 'unidad', label: 'Unidad' },
    { value: 'producto', label: 'Producto' },
    { value: 'porcion', label: 'Porción' },
    { value: 'servicio', label: 'Servicio' },
    { value: 'docena', label: 'Docena' },
    { value: 'paquete', label: 'Paquete' },
    { value: 'caja', label: 'Caja' }
  ],
  measurement: [
    { value: 'onza', label: 'Onza' },
    { value: 'gramo', label: 'Gramo' },
    { value: 'ml', label: 'Mililitro' },
    { value: 'litro', label: 'Litro' },
    { value: 'cm', label: 'Centímetro' },
    { value: 'metro', label: 'Metro' },
    { value: 'minuto', label: 'Minuto' },
    { value: 'hora', label: 'Hora' }
  ]
} as const

/**
 * All available product units (flattened)
 */
export const ALL_PRODUCT_UNITS: SelectOption[] = [
  ...PRODUCT_UNITS.unit,
  ...PRODUCT_UNITS.measurement
]

/**
 * Common equipment needed for products/services
 */
export const COMMON_EQUIPMENT: SelectOption[] = [
  { value: 'dispensador', label: 'Dispensador' },
  { value: 'vasos', label: 'Vasos' },
  { value: 'hielo', label: 'Hielo' },
  { value: 'bowl', label: 'Bowl' },
  { value: 'servilletas', label: 'Servilletas' },
  { value: 'platos', label: 'Platos' },
  { value: 'cucharas', label: 'Cucharas' },
  { value: 'tenedores', label: 'Tenedores' },
  { value: 'cuchillos', label: 'Cuchillos' },
  { value: 'bandejas', label: 'Bandejas' },
  { value: 'manteles', label: 'Manteles' },
  { value: 'servidores', label: 'Servidores' },
  { value: 'calentadores', label: 'Calentadores' },
  { value: 'nevera_portátil', label: 'Nevera Portátil' }
]

/**
 * Common allergens for food products
 */
export const COMMON_ALLERGENS: SelectOption[] = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'lactosa', label: 'Lactosa' },
  { value: 'frutos_secos', label: 'Frutos Secos' },
  { value: 'mani', label: 'Maní' },
  { value: 'huevo', label: 'Huevo' },
  { value: 'soja', label: 'Soja' },
  { value: 'mariscos', label: 'Mariscos' },
  { value: 'pescado', label: 'Pescado' }
]

/**
 * Nutritional information categories
 */
export const NUTRITIONAL_CATEGORIES = [
  'calories',
  'protein',
  'carbohydrates',
  'fat',
  'fiber',
  'sugar',
  'sodium'
] as const

/**
 * Product conditions/states
 */
export const PRODUCT_CONDITIONS: SelectOption[] = [
  { value: 'new', label: 'Nuevo' },
  { value: 'used', label: 'Usado' },
  { value: 'refurbished', label: 'Reacondicionado' },
  { value: 'damaged', label: 'Dañado' }
]

/**
 * Storage requirements
 */
export const STORAGE_REQUIREMENTS: SelectOption[] = [
  { value: 'room_temperature', label: 'Temperatura Ambiente' },
  { value: 'refrigerated', label: 'Refrigerado' },
  { value: 'frozen', label: 'Congelado' },
  { value: 'dry_storage', label: 'Almacén Seco' },
  { value: 'climate_controlled', label: 'Clima Controlado' }
]

/**
 * Helper function to get units by pricing type
 */
export const getUnitsByPricingType = (pricingType: string): SelectOption[] => {
  switch (pricingType) {
    case 'unit':
      return PRODUCT_UNITS.unit
    case 'weight':
      return [
        { value: 'gramo', label: 'Gramo' },
        { value: 'kg', label: 'Kilogramo' },
        { value: 'libra', label: 'Libra' }
      ]
    case 'volume':
      return [
        { value: 'ml', label: 'Mililitro' },
        { value: 'litro', label: 'Litro' },
        { value: 'onza', label: 'Onza' }
      ]
    case 'time':
      return [
        { value: 'minuto', label: 'Minuto' },
        { value: 'hora', label: 'Hora' },
        { value: 'dia', label: 'Día' }
      ]
    default:
      return ALL_PRODUCT_UNITS
  }
}

/**
 * Default form data for product creation
 */
export const defaultFormData = {
  category: '', // Deprecated: usar category_id
  category_id: undefined,
  subcategory: '',
  name: '',
  description: '',
  pricing_type: 'unit' as const,
  base_price: 0,
  unit: 'unidad',
  requires_equipment: false,
  equipment_needed: [],
  preparation_time_minutes: 0,
  shelf_life_hours: 0,
  ingredients: [],
  allergens: [],
  nutritional_info: {},
  supplier_info: {},
  cost_price: 0,
  minimum_order: 1,
  is_seasonal: false,
  seasonal_months: [],
  image_url: '',
  is_active: true
}

/**
 * Helper function to get category info
 */
export const getProductCategoryInfo = (categoryValue: string) => {
  return PRODUCT_CATEGORIES.find(cat => cat.value === categoryValue)
}