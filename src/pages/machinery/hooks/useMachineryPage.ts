import { useState } from 'react'
import {
  useMachinery,
  useMachineryStatistics,
  useMachineryNeedingMaintenance,
  useDeleteMachinery
} from '../../../hooks/useMachinery'
import { Machinery } from '../../../types'
import { MachineryPageState, MachineryPageActions } from '../types'

export const useMachineryPage = () => {
  const [state, setState] = useState<MachineryPageState>({
    currentTab: 0,
    selectedCategory: '',
    createDialogOpen: false,
    editDialogOpen: false,
    selectedMachinery: null,
    maintenanceDialogOpen: false
  })

  const deleteMutation = useDeleteMachinery()

  // Data queries
  const { data: machinery = [] } = useMachinery()
  const { data: statistics } = useMachineryStatistics()
  const { data: maintenanceNeeded = [] } = useMachineryNeedingMaintenance()

  // Filter machinery for display
  const filteredMachinery = state.selectedCategory
    ? machinery.filter(m => m.category === state.selectedCategory)
    : machinery

  // Action handlers
  const actions: MachineryPageActions = {
    setCurrentTab: (tab: number) => setState(prev => ({ ...prev, currentTab: tab })),
    setSelectedCategory: (category: string) => setState(prev => ({ ...prev, selectedCategory: category })),
    setCreateDialogOpen: (open: boolean) => setState(prev => ({ ...prev, createDialogOpen: open })),
    setEditDialogOpen: (open: boolean) => setState(prev => ({ ...prev, editDialogOpen: open })),
    setSelectedMachinery: (machinery: Machinery | null) => setState(prev => ({ ...prev, selectedMachinery: machinery })),
    setMaintenanceDialogOpen: (open: boolean) => setState(prev => ({ ...prev, maintenanceDialogOpen: open })),

    handleCreateMachinery: () => {
      setState(prev => ({
        ...prev,
        selectedMachinery: null,
        createDialogOpen: true
      }))
    },

    handleEditMachinery: (machinery: Machinery) => {
      setState(prev => ({
        ...prev,
        selectedMachinery: machinery,
        editDialogOpen: true
      }))
    },

    handleDeleteMachinery: async (id: number) => {
      if (window.confirm('¿Estás seguro de que quieres eliminar esta maquinaria?')) {
        try {
          await deleteMutation.mutateAsync(id)
        } catch (error) {
          console.error('Error deleting machinery:', error)
        }
      }
    },

    handleScheduleMaintenance: (machinery: Machinery) => {
      setState(prev => ({
        ...prev,
        selectedMachinery: machinery,
        maintenanceDialogOpen: true
      }))
    }
  }

  const closeAllDialogs = () => {
    setState(prev => ({
      ...prev,
      createDialogOpen: false,
      editDialogOpen: false,
      maintenanceDialogOpen: false,
      selectedMachinery: null
    }))
  }

  return {
    state,
    actions,
    data: {
      machinery,
      statistics,
      maintenanceNeeded,
      filteredMachinery
    },
    closeAllDialogs
  }
}