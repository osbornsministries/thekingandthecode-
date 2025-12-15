'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

export default function GeneralSettingsTab() {
  const [settings, setSettings] = useState({
    eventName: 'The King & The Code',
    supportEmail: 'info@afyalink.com',
    currency: 'TZS',
    timezone: 'Africa/Dar_es_Salaam',
    maxTicketsPerOrder: '6',
    ticketValidityHours: '24',
    enableEmailNotifications: true,
    enableSMSNotifications: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-6">General Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Event Name</label>
            <input
              type="text"
              value={settings.eventName}
              onChange={(e) => setSettings({ ...settings, eventName: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Support Email</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white"
            >
              <option value="TZS">TZS - Tanzanian Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Timezone</label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white"
            >
              <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam (GMT+3)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (GMT-5)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Max Tickets Per Order</label>
            <input
              type="number"
              value={settings.maxTicketsPerOrder}
              onChange={(e) => setSettings({ ...settings, maxTicketsPerOrder: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
              min="1"
              max="20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Ticket Validity (Hours)</label>
            <input
              type="number"
              value={settings.ticketValidityHours}
              onChange={(e) => setSettings({ ...settings, ticketValidityHours: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg"
              min="1"
              max="168"
            />
          </div>
        </div>

        {/* Notification Settings */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Email Notifications</p>
                <p className="text-sm text-gray-600">Send email notifications for ticket purchases</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableEmailNotifications}
                  onChange={(e) => setSettings({ ...settings, enableEmailNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A81010]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">SMS Notifications</p>
                <p className="text-sm text-gray-600">Send SMS notifications for ticket purchases</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableSMSNotifications}
                  onChange={(e) => setSettings({ ...settings, enableSMSNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#A81010]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-[#A81010] text-white rounded-lg hover:bg-[#8a0d0d] disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}