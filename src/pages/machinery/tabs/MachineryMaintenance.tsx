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
  Button
} from '@mui/material'
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Build as BuildIcon
} from '@mui/icons-material'
import { useMachineryUtils } from '../../../hooks/useMachinery'
import { MachineryTabProps } from '../types'

const MachineryMaintenance: React.FC<MachineryTabProps> = ({
  maintenanceNeeded = [],
  onScheduleMaintenance
}) => {
  const { getMaintenanceStatusMessage } = useMachineryUtils()

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Mantenimiento Pendiente
          </Typography>
          <List>
            {maintenanceNeeded.map((machine) => (
              <ListItem key={machine.id}>
                <ListItemIcon>
                  <WarningIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary={machine.name}
                  secondary={getMaintenanceStatusMessage(machine)}
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    startIcon={<BuildIcon />}
                    onClick={() => onScheduleMaintenance(machine)}
                  >
                    Programar
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {maintenanceNeeded.length === 0 && (
              <ListItem>
                <ListItemIcon>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Sin mantenimientos pendientes"
                  secondary="Toda la maquinaria está al día"
                />
              </ListItem>
            )}
          </List>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default MachineryMaintenance