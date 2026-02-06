import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const MobileLayout = ({ children, sidebar }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="overflow-y-auto h-full pb-16">
          {sidebar}
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-0">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 flex items-center h-16 px-4 bg-white border-b lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <h1 className="ml-4 text-lg font-semibold text-gray-900">PM Textiles</h1>
        </div>

        {/* Page Content */}
        <main className="responsive-container py-4 sm:py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MobileLayout;
