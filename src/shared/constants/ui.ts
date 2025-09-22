/**
 * UI Constants - Consolidated UI text and common options
 * 
 * Replaces duplicated strings and options across components
 */

/**
 * Common action button labels
 */
export const ACTIONS = {
  // CRUD operations
  CREATE: 'Crear',
  EDIT: 'Editar', 
  UPDATE: 'Actualizar',
  DELETE: 'Eliminar',
  SAVE: 'Guardar',
  CANCEL: 'Cancelar',
  
  // Loading states
  CREATING: 'Creando...',
  UPDATING: 'Actualizando...',
  SAVING: 'Guardando...',
  DELETING: 'Eliminando...',
  LOADING: 'Cargando...',
  
  // Other common actions
  SEARCH: 'Buscar',
  FILTER: 'Filtrar',
  CONFIRM: 'Confirmar',
  VIEW: 'Ver',
  DOWNLOAD: 'Descargar',
  UPLOAD: 'Subir',
  SELECT: 'Seleccionar'
} as const

/**
 * Common status labels
 */
export const STATUS = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  PENDING: 'Pendiente',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado'
} as const

/**
 * Common form labels
 */
export const FORM_LABELS = {
  NAME: 'Nombre',
  DESCRIPTION: 'Descripción', 
  EMAIL: 'Correo electrónico',
  PHONE: 'Teléfono',
  ADDRESS: 'Dirección',
  NOTES: 'Notas',
  DATE: 'Fecha',
  TIME: 'Hora',
  CATEGORY: 'Categoría',
  TYPE: 'Tipo',
  STATUS: 'Estado',
  PRICE: 'Precio',
  QUANTITY: 'Cantidad',
  TOTAL: 'Total'
} as const

/**
 * Common validation messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo es obligatorio',
  INVALID_EMAIL: 'Ingrese un correo electrónico válido',
  INVALID_PHONE: 'Ingrese un número de teléfono válido',
  MIN_LENGTH: (length: number) => `Debe tener al menos ${length} caracteres`,
  MAX_LENGTH: (length: number) => `No debe exceder ${length} caracteres`,
  MIN_VALUE: (value: number) => `El valor mínimo es ${value}`,
  MAX_VALUE: (value: number) => `El valor máximo es ${value}`,
  POSITIVE_NUMBER: 'Debe ser un número positivo',
  INVALID_DATE: 'Ingrese una fecha válida',
  PASSWORDS_MATCH: 'Las contraseñas deben coincidir'
} as const

/**
 * Common confirmation messages
 */
export const CONFIRMATIONS = {
  DELETE_ITEM: '¿Está seguro que desea eliminar este elemento?',
  DELETE_MULTIPLE: '¿Está seguro que desea eliminar los elementos seleccionados?',
  UNSAVED_CHANGES: 'Tiene cambios sin guardar. ¿Desea continuar?',
  CANCEL_OPERATION: '¿Está seguro que desea cancelar esta operación?',
  OVERWRITE_DATA: 'Esta acción sobrescribirá los datos existentes. ¿Continuar?'
} as const

/**
 * Common success messages
 */
export const SUCCESS_MESSAGES = {
  CREATED: 'Elemento creado correctamente',
  UPDATED: 'Elemento actualizado correctamente',
  DELETED: 'Elemento eliminado correctamente',
  SAVED: 'Cambios guardados correctamente',
  UPLOADED: 'Archivo subido correctamente',
  SENT: 'Enviado correctamente'
} as const

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
  GENERIC: 'Ha ocurrido un error inesperado',
  NETWORK: 'Error de conexión. Verifique su conexión a internet',
  NOT_FOUND: 'El elemento solicitado no fue encontrado',
  UNAUTHORIZED: 'No tiene permisos para realizar esta acción',
  VALIDATION: 'Por favor, corrija los errores en el formulario',
  FILE_SIZE: 'El archivo es demasiado grande',
  FILE_TYPE: 'Tipo de archivo no permitido',
  SAVE_FAILED: 'Error al guardar los cambios',
  DELETE_FAILED: 'Error al eliminar el elemento'
} as const

/**
 * Empty state messages
 */
export const EMPTY_STATES = {
  NO_DATA: 'No hay datos para mostrar',
  NO_RESULTS: 'No se encontraron resultados',
  NO_ITEMS: 'No hay elementos disponibles',
  NO_SELECTION: 'No hay elementos seleccionados',
  LOADING: 'Cargando datos...'
} as const

/**
 * Common time periods
 */
export const TIME_PERIODS = {
  TODAY: 'Hoy',
  YESTERDAY: 'Ayer', 
  LAST_WEEK: 'Última semana',
  LAST_MONTH: 'Último mes',
  LAST_YEAR: 'Último año',
  ALL_TIME: 'Todo el tiempo'
} as const