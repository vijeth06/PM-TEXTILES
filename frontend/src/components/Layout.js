import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
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
  ClipboardDocumentListIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  CubeIcon as CubeIconSolid,
  PlayIcon as PlayIconSolid,
  ArchiveBoxIcon as ArchiveBoxIconSolid,
  ShoppingCartIcon as ShoppingCartIconSolid,
  UsersIcon as UsersIconSolid,
  TruckIcon as TruckIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  BanknotesIcon as BanknotesIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid
} from '@heroicons/react/24/solid';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, iconSolid: HomeIconSolid },
  { name: 'Production', href: '/production', icon: CubeIcon, iconSolid: CubeIconSolid, permission: 'view_production' },
  { name: 'Production Execution', href: '/production-execution', icon: PlayIcon, iconSolid: PlayIconSolid, permission: 'manage_production' },
  { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon, iconSolid: ArchiveBoxIconSolid, permission: 'view_inventory' },
  { name: 'Orders', href: '/orders', icon: ShoppingCartIcon, iconSolid: ShoppingCartIconSolid, permission: 'view_orders' },
  { name: 'Customers', href: '/customers', icon: UsersIcon, iconSolid: UsersIconSolid, permission: 'view_customers' },
  { name: 'Suppliers', href: '/suppliers', icon: TruckIcon, iconSolid: TruckIconSolid, permission: 'view_suppliers' },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, iconSolid: ChartBarIconSolid, permission: 'view_reports' },
  { name: 'Finance', href: '/finance', icon: BanknotesIcon, iconSolid: BanknotesIconSolid, permission: 'view_reports' },
  { name: 'Audit Trail', href: '/audit', icon: ClipboardDocumentListIcon, iconSolid: ClipboardDocumentListIconSolid, permission: 'system_admin', adminOnly: true },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, iconSolid: Cog6ToothIconSolid },
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavigation = navigation.filter(
    item => {
      if (item.adminOnly && user?.role !== 'admin') return false;
      return !item.permission || hasPermission(item.permission);
    }
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm transition-opacity" onClick={() => setSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 flex flex-col w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between h-16 px-6 bg-blue-600 border-b border-blue-700">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <CubeIcon className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">PM Textiles</h1>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const IconSolid = item.iconSolid;
                const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-200'
                    }`}
                  >
                    {isActive ? (
                      <IconSolid className="mr-3 h-5 w-5" />
                    ) : (
                      <Icon className="mr-3 h-5 w-5" />
                    )}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-3 px-2 py-2">
                <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.fullName?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          <div className="flex items-center h-16 px-6 bg-blue-600 border-b border-blue-700">
            <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center mr-3">
              <CubeIcon className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">PM Textiles ERP</h1>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const IconSolid = item.iconSolid;
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-200'
                  }`}
                >
                  {isActive ? (
                    <IconSolid className="mr-3 h-5 w-5" />
                  ) : (
                    <Icon className="mr-3 h-5 w-5" />
                  )}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                {user?.fullName?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex h-16 bg-white border-b border-gray-200 shadow-sm">
          <button
            className="px-4 text-gray-500 hover:text-gray-700 focus:outline-none lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex items-center justify-between flex-1 px-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="search"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <NotificationBell />
              
              <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                  {user?.fullName?.charAt(0)}
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
