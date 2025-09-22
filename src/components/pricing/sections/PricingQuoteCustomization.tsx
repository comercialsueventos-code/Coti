import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  TextField,
  Typography,
  Box,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Chip,
  FormControlLabel,
  Switch
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon
} from '@mui/icons-material'
import { useDefaultQuoteTemplate } from '../../../hooks/useQuoteTemplates'
import { PricingFormData, QuoteCustomTexts } from '../types'

interface PricingQuoteCustomizationProps {
  formData: PricingFormData
  updateFormData: (field: keyof PricingFormData, value: any) => void
}

const PricingQuoteCustomization: React.FC<PricingQuoteCustomizationProps> = ({
  formData,
  updateFormData
}) => {
  const { data: defaultTemplate, isLoading: loadingTemplate } = useDefaultQuoteTemplate()
  const [expanded, setExpanded] = useState<string | false>(false)

  // Estado para los textos personalizados
  const [customTexts, setCustomTexts] = useState<QuoteCustomTexts>({
    includes_title: 'INCLUYE',
    includes_content: '',
    payment_title: 'FORMA DE PAGO',
    payment_content: '',
    requirements_title: 'REQUERIMIENTOS DE INSTALACIÓN PARA EQUIPOS',
    requirements_content: '',
    observations_title: 'OBSERVACIONES',
    observations_content: '',
    company_phone: '3174421013',
    company_email: 'comercial@sue-events.com',
    company_instagram: '@sueevents',
    signature_name: 'PEGGY CERVANTES G.',
    use_custom_texts: false
  })

  // Cargar plantilla por defecto cuando esté disponible
  useEffect(() => {
    if (defaultTemplate && !customTexts.use_custom_texts) {
      setCustomTexts(prev => ({
        ...prev,
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
      }))
    }
  }, [defaultTemplate, customTexts.use_custom_texts])

  // Cargar textos desde formData si existen
  useEffect(() => {
    if (formData.quoteCustomTexts) {
      setCustomTexts(formData.quoteCustomTexts)
    }
  }, [formData.quoteCustomTexts])

  const handleAccordionChange = (panel: string) => (
    event: React.SyntheticEvent,
    isExpanded: boolean
  ) => {
    setExpanded(isExpanded ? panel : false)
  }

  const handleTextChange = (field: keyof QuoteCustomTexts) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const updatedTexts = {
      ...customTexts,
      [field]: event.target.value
    }
    setCustomTexts(updatedTexts)
    
    // Actualizar formData inmediatamente
    console.log('🔧 DEBUG: Actualizando textos personalizados:', field, event.target.value)
    console.log('🔧 DEBUG: Textos completos actualizados:', updatedTexts)
    updateFormData('quoteCustomTexts', updatedTexts)
  }

  const handleUseCustomToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const useCustom = event.target.checked
    const updatedTexts = {
      ...customTexts,
      use_custom_texts: useCustom
    }
    
    // Si desactivamos la personalización, restaurar valores de plantilla
    if (!useCustom && defaultTemplate) {
      updatedTexts.includes_title = defaultTemplate.includes_title
      updatedTexts.includes_content = defaultTemplate.includes_content
      updatedTexts.payment_title = defaultTemplate.payment_title
      updatedTexts.payment_content = defaultTemplate.payment_content
      updatedTexts.requirements_title = defaultTemplate.requirements_title
      updatedTexts.requirements_content = defaultTemplate.requirements_content
      updatedTexts.observations_title = defaultTemplate.observations_title
      updatedTexts.observations_content = defaultTemplate.observations_content
      updatedTexts.company_phone = defaultTemplate.company_phone
      updatedTexts.company_email = defaultTemplate.company_email
      updatedTexts.company_instagram = defaultTemplate.company_instagram
      updatedTexts.signature_name = defaultTemplate.signature_name
    }

    console.log('🔄 DEBUG: Toggle personalización:', useCustom)
    console.log('🔄 DEBUG: Textos after toggle:', updatedTexts)
    setCustomTexts(updatedTexts)
    updateFormData('quoteCustomTexts', updatedTexts)
  }

  const resetToDefault = () => {
    if (defaultTemplate) {
      const resetTexts = {
        ...customTexts,
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
      }
      setCustomTexts(resetTexts)
      updateFormData('quoteCustomTexts', resetTexts)
    }
  }

  if (loadingTemplate) {
    return (
      <Card>
        <CardContent>
          <Typography>Cargando plantilla...</Typography>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader 
        title="📄 Personalización de Textos de Cotización"
        avatar={<EditIcon color="primary" />}
        action={
          <Box display="flex" alignItems="center" gap={1}>
            {customTexts.use_custom_texts && (
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={resetToDefault}
                variant="outlined"
              >
                Restaurar Predeterminado
              </Button>
            )}
            <Chip 
              label={customTexts.use_custom_texts ? "Personalizado" : "Plantilla Predeterminada"}
              color={customTexts.use_custom_texts ? "primary" : "default"}
              size="small"
            />
          </Box>
        }
      />
      <CardContent>
        {/* Control de activación */}
        <Box mb={2}>
          <FormControlLabel
            control={
              <Switch
                checked={customTexts.use_custom_texts}
                onChange={handleUseCustomToggle}
                color="primary"
              />
            }
            label={
              <Typography variant="body1">
                <strong>Personalizar textos para esta cotización</strong>
              </Typography>
            }
          />
          {!customTexts.use_custom_texts && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Se usará la plantilla predeterminada. Activa la personalización para editar textos específicos para esta cotización.
            </Alert>
          )}
        </Box>

        {customTexts.use_custom_texts && (
          <>
            {/* Sección INCLUYE */}
            <Accordion 
              expanded={expanded === 'incluye'} 
              onChange={handleAccordionChange('incluye')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  📋 Sección "INCLUYE"
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Título de la sección"
                      value={customTexts.includes_title}
                      onChange={handleTextChange('includes_title')}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      label="Contenido - Qué incluye el servicio"
                      value={customTexts.includes_content}
                      onChange={handleTextChange('includes_content')}
                      variant="outlined"
                      helperText="Cada línea será un elemento separado en el PDF. Describe qué incluye específicamente este servicio."
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Sección FORMA DE PAGO */}
            <Accordion 
              expanded={expanded === 'pago'} 
              onChange={handleAccordionChange('pago')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  💳 Información de Pago
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Título de la sección"
                      value={customTexts.payment_title}
                      onChange={handleTextChange('payment_title')}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Condiciones de pago y datos bancarios"
                      value={customTexts.payment_content}
                      onChange={handleTextChange('payment_content')}
                      variant="outlined"
                      helperText="Especifica condiciones de anticipo, saldo, datos bancarios, etc."
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Sección REQUERIMIENTOS */}
            <Accordion 
              expanded={expanded === 'requerimientos'} 
              onChange={handleAccordionChange('requerimientos')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  🔧 Requerimientos Técnicos
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Título de la sección"
                      value={customTexts.requirements_title}
                      onChange={handleTextChange('requirements_title')}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      label="Requerimientos de instalación y funcionamiento"
                      value={customTexts.requirements_content}
                      onChange={handleTextChange('requirements_content')}
                      variant="outlined"
                      helperText="Especifica requerimientos eléctricos, espacio, instalación, etc."
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Sección OBSERVACIONES */}
            <Accordion 
              expanded={expanded === 'observaciones'} 
              onChange={handleAccordionChange('observaciones')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  📝 Observaciones y Términos
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Título de la sección"
                      value={customTexts.observations_title}
                      onChange={handleTextChange('observations_title')}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={5}
                      label="Términos, condiciones y observaciones importantes"
                      value={customTexts.observations_content}
                      onChange={handleTextChange('observations_content')}
                      variant="outlined"
                      helperText="Políticas de cancelación, términos de servicio, advertencias, etc."
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            {/* Información de Contacto */}
            <Accordion 
              expanded={expanded === 'contacto'} 
              onChange={handleAccordionChange('contacto')}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  🏢 Información de Contacto
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Teléfono / WhatsApp"
                      value={customTexts.company_phone}
                      onChange={handleTextChange('company_phone')}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email de contacto"
                      value={customTexts.company_email}
                      onChange={handleTextChange('company_email')}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Instagram"
                      value={customTexts.company_instagram}
                      onChange={handleTextChange('company_instagram')}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre para firma"
                      value={customTexts.signature_name}
                      onChange={handleTextChange('signature_name')}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="body2">
                ✅ <strong>Textos personalizados activados:</strong> Esta cotización usará los textos que has configurado aquí en lugar de la plantilla predeterminada.
              </Typography>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default PricingQuoteCustomization