import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { getDefaultRouteForRole } from './utils/roleRouting';

// Components
import LayoutV2 from './components/LayoutV2';
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

const RoleHomeRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getDefaultRouteForRole(user?.role)} replace />;
};

function App() {
  const protectedRoutes = [
    { path: '/', element: <RoleHomeRedirect /> },
    { path: '/dashboard', element: <RoleBasedDashboard /> },
    { path: '/dashboard-enhanced', element: <EnhancedDashboard /> },
    { path: '/dashboard-old', element: <DashboardNew /> },
    { path: '/production/*', element: <Production /> },
    { path: '/production-execution/*', element: <ProductionExecution /> },
    { path: '/textile-production/*', element: <TextileProduction /> },
    { path: '/inventory/*', element: <Inventory /> },
    { path: '/orders/*', element: <Orders /> },
    { path: '/customers/*', element: <Customers /> },
    { path: '/suppliers/*', element: <Suppliers /> },
    { path: '/reports/*', element: <ReportsNew /> },
    { path: '/finance/*', element: <Finance /> },
    { path: '/settings/*', element: <Settings /> },
    { path: '/audit/*', element: <AuditTrail /> },
    { path: '/analytics/*', element: <Analytics /> },
    { path: '/leads/*', element: <LeadsManagement /> },
    { path: '/employees/*', element: <EmployeeManagement /> },
    { path: '/documents/*', element: <DocumentManagement /> },
    { path: '/budgets/*', element: <BudgetManagement /> },
    { path: '/invoices/*', element: <InvoiceManagement /> },
    { path: '/rfq/*', element: <RFQManagement /> },
    { path: '/recipes/*', element: <RecipeBOM /> },
    { path: '/quality-checks/*', element: <QualityChecks /> },
    { path: '/barcode/*', element: <BarcodeRFID /> },
    // Friendly aliases for direct access and old bookmarks.
    { path: '/document-management', element: <Navigate to="/documents" replace /> },
    { path: '/employee-management', element: <Navigate to="/employees" replace /> },
    { path: '/lead-management', element: <Navigate to="/leads" replace /> },
    { path: '/budget', element: <Navigate to="/budgets" replace /> },
    { path: '/barcode-rfid', element: <Navigate to="/barcode" replace /> },
    { path: '/audit-trail', element: <Navigate to="/audit" replace /> },
    { path: '*', element: <Navigate to="/dashboard" replace /> }
  ];

  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Toaster position="top-right" />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route element={<PrivateRoute><LayoutV2 /></PrivateRoute>}>
                {protectedRoutes.map((route) => (
                  <Route key={route.path} path={route.path} element={route.element} />
                ))}
              </Route>
            </Routes>
          </Suspense>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
