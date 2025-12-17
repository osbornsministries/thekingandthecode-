// app/admin/sms-templates/components/TemplateForm.tsx
'use client';

import { Save, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SMSTemplate } from '@/lib/types/sms-templates';
import { extractVariables } from '@/lib/utils/templateUtils';
import { toast } from 'sonner';

interface TemplateFormProps {
  editingTemplate: SMSTemplate;
  onTemplateChange: (template: SMSTemplate) => void;
  onSave: (template: SMSTemplate) => Promise<void>;
  isSaving?: boolean;
}

export function TemplateForm({ 
  editingTemplate, 
  onTemplateChange, 
  onSave,
  isSaving = false 
}: TemplateFormProps) {
  const defaultTemplate = `Hello {{fullName}}!

Your ticket {{ticketCode}} is confirmed for {{eventDay}} - {{sessionName}}.

Date: {{eventDate}}
Time: {{sessionTime}}

Thank you for your purchase!`;

  const handleContentChange = (content: string) => {
    const variables = extractVariables(content);
    onTemplateChange({ ...editingTemplate, content, variables });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTemplate.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    if (!editingTemplate.content.trim()) {
      toast.error('Template content is required');
      return;
    }

    await onSave(editingTemplate);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingTemplate.id ? 'Edit Template' : 'Create New Template'}
        </CardTitle>
        <CardDescription>
          {editingTemplate.id 
            ? 'Update your SMS template' 
            : 'Create a new SMS template for sending messages'
          }
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={editingTemplate.name}
                onChange={(e) => onTemplateChange({...editingTemplate, name: e.target.value})}
                placeholder="e.g., WELCOME_MESSAGE"
                disabled={isSaving}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={editingTemplate.category} 
                onValueChange={(value) => onTemplateChange({...editingTemplate, category: value})}
                disabled={isSaving}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="WELCOME">Welcome</SelectItem>
                  <SelectItem value="PURCHASE">Purchase Confirmation</SelectItem>
                  <SelectItem value="REMINDER">Event Reminder</SelectItem>
                  <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                  <SelectItem value="PROMOTION">Promotion</SelectItem>
                  <SelectItem value="VERIFICATION">Verification</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={editingTemplate.description || ''}
              onChange={(e) => onTemplateChange({...editingTemplate, description: e.target.value})}
              placeholder="Describe what this template is for..."
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Template Content *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleContentChange(defaultTemplate)}
                disabled={isSaving}
              >
                <Copy className="h-3 w-3 mr-1" />
                Use Default
              </Button>
            </div>
            <Textarea
              id="content"
              value={editingTemplate.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter your message template here. Use {{variable}} for dynamic content."
              rows={10}
              disabled={isSaving}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Characters: {editingTemplate.content.length} • 
                Variables: {editingTemplate.variables.length}
              </p>
              <p className="text-xs text-muted-foreground">
                SMS segments: {Math.ceil(editingTemplate.content.length / 160)}
              </p>
            </div>
          </div>

          {editingTemplate.variables.length > 0 && (
            <div className="p-3 bg-muted/50 rounded-md">
              <Label className="text-sm">Detected Variables</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {editingTemplate.variables.map(variable => (
                  <code 
                    key={variable} 
                    className="px-2 py-1 bg-background text-xs rounded border"
                  >
                    {'{{' + variable + '}}'}
                  </code>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={editingTemplate.isActive}
              onChange={(e) => onTemplateChange({...editingTemplate, isActive: e.target.checked})}
              className="h-4 w-4"
              disabled={isSaving}
            />
            <Label htmlFor="isActive">Template is active (can be used for sending)</Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            {editingTemplate.id && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onTemplateChange({
                  name: '',
                  description: '',
                  content: '',
                  variables: [],
                  category: 'GENERAL',
                  isActive: true
                })}
                disabled={isSaving}
              >
                New Template
              </Button>
            )}
          </div>
          <Button 
            type="submit" 
            disabled={isSaving || !editingTemplate.name.trim() || !editingTemplate.content.trim()}
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {editingTemplate.id ? 'Update Template' : 'Save Template'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}