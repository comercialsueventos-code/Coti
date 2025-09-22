import React from 'react'
import {
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Avatar,
  Box,
  Rating
} from '@mui/material'
import { Star as StarIcon } from '@mui/icons-material'
import { useSuppliersUtils } from '../../../hooks/useSuppliers'
import { SuppliersTabProps } from '../types'

const SuppliersTopRated: React.FC<SuppliersTabProps> = ({
  topRated = [],
  onRateSupplier
}) => {
  const {
    getTypeDisplayName,
    getRatingText,
    calculateOverallScore
  } = useSuppliersUtils()

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            🏆 Proveedores Mejor Calificados
          </Typography>
          <List>
            {topRated.map((supplier, index) => {
              const overallScore = calculateOverallScore(supplier)
              return (
                <ListItem key={supplier.id}>
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: 'gold', color: 'black', width: 32, height: 32 }}>
                      {index + 1}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={supplier.name}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          {getTypeDisplayName(supplier.type)}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Rating value={overallScore} precision={0.1} size="small" readOnly />
                          <Typography variant="caption">
                            {overallScore.toFixed(1)} ({getRatingText(overallScore)})
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      startIcon={<StarIcon />}
                      onClick={() => onRateSupplier(supplier)}
                    >
                      Calificar
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              )
            })}
            {topRated.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No hay proveedores calificados"
                  secondary="Agrega calificaciones a los proveedores para ver el ranking"
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default SuppliersTopRated