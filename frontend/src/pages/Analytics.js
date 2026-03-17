import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  CurrencyDollarIcon,
  ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';
import ForecastsTab from '../components/analytics/ForecastsTab';
import KPIsTab from '../components/analytics/KPIsTab';
import CostAnalysisTab from '../components/analytics/CostAnalysisTab';
import ProfitabilityTab from '../components/analytics/ProfitabilityTab';
import PageShell from '../components/PageShell';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Analytics() {
  const [selectedTab, setSelectedTab] = useState(0);

  const tabs = [
    { name: 'Forecasts', icon: ArrowTrendingUpIcon, component: ForecastsTab },
    { name: 'KPIs', icon: ChartBarIcon, component: KPIsTab },
    { name: 'Cost Analysis', icon: CurrencyDollarIcon, component: CostAnalysisTab },
    { name: 'Profitability', icon: ClipboardDocumentListIcon, component: ProfitabilityTab }
  ];

  return (
      <PageShell
        title="Analytics & Business Intelligence"
        description="Forecasts, KPI intelligence, cost trends, and profitability insights in one workspace."
        badge="Decision Center"
        stats={[
          { label: 'Modules', value: tabs.length.toString(), helper: 'Forecasts, KPIs, Cost, Profitability' },
          { label: 'Active Tab', value: tabs[selectedTab]?.name || 'Forecasts', helper: 'Switch instantly using the tab row' }
        ]}
      >
        <div>
          <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              {tabs.map((tab) => (
                <Tab
                  key={tab.name}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white text-blue-700 shadow'
                        : 'text-blue-700 hover:bg-white/[0.12] hover:text-blue-800'
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
                    'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2'
                  )}
                >
                  <tab.component />
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </PageShell>
  );
}
