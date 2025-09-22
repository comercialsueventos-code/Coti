import React from 'react'
import { Box, Grid, Typography, Alert } from '@mui/material'
import { validateEmployeeProductAssociation } from '../../services/pricing.service'
import PricingClientSelection from './sections/PricingClientSelection'
import PricingEmployeeManagement from './sections/PricingEmployeeManagement'
import PricingProductSelection from './sections/PricingProductSelection'
import PricingMachinerySection from './sections/PricingMachinerySection'
import PricingCalculationSummary from './sections/PricingCalculationSummary'
import SmartAvailabilityValidator from './SmartAvailabilityValidator'
import { usePricingForm } from './hooks/usePricingForm'
import PricingEmployeeProductAssociation from './sections/PricingEmployeeProductAssociation'
import PricingQuoteCustomization from './sections/PricingQuoteCustomization'
import { PricingFormData } from './types'

interface PricingCalculatorProps {
  initialData?: PricingFormData
  isEditMode?: boolean
  editingQuoteId?: number
}

const PricingCalculator: React.FC<PricingCalculatorProps> = ({ 
  initialData, 
  isEditMode = false, 
  editingQuoteId 
}) => {
  const {
    formData,
    updateFormData,
    addEmployee,
    removeEmployee,
    updateEmployee,
    addProduct,
    removeProduct,
    updateProduct,
    addMachinery,
    removeMachinery,
    updateMachinery,
    addMachineryRental,
    removeMachineryRental,
    updateMachineryRental,
    addEventSubcontract,
    removeEventSubcontract,
    updateEventSubcontract,
    addDisposableItem,
    removeDisposableItem,
    updateDisposableItem,
    result,
    errors,
    suggestions,
    is_valid,
    handleSaveQuote,
    isLoading,
    showSuccessMessage,
    setShowSuccessMessage,
    savedQuoteNumber,
    savedQuoteId
  } = usePricingForm({ initialData, isEditMode, editingQuoteId })

  // 🤖 ULTRATHINK: Validación en tiempo real de empleado-producto
  const associationValidation = React.useMemo(() => {
    return validateEmployeeProductAssociation({
      employees: formData.employeeInputs,
      products: formData.productInputs
    })
  }, [formData.employeeInputs, formData.productInputs])

  // Smart scheduling functions
  const handleEmployeeReplace = (oldEmployeeId: number, newEmployeeId: number) => {
    const employeeIndex = formData.employees.findIndex(emp => emp.id === oldEmployeeId)
    if (employeeIndex !== -1) {
      // Replace the employee while keeping the same hours
      const oldEmployee = formData.employees[employeeIndex]
      updateEmployee(employeeIndex, { id: newEmployeeId, hours: oldEmployee.hours })
    }
  }

  const handleAutoOptimize = (suggestions: any[]) => {
    // Replace current employees with optimized suggestions
    const newEmployees = suggestions.map(suggestion => ({
      id: suggestion.employee.id,
      hours: formData.eventDetails.hours, // Default to event duration
      employee_type: suggestion.employee.employee_type
    }))
    
    updateFormData({
      ...formData,
      employees: newEmployees
    })
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        {isEditMode ? '🤖 Editor ULTRATHINK de Cotización' : '💰 Calculadora de Precios Sue Events'}
      </Typography>
      
      {isEditMode && editingQuoteId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            🤖 <strong>Modo Edición:</strong> Las asociaciones empleado-producto existentes han sido cargadas.
            Modifica los campos necesarios y guarda los cambios.
          </Typography>
        </Alert>
      )}
      
      {/* 🤖 ULTRATHINK: Validación de asociación empleado-producto */}
      {formData.employeeInputs.length > 0 && !associationValidation.isValid && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            ⚠️ Validación de Operarios
          </Typography>
          {associationValidation.errors.map((error, index) => (
            <Typography key={index} variant="body2">
              {error}
            </Typography>
          ))}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Cliente y Información del Evento */}
        <Grid item xs={12}>
          <PricingClientSelection
            formData={formData}
            updateFormData={updateFormData}
          />
        </Grid>

        {/* Empleados */}
        <Grid item xs={12} md={6}>
          <PricingEmployeeManagement
            formData={formData}
            updateFormData={updateFormData}
            addEmployee={addEmployee}
            removeEmployee={removeEmployee}
            updateEmployee={updateEmployee}
          />
        </Grid>

        {/* Validación Inteligente de Disponibilidad */}
        <Grid item xs={12}>
          <SmartAvailabilityValidator
            formData={formData}
            onEmployeeReplace={handleEmployeeReplace}
            onAutoOptimize={handleAutoOptimize}
          />
        </Grid>

        {/* Productos */}
        <Grid item xs={12}>
          <PricingProductSelection
            formData={formData}
            updateFormData={updateFormData}
            addProduct={addProduct}
            removeProduct={removeProduct}
            updateProduct={updateProduct}
          />
        </Grid>

        {/* Asociación Operario-Producto */}
        <Grid item xs={12}>
          <PricingEmployeeProductAssociation
            formData={formData}
            updateFormData={updateFormData}
          />
        </Grid>

        {/* Personalización de Textos de Cotización */}
        <Grid item xs={12}>
          <PricingQuoteCustomization
            formData={formData}
            updateFormData={updateFormData}
          />
        </Grid>

        {/* Maquinaria, Alquiler y Subcontratación */}
        <Grid item xs={12}>
          <PricingMachinerySection
            formData={formData}
            updateFormData={updateFormData}
            addMachinery={addMachinery}
            removeMachinery={removeMachinery}
            updateMachinery={updateMachinery}
            addMachineryRental={addMachineryRental}
            removeMachineryRental={removeMachineryRental}
            updateMachineryRental={updateMachineryRental}
            addEventSubcontract={addEventSubcontract}
            removeEventSubcontract={removeEventSubcontract}
            updateEventSubcontract={updateEventSubcontract}
            addDisposableItem={addDisposableItem}
            removeDisposableItem={removeDisposableItem}
            updateDisposableItem={updateDisposableItem}
          />
        </Grid>

        {/* Resultados */}
        <Grid item xs={12}>
          <PricingCalculationSummary
            formData={formData}
            result={result}
            errors={errors}
            suggestions={suggestions}
            is_valid={is_valid}
            onSaveQuote={handleSaveQuote}
            isLoading={isLoading}
            showSuccessMessage={showSuccessMessage}
            setShowSuccessMessage={setShowSuccessMessage}
            savedQuoteNumber={savedQuoteNumber}
            savedQuoteId={savedQuoteId}
            isEditMode={isEditMode}
            editingQuoteId={editingQuoteId}
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default PricingCalculator
