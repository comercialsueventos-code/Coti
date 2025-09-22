import { useState } from 'react'
import {
  useSuppliers,
  useSuppliersStatistics,
  useTopRatedSuppliers,
  useDeleteSupplier
} from '../../../hooks/useSuppliers'
import { Supplier } from '../../../types'
import { SuppliersPageState, SuppliersPageActions } from '../types'

export const useSuppliersPage = () => {
  const [state, setState] = useState<SuppliersPageState>({
    currentTab: 0,
    selectedType: '',
    searchTerm: '',
    createDialogOpen: false,
    editDialogOpen: false,
    ratingDialogOpen: false,
    selectedSupplier: null
  })

  const deleteMutation = useDeleteSupplier()

  // Data queries
  const { data: suppliers = [] } = useSuppliers({
    type: state.selectedType || undefined,
    search: state.searchTerm || undefined
  })
  const { data: statistics } = useSuppliersStatistics()
  const { data: topRated = [] } = useTopRatedSuppliers(5)

  // Filter suppliers for display
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = !state.searchTerm || 
      supplier.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      supplier.contact_person?.toLowerCase().includes(state.searchTerm.toLowerCase())
    
    return matchesSearch
  })

  // Action handlers
  const actions: SuppliersPageActions = {
    setCurrentTab: (tab: number) => setState(prev => ({ ...prev, currentTab: tab })),
    setSelectedType: (type: string) => setState(prev => ({ ...prev, selectedType: type })),
    setSearchTerm: (term: string) => setState(prev => ({ ...prev, searchTerm: term })),
    setCreateDialogOpen: (open: boolean) => setState(prev => ({ ...prev, createDialogOpen: open })),
    setEditDialogOpen: (open: boolean) => setState(prev => ({ ...prev, editDialogOpen: open })),
    setRatingDialogOpen: (open: boolean) => setState(prev => ({ ...prev, ratingDialogOpen: open })),
    setSelectedSupplier: (supplier: Supplier | null) => setState(prev => ({ ...prev, selectedSupplier: supplier })),

    handleCreateSupplier: () => {
      setState(prev => ({
        ...prev,
        selectedSupplier: null,
        createDialogOpen: true
      }))
    },

    handleEditSupplier: (supplier: Supplier) => {
      setState(prev => ({
        ...prev,
        selectedSupplier: supplier,
        editDialogOpen: true
      }))
    },

    handleDeleteSupplier: async (id: number) => {
      if (window.confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
        try {
          await deleteMutation.mutateAsync(id)
        } catch (error) {
          console.error('Error deleting supplier:', error)
        }
      }
    },

    handleRateSupplier: (supplier: Supplier) => {
      setState(prev => ({
        ...prev,
        selectedSupplier: supplier,
        ratingDialogOpen: true
      }))
    }
  }

  const closeAllDialogs = () => {
    setState(prev => ({
      ...prev,
      createDialogOpen: false,
      editDialogOpen: false,
      ratingDialogOpen: false,
      selectedSupplier: null
    }))
  }

  return {
    state,
    actions,
    data: {
      suppliers,
      statistics,
      topRated,
      filteredSuppliers
    },
    closeAllDialogs
  }
}