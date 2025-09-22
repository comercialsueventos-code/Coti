import React, { useState, useEffect } from 'react'
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material'
import {
  Save as SaveIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon
} from '@mui/icons-material'
import { 
  useDefaultQuoteTemplate,
  useQuoteTemplates, 
  useUpdateQuoteTemplate,
  useCreateQuoteTemplate,
  useSetDefaultTemplate 
} from '../../hooks/useQuoteTemplates'
import { QuoteTemplate, QuoteTemplateUpdate } from '../../services/quoteTemplates.service'

interface QuoteTemplateEditorProps {
  onClose?: () => void
}

const QuoteTemplateEditor: React.FC<QuoteTemplateEditorProps> = ({ onClose }) => {
  const { data: defaultTemplate, isLoading: loadingDefault } = useDefaultQuoteTemplate()
  const { data: allTemplates = [] } = useQuoteTemplates()
  const updateTemplateMutation = useUpdateQuoteTemplate()
  const createTemplateMutation = useCreateQuoteTemplate()
  const setDefaultMutation = useSetDefaultTemplate()

  const [isEditing, setIsEditing] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState<QuoteTemplateUpdate>({
    includes_title: '',
    includes_content: '',
    payment_title: '',
    payment_content: '',
    requirements_title: '',
    requirements_content: '',
    observations_title: '',
    observations_content: '',
    company_phone: '',
    company_email: '',
    company_instagram: '',
    signature_name: ''
  })

  const [newTemplateData, setNewTemplateData] = useState({
    template_name: '',
    ...formData
  })

  useEffect(() => {
    if (defaultTemplate && !isEditing) {
      setFormData({
        includes_title: defaultTemplate.includes_title,
        includes_content: defaultTemplate.includes_content,
        payment_title: defaultTemplate.payment_title,
        payment_content: defaultTemplate.payment_content,
        requirements_title: defaultTemplate.requirements_title,
        requirements_content: defaultTemplate.requirements_content,
        observations_title: defaultTemplate.observations_title,
        observations_content: defaultTemplate.observations_content,
        company_phone: defaultTemplate.company_phone,
        company_email: defaultTemplate.company_email,
        company_instagram: defaultTemplate.company_instagram,
        signature_name: defaultTemplate.signature_name
      })
      setSelectedTemplateId(defaultTemplate.id)
    }
  }, [defaultTemplate, isEditing])

  const handleInputChange = (field: keyof QuoteTemplateUpdate) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleNewTemplateChange = (field: keyof typeof newTemplateData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNewTemplateData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  const handleSave = async () => {
    if (!selectedTemplateId) return

    try {
      await updateTemplateMutation.mutateAsync({
        id: selectedTemplateId,
        updates: formData
      })
      setIsEditing(false)
      alert('¡Plantilla actualizada correctamente!')
    } catch (error) {
      console.error('Error al guardar:', error)
      alert('Error al guardar la plantilla')
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplateData.template_name.trim()) {
      alert('Por favor ingresa un nombre para la plantilla')
      return
    }

    try {
      const { template_name, ...templateData } = newTemplateData
      await createTemplateMutation.mutateAsync({
        template_name,
        ...templateData
      })
      setShowCreateDialog(false)
      setNewTemplateData({
        template_name: '',
        ...formData
      })
      alert('¡Plantilla creada correctamente!')
    } catch (error) {
      console.error('Error al crear plantilla:', error)
      alert('Error al crear la plantilla')
    }
  }

  const handleSetDefault = async (templateId: number) => {
    try {
      await setDefaultMutation.mutateAsync(templateId)
      setSelectedTemplateId(templateId)
      alert('Plantilla marcada como predeterminada')
    } catch (error) {
      console.error('Error al marcar como predeterminada:', error)
      alert('Error al cambiar la plantilla predeterminada')
    }
  }

  const loadTemplate = (template: QuoteTemplate) => {
    setFormData({
      includes_title: template.includes_title,
      includes_content: template.includes_content,
      payment_title: template.payment_title,
      payment_content: template.payment_content,
      requirements_title: template.requirements_title,
      requirements_content: template.requirements_content,
      observations_title: template.observations_title,
      observations_content: template.observations_content,
      company_phone: template.company_phone,
      company_email: template.company_email,
      company_instagram: template.company_instagram,
      signature_name: template.signature_name
    })
    setSelectedTemplateId(template.id)
    setIsEditing(true)
  }

  if (loadingDefault) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          📄 Editor de Plantillas de Cotización
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={() => setShowCreateDialog(true)}
          >
            Nueva Plantilla
          </Button>
          {onClose && (
            <Button onClick={onClose} variant="outlined">
              Cerrar
            </Button>
          )}
        </Box>
      </Box>

      {/* Plantillas disponibles */}
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Plantillas Disponibles" />
        <CardContent>
          <Grid container spacing={2}>
            {allTemplates.filter(t => t.is_active).map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    cursor: 'pointer',
                    border: selectedTemplateId === template.id ? 2 : 1,
                    borderColor: selectedTemplateId === template.id ? 'primary.main' : 'divider',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => loadTemplate(template)}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {template.template_name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      {template.is_default && (
                        <Chip 
                          icon={<StarIcon />} 
                          label="Predeterminada" 
                          size="small" 
                          color="primary" 
                        />
                      )}
                      {!template.is_default && (
                        <Button
                          size="small"
                          startIcon={<StarBorderIcon />}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSetDefault(template.id)
                          }}
                        >
                          Predeterminada
                        </Button>
                      )}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Creada: {new Date(template.created_at).toLocaleDateString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Actualizada: {new Date(template.updated_at).toLocaleDateString()}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {!isEditing ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary" mb={2}>
            Selecciona una plantilla para editarla
          </Typography>
          <Button
            startIcon={<EditIcon />}
            variant="contained"
            onClick={() => setIsEditing(true)}
            disabled={!selectedTemplateId}
          >
            Editar Plantilla Seleccionada
          </Button>
        </Box>
      ) : (
        <form>
          <Grid container spacing={3}>
            {/* Sección INCLUYE */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                📋 Sección "INCLUYE"
              </Typography>
              <TextField
                fullWidth
                label="Título de la sección"
                value={formData.includes_title}
                onChange={handleInputChange('includes_title')}
                margin="dense"
                variant="outlined"
              />
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Contenido que incluye el servicio"
                value={formData.includes_content}
                onChange={handleInputChange('includes_content')}
                margin="dense"
                variant="outlined"
                helperText="Cada línea será un elemento separado en el PDF"
              />
            </Grid>

            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Sección FORMA DE PAGO */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                💳 Información de Pago
              </Typography>
              <TextField
                fullWidth
                label="Título de la sección"
                value={formData.payment_title}
                onChange={handleInputChange('payment_title')}
                margin="dense"
                variant="outlined"
              />
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Contenido de forma de pago"
                value={formData.payment_content}
                onChange={handleInputChange('payment_content')}
                margin="dense"
                variant="outlined"
              />
            </Grid>

            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Sección REQUERIMIENTOS */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                🔧 Requerimientos de Instalación
              </Typography>
              <TextField
                fullWidth
                label="Título de la sección"
                value={formData.requirements_title}
                onChange={handleInputChange('requirements_title')}
                margin="dense"
                variant="outlined"
              />
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Contenido de requerimientos"
                value={formData.requirements_content}
                onChange={handleInputChange('requirements_content')}
                margin="dense"
                variant="outlined"
              />
            </Grid>

            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Sección OBSERVACIONES */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                📝 Observaciones Importantes
              </Typography>
              <TextField
                fullWidth
                label="Título de la sección"
                value={formData.observations_title}
                onChange={handleInputChange('observations_title')}
                margin="dense"
                variant="outlined"
              />
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Contenido de observaciones"
                value={formData.observations_content}
                onChange={handleInputChange('observations_content')}
                margin="dense"
                variant="outlined"
              />
            </Grid>

            <Divider sx={{ width: '100%', my: 2 }} />

            {/* Información de la empresa */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                🏢 Información de Contacto
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Teléfono de la empresa"
                    value={formData.company_phone}
                    onChange={handleInputChange('company_phone')}
                    margin="dense"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email de la empresa"
                    value={formData.company_email}
                    onChange={handleInputChange('company_email')}
                    margin="dense"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Instagram"
                    value={formData.company_instagram}
                    onChange={handleInputChange('company_instagram')}
                    margin="dense"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nombre para la firma"
                    value={formData.signature_name}
                    onChange={handleInputChange('signature_name')}
                    margin="dense"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Botones de acción */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="center" mt={3}>
                <Button
                  variant="contained"
                  startIcon={updateTemplateMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={updateTemplateMutation.isPending}
                  size="large"
                >
                  {updateTemplateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(false)}
                  disabled={updateTemplateMutation.isPending}
                  size="large"
                >
                  Cancelar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      )}

      {/* Dialog para crear nueva plantilla */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Nueva Plantilla</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre de la plantilla"
            value={newTemplateData.template_name}
            onChange={handleNewTemplateChange('template_name')}
            margin="dense"
            variant="outlined"
            autoFocus
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            La nueva plantilla se creará con los valores predeterminados. Puedes editarla después de crearla.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancelar</Button>
          <Button 
            onClick={handleCreateTemplate} 
            variant="contained"
            disabled={createTemplateMutation.isPending}
          >
            {createTemplateMutation.isPending ? 'Creando...' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}

export default QuoteTemplateEditor