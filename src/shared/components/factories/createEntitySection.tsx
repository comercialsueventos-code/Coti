/**
 * Entity Section Factory - Story 2.7: Component Standardization
 * 
 * Factory functions for generating reusable entity form section components
 * Eliminates duplication across ProductBasicInfo, EmployeeBasicInfo, etc.
 */

import React, { useCallback } from 'react'
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Chip,
  Stack,
  Autocomplete,
  InputAdornment
} from '@mui/material'
import type {
  BaseFormData,
  EntitySectionProps,
  FieldConfig,
  FieldType,
  FieldOption
} from './types'

/**
 * Configuration for dynamic entity section
 */
export interface EntitySectionConfig {
  id: string
  title: string
  icon?: string
  fields: FieldConfig[]
  layout?: {
    columns?: number
    spacing?: number
  }
}

/**
 * Create a dynamic entity section component
 * 
 * @param config - Section configuration
 * @returns Generated section component
 */
export function createEntitySection<TFormData extends BaseFormData>(
  config: EntitySectionConfig
): React.ComponentType<EntitySectionProps<TFormData>> {
  
  const EntitySection: React.FC<EntitySectionProps<TFormData>> = ({
    formData,
    onFormDataChange,
    errors,
    mode,
    readOnly = false
  }) => {
    
    // Handle field value changes
    const handleFieldChange = useCallback((field: string, value: any) => {
      onFormDataChange({ [field]: value } as Partial<TFormData>)
    }, [onFormDataChange])
    
    // Filter and sort fields
    const visibleFields = config.fields
      .filter(field => !field.visible || field.visible(formData, mode))
      .sort((a, b) => a.order - b.order)
    
    return (
      <Grid container spacing={config.layout?.spacing || 2}>
        {visibleFields.map(field => {
          const isDisabled = readOnly || 
                           (field.disabled && field.disabled(formData, mode))
          
          return (
            <Grid item xs={12} sm={6} md={4} key={field.field}>
              {renderFormField(
                field,
                formData[field.field as keyof TFormData],
                (value) => handleFieldChange(field.field, value),
                errors[field.field],
                isDisabled
              )}
            </Grid>
          )
        })}
      </Grid>
    )
  }
  
  EntitySection.displayName = `EntitySection(${config.title})`
  
  return EntitySection
}

/**
 * Render form field based on field configuration
 */
