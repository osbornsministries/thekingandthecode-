'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventDaysTab from './tabs/EventDaysTab';
// import EventSessionsTab from './tabs/EventSessionsTab';
import TicketPricesTab from './tabs/TicketPricesTab';
import PaymentMethodsTab from './tabs/PaymentMethodsTab';
import SystemActions from './tabs/SystemActions';

export default function SettingsDashboard() {
  const [activeTab, setActiveTab] = useState('eventDays');

  return (
    <div className="space-y-6">
      <SystemActions />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="eventDays">Event Days</TabsTrigger>
          <TabsTrigger value="eventSessions">Sessions</TabsTrigger>
          <TabsTrigger value="ticketPrices">Ticket Prices</TabsTrigger>
          <TabsTrigger value="paymentMethods">Payment Methods</TabsTrigger>
        </TabsList>
        
        <TabsContent value="eventDays" className="mt-6">
          <EventDaysTab />
        </TabsContent>
        
        {/* <TabsContent value="eventSessions" className="mt-6">
          <EventSessionsTab />
        </TabsContent> */}
        
        <TabsContent value="ticketPrices" className="mt-6">
          <TicketPricesTab />
        </TabsContent>
        
        <TabsContent value="paymentMethods" className="mt-6">
          <PaymentMethodsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}