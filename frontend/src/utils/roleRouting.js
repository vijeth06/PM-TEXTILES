export const getDefaultRouteForRole = (role) => {
  const routeMap = {
    production_manager: '/production',
    qa_inspector: '/quality-checks',
    store_manager: '/inventory',
    sales_manager: '/orders',
    accountant: '/finance',
    procurement_manager: '/rfq',
    hr_manager: '/employees',
    admin: '/dashboard',
    management: '/dashboard'
  };

  return routeMap[role] || '/dashboard';
};
