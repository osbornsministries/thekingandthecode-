// app/admin/sms-templates/components/SendMessagesTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Send, RefreshCw, CheckCircle, XCircle, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { SMSTemplate, Ticket, Session, Day } from '@/lib/types/sms-templates';
import { MessageConfiguration } from './MessageConfiguration';
import { TicketSelection } from './TicketSelection';
import { useSMSMessaging } from '@/lib/hooks/useSMSMessaging';

interface SendMessagesTabProps {
  templates: SMSTemplate[];
  tickets: Ticket[];
  sessions: Session[];
  days: Day[];
  initialSelectedTemplate?: string;
}

export function SendMessagesTab({
  templates = [],
  tickets = [],
  sessions = [],
  days = [],
  initialSelectedTemplate = '',
}: SendMessagesTabProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialSelectedTemplate);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Update selected template when initialSelectedTemplate changes
  useEffect(() => {
    if (initialSelectedTemplate && templates.length > 0) {
      setSelectedTemplate(initialSelectedTemplate);
      const template = templates.find(t => t.name === initialSelectedTemplate);
      if (template && !customMessage) {
        setCustomMessage(template.content);
      }
    }
  }, [initialSelectedTemplate, templates, customMessage]); // Fixed: Changed 'initialized' to 'initialSelectedTemplate'

  // Mark as initialized when all data is loaded
  useEffect(() => {
    if (tickets.length > 0 && sessions.length > 0 && days.length > 0) {
      setIsInitialized(true);
    }
  }, [tickets, sessions, days]);

  const {
    sending,
    results,
    sendMessages,
    sendTestMessage,
    getFilteredTickets,
    selectAllTickets,
    clearSelection,
    toggleTicketSelection,
  } = useSMSMessaging({
    templates,
    tickets,
    sessions,
    days,
    selectedTemplate,
    customMessage,
    selectedSession,
    selectedDay,
    selectedStatus,
    selectedTickets,
    setSelectedTickets,
  });

  // Handle sending with confirmation
  const handleSendMessages = async () => {
    if (selectedTickets.length === 0) {
      toast.error('No tickets selected');
      return;
    }

    if (tickets.length === 0) {
      toast.error('No tickets available');
      return;
    }

    const message = customMessage || templates.find(t => t.name === selectedTemplate)?.content;
    
    if (!message?.trim()) {
      toast.error('Please enter a message or select a template');
      return;
    }

    // Calculate SMS cost
    const smsSegments = Math.ceil(message.length / 160);
    const totalCost = smsSegments * selectedTickets.length;

    // Confirmation dialog
    const confirmed = window.confirm(
      `Send message to ${selectedTickets.length} ticket holder(s)?\n\n` +
      `• ${smsSegments} SMS segment(s) per message\n` +
      `• Total estimated cost: ${totalCost} SMS units\n\n` +
      `Are you sure you want to proceed?`
    );

    if (!confirmed) return;

    // Send messages
    const sendResults = await sendMessages();
    
    // Show results
    if (sendResults.length > 0) {
      setShowResults(true);
    }
  };

  // Export results to CSV
  const exportResultsToCSV = () => {
    if (results.length === 0) return;

    const headers = ['Ticket Code', 'Phone', 'Status', 'Message ID', 'Error'];
    const csvRows = [
      headers.join(','),
      ...results.map(r => [
        r.ticketCode,
        r.phone,
        r.success ? 'Success' : 'Failed',
        r.messageId || '',
        r.error?.replace(/"/g, '""') || ''
      ].map(cell => `"${cell}"`).join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sms_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Safe calculation functions
  const getMessageLength = () => {
    if (customMessage) return customMessage.length;
    const template = templates.find(t => t.name === selectedTemplate);
    return template?.content.length || 0;
  };

  const getSmsSegments = () => {
    const messageLength = getMessageLength();
    return Math.ceil(messageLength / 160);
  };

  const getSuccessfulCount = () => results.filter(r => r.success).length;
  const getFailedCount = () => results.filter(r => !r.success).length;

  // Show loading state if data isn't ready
  if (!isInitialized && (tickets.length === 0 || sessions.length === 0 || days.length === 0)) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Loading ticket data... Please wait while we fetch tickets, sessions, and days.
          </AlertDescription>
        </Alert>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Show empty state if no tickets
  if (tickets.length === 0) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tickets found. Please check your database or create some tickets first.
          </AlertDescription>
        </Alert>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">No tickets available to send messages to.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const messageLength = getMessageLength();
  const smsSegments = getSmsSegments();
  const successfulCount = getSuccessfulCount();
  const failedCount = getFailedCount();

  return (
    <div className="space-y-6">
      {/* Data Status Banner */}
      {(!tickets.length || !sessions.length || !days.length) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Some data is missing: {tickets.length} tickets, {sessions.length} sessions, {days.length} days
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MessageConfiguration
          templates={templates}
          selectedTemplate={selectedTemplate}
          customMessage={customMessage}
          onTemplateSelect={setSelectedTemplate}
          onCustomMessageChange={setCustomMessage}
          onUseTemplate={() => {
            const template = templates.find(t => t.name === selectedTemplate);
            if (template) {
              setCustomMessage(template.content);
            }
          }}
        />

        <div className="lg:col-span-2">
          <TicketSelection
            tickets={tickets}
            sessions={sessions}
            days={days}
            selectedTickets={selectedTickets}
            selectedSession={selectedSession}
            selectedDay={selectedDay}
            selectedStatus={selectedStatus}
            onSessionChange={setSelectedSession}
            onDayChange={setSelectedDay}
            onStatusChange={setSelectedStatus}
            onTicketToggle={toggleTicketSelection}
            onSelectAll={selectAllTickets}
            onClearSelection={clearSelection}
            getFilteredTickets={() => getFilteredTickets(searchQuery)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSendMessages={handleSendMessages}
            isSending={sending}
            selectedTemplateName={selectedTemplate}
          />
          
          {/* Send Button Card */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Send Messages</CardTitle>
              <CardDescription>
                {selectedTickets.length} ticket(s) selected • {smsSegments} SMS segment(s) per message
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Cost Estimation */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-amber-800">Cost Estimation</p>
                      <p className="text-sm text-amber-700">
                        Total estimated cost: {smsSegments * selectedTickets.length} SMS units
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-white text-amber-800">
                      {smsSegments} × {selectedTickets.length}
                    </Badge>
                  </div>
                </div>

                {/* Send Button */}
                <Button 
                  onClick={handleSendMessages} 
                  disabled={sending || selectedTickets.length === 0 || tickets.length === 0}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Sending {selectedTickets.length} message(s)...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send to {selectedTickets.length} Selected Ticket(s)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Panel */}
      {showResults && results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sending Results</CardTitle>
                <CardDescription>
                  {successfulCount} successful, {failedCount} failed
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportResultsToCSV}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResults(false)}
                >
                  Hide
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={`${result.ticketId}-${index}`}
                  className={`p-4 border rounded-lg ${
                    result.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">{result.ticketCode}</p>
                        <p className="text-sm text-muted-foreground">{result.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? 'Success' : 'Failed'}
                      </Badge>
                      {result.messageId && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ID: {result.messageId.substring(0, 8)}...
                        </p>
                      )}
                    </div>
                  </div>
                  {result.error && (
                    <p className="text-sm text-red-600 mt-2">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm font-medium">Total Tickets</p>
          <p className="text-2xl font-bold">{tickets.length}</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm font-medium">Selected</p>
          <p className="text-2xl font-bold text-primary">{selectedTickets.length}</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm font-medium">Message Length</p>
          <p className="text-2xl font-bold">{messageLength}</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm font-medium">SMS Segments</p>
          <p className="text-2xl font-bold">{smsSegments}</p>
        </div>
      </div>
    </div>
  );
}