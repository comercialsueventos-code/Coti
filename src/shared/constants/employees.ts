/**
 * Employee-specific Constants
 * 
 * Consolidated constants for employee management across the application
 */

import { SelectOption } from '../types'
import { HourlyRateRange } from '../../types'

/**
 * Employee types with display labels and icons
 */
export const EMPLOYEE_TYPES: SelectOption[] = [
  { value: 'operario', label: 'Operario', icon: '🔧' },
  { value: 'chef', label: 'Chef', icon: '👨‍🍳' },
  { value: 'mesero', label: 'Mesero', icon: '🍽️' },
  { value: 'supervisor', label: 'Supervisor', icon: '👔' },
  { value: 'conductor', label: 'Conductor', icon: '🚐' }
]

/**
 * Common certifications for employees
 */
export const EMPLOYEE_CERTIFICATIONS: SelectOption[] = [
  { value: 'manipulacion_alimentos', label: 'Manipulación de Alimentos' },
  { value: 'chef_profesional', label: 'Chef Profesional' },
  { value: 'atencion_cliente', label: 'Atención al Cliente' },
  { value: 'liderazgo', label: 'Liderazgo' },
  { value: 'licencia_c2', label: 'Licencia C2' },
  { value: 'licencia_c3', label: 'Licencia C3' },
  { value: 'primeros_auxilios', label: 'Primeros Auxilios' },
  { value: 'alturas', label: 'Trabajo en Alturas' },
  { value: 'manejo_defensivo', label: 'Manejo Defensivo' }
]

/**
 * Common certifications as simple strings for forms
 */
export const COMMON_CERTIFICATIONS = [
  'manipulacion_alimentos',
  'chef_profesional', 
  'atencion_cliente',
  'liderazgo',
  'licencia_c2',
  'licencia_c3',
  'primeros_auxilios',
  'alturas',
  'manejo_defensivo',
  'operacion_equipos',
  'seguridad_industrial'
]

/**
 * ARL providers in Colombia
 */
export const ARL_PROVIDERS: SelectOption[] = [
  { value: 'sura', label: 'Sura ARL' },
  { value: 'positiva', label: 'Positiva ARL' },
  { value: 'colmena', label: 'Colmena ARL' },
  { value: 'liberty', label: 'Liberty ARL' },
  { value: 'equidad', label: 'Equidad ARL' },
  { value: 'bolivar', label: 'Bolívar ARL' }
]

/**
 * Default hourly rate templates for different employee types
 * These serve as starting points that can be customized per employee
 */
export const EMPLOYEE_RATE_TEMPLATES: Record<string, HourlyRateRange[]> = {
  operario: [
    { 
      id: crypto.randomUUID(), 
      min_hours: 0, 
      max_hours: 2, 
      rate: 25000, 
      description: 'Primeras 2 horas' 
    },
    { 
      id: crypto.randomUUID(), 
      min_hours: 2, 
      max_hours: 6, 
      rate: 22000, 
      description: 'Horas adicionales' 
    },
    { 
      id: crypto.randomUUID(), 
      min_hours: 6, 
      max_hours: null, 
      rate: 20000, 
      description: 'Tarifa extendida' 
    }
  ],
  chef: [
    { 
      id: crypto.randomUUID(), 
      min_hours: 0, 
      max_hours: 1, 
      rate: 80000, 
      description: 'Primera hora' 
    },
    { 
      id: crypto.randomUUID(), 
      min_hours: 1, 
      max_hours: 4, 
      rate: 70000, 
      description: 'Horas adicionales' 
    },
    { 
      id: crypto.randomUUID(), 
      min_hours: 4, 
      max_hours: null, 
      rate: 65000, 
      description: 'Tarifa extendida' 
    }
  ],
  mesero: [
    { 
      id: crypto.randomUUID(), 
      min_hours: 1, 
      max_hours: 4, 
      rate: 18000, 
      description: 'Servicio básico' 
    },
    { 
      id: crypto.randomUUID(), 
      min_hours: 4, 
      max_hours: 8, 
      rate: 16000, 
      description: 'Servicio medio' 
    },
    { 
      id: crypto.randomUUID(), 
      min_hours: 8, 
      max_hours: null, 
      rate: 15000, 
      description: 'Servicio extendido' 
    }
  ],
  supervisor: [
    { 
      id: crypto.randomUUID(), 
      min_hours: 0, 
      max_hours: 2, 
      rate: 45000, 
      description: 'Supervisión básica' 
    },
    { 
      id: crypto.randomUUID(), 
      min_hours: 2, 
      max_hours: 6, 
      rate: 40000, 
      description: 'Supervisión media' 
    },
    { 
      id: crypto.randomUUID(), 
      min_hours: 6, 
      max_hours: null, 
      rate: 35000, 
      description: 'Supervisión extendida' 
    }
  ],
  conductor: [
    { 
      id: crypto.randomUUID(), 
      min_hours: 1, 
      max_hours: 3, 
      rate: 30000, 
      description: 'Transporte corto' 
    },
    { 
      id: crypto.randomUUID(), 
      min_hours: 3, 
      max_hours: 8, 
      rate: 25000, 
      description: 'Transporte medio' 
    },
    { 
      id: crypto.randomUUID(), 
      min_hours: 8, 
      max_hours: null, 
      rate: 22000, 
      description: 'Transporte largo' 
    }
  ]
}

