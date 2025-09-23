import React, { useState, useCallback, useEffect } from 'react'
import { TextField, TextFieldProps } from '@mui/material'
import { useDebounce } from '../../../hooks/useDebounce'

interface OptimizedTextInputProps extends Omit<TextFieldProps, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  debounceMs?: number
}

/**
 * Optimized text input that uses local state and debouncing
 * to prevent excessive re-renders during typing
 */
export const OptimizedTextInput: React.FC<OptimizedTextInputProps> = React.memo(({
  value,
  onChange,
  debounceMs = 300,
  ...textFieldProps
}) => {
  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(value)

  // Debounced value for external updates
  const debouncedValue = useDebounce(localValue, debounceMs)

  // Update external state when debounced value changes
  useEffect(() => {
    if (debouncedValue !== value) {
      onChange(debouncedValue)
    }
  }, [debouncedValue, onChange, value])

  // Update local state when external value changes (e.g., form reset)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Handle local input changes
  const handleLocalChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(event.target.value)
  }, [])

  return (
    <TextField
      {...textFieldProps}
      value={localValue}
      onChange={handleLocalChange}
    />
  )
})