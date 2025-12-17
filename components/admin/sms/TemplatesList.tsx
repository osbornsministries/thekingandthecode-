// app/admin/sms-templates/components/TemplatesList.tsx
'use client';

import { Edit, Send, Trash2, Copy, Check, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SMSTemplate } from '@/lib/types/sms-templates';
import { getVariablesAsArray } from '@/lib/utils/templateUtils';
import { toast } from 'sonner';

interface TemplatesListProps {
  templates: SMSTemplate[];
  onEdit: (template: SMSTemplate) => void;
  onDelete: (id: number) => Promise<void>;
  onUseTemplate?: (templateName: string) => void;
  isDeleting?: number | null;
}

export function TemplatesList({ 
  templates, 
  onEdit, 
  onDelete, 
  onUseTemplate,
  isDeleting 
}: TemplatesListProps) {
  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Template copied to clipboard');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      GENERAL: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
      WELCOME: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
      PURCHASE: 'bg-green-100 text-green-800 hover:bg-green-100',
      REMINDER: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
      ANNOUNCEMENT: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
      PROMOTION: 'bg-pink-100 text-pink-800 hover:bg-pink-100',
      VERIFICATION: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100',
      CUSTOM: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 hover:bg-gray-100';
  };

  // Get variables safely as array
  const getSafeVariables = (template: SMSTemplate): string[] => {
    return getVariablesAsArray(template);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>SMS Templates</CardTitle>
          <CardDescription>Manage your existing templates</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Eye className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No templates found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first template using the form on the left
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>SMS Templates</CardTitle>
            <CardDescription>
              {templates.length} template{templates.length !== 1 ? 's' : ''} available
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            Active: {templates.filter(t => t.isActive).length}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-400px)]">
          <div className="space-y-4 pr-4">
            {templates.map(template => {
              const variables = getSafeVariables(template);
              
              return (
                <div 
                  key={template.id} 
                  className="p-4 border rounded-lg hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      {/* Template header with name and badges */}
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {template.name}
                        </h3>
                        <Badge 
                          variant="outline" 
                          className={getCategoryColor(template.category)}
                        >
                          {template.category}
                        </Badge>
                        {template.isActive ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 border-0">
                            <Check className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                            <X className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      
                      {/* Description */}
                      {template.description && (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      )}
                      
                      {/* Content preview */}
                      <div className="relative">
                        <div className="p-3 bg-muted/30 rounded-md border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Template Content</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyToClipboard(template.content)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="relative">
                            <pre className="text-sm font-mono whitespace-pre-wrap break-words max-h-24 overflow-y-auto pr-4">
                              {template.content}
                            </pre>
                            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-muted/30 to-transparent" />
                          </div>
                          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                            <span>{template.content.length} characters</span>
                            <span>{Math.ceil(template.content.length / 160)} SMS</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Variables section */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Variables</span>
                          <span className="text-xs text-muted-foreground">
                            {variables.length} variable{variables.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {variables.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {variables.map(variable => (
                              <Badge 
                                key={variable} 
                                variant="secondary" 
                                className="text-xs cursor-help hover:bg-secondary/80" 
                                title={`Will be replaced with actual data when sending`}
                              >
                                {'{{' + variable + '}}'}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            No variables detected in this template
                          </p>
                        )}
                      </div>
                      
                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                        <div>
                          <span>Created: {formatDate(template.createdAt)}</span>
                          {template.updatedAt && template.updatedAt !== template.createdAt && (
                            <span className="ml-2">• Updated: {formatDate(template.updatedAt)}</span>
                          )}
                        </div>
                        {template.language && (
                          <Badge variant="outline" className="text-xs">
                            {template.language.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(template)}
                        className="flex items-center justify-center"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      
                      {onUseTemplate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUseTemplate(template.name)}
                          className="flex items-center justify-center"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          Use
                        </Button>
                      )}
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => template.id && onDelete(template.id)}
                        disabled={isDeleting === template.id}
                        className="flex items-center justify-center"
                      >
                        {isDeleting === template.id ? (
                          <>
                            <span className="animate-spin mr-1">⟳</span>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                      
                      {/* Quick copy button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyToClipboard(template.content)}
                        className="flex items-center justify-center text-xs"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Content
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}