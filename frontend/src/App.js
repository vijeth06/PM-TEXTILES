import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import Login from './pages/Login';
import DashboardNew from './pages/DashboardNew';
import EnhancedDashboard from './pages/EnhancedDashboard';
import Production from './pages/Production';
import ProductionExecution from './pages/ProductionExecution';
import Inventory from './pages/Inventory';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import ReportsNew from './pages/ReportsNew';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import AuditTrail from './pages/AuditTrail';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<EnhancedDashboard />} />
              <Route path="/dashboard-old" element={<DashboardNew />} />
              <Route path="/production/*" element={<Production />} />
              <Route path="/production-execution/*" element={<ProductionExecution />} />
              <Route path="/inventory/*" element={<Inventory />} />
              <Route path="/orders/*" element={<Orders />} />
              <Route path="/customers/*" element={<Customers />} />
              <Route path="/suppliers/*" element={<Suppliers />} />
              <Route path="/reports/*" element={<ReportsNew />} />
              <Route path="/finance/*" element={<Finance />} />
              <Route path="/settings/*" element={<Settings />} />
              <Route path="/audit/*" element={<AuditTrail />} />
            </Route>
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
