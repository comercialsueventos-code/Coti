import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export const createUserProfile = async (userId: string, email: string, fullName?: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email,
      full_name: fullName || null,
      role: 'viewer' // Default role
    })
    .select()
    .single()
  return { data, error }
}

// Real-time subscription helpers
export const subscribeToQuotes = (callback: (payload: any) => void) => {
  return supabase
    .channel('quotes_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'quotes' },
      callback
    )
    .subscribe()
}

export const subscribeToEmployeeShifts = (callback: (payload: any) => void) => {
  return supabase
    .channel('employee_shifts_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'employee_shifts' },
      callback
    )
    .subscribe()
}

// Helper functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return ''
  // Format Colombian phone numbers: +57 300 123 4567
  return phone.replace(/(\+57)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4')
}

// FUNCIÓN ELIMINADA: calculateEmployeeRate era obsoleta y usaba formato legacy
// Use PricingService.calculateEmployeeCost() o EmployeesService.getEmployeeRateForHours() en su lugar

export const getShiftDisplayName = (shift: string): string => {
  const shifts = {
    'morning': 'Mañana',
    'afternoon': 'Tarde', 
    'full_day': 'Día completo'
  }
  return shifts[shift as keyof typeof shifts] || shift
}

export const getStatusDisplayName = (status: string): string => {
  const statuses = {
    'pendiente': 'Pendiente',
    'aceptado': 'Aceptado',
    'cancelado': 'Cancelado',
    'available': 'Disponible',
    'booked': 'Ocupado',
    'vacation': 'Vacaciones',
    'sick': 'Enfermo',
    'maintenance': 'Mantenimiento'
  }
  return statuses[status as keyof typeof statuses] || status
}

export const getClientTypeDisplayName = (type: string): string => {
  const types = {
    'social': 'Social',
    'corporativo': 'Corporativo'
  }
  return types[type as keyof typeof types] || type
}

export const getEmployeeTypeDisplayName = (type: string): string => {
  const types = {
    'operario': 'Operario',
    'chef': 'Chef',
    'mesero': 'Mesero',
    'supervisor': 'Supervisor',
    'conductor': 'Conductor'
  }
  return types[type as keyof typeof types] || type
}