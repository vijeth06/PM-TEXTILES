import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import CommandPalette from './CommandPalette';
import {
  HomeIcon,
  CubeIcon,
  PlayIcon,
  ArchiveBoxIcon,
  ShoppingCartIcon,
  UsersIcon,
  TruckIcon,
  ChartBarIcon,
  BanknotesIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  UserGroupIcon,
  MegaphoneIcon,
  BeakerIcon,
  CheckCircleIcon,
  QrCodeIcon,
  ReceiptPercentIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

const navigationSections = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, keywords: ['home', 'overview', 'kpi'] },
      { name: 'Enhanced Dashboard', href: '/dashboard-enhanced', icon: HomeIcon, keywords: ['advanced dashboard', 'enhanced'] },
      { name: 'Classic Dashboard', href: '/dashboard-old', icon: HomeIcon, keywords: ['legacy dashboard', 'classic'] },
      { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, permission: 'view_reports', keywords: ['trends', 'forecast', 'cost'] },
      { name: 'Reports', href: '/reports', icon: ChartBarIcon, permission: 'view_reports', keywords: ['summary', 'exports'] }
    ]
  },
  {
    title: 'Operations',
    items: [
      { name: 'Textile Production', href: '/textile-production', icon: CubeIcon, keywords: ['loom', 'dyeing', 'fabric'] },
      { name: 'Production', href: '/production', icon: CubeIcon, permission: 'view_production', keywords: ['plan', 'batch'] },
      { name: 'Production Execution', href: '/production-execution', icon: PlayIcon, permission: 'manage_production', keywords: ['shopfloor', 'schedule'] },
      { name: 'Recipe / BOM', href: '/recipes', icon: BeakerIcon, permission: 'view_production', keywords: ['formula', 'bom', 'recipe'] },
      { name: 'Quality Checks', href: '/quality-checks', icon: CheckCircleIcon, permission: 'view_production', keywords: ['inspection', 'quality'] },
      { name: 'Barcode / RFID', href: '/barcode', icon: QrCodeIcon, permission: 'view_inventory', keywords: ['scan', 'tracking'] }
    ]
  },
  {
    title: 'Supply Chain',
    items: [
      { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon, permission: 'view_inventory', keywords: ['stock', 'warehouse'] },
      { name: 'Orders', href: '/orders', icon: ShoppingCartIcon, permission: 'view_orders', keywords: ['sales order', 'dispatch'] },
      { name: 'RFQ', href: '/rfq', icon: ClipboardDocumentListIcon, permission: 'view_suppliers', keywords: ['procurement', 'purchase'] },
      { name: 'Suppliers', href: '/suppliers', icon: TruckIcon, permission: 'view_suppliers', keywords: ['vendors'] },
      { name: 'Customers', href: '/customers', icon: UsersIcon, permission: 'view_customers', keywords: ['buyers'] }
    ]
  },
  {
    title: 'Business Ops',
    items: [
      { name: 'Leads / CRM', href: '/leads', icon: MegaphoneIcon, permission: 'view_customers', keywords: ['crm', 'pipeline'] },
      { name: 'Employees', href: '/employees', icon: UserGroupIcon, permission: 'manage_users', keywords: ['hr', 'team'] },
      { name: 'Documents', href: '/documents', icon: DocumentTextIcon, keywords: ['dms', 'files', 'approval'] },
      { name: 'Finance', href: '/finance', icon: BanknotesIcon, permission: 'view_reports', keywords: ['payment', 'cost'] },
      { name: 'Budget', href: '/budgets', icon: ReceiptPercentIcon, permission: 'view_reports', keywords: ['budgeting', 'planning'] },
      { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon, permission: 'view_orders', keywords: ['billing'] }
    ]
  },
  {
    title: 'Admin',
    items: [
      { name: 'Audit Trail', href: '/audit', icon: ClipboardDocumentListIcon, permission: 'system_admin', adminOnly: true, keywords: ['logs', 'compliance'] },
      { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, keywords: ['preferences', 'config'] }
    ]
  }
];

const PRIMARY_NAV_ORDER = ['/dashboard', '/production', '/inventory', '/orders', '/analytics'];

