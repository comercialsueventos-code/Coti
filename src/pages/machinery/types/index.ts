import { Machinery } from '../../../types'

export interface MachineryPageState {
  currentTab: number
  selectedCategory: string
  createDialogOpen: boolean
  editDialogOpen: boolean
  selectedMachinery: Machinery | null
  maintenanceDialogOpen: boolean
}

export interface MachineryPageActions {
  setCurrentTab: (tab: number) => void
  setSelectedCategory: (category: string) => void
  setCreateDialogOpen: (open: boolean) => void
  setEditDialogOpen: (open: boolean) => void
  setSelectedMachinery: (machinery: Machinery | null) => void
  setMaintenanceDialogOpen: (open: boolean) => void
  handleCreateMachinery: () => void
  handleEditMachinery: (machinery: Machinery) => void
  handleDeleteMachinery: (id: number) => Promise<void>
  handleScheduleMaintenance: (machinery: Machinery) => void
}

export interface MachineryTabProps {
  machinery?: Machinery[]
  statistics?: any
  maintenanceNeeded?: Machinery[]
  selectedCategory: string
  filteredMachinery: Machinery[]
  onCategoryChange: (category: string) => void
  onEditMachinery: (machinery: Machinery) => void
  onDeleteMachinery: (id: number) => Promise<void>
  onScheduleMaintenance: (machinery: Machinery) => void
}

export interface MachineryDialogProps {
  open: boolean
  onClose: () => void
  machinery?: Machinery | null
  isEdit?: boolean
}

export interface MaintenanceDialogProps {
  open: boolean
  onClose: () => void
  machinery: Machinery | null
}

// TabPanelProps moved to @/shared/types - import from there if needed