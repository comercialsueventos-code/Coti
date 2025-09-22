import React from 'react'
import {
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Divider
} from '@mui/material'
import { BANKS, ACCOUNT_TYPES } from '@/shared/constants'
import { EmployeeBankingInfoProps } from '../types'

const EmployeeBankingInfo: React.FC<EmployeeBankingInfoProps> = ({
  formData,
  onFormDataChange
}) => {
  const handleBankAccountChange = (field: string, value: string) => {
    onFormDataChange('bank_account', {
      ...formData.bank_account,
      [field]: value
    })
  }

  return (
    <>
      <Grid item xs={12}>
        <Divider />
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          🏦 Información Bancaria
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Autocomplete
          options={BANKS}
          value={formData.bank_account.bank}
          onChange={(_, value) => handleBankAccountChange('bank', value || '')}
          renderInput={(params) => (
            <TextField {...params} label="Banco" />
          )}
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth>
          <InputLabel>Tipo de cuenta</InputLabel>
          <Select
            value={formData.bank_account.account_type}
            label="Tipo de cuenta"
            onChange={(e) => handleBankAccountChange('account_type', e.target.value)}
          >
            {ACCOUNT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Número de cuenta"
          value={formData.bank_account.account_number}
          onChange={(e) => handleBankAccountChange('account_number', e.target.value)}
        />
      </Grid>
    </>
  )
}

export default EmployeeBankingInfo