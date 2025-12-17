// app/admin/sms-templates/components/MessageConfiguration.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy } from 'lucide-react';
import { SMSTemplate } from '@/lib/types/sms-templates';

interface MessageConfigurationProps {
  templates: SMSTemplate[];
  selectedTemplate: string;
  customMessage: string;
  onTemplateSelect: (template: string) => void;
  onCustomMessageChange: (message: string) => void;
  onUseTemplate: () => void;
}

export function MessageConfiguration({
  templates,
  selectedTemplate,
  customMessage,
  onTemplateSelect,
  onCustomMessageChange,
  onUseTemplate,
}: MessageConfigurationProps) {
  const selectedTemplateObj = templates.find(t => t.name === selectedTemplate);
  
  // Safely get variables as an array
  const getVariablesArray = (): string[] => {
    if (!selectedTemplateObj || !selectedTemplateObj.variables) {
      return [];
    }
    
    // Handle case where variables might be a string (JSON) or already an array
    if (typeof selectedTemplateObj.variables === 'string') {
      try {
        const parsed = JSON.parse(selectedTemplateObj.variables);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    
    if (Array.isArray(selectedTemplateObj.variables)) {
      return selectedTemplateObj.variables;
    }
    
    return [];
  };

  const variables = getVariablesArray();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Configuration</CardTitle>
        <CardDescription>Select template and customize message</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select Template</Label>
          <Select value={selectedTemplate} onValueChange={onTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(template => (
                <SelectItem key={template.id || template.name} value={template.name}>
                  {template.name} ({template.category})
                  {!template.isActive && ' (Inactive)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTemplateObj && !selectedTemplateObj.isActive && (
            <p className="text-sm text-amber-600 mt-1">
              Note: This template is currently inactive
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Custom Message</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={onUseTemplate}
              disabled={!selectedTemplateObj}
            >
              <Copy className="h-3 w-3 mr-1" />
              Use Template
            </Button>
          </div>
          <Textarea
            value={customMessage}
            onChange={(e) => onCustomMessageChange(e.target.value)}
            placeholder="Enter your message here..."
            rows={8}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Use {'{{variable}}'} for dynamic content
            </p>
            <p className="text-xs text-muted-foreground">
              {customMessage.length} characters • {Math.ceil(customMessage.length / 160)} SMS
            </p>
          </div>
        </div>

        {variables.length > 0 && (
          <div className="space-y-2">
            <Label>Available Variables</Label>
            <div className="flex flex-wrap gap-2">
              {variables.map(variable => (
                <Badge 
                  key={variable} 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80" 
                  title="Click to copy"
                  onClick={() => {
                    navigator.clipboard.writeText(`{{${variable}}}`);
                  }}
                >
                  {'{{' + variable + '}}'}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Variables will be automatically replaced with ticket data
            </p>
          </div>
        )}

        {selectedTemplateObj && variables.length === 0 && (
          <div className="p-3 bg-muted/30 rounded-md">
            <p className="text-sm">
              No variables detected in this template. Add variables using {'{{variableName}}'} format.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}