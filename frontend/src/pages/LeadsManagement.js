import React, { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { 
  UserGroupIcon, 
  DocumentTextIcon,
  FunnelIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout';
import LeadsListTab from '../components/leads/LeadsListTab';
import QuotationsTab from '../components/leads/QuotationsTab';
import LeadFunnelTab from '../components/leads/LeadFunnelTab';
import LeadStatsTab from '../components/leads/LeadStatsTab';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function LeadsManagement() {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { name: 'Leads', icon: UserGroupIcon, component: LeadsListTab },
    { name: 'Quotations', icon: DocumentTextIcon, component: QuotationsTab },
    { name: 'Sales Funnel', icon: FunnelIcon, component: LeadFunnelTab },
    { name: 'Statistics', icon: ChartBarIcon, component: LeadStatsTab }
  ];

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-semibold text-gray-900">CRM & Lead Management</h1>
            <p className="mt-2 text-sm text-gray-700">
              Track leads from capture to conversion with quotations and sales pipeline management.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex space-x-1 rounded-xl bg-green-900/20 p-1">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-green-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white text-green-700 shadow'
                        : 'text-green-700 hover:bg-white/[0.12] hover:text-green-800'
                    )
                  }
                >
                  <div className="flex items-center justify-center space-x-2">
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </div>
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-6">
              {tabs.map((tab, idx) => (
                <Tab.Panel
                  key={idx}
                  className={classNames(
                    'rounded-xl bg-white p-6',
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-green-400 focus:outline-none focus:ring-2'
                  )}
                >
                  <tab.component />
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </Layout>
  );
}
