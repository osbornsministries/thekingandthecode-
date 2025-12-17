// app/admin/sms-templates/hooks/useSMSMessaging.ts
import { useState } from 'react';
import { toast } from 'sonner';
import { SMSTemplate, Ticket, Session, Day } from '../types/sms-templates';


interface UseSMSMessagingProps {
  templates: SMSTemplate[];
  tickets: Ticket[];
  sessions: Session[];
  days: Day[];
  selectedTemplate: string;
  customMessage: string;
  selectedSession: string;
  selectedDay: string;
  selectedStatus: string;
  selectedTickets: number[];
  setSelectedTickets: (tickets: number[]) => void;
}

export function useSMSMessaging({
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
}: UseSMSMessagingProps) {
  const [sending, setSending] = useState(false);

 
const getFilteredTickets = (searchQuery?: string) => {
    if (!tickets || !Array.isArray(tickets)) {
      return [];
    }

    let filtered = tickets.filter(ticket => {
      if (!ticket) return false;
      
      if (selectedSession !== 'all' && ticket.sessionId !== parseInt(selectedSession)) return false;
      if (selectedStatus !== 'all' && ticket.status !== selectedStatus) return false;
      
      if (selectedDay !== 'all') {
        const session = sessions.find(s => s.id === ticket.sessionId);
        if (!session || session.dayId !== parseInt(selectedDay)) return false;
      }
      
      return true;
    });

    // Apply search query if provided
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => {
        if (!t) return false;
        return (
          (t.ticketCode && t.ticketCode.toLowerCase().includes(query)) ||
          (t.purchaserName && t.purchaserName.toLowerCase().includes(query)) ||
          (t.purchaserPhone && t.purchaserPhone.includes(query))
        );
      });
    }
    
    return filtered;
  };
  

  const toggleTicketSelection = (ticketId: number) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const selectAllTickets = () => {
    const filtered = getFilteredTickets();
    setSelectedTickets(filtered.map(t => t.id));
  };

  const clearSelection = () => {
    setSelectedTickets([]);
  };

  const sendMessages = async () => {
    if (selectedTickets.length === 0) {
      toast.error('No tickets selected');
      return;
    }

    const selectedTemplateObj = templates.find(t => t.name === selectedTemplate);
    const message = customMessage || selectedTemplateObj?.content;
    
    if (!message) {
      toast.error('No message content');
      return;
    }

    setSending(true);
    const results = [];
    const filteredTickets = tickets.filter(t => selectedTickets.includes(t.id));

    for (const ticket of filteredTickets) {
      try {
        const session = sessions.find(s => s.id === ticket.sessionId);
        const day = days.find(d => d.id === session?.dayId);
        
        const data: Record<string, string> = {
          fullName: ticket.purchaserName,
          phone: ticket.purchaserPhone,
          ticketCode: ticket.ticketCode,
          ticketId: ticket.id.toString(),
          ticketType: ticket.ticketType,
          status: ticket.status,
          paymentStatus: ticket.paymentStatus,
          sessionName: session?.name || 'Unknown Session',
          eventDay: day?.name || 'Unknown Day',
          eventDate: day?.date ? new Date(day.date).toLocaleDateString() : 'Unknown Date',
          sessionTime: session ? `${session.startTime} - ${session.endTime}` : 'Unknown Time',
          currentDate: new Date().toLocaleDateString(),
          currentTime: new Date().toLocaleTimeString(),
        };

        let renderedMessage = message;
        Object.entries(data).forEach(([key, value]) => {
          renderedMessage = renderedMessage.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
        });

        const response = await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: ticket.purchaserPhone,
            message: renderedMessage,
            template: selectedTemplate,
            ticketId: ticket.id
          })
        });

        results.push({
          ticketCode: ticket.ticketCode,
          success: response.ok,
          phone: ticket.purchaserPhone
        });

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        results.push({
          ticketCode: ticket.ticketCode,
          success: false,
          phone: ticket.purchaserPhone,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setSending(false);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    toast.success(`Sent ${successful} messages${failed > 0 ? `, ${failed} failed` : ''}`);
    
    console.log('SMS sending results:', results);
  };

  return {
    sending,
    sendMessages,
    getFilteredTickets,
    selectAllTickets,
    clearSelection,
    toggleTicketSelection,
  };
}