/**
 * Default hourly rate structure for new employees
 */
export const DEFAULT_HOURLY_RATES: HourlyRateRange[] = [
  {
    id: crypto.randomUUID(),
    min_hours: 1,
    max_hours: 4,
    rate: 0,
    description: 'Servicio básico (1-4 horas)'
  },
  {
    id: crypto.randomUUID(),
    min_hours: 4,
    max_hours: 8,
    rate: 0,
    description: 'Servicio medio (4-8 horas)'
  },
  {
    id: crypto.randomUUID(),
    min_hours: 8,
    max_hours: null,
    rate: 0,
    description: 'Servicio extendido (8+ horas)'
  }
]

/**
 * Helper function to get rate template for a specific employee type
 */
export const getEmployeeRateTemplate = (employeeType: string): HourlyRateRange[] => {
  return EMPLOYEE_RATE_TEMPLATES[employeeType] || DEFAULT_HOURLY_RATES
}

/**
 * Helper function to get employee type display info
 */
export const getEmployeeTypeInfo = (employeeType: string) => {
  return EMPLOYEE_TYPES.find(type => type.value === employeeType)
}

/**
 * Common icons for employee categories
 */
export const COMMON_ICONS = ['👤', '🔧', '👨‍🍳', '🍽️', '👔', '🚐', '⚡', '🎯', '💎', '🌟']

/**
 * Common colors for employee categories
 */
export const COMMON_COLORS = [
  '#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#607D8B', 
  '#F44336', '#00BCD4', '#CDDC39', '#795548', '#E91E63'
]

/**
 * Category types (alias for EMPLOYEE_TYPES)
 */
export const CATEGORY_TYPES = EMPLOYEE_TYPES

/**
 * Pricing type options for employee categories
 */
export const PRICING_TYPES = [
  { value: 'plana', label: 'Tarifa Plana', icon: '💰', description: 'Precio fijo por hora sin importar la cantidad' },
  { value: 'flexible', label: 'Tarifa Flexible', icon: '📊', description: 'Precios por escalones según horas trabajadas' }
] as const

/**
 * Tab labels for employee category form
 */
export const TAB_LABELS = [
  { icon: '⚙️', label: 'Información Básica' },
  { icon: '💰', label: 'Tarifas por Defecto' },
  { icon: '🎓', label: 'Certificaciones' },
  { icon: '🛠️', label: 'Habilidades y Equipos' }
] as const

/**
 * Common skills for employees
 */
export const COMMON_SKILLS = [
  'Servicio al cliente',
  'Trabajo en equipo',
  'Manejo de equipos',
  'Supervisión',
  'Cocina internacional',
  'Repostería',
  'Bartender',
  'Protocolo de eventos',
  'Manejo de inventarios',
  'Seguridad alimentaria'
]

/**
 * Common equipment access for employees
 */
export const COMMON_EQUIPMENT = [
  'Cocina industrial',
  'Equipos de sonido',
  'Herramientas eléctricas',
  'Vehículos de carga',
  'Equipos de refrigeración',
  'Mesas y sillas',
  'Vajilla y cristalería',
  'Equipo de limpieza',
  'Generadores',
  'Carpas y toldos'
]

/**
 * Default form values for employee category creation
 */
export const DEFAULT_FORM_VALUES = {
  name: '',
  category_type: '' as const,
  description: '',
  icon: '👤',
  color: '#2196F3',
  pricing_type: 'flexible' as const,
  flat_rate: 0,
  default_hourly_rates: [
    {
      id: crypto.randomUUID(),
      min_hours: 0,
      max_hours: 4,
      rate: 0,
      description: 'Servicio básico'
    },
    {
      id: crypto.randomUUID(),
      min_hours: 4,
      max_hours: null,
      rate: 0,
      description: 'Servicio extendido'
    }
  ],
  default_has_arl: true,
  default_arl_provider: '',
  default_certifications: [],
  requires_certification: false,
  required_certifications: [],
  min_experience_months: 0,
  special_skills: [],
  equipment_access: []
} as const