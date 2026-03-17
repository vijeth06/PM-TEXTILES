import React, { useEffect, useMemo, useRef, useState } from 'react';
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
      { name: 'Reports', href: '/reports', icon: ChartBarIcon, permission: 'view_reports', keywords: ['summary', 'exports'] }
    ]
  },
  {
    title: 'Operations',
    items: [
      { name: 'Textile Production', href: '/textile-production', icon: CubeIcon, keywords: ['loom', 'dyeing', 'fabric'] },
      { name: 'Production', href: '/production', icon: CubeIcon, permission: 'view_production', keywords: ['plan', 'batch'] },
      { name: 'Production Execution', href: '/production-execution', icon: PlayIcon, permission: 'manage_production', keywords: ['shopfloor', 'schedule'] },
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

const PRIMARY_NAV_ORDER = ['/dashboard', '/production', '/inventory', '/orders', '/reports'];

const LayoutV2 = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [appsMenuOpen, setAppsMenuOpen] = useState(false);
  const [appsSearchTerm, setAppsSearchTerm] = useState('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();
  const appsMenuRef = useRef(null);

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

  const topNavItems = useMemo(
    () => PRIMARY_NAV_ORDER.map((href) => quickAccessItems.find((item) => item.href === href)).filter(Boolean),
    [quickAccessItems]
  );

  const topNavPaths = useMemo(() => new Set(topNavItems.map((item) => item.href)), [topNavItems]);

  const appsSections = useMemo(
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
    if (!term) return quickAccessItems.slice(0, 10);
    return quickAccessItems
      .filter((item) =>
        item.name.toLowerCase().includes(term) ||
        (item.keywords || []).some((keyword) => keyword.toLowerCase().includes(term))
      )
      .slice(0, 10);
  }, [quickAccessItems, appsSearchTerm]);

  const activeItem = useMemo(
    () => quickAccessItems.find((item) => location.pathname === item.href || location.pathname.startsWith(item.href + '/')),
    [quickAccessItems, location.pathname]
  );

  const isActiveRoute = (href) => location.pathname === href || location.pathname.startsWith(href + '/');

  const handleNavigate = (href) => {
    navigate(href);
    setMobileNavOpen(false);
    setAppsMenuOpen(false);
    setAppsSearchTerm('');
  };

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const activeSection = filteredSections.find((section) =>
      section.items.some((item) => item.href === activeItem?.href)
    )?.title;

    if (!activeSection) return;
    setExpandedSections((prev) => (prev[activeSection] ? prev : { ...prev, [activeSection]: true }));
  }, [activeItem?.href, filteredSections]);

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      const isK = String(event?.key || '').toLowerCase() === 'k';
      if ((event.ctrlKey || event.metaKey) && isK) {
        event.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!appsMenuRef.current) return;
      if (!appsMenuRef.current.contains(event.target)) {
        setAppsMenuOpen(false);
      }
    };

    if (appsMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [appsMenuOpen]);

  useEffect(() => {
    setAppsMenuOpen(false);
    setAppsSearchTerm('');
  }, [location.pathname]);

  return (
    <div className="min-h-screen app-surface bg-[radial-gradient(900px_380px_at_50%_-220px,rgba(37,99,235,0.16),transparent_70%)]">
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-900/55"
            aria-label="Close mobile menu"
            onClick={() => setMobileNavOpen(false)}
          ></button>

          <aside className="absolute inset-y-0 left-0 w-80 bg-white shadow-2xl border-r border-slate-200">
            <div className="h-16 px-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-100 flex items-center justify-between">
              <div className="leading-tight text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-800">PM Textiles</p>
                <p className="text-sm font-extrabold text-slate-900">All Apps</p>
              </div>
              <button className="text-slate-500 hover:text-slate-700" onClick={() => setMobileNavOpen(false)}>
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-3 space-y-3 overflow-y-auto h-[calc(100%-64px)]">
              {filteredSections.map((section) => (
                <div key={section.title} className="rounded-xl border border-slate-200 bg-slate-50/85 shadow-sm">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-800"
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
                            className={`group flex items-center px-2.5 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-white'}`}
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
          </aside>
        </div>
      )}

      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl shadow-[0_10px_30px_-26px_rgba(15,23,42,0.4)]">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-blue-700"></div>
          <div className="pointer-events-none absolute inset-y-0 right-4 hidden lg:flex items-center">
            <span className="select-none text-[44px] font-black tracking-[0.22em] text-slate-900/[0.05]">PMT</span>
          </div>
          <div className="w-full h-16 px-3 sm:px-4 lg:px-6 xl:px-8 relative grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button className="lg:hidden text-slate-600 hover:text-blue-700" onClick={() => setMobileNavOpen(true)}>
                <Bars3Icon className="h-6 w-6" />
              </button>

              <button
                onClick={() => handleNavigate('/dashboard')}
                className="group inline-flex items-center rounded-xl border border-blue-950/20 bg-gradient-to-r from-[#0b1f5e] via-[#123a9a] to-[#2563eb] text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-[0_14px_28px_-16px_rgba(30,64,175,0.9)] whitespace-nowrap transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_18px_30px_-14px_rgba(30,64,175,0.95)]"
              >
                <span className="mr-1.5 sm:mr-2 inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg border border-white/30 bg-white/15 overflow-hidden">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" aria-hidden="true">
                    <rect x="4.5" y="4.5" width="15" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.6" opacity="0.95" />
                    <path d="M8 6.2V17.8M12 6.2V17.8M16 6.2V17.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
                    <path d="M6.2 8H17.8M6.2 12H17.8M6.2 16H17.8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.75" />
                    <path d="M7 14.6L17 10.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />
                    <circle cx="17.8" cy="9.8" r="1.3" fill="currentColor" opacity="0.9" />
                  </svg>
                </span>
                <span className="leading-tight text-left">
                  <span className="block text-[11px] sm:text-[13px] font-black tracking-[0.08em] uppercase">PM Textiles Group</span>
                  <span className="hidden sm:block text-[10px] font-semibold tracking-[0.13em] uppercase text-blue-100">Enterprise Textile ERP</span>
                </span>
              </button>
            </div>

            <div className="hidden xl:flex items-center justify-center">
              <nav className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                {topNavItems.map((item) => {
                  const isActive = isActiveRoute(item.href);
                  return (
                    <button
                      key={item.href}
                      onClick={() => handleNavigate(item.href)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-blue-700 text-white shadow-[inset_0_-1px_0_rgba(255,255,255,0.28)]' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 justify-self-end" ref={appsMenuRef}>
              <button
                onClick={() => setAppsMenuOpen((prev) => !prev)}
                className="hidden md:inline-flex items-center rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-800 shadow-sm transition-colors"
              >
                <Squares2X2Icon className="h-4 w-4 mr-1.5" />
                Apps
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              </button>

              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden xl:inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-800 shadow-sm transition-colors"
              >
                <CommandLineIcon className="h-4 w-4 mr-1.5" />
                Ctrl/Cmd+K
              </button>

              <div className="hidden sm:block">
                <NotificationBell />
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center rounded-lg px-2.5 sm:px-3 py-2 text-sm font-medium text-slate-700 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>

              {appsMenuOpen && (
                <div className="hidden md:block absolute top-[4.25rem] right-0 w-[22rem] sm:w-[25rem] rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_24px_60px_-22px_rgba(15,23,42,0.45)] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">Apps</h2>
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">PM Textiles Workspace</p>
                    </div>
                    <button onClick={() => setAppsMenuOpen(false)} className="text-slate-500 hover:text-slate-700">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="relative mb-3">
                    <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="search"
                      value={appsSearchTerm}
                      onChange={(e) => setAppsSearchTerm(e.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && appsSearchResults[0]) {
                          handleNavigate(appsSearchResults[0].href);
                        }
                      }}
                      placeholder="Find app..."
                      className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              onClick={() => handleNavigate(item.href)}
                              className={`w-full text-left group flex items-center px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-slate-100'}`}
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
                      {appsSections.map((section) => (
                        <div key={section.title} className="rounded-xl border border-slate-200 bg-slate-50/80">
                          <button
                            type="button"
                            onClick={() => toggleSection(section.title)}
                            className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-800"
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
                                    onClick={() => handleNavigate(item.href)}
                                    className={`w-full text-left group flex items-center px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-900' : 'text-slate-700 hover:bg-white'}`}
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
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette
        open={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        items={quickAccessItems}
        onSelect={(item) => {
          handleNavigate(item.href);
          setIsCommandPaletteOpen(false);
        }}
      />
    </div>
  );
};

export default LayoutV2;