const Layout = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [moduleMenuOpen, setModuleMenuOpen] = useState(false);
  const [appsSearchTerm, setAppsSearchTerm] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  const filteredSections = useMemo(
    () => navigationSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.adminOnly && user?.role !== 'admin') return false;
          return !item.permission || hasPermission(item.permission);
        })
      }))
      .filter((section) => section.items.length > 0),
    [user?.role, hasPermission]
  );

  const quickAccessItems = useMemo(
    () => filteredSections.flatMap((section) => section.items.map((item) => ({ ...item, section: section.title }))),
    [filteredSections]
  );

  const topNavItems = useMemo(() => {
    return PRIMARY_NAV_ORDER
      .map((href) => quickAccessItems.find((item) => item.href === href))
      .filter(Boolean);
  }, [quickAccessItems]);

  const topNavPaths = useMemo(() => new Set(topNavItems.map((item) => item.href)), [topNavItems]);

  const moreSections = useMemo(
    () => filteredSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !topNavPaths.has(item.href))
      }))
      .filter((section) => section.items.length > 0),
    [filteredSections, topNavPaths]
  );

  const appsSearchResults = useMemo(() => {
    const term = appsSearchTerm.trim().toLowerCase();
    if (!term) return quickAccessItems.slice(0, 8);
    return quickAccessItems
      .filter((item) =>
        item.name.toLowerCase().includes(term) ||
        (item.keywords || []).some((keyword) => keyword.toLowerCase().includes(term))
      )
      .slice(0, 8);
  }, [quickAccessItems, appsSearchTerm]);

  const isActiveRoute = (href) => location.pathname === href || location.pathname.startsWith(href + '/');

  const handleQuickNavigate = (href) => {
    navigate(href);
    setAppsSearchTerm('');
    setMobileNavOpen(false);
    setModuleMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      const isK = event.key.toLowerCase() === 'k';
      if ((event.ctrlKey || event.metaKey) && isK) {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    setModuleMenuOpen(false);
    setAppsSearchTerm('');
  }, [location.pathname]);

  return (
    <div className="min-h-screen app-surface">
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-80 bg-white shadow-2xl">
            <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200">
              <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Modules</h2>
              <button onClick={() => setMobileNavOpen(false)} className="text-slate-500 hover:text-slate-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto h-[calc(100%-64px)]">
              {filteredSections.map((section) => (
                <div key={section.title} className="rounded-lg border border-slate-200 bg-slate-50/80">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    <span>{section.title}</span>
                    {expandedSections[section.title] ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                  </button>
                  {expandedSections[section.title] && (
                    <div className="space-y-1 px-2 pb-2">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActiveRoute(item.href);
                        return (
                          <Link
                            key={item.href}
                            to={item.href}
                            onClick={() => setMobileNavOpen(false)}
                            className={`group flex items-center px-2.5 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-white'}`}
                          >
                            <Icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col min-h-screen relative">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="h-16 max-w-7xl mx-auto w-full px-4 sm:px-6 flex items-center gap-3 relative">
          <button
            className="lg:hidden text-slate-600 hover:text-blue-700"
            onClick={() => setMobileNavOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <button
            onClick={() => handleQuickNavigate('/dashboard')}
            className="inline-flex items-center rounded-xl bg-blue-700 text-white px-3 py-1.5 text-sm font-bold tracking-tight whitespace-nowrap"
          >
            PM Textiles ERP
          </button>

          <nav className="hidden lg:flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1">
            {topNavItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <button
                  key={item.href}
                  onClick={() => handleQuickNavigate(item.href)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
                >
                  {item.name}
                </button>
              );
            })}
          </nav>

          <div className="flex-1" />

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModuleMenuOpen((prev) => !prev)}
              className="hidden lg:inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <Squares2X2Icon className="h-4 w-4 mr-1.5" />
              Apps
              <ChevronDownIcon className="h-4 w-4 ml-1" />
            </button>
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden md:inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <CommandLineIcon className="h-4 w-4 mr-1.5" />
              Ctrl/Cmd+K
            </button>
            <NotificationBell />
            <button
              onClick={handleLogout}
              className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:text-red-600 hover:bg-red-50"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
          </div>

          {moduleMenuOpen && (
            <div className="hidden lg:block absolute right-4 sm:right-6 top-16 w-[24rem]">
              <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-900">Apps</h2>
                  <button onClick={() => setModuleMenuOpen(false)} className="text-slate-500 hover:text-slate-700">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
                <div className="relative mb-3">
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    value={appsSearchTerm}
                    onChange={(e) => setAppsSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && appsSearchResults[0]) {
                        handleQuickNavigate(appsSearchResults[0].href);
                      }
                    }}
                    placeholder="Find app..."
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {appsSearchTerm.trim() ? (
                  <div className="max-h-[55vh] overflow-y-auto space-y-1">
                    {appsSearchResults.length > 0 ? (
                      appsSearchResults.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActiveRoute(item.href);
                        return (
                          <button
                            key={item.href}
                            onClick={() => handleQuickNavigate(item.href)}
                            className={`w-full text-left group flex items-center px-2.5 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'}`}
                          >
                            <Icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </button>
                        );
                      })
                    ) : (
                      <p className="px-2 py-3 text-sm text-slate-500">No matching apps</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                  {moreSections.map((section) => (
                    <div key={section.title} className="rounded-lg border border-slate-200 bg-slate-50/80">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.title)}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        <span>{section.title}</span>
                        {expandedSections[section.title] ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
                      </button>
                      {expandedSections[section.title] && (
                        <div className="space-y-1 px-2 pb-2">
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = isActiveRoute(item.href);
                            return (
                              <button
                                key={item.href}
                                onClick={() => handleQuickNavigate(item.href)}
                                className={`w-full text-left group flex items-center px-2.5 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-white'}`}
                              >
                                <Icon className="mr-3 h-5 w-5" />
                                {item.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette
        open={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        items={quickAccessItems}
        onSelect={(item) => {
          handleQuickNavigate(item.href);
          setIsCommandPaletteOpen(false);
        }}
      />
    </div>
  );
};

export default Layout;
