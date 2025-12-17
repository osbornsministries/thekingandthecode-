// app/admin/sms-templates/components/TemplateTabs.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SMSTemplate, Ticket, Session, Day } from '@/lib/types/sms-templates';
import { SendMessagesTab } from './SendMessagesTab';
import { ManageTemplatesTab } from './ManageTemplatesTab';
import { PreviewTestTab } from './PreviewTestTab';

interface TemplateTabsProps {
  templates: SMSTemplate[];
  tickets: Ticket[];
  sessions: Session[];
  days: Day[];
  onTemplatesUpdate: (templates: SMSTemplate[]) => void;
}

export function TemplateTabs({
  templates,
  tickets,
  sessions,
  days,
  onTemplatesUpdate,
}: TemplateTabsProps) {
  const [activeTab, setActiveTab] = useState('send');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');

  const handleUseTemplate = (templateName: string) => {
    setSelectedTemplateName(templateName);
    setActiveTab('send');
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="send">Send Messages</TabsTrigger>
        <TabsTrigger value="templates">Manage Templates</TabsTrigger>
        <TabsTrigger value="preview">Preview & Test</TabsTrigger>
      </TabsList>

      <TabsContent value="send">
        <SendMessagesTab
          templates={templates}
          tickets={tickets}
          sessions={sessions}
          days={days}
          initialSelectedTemplate={selectedTemplateName}
        />
      </TabsContent>

      <TabsContent value="templates">
        <ManageTemplatesTab
          templates={templates}
          onTemplatesUpdate={onTemplatesUpdate}
          onUseTemplate={handleUseTemplate}
        />
      </TabsContent>

      <TabsContent value="preview">
        <PreviewTestTab templates={templates} />
      </TabsContent>
    </Tabs>
  );
}