const sendMessages = async (): Promise<SMSResult[]> => {
  if (selectedTickets.length === 0) {
    toast.error('No tickets selected');
    return [];
  }

  const selectedTemplateObj = templates.find(t => t.name === selectedTemplate);
  const messageTemplate = customMessage || selectedTemplateObj?.content;
  
  if (!messageTemplate?.trim()) {
    toast.error('No message content');
    return [];
  }

  // Validate message length
  if (messageTemplate.length > 1600) {
    toast.error('Message is too long. Maximum 1600 characters allowed.');
    return [];
  }

  setSending(true);
  setResults([]);
  
  const filteredTickets = tickets.filter(t => selectedTickets.includes(t.id));
  const results: SMSResult[] = [];

  try {
    // Show sending progress
    toast.info(`Starting to send ${filteredTickets.length} messages...`);

    for (const ticket of filteredTickets) {
      try {
        // Prepare data for variable replacement
        const session = sessions.find(s => s.id === ticket.sessionId);
        const day = days.find(d => d.id === session?.dayId);
        
        const data: Record<string, string> = {
          fullName: ticket.purchaserName || '',
          phone: ticket.purchaserPhone || '',
          ticketCode: ticket.ticketCode || '',
          ticketId: ticket.id.toString(),
          ticketType: ticket.ticketType || 'REGULAR',
          status: ticket.status || '',
          paymentStatus: ticket.paymentStatus || '',
          sessionName: session?.name || 'Unknown Session',
          eventDay: day?.name || 'Unknown Day',
          eventDate: day?.date ? new Date(day.date).toLocaleDateString() : 'Unknown Date',
          sessionTime: session ? `${session.startTime || ''} - ${session.endTime || ''}` : 'Unknown Time',
          currentDate: new Date().toLocaleDateString(),
          currentTime: new Date().toLocaleTimeString(),
          adultQuantity: ticket.adultQuantity?.toString() || '0',
          studentQuantity: ticket.studentQuantity?.toString() || '0',
          childQuantity: ticket.childQuantity?.toString() || '0',
          totalQuantity: ticket.totalQuantity?.toString() || '1',
          totalAmount: ticket.totalAmount?.toString() || '0',
        };

        // Replace variables in message
        let renderedMessage = messageTemplate;
        Object.entries(data).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          renderedMessage = renderedMessage.replace(regex, value);
        });

        // Send SMS via API - THIS NOW USES BRIQ!
        const response = await fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: ticket.purchaserPhone,
            message: renderedMessage,
            template: selectedTemplate,
            ticketId: ticket.id,
            sessionId: ticket.sessionId,
            variables: data,
            isTest: false // REAL SMS sending
          })
        });

        const result = await response.json();

        const smsResult: SMSResult = {
          ticketId: ticket.id,
          ticketCode: ticket.ticketCode,
          phone: ticket.purchaserPhone,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        };

        results.push(smsResult);

        // Update UI with progress
        setResults(prev => [...prev, smsResult]);

        // Rate limiting: wait 200ms between messages (Briq might have limits)
        await new Promise(resolve => setTimeout(resolve, 200));

        // Show progress toast every 10 messages
        if (results.length % 10 === 0) {
          const successful = results.filter(r => r.success).length;
          toast.info(`Progress: ${successful}/${results.length} sent successfully`);
        }

      } catch (error) {
        const smsResult: SMSResult = {
          ticketId: ticket.id,
          ticketCode: ticket.ticketCode,
          phone: ticket.purchaserPhone,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        results.push(smsResult);
        setResults(prev => [...prev, smsResult]);
      }
    }

    // Calculate final statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (failed === 0) {
      toast.success(`✅ Successfully sent all ${successful} messages via Briq`);
    } else if (successful === 0) {
      toast.error(`❌ Failed to send all ${failed} messages`);
    } else {
      toast.success(`✅ Sent ${successful} messages via Briq, ${failed} failed`);
    }

    // Clear selection after successful sending
    if (successful > 0) {
      setSelectedTickets([]);
    }

    return results;

  } catch (error) {
    console.error('SMS sending error:', error);
    toast.error('Failed to send messages');
    return results;
  } finally {
    setSending(false);
  }
};