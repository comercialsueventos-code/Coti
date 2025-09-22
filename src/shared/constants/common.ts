/**
 * Common Data Constants
 * 
 * Shared data arrays and objects used across multiple components
 */

import { SelectOption } from '../types'

/**
 * Spanish months for date pickers and forms
 */
export const MONTHS: SelectOption[] = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' }
]

/**
 * Common Colombian banks
 */
export const BANKS: SelectOption[] = [
  { value: 'bancolombia', label: 'Bancolombia' },
  { value: 'banco_bogota', label: 'Banco de Bogotá' },
  { value: 'davivienda', label: 'Davivienda' },
  { value: 'bbva', label: 'BBVA' },
  { value: 'banco_popular', label: 'Banco Popular' },
  { value: 'colpatria', label: 'Colpatria' },
  { value: 'banco_caja_social', label: 'Banco Caja Social' },
  { value: 'av_villas', label: 'Banco AV Villas' },
  { value: 'agrario', label: 'Banco Agrario' },
  { value: 'falabella', label: 'Banco Falabella' }
]

/**
 * Bank account types
 */
export const ACCOUNT_TYPES: SelectOption[] = [
  { value: 'ahorros', label: 'Ahorros' },
  { value: 'corriente', label: 'Corriente' }
]

/**
 * Common Colombian cities (major ones)
 */
export const CITIES: SelectOption[] = [
  { value: 'bogota', label: 'Bogotá D.C.' },
  { value: 'medellin', label: 'Medellín' },
  { value: 'cali', label: 'Cali' },
  { value: 'barranquilla', label: 'Barranquilla' },
  { value: 'cartagena', label: 'Cartagena' },
  { value: 'cucuta', label: 'Cúcuta' },
  { value: 'bucaramanga', label: 'Bucaramanga' },
  { value: 'pereira', label: 'Pereira' },
  { value: 'santa_marta', label: 'Santa Marta' },
  { value: 'ibague', label: 'Ibagué' },
  { value: 'manizales', label: 'Manizales' },
  { value: 'villavicencio', label: 'Villavicencio' }
]

/**
 * Document types (Colombian)
 */
export const DOCUMENT_TYPES: SelectOption[] = [
  { value: 'cc', label: 'Cédula de Ciudadanía' },
  { value: 'ce', label: 'Cédula de Extranjería' },
  { value: 'ti', label: 'Tarjeta de Identidad' },
  { value: 'passport', label: 'Pasaporte' },
  { value: 'nit', label: 'NIT' },
  { value: 'rut', label: 'RUT' }
]

/**
 * Relationship types for emergency contacts
 */
export const RELATIONSHIPS: SelectOption[] = [
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'hermano', label: 'Hermano/a' },
  { value: 'esposo', label: 'Esposo/a' },
  { value: 'hijo', label: 'Hijo/a' },
  { value: 'amigo', label: 'Amigo/a' },
  { value: 'otro', label: 'Otro' }
]

/**
 * Common file extensions for uploads
 */
export const ALLOWED_FILE_EXTENSIONS = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  DOCUMENTS: ['.pdf', '.doc', '.docx', '.txt'],
  SPREADSHEETS: ['.xls', '.xlsx', '.csv'],
  ALL_COMMON: ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.xls', '.xlsx']
}

/**
 * File size limits (in bytes)
 */
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024,     // 5MB
  DOCUMENT: 10 * 1024 * 1024,  // 10MB
  GENERAL: 25 * 1024 * 1024    // 25MB
}

/**
 * Common phone number prefixes (Colombian mobile)
 */
export const PHONE_PREFIXES: SelectOption[] = [
  { value: '300', label: '300' },
  { value: '301', label: '301' },
  { value: '302', label: '302' },
  { value: '303', label: '303' },
  { value: '304', label: '304' },
  { value: '305', label: '305' },
  { value: '310', label: '310' },
  { value: '311', label: '311' },
  { value: '312', label: '312' },
  { value: '313', label: '313' },
  { value: '314', label: '314' },
  { value: '315', label: '315' },
  { value: '316', label: '316' },
  { value: '317', label: '317' },
  { value: '318', label: '318' },
  { value: '319', label: '319' },
  { value: '320', label: '320' },
  { value: '321', label: '321' },
  { value: '322', label: '322' },
  { value: '323', label: '323' },
  { value: '324', label: '324' },
  { value: '325', label: '325' }
]

/**
 * Priority levels
 */
export const PRIORITIES: SelectOption[] = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' }
]

/**
 * Common units of measurement
 */
export const UNITS = {
  WEIGHT: [
    { value: 'g', label: 'Gramos' },
    { value: 'kg', label: 'Kilogramos' },
    { value: 'lb', label: 'Libras' }
  ],
  VOLUME: [
    { value: 'ml', label: 'Mililitros' },
    { value: 'l', label: 'Litros' },
    { value: 'oz', label: 'Onzas' }
  ],
  LENGTH: [
    { value: 'cm', label: 'Centímetros' },
    { value: 'm', label: 'Metros' },
    { value: 'in', label: 'Pulgadas' },
    { value: 'ft', label: 'Pies' }
  ],
  TIME: [
    { value: 'min', label: 'Minutos' },
    { value: 'hr', label: 'Horas' },
    { value: 'day', label: 'Días' }
  ],
  QUANTITY: [
    { value: 'unit', label: 'Unidad' },
    { value: 'dozen', label: 'Docena' },
    { value: 'pack', label: 'Paquete' },
    { value: 'box', label: 'Caja' }
  ]
}

/**
 * Common colors for categorization
 */
export const CATEGORY_COLORS = [
  '#1976d2', // Blue
  '#388e3c', // Green  
  '#f57c00', // Orange
  '#d32f2f', // Red
  '#7b1fa2', // Purple
  '#0097a7', // Teal
  '#455a64', // Blue Grey
  '#e64a19', // Deep Orange
  '#303f9f', // Indigo
  '#689f38'  // Light Green
] as const