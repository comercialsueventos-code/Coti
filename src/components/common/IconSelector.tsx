import React, { useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material'
import {
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material'

interface IconSelectorProps {
  value?: string
  onChange: (icon: string) => void
  placeholder?: string
  label?: string
  helperText?: string
  required?: boolean
}

// Categorías de iconos comunes para negocios de eventos
const iconCategories = {
  bebidas: {
    label: 'Bebidas',
    icons: ['🥤', '🧃', '☕', '🍵', '🧊', '🍺', '🍷', '🥂', '🍸', '🍹', '🍻', '🥃', '🧋', '🥛', '💧']
  },
  comida: {
    label: 'Comida',
    icons: ['🍽️', '🍕', '🍔', '🌮', '🌯', '🥙', '🥪', '🌭', '🍖', '🍗', '🥩', '🍱', '🍜', '🍝', '🥘', '🍲', '🥗', '🍤', '🍳']
  },
  postres: {
    label: 'Postres y Dulces',
    icons: ['🧇', '🎂', '🍰', '🧁', '🍪', '🍫', '🍬', '🍭', '🍩', '🍮', '🍯', '🥧', '🍨', '🍦', '🍡']
  },
  snacks: {
    label: 'Snacks',
    icons: ['🍿', '🥨', '🥯', '🥖', '🍞', '🥐', '🧀', '🥜', '🌰', '🥔', '🍟', '🥙']
  },
  frutas: {
    label: 'Frutas',
    icons: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅']
  },
  equipos: {
    label: 'Equipos y Mobiliario',
    icons: ['🔧', '⚙️', '🪑', '🪗', '🎪', '🎭', '🎨', '🎵', '🎤', '🎧', '📻', '📺', '💡', '🕯️', '🔥']
  },
  eventos: {
    label: 'Eventos y Celebraciones',
    icons: ['🎈', '🎉', '🎊', '🎀', '🎁', '🎂', '🕯️', '🎪', '🎭', '🎨', '🎵', '🎶', '🎸', '🥁', '🎷']
  },
  transporte: {
    label: 'Transporte y Logística',
    icons: ['🚐', '🚚', '🚛', '🚗', '🚙', '🏍️', '🚴', '📦', '📋', '📝', '⏰', '📍', '🗺️']
  },
  general: {
    label: 'General',
    icons: ['📦', '⭐', '✨', '💫', '🌟', '🔖', '🏷️', '📌', '📍', '🎯', '💎', '🔥', '⚡', '🌈', '☀️']
  }
}

const IconSelector: React.FC<IconSelectorProps> = ({
  value = '',
  onChange,
  placeholder = 'Seleccionar icono',
  label = 'Icono',
  helperText,
  required = false
}) => {
  const [open, setOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const categories = Object.keys(iconCategories)
  const currentCategory = categories[selectedTab]
  
  // Filtrar iconos por búsqueda
  const filteredIcons = searchTerm
    ? Object.values(iconCategories)
        .flatMap(cat => cat.icons)
        .filter(icon => icon.includes(searchTerm))
    : iconCategories[currentCategory as keyof typeof iconCategories]?.icons || []

  const handleIconSelect = (icon: string) => {
    onChange(icon)
    setOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onChange('')
  }

  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>
      
      <Box display="flex" alignItems="center" gap={1}>
        <Button
          variant="outlined"
          onClick={() => setOpen(true)}
          sx={{ 
            minWidth: 120, 
            height: 56,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          {value ? (
            <>
              <Typography variant="h5">{value}</Typography>
              <Typography variant="body2">Cambiar</Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {placeholder}
            </Typography>
          )}
        </Button>
        
        {value && (
          <IconButton onClick={handleClear} size="small" title="Quitar icono">
            <ClearIcon />
          </IconButton>
        )}
      </Box>

      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {helperText}
        </Typography>
      )}

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '70vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Seleccionar Icono</Typography>
            {value && (
              <Chip 
                label={`Actual: ${value}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Buscar emoji..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              size="small"
            />
          </Box>

          {!searchTerm && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs 
                value={selectedTab} 
                onChange={(_, newValue) => setSelectedTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {categories.map((category) => (
                  <Tab 
                    key={category}
                    label={iconCategories[category as keyof typeof iconCategories].label}
                  />
                ))}
              </Tabs>
            </Box>
          )}

          <Grid container spacing={1} sx={{ maxHeight: '400px', overflow: 'auto' }}>
            {filteredIcons.map((icon, index) => (
              <Grid item key={`${icon}-${index}`}>
                <IconButton
                  onClick={() => handleIconSelect(icon)}
                  sx={{
                    fontSize: '2rem',
                    width: 60,
                    height: 60,
                    border: value === icon ? '2px solid' : '1px solid transparent',
                    borderColor: value === icon ? 'primary.main' : 'transparent',
                    backgroundColor: value === icon ? 'primary.50' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderColor: 'primary.main'
                    }
                  }}
                  title={`Seleccionar ${icon}`}
                >
                  {icon}
                </IconButton>
              </Grid>
            ))}
          </Grid>

          {filteredIcons.length === 0 && searchTerm && (
            <Box 
              display="flex" 
              justifyContent="center" 
              alignItems="center" 
              minHeight="200px"
            >
              <Typography color="text.secondary">
                No se encontraron iconos para "{searchTerm}"
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          {value && (
            <Button onClick={handleClear} color="secondary">
              Quitar Icono
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default IconSelector