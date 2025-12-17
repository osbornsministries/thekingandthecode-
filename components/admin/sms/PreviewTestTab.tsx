// app/admin/sms-templates/components/PreviewTestTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SMSTemplate } from '@/lib/types/sms-templates';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface PreviewTestTabProps {
  templates: SMSTemplate[];
}

export function PreviewTestTab({ templates }: PreviewTestTabProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [previewData, setPreviewData] = useState<Record<string, string>>({});
  const [previewPhone, setPreviewPhone] = useState('');
  const [previewMessage, setPreviewMessage] = useState('');

  const selectedTemplateObj = templates.find(t => t.name === selectedTemplate);
  const messageContent = customMessage || selectedTemplateObj?.content || '';

  // Update preview when dependencies change
  useEffect(() => {
    updatePreview();
  }, [selectedTemplate, customMessage, previewData]);

  const updatePreview = () => {
    let message = messageContent;
    
    // Replace variables with preview data
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      message = message.replace(regex, value || `{{${key}}}`);
    });
    
    // Replace any remaining variables with placeholder
    const remainingVars = message.match(/\{\{(\w+)\}\}/g) || [];
    remainingVars.forEach(variable => {
      const varName = variable.replace(/\{\{|\}\}/g, '');
      message = message.replace(variable, `[${varName}]`);
    });
    
    setPreviewMessage(message);
  };

  const sendTestMessage = async () => {
    if (!previewPhone) {
      toast.error('Please enter a test phone number');
      return;
    }

    if (!previewMessage.trim()) {
      toast.error('Please generate a preview message first');
      return;
    }

    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: previewPhone,
          message: previewMessage,
          template: 'TEST',
          isTest: true
        })
      });

      if (response.ok) {
        toast.success('Test message sent successfully');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send test message');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send test message');
    }
  };

  const renderVariableInputs = () => {
    if (!selectedTemplateObj) return null;

    const variables = selectedTemplateObj.variables;
    if (variables.length === 0) return null;

    return (
      <div className="space-y-2">
        <Label>Preview Variables</Label>
        <div className="space-y-2">
          {variables.map(variable => (
            <div key={variable} className="flex items-center gap-2">
              <Label className="w-32 text-sm">{variable}</Label>
              <Input
                value={previewData[variable] || ''}
                onChange={(e) => setPreviewData({...previewData, [variable]: e.target.value})}
                placeholder={`Enter ${variable} value`}
                className="flex-1"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getMessageStats = () => {
    const length = previewMessage.length;
    const smsCount = Math.ceil(length / 160);
    const remainingChars = 160 - (length % 160);
    
    return { length, smsCount, remainingChars };
  };

  const stats = getMessageStats();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Preview Configuration</CardTitle>
            <CardDescription>Test your template with sample data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id || template.name} value={template.name}>
                      {template.name} ({template.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Override template with custom message..."
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label>Test Phone Number</Label>
              <Input
                value={previewPhone}
                onChange={(e) => setPreviewPhone(e.target.value)}
                placeholder="255712345678"
                type="tel"
              />
              <p className="text-xs text-muted-foreground">
                Format: 255XXXXXXXXX (Tanzania)
              </p>
            </div>

            {renderVariableInputs()}
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>Message Preview</CardTitle>
            <CardDescription>How your message will appear</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Message Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-4 bg-muted rounded-lg min-h-[200px] max-h-[300px] overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {previewMessage || 'Select a template and enter variable values to see preview...'}
                  </pre>
                </div>
              </div>
              
              {/* Message Stats */}
              <div className="space-y-2">
                <Label>Message Details</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Characters:</span>
                      <span className="font-medium">{stats.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">SMS Segments:</span>
                      <span className={`font-medium ${stats.smsCount > 1 ? 'text-amber-600' : ''}`}>
                        {stats.smsCount}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Remaining:</span>
                      <span className={`font-medium ${stats.remainingChars < 20 ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.remainingChars}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Template:</span>
                      <span className="font-medium">{selectedTemplate || 'None'}</span>
                    </div>
                  </div>
                </div>
                
                {/* Warning for long messages */}
                {stats.smsCount > 1 && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
                    ⚠️ Message will be split into {stats.smsCount} SMS segments
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={sendTestMessage} 
              disabled={!previewPhone || !previewMessage.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              Send Test Message
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Sample Data Help Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Available Variables</CardTitle>
          <CardDescription className="text-blue-700">
            Use these variables in your templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            <Badge variant="outline" className="bg-white">fullName</Badge>
            <Badge variant="outline" className="bg-white">phone</Badge>
            <Badge variant="outline" className="bg-white">ticketCode</Badge>
            <Badge variant="outline" className="bg-white">ticketId</Badge>
            <Badge variant="outline" className="bg-white">ticketType</Badge>
            <Badge variant="outline" className="bg-white">status</Badge>
            <Badge variant="outline" className="bg-white">paymentStatus</Badge>
            <Badge variant="outline" className="bg-white">sessionName</Badge>
            <Badge variant="outline" className="bg-white">eventDay</Badge>
            <Badge variant="outline" className="bg-white">eventDate</Badge>
            <Badge variant="outline" className="bg-white">sessionTime</Badge>
            <Badge variant="outline" className="bg-white">currentDate</Badge>
            <Badge variant="outline" className="bg-white">currentTime</Badge>
          </div>
          <p className="text-sm text-blue-700 mt-4">
            Variables are automatically replaced with ticket data when sending messages.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}