'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { 
  Globe, 
  Calendar, 
  // Clock3, // Commented out
  Ticket, 
  CreditCard, 
  Database, 
  Shield,
  Settings as SettingsIcon
} from 'lucide-react';
import EventDaysTab from '@/components/admin/settings/tabs/EventDaysTab';
import TicketPricesTab from '@/components/admin/settings/tabs/TicketPricesTab';
import PaymentMethodsTab from '@/components/admin/settings/tabs/PaymentMethodsTab';
import BackupTab from '@/components/admin/settings/tabs/BackupTab';
import GeneralSettingsTab from '@/components/admin/settings/tabs/GeneralSettingsTab';

// Remove sessions from tabs array if not ready
const tabs = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'eventDays', label: 'Event Days', icon: Calendar },
  // { id: 'sessions', label: 'Sessions', icon: Clock3 }, // Remove this line
  { id: 'tickets', label: 'Ticket Prices', icon: Ticket },
  { id: 'payments', label: 'Payment Methods', icon: CreditCard },
  { id: 'backup', label: 'Database & Backup', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettingsTab />;
      case 'eventDays':
        return <EventDaysTab />;
      case 'tickets':
        return <TicketPricesTab />;
      case 'payments':
        return <PaymentMethodsTab />;
      case 'backup':
        return <BackupTab />;
      case 'security':
        return (
          <div className="text-center py-12">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Security Settings</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Security configuration will be available in the next update.
            </p>
          </div>
        );
      default:
        return <GeneralSettingsTab />;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-[#A81010]" />
            <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          </div>
          <p className="text-gray-600">Manage your event configuration, database settings, and system preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 overflow-x-auto pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#A81010] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}