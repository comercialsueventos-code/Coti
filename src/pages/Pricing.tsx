import React from 'react'
import { Box, Container } from '@mui/material'
import PricingCalculator from '../components/pricing/PricingCalculator'

const Pricing: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <PricingCalculator />
      </Box>
    </Container>
  )
}

export default Pricing