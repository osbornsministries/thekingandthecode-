// app/admin/sms-templates/components/ManageTemplatesTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { SMSTemplate } from '@/lib/types/sms-templates';
import { TemplateForm } from './TemplateForm';
import { TemplatesList } from './TemplatesList';
import { saveTemplate, deleteTemplate, getVariablesAsArray } from '@/lib/utils/templateUtils';
import { Button } from '@/components/ui/button'; // Add this import
import { Label } from '@/components/ui/label'; // Add this import

interface ManageTemplatesTabProps {
  templates: SMSTemplate[];
  onTemplatesUpdate: (templates: SMSTemplate[]) => void;
  onUseTemplate?: (templateName: string) => void;
}

export function ManageTemplatesTab({ 
  templates, 
  onTemplatesUpdate,
  onUseTemplate 
}: ManageTemplatesTabProps) {
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate>({
    name: '',
    description: '',
    content: '',
    variables: [],
    category: 'GENERAL',
    isActive: true
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter templates based on search and category
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(templates.map(t => t.category).filter(Boolean))];

  const handleSaveTemplate = async (templateData: SMSTemplate) => {
    setIsSaving(true);
    
    try {
      // Ensure variables are properly formatted
      const templateToSave = {
        ...templateData,
        variables: Array.isArray(templateData.variables) ? templateData.variables : []
      };

      const savedTemplate = await saveTemplate(templateToSave);
      
      if (savedTemplate) {
        // Ensure saved template has proper variable format
        const normalizedTemplate = {
          ...savedTemplate,
          variables: getVariablesAsArray(savedTemplate)
        };

        if (templateData.id) {
          // Update existing template
          onTemplatesUpdate(
            templates.map(t => t.id === normalizedTemplate.id ? normalizedTemplate : t)
          );
          toast.success('Template updated successfully');
        } else {
          // Add new template
          onTemplatesUpdate([...templates, normalizedTemplate]);
          toast.success('Template created successfully');
        }
        
        // Reset form
        setEditingTemplate({
          name: '',
          description: '',
          content: '',
          variables: [],
          category: 'GENERAL',
          isActive: true
        });
      }
    } catch (error) {
      toast.error('Failed to save template');
      console.error('Save template error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(id);
    
    try {
      const success = await deleteTemplate(id);
      
      if (success) {
        onTemplatesUpdate(templates.filter(t => t.id !== id));
        toast.success('Template deleted successfully');
      } else {
        toast.error('Failed to delete template');
      }
    } catch (error) {
      toast.error('Failed to delete template');
      console.error('Delete template error:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditTemplate = (template: SMSTemplate) => {
    setEditingTemplate({
      ...template,
      // Ensure all required fields are present
      description: template.description || '',
      variables: getVariablesAsArray(template),
      category: template.category || 'GENERAL',
      isActive: template.isActive !== undefined ? template.isActive : true
    });
  };

  // Stats calculations
  const activeTemplates = templates.filter(t => t.isActive).length;
  const inactiveTemplates = templates.length - activeTemplates;
  const totalVariables = templates.reduce((sum, template) => {
    return sum + getVariablesAsArray(template).length;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">SMS Templates</h2>
          <p className="text-muted-foreground">
            Create and manage SMS templates for sending messages to ticket holders
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm">Search Templates</Label>
          <input
            id="search"
            type="text"
            placeholder="Search by name, description, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm">Filter by Category</Label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm">Quick Actions</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const defaultTemplate = {
                  name: `TEMPLATE_${Date.now()}`,
                  description: '',
                  content: `Hello {{fullName}}!\n\nYour ticket {{ticketCode}} is confirmed for {{eventDay}}.\n\nThank you!`,
                  variables: ['fullName', 'ticketCode', 'eventDay'],
                  category: 'GENERAL',
                  isActive: true
                };
                handleEditTemplate(defaultTemplate);
              }}
            >
              Quick Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // You can implement export functionality here
                toast.info('Export feature coming soon');
              }}
            >
              Export All
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <TemplateForm
            editingTemplate={editingTemplate}
            onTemplateChange={setEditingTemplate}
            onSave={handleSaveTemplate}
            isSaving={isSaving}
          />
        </div>

        <div className="lg:col-span-1">
          <TemplatesList
            templates={filteredTemplates}
            onEdit={handleEditTemplate}
            onDelete={handleDeleteTemplate}
            onUseTemplate={onUseTemplate}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {/* Template Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm font-medium">Active Templates</p>
          <p className="text-2xl font-bold text-green-600">{activeTemplates}</p>
          <p className="text-xs text-muted-foreground">Ready to use</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm font-medium">Total Templates</p>
          <p className="text-2xl font-bold">{templates.length}</p>
          <p className="text-xs text-muted-foreground">
            {inactiveTemplates} inactive
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm font-medium">Categories</p>
          <p className="text-2xl font-bold">
            {new Set(templates.map(t => t.category)).size}
          </p>
          <p className="text-xs text-muted-foreground">Unique categories</p>
        </div>
        <div className="p-4 border rounded-lg bg-card">
          <p className="text-sm font-medium">Total Variables</p>
          <p className="text-2xl font-bold">{totalVariables}</p>
          <p className="text-xs text-muted-foreground">Across all templates</p>
        </div>
      </div>

      {/* Help Information */}
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">Template Variables Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-700 mb-1">Available Variables</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <code className="bg-blue-100 px-1 rounded">{"{{fullName}}"}</code> - Purchaser's full name</li>
              <li>• <code className="bg-blue-100 px-1 rounded">{"{{phone}}"}</code> - Purchaser's phone number</li>
              <li>• <code className="bg-blue-100 px-1 rounded">{"{{ticketCode}}"}</code> - Unique ticket code</li>
              <li>• <code className="bg-blue-100 px-1 rounded">{"{{ticketType}}"}</code> - Ticket type (ADULT/STUDENT/CHILD)</li>
              <li>• <code className="bg-blue-100 px-1 rounded">{"{{eventDay}}"}</code> - Event day name</li>
              <li>• <code className="bg-blue-100 px-1 rounded">{"{{eventDate}}"}</code> - Event date</li>
              <li>• <code className="bg-blue-100 px-1 rounded">{"{{sessionName}}"}</code> - Session name</li>
              <li>• <code className="bg-blue-100 px-1 rounded">{"{{sessionTime}}"}</code> - Session time range</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 mb-1">Best Practices</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Keep messages under 160 characters for single SMS</li>
              <li>• Always test templates before sending to many recipients</li>
              <li>• Use descriptive template names for easy identification</li>
              <li>• Deactivate old templates instead of deleting them</li>
              <li>• Variables are case-sensitive: {"{{FullName}}"} ≠ {"{{fullName}}"}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}