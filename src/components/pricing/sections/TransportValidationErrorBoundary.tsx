/**
 * Error Boundary for Transport Manual Validation Failures
 * TMD-CONSOLIDATED story - QA testing requirement
 * 
 * Handles errors that occur during transport manual distribution validation
 */

import React, { Component, ReactNode } from 'react'
import { Alert, AlertTitle, Box, Button, Typography, Divider } from '@mui/material'
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorId: string
}

interface TransportValidationError extends Error {
  code?: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
  context?: {
    transportCount?: number
    totalAllocated?: number
    productIds?: number[]
    zone?: any
  }
}

class TransportValidationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `transport-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error for debugging (in development only)
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Transport Validation Error Boundary')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }

    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
    // In a real application, this would send to a monitoring service like Sentry
    try {
      const errorReport = {
        id: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        feature: 'transport-manual-distribution'
      }

      // Simulate error reporting (replace with actual service)
      // Example: Sentry.captureException(error, { extra: errorReport })
      console.warn('Error report would be sent:', errorReport)
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })

    // Call optional reset callback
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const transportError = error as TransportValidationError
    
    if (transportError.severity) {
      return transportError.severity
    }

    // Determine severity based on error characteristics
    if (error.message.includes('CRITICAL') || error.message.includes('Fatal')) {
      return 'critical'
    }
    
    if (error.message.includes('validation') || error.message.includes('allocation')) {
      return 'medium'
    }
    
    if (error.message.includes('warning') || error.message.includes('minor')) {
      return 'low'
    }

    return 'high' // Default to high for unknown errors
  }

  private getErrorTitle = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return 'Error Crítico en Validación de Transporte'
      case 'high':
        return 'Error en Validación de Transporte'
      case 'medium':
        return 'Problema de Validación de Transporte'
      case 'low':
        return 'Advertencia de Transporte'
      default:
        return 'Error de Transporte'
    }
  }

  private getErrorActions = (severity: string): ReactNode => {
    const baseActions = (
      <Button
        variant="outlined"
        startIcon={<RefreshIcon />}
        onClick={this.handleReset}
        size="small"
      >
        Intentar de Nuevo
      </Button>
    )

    if (severity === 'critical') {
      return (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {baseActions}
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={() => window.location.reload()}
          >
            Recargar Página
          </Button>
        </Box>
      )
    }

    return baseActions
  }

  private renderErrorDetails = (): ReactNode => {
    const { error } = this.state
    if (!error) return null

    const transportError = error as TransportValidationError
    const context = transportError.context

    if (!context) return null

    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="subtitle2" gutterBottom>
          Detalles del Error:
        </Typography>
        
        {context.transportCount !== undefined && (
          <Typography variant="body2">
            • Cantidad de transportes: {context.transportCount}
          </Typography>
        )}
        
        {context.totalAllocated !== undefined && (
          <Typography variant="body2">
            • Total asignado: {context.totalAllocated}
          </Typography>
        )}
        
        {context.productIds && context.productIds.length > 0 && (
          <Typography variant="body2">
            • Productos afectados: {context.productIds.length} productos
          </Typography>
        )}
        
        {context.zone && (
          <Typography variant="body2">
            • Zona de transporte: {context.zone.name || 'Zona sin nombre'}
          </Typography>
        )}
      </Box>
    )
  }

  render() {
    const { hasError, error, errorId } = this.state
    const { children, fallback } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      const severity = this.getErrorSeverity(error)
      const title = this.getErrorTitle(severity)
      const actions = this.getErrorActions(severity)

      const alertSeverity = severity === 'critical' ? 'error' 
        : severity === 'high' ? 'error'
        : severity === 'medium' ? 'warning'
        : 'info'

      return (
        <Box sx={{ p: 3 }}>
          <Alert 
            severity={alertSeverity} 
            icon={<ErrorIcon />}
            action={actions}
          >
            <AlertTitle>{title}</AlertTitle>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              Ha ocurrido un error durante la validación de la distribución manual de transportes.
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Error:</strong> {error.message}
            </Typography>

            {this.renderErrorDetails()}

            <Divider sx={{ my: 2 }} />
            
            <Typography variant="caption" color="text.secondary">
              ID del Error: {errorId}
            </Typography>
            
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                  Detalles Técnicos (Solo Desarrollo)
                </summary>
                <pre style={{ 
                  fontSize: '0.75rem', 
                  background: '#f5f5f5', 
                  padding: '8px', 
                  marginTop: '8px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {error.stack}
                </pre>
              </details>
            )}
          </Alert>
        </Box>
      )
    }

    return children
  }
}

export default TransportValidationErrorBoundary

// Higher-order component for easy wrapping
export const withTransportValidationErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) => {
  const WithErrorBoundary = (props: P) => (
    <TransportValidationErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </TransportValidationErrorBoundary>
  )

  WithErrorBoundary.displayName = `withTransportValidationErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`

  return WithErrorBoundary
}

// Custom hook for throwing transport validation errors
export const useTransportValidationError = () => {
  const throwTransportError = (
    message: string, 
    options?: {
      code?: string
      severity?: 'low' | 'medium' | 'high' | 'critical'
      context?: TransportValidationError['context']
    }
  ) => {
    const error = new Error(message) as TransportValidationError
    error.name = 'TransportValidationError'
    
    if (options) {
      error.code = options.code
      error.severity = options.severity
      error.context = options.context
    }
    
    throw error
  }

  return { throwTransportError }
}