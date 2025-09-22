import { Supplier } from '../../../types'

export interface SuppliersPageState {
  currentTab: number
  selectedType: string
  searchTerm: string
  createDialogOpen: boolean
  editDialogOpen: boolean
  ratingDialogOpen: boolean
  selectedSupplier: Supplier | null
}

export interface SuppliersPageActions {
  setCurrentTab: (tab: number) => void
  setSelectedType: (type: string) => void
  setSearchTerm: (term: string) => void
  setCreateDialogOpen: (open: boolean) => void
  setEditDialogOpen: (open: boolean) => void
  setRatingDialogOpen: (open: boolean) => void
  setSelectedSupplier: (supplier: Supplier | null) => void
  handleCreateSupplier: () => void
  handleEditSupplier: (supplier: Supplier) => void
  handleDeleteSupplier: (id: number) => Promise<void>
  handleRateSupplier: (supplier: Supplier) => void
}

export interface SuppliersTabProps {
  suppliers?: Supplier[]
  statistics?: any
  topRated?: Supplier[]
  searchTerm: string
  selectedType: string
  filteredSuppliers: Supplier[]
  onSearchChange: (term: string) => void
  onTypeChange: (type: string) => void
  onEditSupplier: (supplier: Supplier) => void
  onDeleteSupplier: (id: number) => Promise<void>
  onRateSupplier: (supplier: Supplier) => void
}

export interface SupplierDialogProps {
  open: boolean
  onClose: () => void
  supplier?: Supplier | null
  isEdit?: boolean
}

// TabPanelProps moved to @/shared/types - import from there if needed