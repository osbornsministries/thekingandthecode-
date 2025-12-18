// components/admin/tickets/BulkSMSModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Send, Mail, Smartphone, Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { SMSService } from '@/lib/services/sms';
import { SMSTemplate } from '@/lib/types/sms-templates';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type MessageMode = 'custom' | 'template';

interface BulkSMSModalProps {
  selectedTickets: number[];
  ticketsData: Array<{
    id: number;
    purchaserName: string;
    purchaserPhone: string;
    ticketCode: string;
    ticketType: string;
    sessionName?: string;
    dayName?: string;
    eventName?: string;
  }>;
  onClose: () => void;
}

interface TemplateVariable {
  name: string;
  value: string;
  description?: string;
}

export default function BulkSMSModal({ selectedTickets, ticketsData, onClose }: BulkSMSModalProps) {
  const [messageMode, setMessageMode] = useState<MessageMode>('custom');
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendStats, setSendStats] = useState({ 
    sent: 0, 
    failed: 0, 
    total: 0,
    failedDetails: [] as Array<{ phone: string; error: string }>
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [availableVariables, setAvailableVariables] = useState<TemplateVariable[]>([
    { name: 'name', value: '{name}', description: 'Customer name' },
    { name: 'phone', value: '{phone}', description: 'Customer phone' },
    { name: 'code', value: '{code}', description: 'Ticket code' },
    { name: 'type', value: '{type}', description: 'Ticket type (VIP/VVIP)' },
    { name: 'event', value: '{event}', description: 'Event name' },
    { name: 'session', value: '{session}', description: 'Session name' },
    { name: 'day', value: '{day}', description: 'Event day' },
    { name: 'date', value: '{date}', description: 'Event date' },
    { name: 'time', value: '{time}', description: 'Session time' },
    { name: 'amount', value: '{amount}', description: 'Ticket amount' },
  ]);

  // Load templates from API
  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await fetch('/api/sms-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
        if (data.templates?.length > 0) {
          setSelectedTemplate(data.templates[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadTemplates();
  }, []);

  // Extract variables from template content
  const extractVariables = (content: string): string[] => {
    const regex = /{(\w+)}/g;
    const matches = content.match(regex);
    return matches ? [...new Set(matches.map(m => m.slice(1, -1)))] : [];
  };

  // Apply template with variables replacement
  const applyTemplate = (template: SMSTemplate | null, ticket: any): string => {
    if (!template) return '';
    
    let message = template.content;
    
    // Define available data for replacement
    const replacements: Record<string, string> = {
      name: ticket.purchaserName || 'Guest',
      phone: ticket.purchaserPhone || '',
      code: ticket.ticketCode || 'N/A',
      type: ticket.ticketType || 'Ticket',
      event: ticket.eventName || 'The Event',
      session: ticket.sessionName || '',
      day: ticket.dayName || '',
      date: new Date().toLocaleDateString('en-TZ'),
      time: new Date().toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' }),
      amount: ticket.totalAmount ? `TZS ${Number(ticket.totalAmount).toLocaleString('en-TZ')}` : '',
    };

    // Replace all variables
    Object.entries(replacements).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    return message;
  };

  // Format phone number
  const formatPhone = (phone: string) => {
    return phone.startsWith('0') ? '+255' + phone.substring(1) : phone;
  };

  // Generate preview
  const getMessagePreview = () => {
    if (ticketsData.length === 0) return '';

    if (messageMode === 'custom') {
      return message;
    } else if (selectedTemplate) {
      const firstTicket = ticketsData[0];
      return applyTemplate(selectedTemplate, firstTicket);
    }
    return '';
  };

  // Handle variable insertion
  const handleInsertVariable = (variable: string) => {
    if (messageMode === 'custom') {
      setMessage(prev => prev + `{${variable}}`);
    }
  };

  // Handle send
  const handleSend = async () => {
    if (ticketsData.length === 0) {
      setErrorMessage('No tickets selected');
      return;
    }

    setIsSending(true);
    setSendStats({ 
      sent: 0, 
      failed: 0, 
      total: ticketsData.length,
      failedDetails: []
    });
    setSuccessMessage('');
    setErrorMessage('');

    try {
      let sent = 0;
      let failed = 0;
      const failedDetails: Array<{ phone: string; error: string }> = [];

      for (const ticket of ticketsData) {
        try {
          let messageToSend = '';
          
          if (messageMode === 'custom') {
            messageToSend = message;
          } else if (selectedTemplate) {
            messageToSend = applyTemplate(selectedTemplate, ticket);
          } else {
            failed++;
            continue;
          }

          if (!messageToSend.trim()) {
            failed++;
            failedDetails.push({
              phone: ticket.purchaserPhone,
              error: 'Empty message'
            });
            continue;
          }

          // Apply variable replacements for custom messages too
          if (messageMode === 'custom') {
            const replacements: Record<string, string> = {
              name: ticket.purchaserName || 'Guest',
              phone: ticket.purchaserPhone || '',
              code: ticket.ticketCode || 'N/A',
              type: ticket.ticketType || 'Ticket',
              event: ticket.eventName || 'The Event',
              session: ticket.sessionName || '',
              day: ticket.dayName || '',
              date: new Date().toLocaleDateString('en-TZ'),
              time: new Date().toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' }),
              amount: ticket.totalAmount ? `TZS ${Number(ticket.totalAmount).toLocaleString('en-TZ')}` : '',
            };

            Object.entries(replacements).forEach(([key, value]) => {
              messageToSend = messageToSend.replace(new RegExp(`{${key}}`, 'g'), value);
            });
          }

          const result = await SMSService.sendSMS(ticket.purchaserPhone, messageToSend);
          
          if (result.success) {
            sent++;
          } else {
            failed++;
            failedDetails.push({
              phone: ticket.purchaserPhone,
              error: result.error?.message || 'Unknown error'
            });
          }
        } catch (error: any) {
          failed++;
          failedDetails.push({
            phone: ticket.purchaserPhone,
            error: error.message || 'Network error'
          });
        }

        // Update progress
        setSendStats({ 
          sent, 
          failed, 
          total: ticketsData.length,
          failedDetails
        });

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Show results
      if (sent > 0) {
        setSuccessMessage(`Successfully sent ${sent} SMS message(s)`);
        
        // Log success in database if needed
        if (sent > 0) {
          try {
            await fetch('/api/sms-templates/logs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                templateId: selectedTemplate?.id,
                templateName: selectedTemplate?.name,
                messageCount: sent,
                mode: messageMode,
                ticketIds: ticketsData.map(t => t.id)
              })
            });
          } catch (error) {
            console.error('Failed to log SMS:', error);
          }
        }
      }
      
      if (failed > 0) {
        setErrorMessage(`${failed} message(s) failed to send`);
      }

      // Auto-close if all successful
      if (failed === 0 && sent > 0) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }

    } catch (error: any) {
      console.error('Bulk SMS error:', error);
      setErrorMessage('An unexpected error occurred: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  // Reset on close
  useEffect(() => {
    if (!isSending) {
      // Don't reset message if sending
    }
  }, [isSending]);

  const messagePreview = getMessagePreview();
  const selectedVariables = selectedTemplate ? extractVariables(selectedTemplate.content) : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Send SMS to {ticketsData.length} Ticket(s)
            </h3>
            <p className="text-sm text-gray-500">
              Send messages to selected ticket holders via SMS
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            disabled={isSending}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Recipient Summary */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {ticketsData.length} recipient(s)
                  </p>
                  <p className="text-sm text-gray-500">
                    First recipient: {ticketsData[0]?.purchaserName} ({formatPhone(ticketsData[0]?.purchaserPhone || '')})
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {ticketsData.length} phone number(s)
              </div>
            </div>
          </div>

          {/* Message Mode Selector */}
          <div className="mb-6">
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMessageMode('custom')}
                className={`flex-1 py-3 px-4 rounded-lg text-center transition-colors ${
                  messageMode === 'custom'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Mail size={16} />
                  Custom Message
                </div>
              </button>
              <button
                onClick={() => setMessageMode('template')}
                className={`flex-1 py-3 px-4 rounded-lg text-center transition-colors ${
                  messageMode === 'template'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Smartphone size={16} />
                  Use Template
                </div>
              </button>
            </div>

            {/* Custom Message Input */}
            {messageMode === 'custom' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Custom Message
                    </label>
                    <div className="text-xs text-gray-500">
                      Characters: {message.length} | SMS: {Math.ceil(message.length / 160)}
                    </div>
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here. Use variables like {name}, {code}, etc..."
                    className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    disabled={isSending}
                  />
                </div>

                {/* Variables for custom message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Variables (Click to insert)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableVariables.map((variable) => (
                      <Badge
                        key={variable.name}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors"
                        onClick={() => handleInsertVariable(variable.name)}
                      >
                        {variable.value}
                        {variable.description && (
                          <span className="text-xs text-gray-500 ml-1">
                            ({variable.description})
                          </span>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Template Selector */}
            {messageMode === 'template' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Template
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={loadTemplates}
                      disabled={isLoadingTemplates}
                      className="h-8"
                    >
                      {isLoadingTemplates ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3 mr-1" />
                      )}
                      Refresh
                    </Button>
                  </div>
                  
                  {isLoadingTemplates ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="p-4 border border-gray-200 rounded-lg text-center">
                      <p className="text-gray-500">No templates found</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Create templates in the SMS Templates section
                      </p>
                    </div>
                  ) : (
                    <>
                      <select
                        value={selectedTemplate?.id || ''}
                        onChange={(e) => {
                          const template = templates.find(t => t.id === parseInt(e.target.value));
                          setSelectedTemplate(template || null);
                        }}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSending}
                      >
                        <option value="">Select a template...</option>
                        {templates
                          .filter(t => t.isActive)
                          .map((template) => (
                            <option key={template.id} value={template.id}>
                              {template.name} ({template.category})
                              {template.description && ` - ${template.description}`}
                            </option>
                          ))}
                      </select>

                      {/* Selected template details */}
                      {selectedTemplate && (
                        <div className="mt-4 space-y-4">
                          {/* Template info */}
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{selectedTemplate.name}</span>
                                <Badge variant="outline">{selectedTemplate.category}</Badge>
                                {selectedTemplate.language && (
                                  <Badge variant="secondary">{selectedTemplate.language.toUpperCase()}</Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {selectedTemplate.content.length} chars • {Math.ceil(selectedTemplate.content.length / 160)} SMS
                              </div>
                            </div>
                            {selectedTemplate.description && (
                              <p className="text-sm text-gray-600 mb-3">{selectedTemplate.description}</p>
                            )}
                            <div className="p-3 bg-white rounded border">
                              <pre className="text-sm whitespace-pre-wrap break-words">
                                {selectedTemplate.content}
                              </pre>
                            </div>
                          </div>

                          {/* Template variables */}
                          {selectedVariables.length > 0 && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Template Variables
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {selectedVariables.map((variable) => {
                                  const varInfo = availableVariables.find(v => v.name === variable);
                                  return (
                                    <Badge
                                      key={variable}
                                      variant="secondary"
                                      className="cursor-help"
                                      title={varInfo?.description || `Will be replaced with ${variable}`}
                                    >
                                      {`{${variable}}`}
                                    </Badge>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Message Preview */}
            {messagePreview && (
              <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">Message Preview</p>
                  <div className="text-xs text-gray-500">
                    {messagePreview.length} chars • {Math.ceil(messagePreview.length / 160)} SMS
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <p className="text-gray-600 whitespace-pre-wrap">{messagePreview}</p>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  This preview shows how the message will appear to the first recipient.
                  {ticketsData.length > 1 && ` Variables will be replaced for each of ${ticketsData.length} recipients.`}
                </div>
              </div>
            )}
          </div>

          {/* Sending Progress */}
          {isSending && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">Sending progress</p>
                <p className="text-sm text-gray-600">
                  {sendStats.sent + sendStats.failed} of {sendStats.total}
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((sendStats.sent + sendStats.failed) / sendStats.total) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span className="text-green-600">✅ Sent: {sendStats.sent}</span>
                <span className="text-red-600">❌ Failed: {sendStats.failed}</span>
              </div>
            </div>
          )}

          {/* Failed Details */}
          {sendStats.failedDetails.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="font-medium text-red-700">Failed Messages</p>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {sendStats.failedDetails.slice(0, 5).map((detail, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium">{formatPhone(detail.phone)}:</span>
                    <span className="text-red-600 ml-2">{detail.error}</span>
                  </div>
                ))}
                {sendStats.failedDetails.length > 5 && (
                  <p className="text-sm text-gray-500">
                    ...and {sendStats.failedDetails.length - 5} more
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5" />
              <div>
                <p className="font-medium">{successMessage}</p>
                <p className="text-sm opacity-90">
                  Using template: {selectedTemplate?.name || 'Custom message'}
                </p>
              </div>
            </div>
          )}
          
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5" />
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Using Briq SMS Service • {messageMode === 'template' && selectedTemplate ? `Template: ${selectedTemplate.name}` : 'Custom message'}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || 
                (messageMode === 'custom' && !message.trim()) || 
                (messageMode === 'template' && !selectedTemplate)
              }
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                isSending || 
                (messageMode === 'custom' && !message.trim()) || 
                (messageMode === 'template' && !selectedTemplate)
                  ? 'bg-blue-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} /> Send SMS
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}