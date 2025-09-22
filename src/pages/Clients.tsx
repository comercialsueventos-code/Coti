import React from 'react'
import { Box, Container } from '@mui/material'
import ClientList from '../components/clients/ClientList'

const Clients: React.FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <ClientList />
      </Box>
    </Container>
  )
}

export default Clients