import { Employee, Product } from '../../../types'

export const mockEmployees: Employee[] = [
  {
    id: 1,
    name: 'Carlos Mendoza',
    employee_type: 'operario',
    category_id: 1,
    category: {
      id: 1,
      name: 'Operario Estándar',
      icon: '👷',
      color: '#2196F3',
      description: 'Operario con experiencia básica',
      default_hourly_rates: [
        { id: '1', min_hours: 0, max_hours: 4, rate: 10000, description: 'Servicio básico' },
        { id: '2', min_hours: 4, max_hours: 8, rate: 8000, description: 'Servicio medio' },
        { id: '3', min_hours: 8, max_hours: null, rate: 6000, description: 'Servicio extendido' }
      ]
    },
    hourly_rates: { '1-4h': 10000, '4-8h': 8000, '8h+': 6000 }, // Legacy fallback
    has_arl: true,
    default_extra_cost: 5000,
    default_extra_cost_reason: 'ARL y bonificación',
    is_active: true,
    created_at: '',
    updated_at: ''
  },
  {
    id: 2,
    name: 'Ana García',
    employee_type: 'operario',
    category_id: 1,
    category: {
      id: 1,
      name: 'Operario Estándar',
      icon: '👷',
      color: '#2196F3',
      description: 'Operario con experiencia básica',
      default_hourly_rates: [
        { id: '1', min_hours: 0, max_hours: 4, rate: 10000, description: 'Servicio básico' },
        { id: '2', min_hours: 4, max_hours: 8, rate: 8000, description: 'Servicio medio' },
        { id: '3', min_hours: 8, max_hours: null, rate: 6000, description: 'Servicio extendido' }
      ]
    },
    hourly_rates: { '1-4h': 9500, '4-8h': 7500, '8h+': 5500 }, // Legacy fallback
    has_arl: true,
    default_extra_cost: 3000,
    default_extra_cost_reason: 'ARL',
    is_active: true,
    created_at: '',
    updated_at: ''
  },
  {
    id: 5,
    name: 'María Ospina',
    employee_type: 'chef',
    category_id: 2,
    category: {
      id: 2,
      name: 'Chef Profesional',
      icon: '👨‍🍳',
      color: '#FF9800',
      description: 'Chef con experiencia culinaria',
      default_hourly_rates: [
        { id: '1', min_hours: 0, max_hours: 4, rate: 15000, description: 'Servicio básico' },
        { id: '2', min_hours: 4, max_hours: 8, rate: 12000, description: 'Servicio medio' },
        { id: '3', min_hours: 8, max_hours: null, rate: 10000, description: 'Servicio extendido' }
      ]
    },
    hourly_rates: { '1-4h': 15000, '4-8h': 12000, '8h+': 10000 }, // Legacy fallback
    has_arl: true,
    default_extra_cost: 8000,
    default_extra_cost_reason: 'ARL y certificación culinaria',
    is_active: true,
    created_at: '',
    updated_at: ''
  }
]

export const mockProducts: Product[] = [
  {
    id: 1,
    category: 'crispetas',
    name: 'Crispetas dulces',
    base_price: 8000,
    cost_price: 3000,
    unit: 'porción',
    requires_equipment: true,
    minimum_order: 1,
    is_seasonal: false,
    is_active: true,
    created_at: '',
    updated_at: ''
  },
  {
    id: 2,
    category: 'obleas',
    name: 'Obleas con arequipe',
    base_price: 12000,
    cost_price: 4000,
    unit: 'unidad',
    requires_equipment: true,
    minimum_order: 1,
    is_seasonal: false,
    is_active: true,
    created_at: '',
    updated_at: ''
  }
]