import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Button,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  DragIndicator as DragIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import IconSelector from '../common/IconSelector'
import { 
  useCategories, 
  useCategoriesWithProductCount,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories
} from '../../hooks/useCategories'
import { ProductCategory } from '../../types'
import { CreateCategoryData, UpdateCategoryData } from '../../services/categories.service'

interface CategoryFormData {
  display_name: string
  icon: string
  description: string
}

const CategoryList: React.FC = () => {
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<ProductCategory | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    display_name: '',
    icon: '',
    description: ''
  })

  const { data: categoriesWithCount = [], isLoading } = useCategoriesWithProductCount()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const handleCreate = () => {
    setEditingCategory(null)
    setFormData({
      display_name: '',
      icon: '',
      description: ''
    })
    setShowForm(true)
  }

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category)
    setFormData({
      display_name: category.display_name,
      icon: category.icon,
      description: category.description || ''
    })
    setShowForm(true)
  }

  // Función para generar nombre interno desde display_name
  const generateInternalName = (displayName: string): string => {
    return displayName
      .toLowerCase()
      .trim()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  const handleSubmit = async () => {
    try {
      const internalName = generateInternalName(formData.display_name)
      
      if (editingCategory) {
        // Update - solo actualizar display_name, icon y description
        const updateData: UpdateCategoryData = {
          display_name: formData.display_name,
          icon: formData.icon,
          description: formData.description
        }
        await updateCategory.mutateAsync({ id: editingCategory.id, data: updateData })
      } else {
        // Create
        const createData: CreateCategoryData = {
          name: internalName,
          display_name: formData.display_name,
          icon: formData.icon,
          description: formData.description,
          sort_order: categoriesWithCount.length + 1
        }
        await createCategory.mutateAsync(createData)
      }
      setShowForm(false)
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleDelete = async (category: ProductCategory) => {
    try {
      await deleteCategory.mutateAsync(category.id)
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const isFormValid = formData.display_name.trim().length >= 2

  if (isLoading) {
    return <Typography>Cargando categorías...</Typography>
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          🏷️ Gestión de Categorías
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
        >
          Nueva Categoría
        </Button>
      </Box>

      <Grid container spacing={2}>
        {categoriesWithCount.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {category.icon ? (
                      <Typography variant="h4">{category.icon}</Typography>
                    ) : (
                      <Box 
                        sx={{ 
                          width: 40, 
                          height: 40, 
                          borderRadius: 1, 
                          backgroundColor: 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          Sin icono
                        </Typography>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="h6">{category.display_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {category.name}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip 
                    label={`${category.product_count} productos`}
                    size="small"
                    color={category.product_count > 0 ? "primary" : "default"}
                  />
                </Box>

                {category.description && (
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {category.description}
                  </Typography>
                )}

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption">
                      Orden: {category.sort_order}
                    </Typography>
                    <Chip 
                      label={category.is_active ? "Activa" : "Inactiva"}
                      size="small"
                      color={category.is_active ? "success" : "default"}
                    />
                  </Box>
                  
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(category)}
                      title="Editar categoría"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDeleteConfirm(category)}
                      disabled={category.product_count > 0}
                      title={
                        category.product_count > 0 
                          ? "No se puede eliminar una categoría con productos"
                          : "Eliminar categoría"
                      }
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {categoriesWithCount.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No hay categorías registradas. Crea la primera categoría para empezar.
        </Alert>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onClose={() => setShowForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nombre de la categoría"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              placeholder="ej: Bebidas, Postres, Comida"
              helperText="Nombre que se mostrará en la interfaz"
              fullWidth
              required
            />
            
            <IconSelector
              label="Icono"
              value={formData.icon}
              onChange={(icon) => setFormData({ ...formData, icon })}
              placeholder="Seleccionar icono"
              helperText="Emoji que representará la categoría (opcional)"
              required={false}
            />
            
            <TextField
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional de la categoría"
              multiline
              rows={3}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowForm(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!isFormValid || createCategory.isPending || updateCategory.isPending}
          >
            {editingCategory ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar la categoría "{deleteConfirm?.display_name}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            color="error"
            variant="contained"
            disabled={deleteCategory.isPending}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CategoryList