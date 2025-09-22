import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QuotesService } from '../services/quotes.service'
import { Quote, CreateQuoteData, UpdateQuoteData, CreateQuoteItemData, QuoteFilters } from '../types'

// Query keys
export const QUOTES_QUERY_KEYS = {
  all: ['quotes'] as const,
  lists: () => [...QUOTES_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: QuoteFilters) => [...QUOTES_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...QUOTES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...QUOTES_QUERY_KEYS.details(), id] as const,
  statistics: () => [...QUOTES_QUERY_KEYS.all, 'statistics'] as const,
  search: (term: string) => [...QUOTES_QUERY_KEYS.all, 'search', term] as const
}

/**
 * Hook for fetching all quotes with optional filters
 */
export function useQuotes(filters?: QuoteFilters) {
  return useQuery({
    queryKey: QUOTES_QUERY_KEYS.list(filters),
    queryFn: () => QuotesService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching a single quote by ID
 */
export function useQuote(id: number) {
  return useQuery({
    queryKey: QUOTES_QUERY_KEYS.detail(id),
    queryFn: () => QuotesService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching quotes statistics
 */
export function useQuotesStatistics() {
  return useQuery({
    queryKey: QUOTES_QUERY_KEYS.statistics(),
    queryFn: () => QuotesService.getStatistics(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for searching quotes
 */
export function useQuotesSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery({
    queryKey: QUOTES_QUERY_KEYS.search(searchTerm),
    queryFn: () => QuotesService.search(searchTerm),
    enabled: enabled && searchTerm.length > 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook for creating a new quote
 */
export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteData, items }: { 
      quoteData: CreateQuoteData
      items?: CreateQuoteItemData[] 
    }) => {
      return QuotesService.create(quoteData, items)
    },
    onSuccess: (newQuote) => {
      // Invalidate and refetch quotes list
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.statistics() })
      
      // Add the new quote to cache
      queryClient.setQueryData(QUOTES_QUERY_KEYS.detail(newQuote.id), newQuote)
    },
  })
}

/**
 * Hook for updating a quote
 */
export function useUpdateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updateData }: { id: number; updateData: UpdateQuoteData }) => {
      return QuotesService.update(id, updateData)
    },
    onSuccess: (updatedQuote) => {
      // Update specific quote in cache
      queryClient.setQueryData(QUOTES_QUERY_KEYS.detail(updatedQuote.id), updatedQuote)
      
      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for deleting a quote
 */
export function useDeleteQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => QuotesService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: QUOTES_QUERY_KEYS.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for adding an item to a quote
 */
export function useAddQuoteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ quoteId, itemData }: { 
      quoteId: number
      itemData: Omit<CreateQuoteItemData, 'quote_id'> 
    }) => {
      return QuotesService.addItem(quoteId, itemData)
    },
    onSuccess: (_, { quoteId }) => {
      // Invalidate the specific quote to refetch with new item
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.detail(quoteId) })
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for updating a quote item
 */
export function useUpdateQuoteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, updateData }: { 
      itemId: number
      updateData: Partial<CreateQuoteItemData> 
    }) => {
      return QuotesService.updateItem(itemId, updateData)
    },
    onSuccess: (updatedItem) => {
      // Invalidate the quote that contains this item
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.detail(updatedItem.quote_id) })
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for removing a quote item
 */
export function useRemoveQuoteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, quoteId }: { itemId: number; quoteId: number }) => {
      return QuotesService.removeItem(itemId)
    },
    onSuccess: (_, { quoteId }) => {
      // Invalidate the quote that contained this item
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.detail(quoteId) })
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for approving a quote
 */
export function useApproveQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, approvedBy }: { id: number; approvedBy: string }) => {
      return QuotesService.approve(id, approvedBy)
    },
    onSuccess: (updatedQuote) => {
      queryClient.setQueryData(QUOTES_QUERY_KEYS.detail(updatedQuote.id), updatedQuote)
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for cancelling a quote
 */
export function useCancelQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => QuotesService.cancel(id),
    onSuccess: (updatedQuote) => {
      queryClient.setQueryData(QUOTES_QUERY_KEYS.detail(updatedQuote.id), updatedQuote)
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for duplicating a quote - complete copy with only title change
 * Duplicates everything exactly as-is including employees and dates, only changes title to "(copia)"
 */
export function useDuplicateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (originalQuoteId: number) => {
      return QuotesService.duplicate(originalQuoteId)
    },
    onSuccess: (duplicatedQuote) => {
      // Add the new quote to cache
      queryClient.setQueryData(QUOTES_QUERY_KEYS.detail(duplicatedQuote.id), duplicatedQuote)
      
      // Invalidate lists to show the new quote
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: QUOTES_QUERY_KEYS.statistics() })
    },
    onError: (error) => {
      console.error('Error duplicating quote:', error)
    }
  })
}

/**
 * Hook for generating next quote number
 */
export function useGenerateQuoteNumber() {
  return useMutation({
    mutationFn: () => QuotesService.generateQuoteNumber(),
  })
}

/**
 * Utility hook for quote validation
 */
export function useQuoteValidation() {
  return {
    validateQuoteData: QuotesService.validateQuoteData,
    formatCurrency: QuotesService.formatCurrency
  }
}