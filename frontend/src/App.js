import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

// Eager-loaded critical pages
import Login from './pages/Login';

// Lazy-loaded pages for code splitting
const DashboardNew = lazy(() => import('./pages/DashboardNew'));
const EnhancedDashboard = lazy(() => import('./pages/EnhancedDashboard'));
const Production = lazy(() => import('./pages/Production'));
const ProductionExecution = lazy(() => import('./pages/ProductionExecution'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Orders = lazy(() => import('./pages/Orders'));
const Customers = lazy(() => import('./pages/Customers'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const ReportsNew = lazy(() => import('./pages/ReportsNew'));
const Finance = lazy(() => import('./pages/Finance'));
const Settings = lazy(() => import('./pages/Settings'));
const AuditTrail = lazy(() => import('./pages/AuditTrail'));
const Analytics = lazy(() => import('./pages/Analytics'));
const LeadsManagement = lazy(() => import('./pages/LeadsManagement'));
const EmployeeManagement = lazy(() => import('./pages/EmployeeManagement'));
const DocumentManagement = lazy(() => import('./pages/DocumentManagement'));
const TextileProduction = lazy(() => import('./pages/TextileProduction'));
const RoleBasedDashboard = lazy(() => import('./pages/RoleBasedDashboard'));
const BudgetManagement = lazy(() => import('./pages/BudgetManagement'));
const InvoiceManagement = lazy(() => import('./pages/InvoiceManagement'));
const RFQManagement = lazy(() => import('./pages/RFQManagement'));
const RecipeBOM = lazy(() => import('./pages/RecipeBOM'));
const QualityChecks = lazy(() => import('./pages/QualityChecks'));
const BarcodeRFID = lazy(() => import('./pages/BarcodeRFID'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Toaster position="top-right" />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<RoleBasedDashboard />} />
                <Route path="/dashboard-enhanced" element={<EnhancedDashboard />} />
                <Route path="/dashboard-old" element={<DashboardNew />} />
                <Route path="/production/*" element={<Production />} />
                <Route path="/production-execution/*" element={<ProductionExecution />} />
                <Route path="/textile-production/*" element={<TextileProduction />} />
                <Route path="/inventory/*" element={<Inventory />} />
                <Route path="/orders/*" element={<Orders />} />
                <Route path="/customers/*" element={<Customers />} />
                <Route path="/suppliers/*" element={<Suppliers />} />
                <Route path="/reports/*" element={<ReportsNew />} />
                <Route path="/finance/*" element={<Finance />} />
                <Route path="/settings/*" element={<Settings />} />
                <Route path="/audit/*" element={<AuditTrail />} />
                <Route path="/analytics/*" element={<Analytics />} />
                <Route path="/leads/*" element={<LeadsManagement />} />
                <Route path="/employees/*" element={<EmployeeManagement />} />
                <Route path="/documents/*" element={<DocumentManagement />} />
                <Route path="/budgets/*" element={<BudgetManagement />} />
                <Route path="/invoices/*" element={<InvoiceManagement />} />
                <Route path="/rfq/*" element={<RFQManagement />} />
                <Route path="/recipes/*" element={<RecipeBOM />} />
                <Route path="/quality-checks/*" element={<QualityChecks />} />
                <Route path="/barcode/*" element={<BarcodeRFID />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
