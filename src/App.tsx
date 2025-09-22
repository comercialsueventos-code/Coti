import { Routes, Route } from 'react-router-dom'
import { CssBaseline } from '@mui/material'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import Employees from './pages/Employees'
import Products from './pages/Products'
import Machinery from './pages/Machinery'
import Suppliers from './pages/Suppliers'
import Quotes from './pages/Quotes'
import Pricing from './pages/Pricing'
import Scheduling from './pages/Scheduling'
import QuoteApprovals from './pages/QuoteApprovals'
import TransportZones from './pages/TransportZones'
import DisposableItems from './pages/DisposableItems'
import Settings from './pages/Settings'

function App() {
  return (
    <>
      <CssBaseline />
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/products" element={<Products />} />
          <Route path="/machinery" element={<Machinery />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/scheduling" element={<Scheduling />} />
          <Route path="/approvals" element={<QuoteApprovals />} />
          <Route path="/transport" element={<TransportZones />} />
          <Route path="/disposables" element={<DisposableItems />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppLayout>
    </>
  )
}

export default App