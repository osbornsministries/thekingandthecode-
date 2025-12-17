// app/admin/sms-templates/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SMSTemplate, Ticket, Session, Day }  from '@/lib/types/sms-templates';
import { TemplateTabs } from '@/components/admin/sms/TemplateTabs';
import { LoadingState } from '@/components/notification/LoadingState';
import { InfoAlert } from '@/components/notification/InfoAlert';
import AdminLayout from '@/components/admin/AdminLayout';

export default function SMSTemplateManager() {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [days, setDays] = useState<Day[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

 // In your main page component, add better error handling:
const fetchData = async () => {
  setLoading(true);
  try {
    const [templatesRes, ticketsRes, sessionsRes, daysRes] = await Promise.all([
      fetch('/api/admin/sms-templates'),
      fetch('/api/tickets?limit=100'),
      fetch('/api/event-sessions'),
      fetch('/api/event-days')
    ]);

    // Set defaults to empty arrays if APIs fail
    if (templatesRes.ok) {
      const templatesData = await templatesRes.json();
      setTemplates(Array.isArray(templatesData) ? templatesData : []);
    } else {
      setTemplates([]);
      console.error('Failed to fetch templates:', templatesRes.status);
    }

    if (ticketsRes.ok) {
      const ticketsData = await ticketsRes.json();
      setTickets(Array.isArray(ticketsData) ? ticketsData : []);
    } else {
      setTickets([]);
      console.error('Failed to fetch tickets:', ticketsRes.status);
    }

    if (sessionsRes.ok) {
      const sessionsData = await sessionsRes.json();
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } else {
      setSessions([]);
      console.error('Failed to fetch sessions:', sessionsRes.status);
    }

    if (daysRes.ok) {
      const daysData = await daysRes.json();
      setDays(Array.isArray(daysData) ? daysData : []);
    } else {
      setDays([]);
      console.error('Failed to fetch days:', daysRes.status);
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    toast.error('Failed to fetch data');
    // Set empty arrays on error
    setTemplates([]);
    setTickets([]);
    setSessions([]);
    setDays([]);
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return <LoadingState />;
  }

  return (
    <AdminLayout>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Template Manager</h1>
          <p className="text-muted-foreground">Create templates and send messages to ticket holders</p>
        </div>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <TemplateTabs
        templates={templates}
        tickets={tickets}
        sessions={sessions}
        days={days}
        onTemplatesUpdate={setTemplates}
      />
      
      <InfoAlert />
    </div>
    </AdminLayout>
  );
}