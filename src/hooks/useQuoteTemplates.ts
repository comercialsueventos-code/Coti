import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QuoteTemplatesService, QuoteTemplate, QuoteTemplateInsert, QuoteTemplateUpdate } from '../services/quoteTemplates.service'

/**
 * Hook para obtener todas las plantillas
 */
export const useQuoteTemplates = () => {
  return useQuery({
    queryKey: ['quoteTemplates'],
    queryFn: () => QuoteTemplatesService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para obtener la plantilla predeterminada
 */
export const useDefaultQuoteTemplate = () => {
  return useQuery({
    queryKey: ['quoteTemplates', 'default'],
    queryFn: () => QuoteTemplatesService.getDefault(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para obtener una plantilla específica por ID
 */
export const useQuoteTemplate = (id: number) => {
  return useQuery({
    queryKey: ['quoteTemplates', id],
    queryFn: () => QuoteTemplatesService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook para crear una nueva plantilla
 */
export const useCreateQuoteTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (template: QuoteTemplateInsert) => 
      QuoteTemplatesService.create(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quoteTemplates'] })
    }
  })
}

/**
 * Hook para actualizar una plantilla existente
 */
export const useUpdateQuoteTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: QuoteTemplateUpdate }) =>
      QuoteTemplatesService.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quoteTemplates'] })
      queryClient.invalidateQueries({ queryKey: ['quoteTemplates', data.id] })
      if (data.is_default) {
        queryClient.invalidateQueries({ queryKey: ['quoteTemplates', 'default'] })
      }
    }
  })
}

/**
 * Hook para marcar una plantilla como predeterminada
 */
export const useSetDefaultTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => QuoteTemplatesService.setAsDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quoteTemplates'] })
      queryClient.invalidateQueries({ queryKey: ['quoteTemplates', 'default'] })
    }
  })
}

/**
 * Hook para eliminar (desactivar) una plantilla
 */
export const useDeleteQuoteTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => QuoteTemplatesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quoteTemplates'] })
      queryClient.invalidateQueries({ queryKey: ['quoteTemplates', 'default'] })
    }
  })
}

/**
 * Hook para restaurar una plantilla eliminada
 */
export const useRestoreQuoteTemplate = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => QuoteTemplatesService.restore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quoteTemplates'] })
    }
  })
}