function renderFormField(
  field: FieldConfig,
  value: any,
  onChange: (value: any) => void,
  error?: string,
  disabled: boolean = false
) {
  const commonProps = {
    fullWidth: true,
    error: !!error,
    helperText: error || field.helperText,
    disabled,
    required: field.required
  }
  
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <TextField
          {...commonProps}
          label={field.label}
          placeholder={field.placeholder}
          type={field.type === 'email' ? 'email' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      
    case 'number':
      return (
        <TextField
          {...commonProps}
          label={field.label}
          placeholder={field.placeholder}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        />
      )
      
    case 'currency':
      return (
        <TextField
          {...commonProps}
          label={field.label}
          placeholder={field.placeholder}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>
          }}
        />
      )
      
    case 'percentage':
      return (
        <TextField
          {...commonProps}
          label={field.label}
          placeholder={field.placeholder}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          InputProps={{
            endAdornment: <InputAdornment position="end">%</InputAdornment>
          }}
        />
      )
      
    case 'select':
      return (
        <FormControl {...commonProps}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            label={field.label}
          >
            {!field.required && (
              <MenuItem value="">
                <em>Ninguno</em>
              </MenuItem>
            )}
            {field.options?.map(option => (
              <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )
      
    case 'multiselect':
      return (
        <FormControl {...commonProps}>
          <Autocomplete
            multiple
            value={value || []}
            onChange={(_, newValue) => onChange(newValue)}
            options={field.options?.map(opt => opt.value) || []}
            getOptionLabel={(option) => {
              const foundOption = field.options?.find(opt => opt.value === option)
              return foundOption?.label || String(option)
            }}
            renderTags={(selected, getTagProps) =>
              selected.map((option, index) => {
                const foundOption = field.options?.find(opt => opt.value === option)
                return (
                  <Chip
                    variant="outlined"
                    label={foundOption?.label || String(option)}
                    {...getTagProps({ index })}
                    key={option}
                  />
                )
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={field.label}
                placeholder={field.placeholder}
                error={!!error}
                helperText={error || field.helperText}
              />
            )}
            disabled={disabled}
          />
        </FormControl>
      )
      
    case 'boolean':
      return (
        <FormControlLabel
          control={
            <Switch
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={disabled}
            />
          }
          label={field.label}
          sx={{
            width: '100%',
            ml: 0,
            '& .MuiFormControlLabel-label': {
              width: '100%'
            }
          }}
        />
      )
      
    case 'date':
      return (
        <TextField
          {...commonProps}
          label={field.label}
          placeholder={field.placeholder}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          InputLabelProps={{
            shrink: true
          }}
        />
      )
      
    case 'datetime':
      return (
        <TextField
          {...commonProps}
          label={field.label}
          placeholder={field.placeholder}
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          InputLabelProps={{
            shrink: true
          }}
        />
      )
      
    case 'textarea':
      return (
        <TextField
          {...commonProps}
          label={field.label}
          placeholder={field.placeholder}
          multiline
          rows={4}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      
    case 'autocomplete':
      return (
        <Autocomplete
          value={value || null}
          onChange={(_, newValue) => onChange(newValue)}
          options={field.options?.map(opt => opt.value) || []}
          getOptionLabel={(option) => {
            const foundOption = field.options?.find(opt => opt.value === option)
            return foundOption?.label || String(option)
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={field.label}
              placeholder={field.placeholder}
              error={!!error}
              helperText={error || field.helperText}
              required={field.required}
            />
          )}
          disabled={disabled}
        />
      )
      
    case 'color':
      return (
        <TextField
          {...commonProps}
          label={field.label}
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          InputProps={{
            sx: {
              height: '56px',
              '& input[type="color"]': {
                width: '100%',
                height: '40px',
                border: 'none',
                borderRadius: '4px'
              }
            }
          }}
        />
      )
      
    default:
      return (
        <TextField
          {...commonProps}
          label={field.label}
          placeholder={field.placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }
}

/**
 * Pre-defined section configurations for common use cases
 */
export const CommonSections = {
  /**
   * Basic information section (name, description, active status)
   */
  basicInfo: (customFields: FieldConfig[] = []): EntitySectionConfig => ({
    id: 'basic',
    title: 'Información Básica',
    icon: '📋',
    fields: [
      {
        field: 'name',
        label: 'Nombre',
        type: 'text',
        section: 'basic',
        order: 1,
        required: true,
        placeholder: 'Ingresa el nombre'
      },
      {
        field: 'description',
        label: 'Descripción',
        type: 'textarea',
        section: 'basic',
        order: 2,
        placeholder: 'Descripción opcional'
      },
      {
        field: 'is_active',
        label: 'Activo',
        type: 'boolean',
        section: 'basic',
        order: 3
      },
      ...customFields
    ].sort((a, b) => a.order - b.order)
  }),
  
  /**
   * Contact information section (email, phone, address)
   */
  contactInfo: (customFields: FieldConfig[] = []): EntitySectionConfig => ({
    id: 'contact',
    title: 'Información de Contacto',
    icon: '📞',
    fields: [
      {
        field: 'email',
        label: 'Email',
        type: 'email',
        section: 'contact',
        order: 1,
        placeholder: 'ejemplo@correo.com'
      },
      {
        field: 'phone',
        label: 'Teléfono',
        type: 'phone',
        section: 'contact',
        order: 2,
        placeholder: '300 123 4567'
      },
      {
        field: 'address',
        label: 'Dirección',
        type: 'textarea',
        section: 'contact',
        order: 3,
        placeholder: 'Dirección completa'
      },
      ...customFields
    ].sort((a, b) => a.order - b.order)
  }),
  
  /**
   * Pricing information section (price, cost, margin)
   */
  pricingInfo: (customFields: FieldConfig[] = []): EntitySectionConfig => ({
    id: 'pricing',
    title: 'Información de Precios',
    icon: '💰',
    fields: [
      {
        field: 'base_price',
        label: 'Precio Base',
        type: 'currency',
        section: 'pricing',
        order: 1,
        required: true
      },
      {
        field: 'cost_price',
        label: 'Precio de Costo',
        type: 'currency',
        section: 'pricing',
        order: 2
      },
      {
        field: 'margin_percentage',
        label: 'Margen %',
        type: 'percentage',
        section: 'pricing',
        order: 3
      },
      ...customFields
    ].sort((a, b) => a.order - b.order)
  }),
  
  /**
   * Notes and additional information section
   */
  additionalInfo: (customFields: FieldConfig[] = []): EntitySectionConfig => ({
    id: 'additional',
    title: 'Información Adicional',
    icon: '📝',
    fields: [
      {
        field: 'notes',
        label: 'Notas',
        type: 'textarea',
        section: 'additional',
        order: 1,
        placeholder: 'Notas adicionales'
      },
      {
        field: 'tags',
        label: 'Etiquetas',
        type: 'multiselect',
        section: 'additional',
        order: 2,
        options: [] // Should be populated with available tags
      },
      ...customFields
    ].sort((a, b) => a.order - b.order)
  })
}

/**
 * Helper function to create custom section configuration
 */
export function createCustomSection(
  id: string,
  title: string,
  fields: FieldConfig[],
  options: {
    icon?: string
    layout?: EntitySectionConfig['layout']
  } = {}
): EntitySectionConfig {
  return {
    id,
    title,
    icon: options.icon,
    fields: fields.sort((a, b) => a.order - b.order),
    layout: options.layout
  }
}

/**
 * Helper function to merge field configurations with validation
 */
export function mergeFields(
  baseFields: FieldConfig[],
  customFields: FieldConfig[]
): FieldConfig[] {
  const merged = [...baseFields]
  
  customFields.forEach(customField => {
    const existingIndex = merged.findIndex(f => f.field === customField.field)
    
    if (existingIndex >= 0) {
      // Replace existing field
      merged[existingIndex] = customField
    } else {
      // Add new field
      merged.push(customField)
    }
  })
  
  return merged.sort((a, b) => a.order - b.order)
}