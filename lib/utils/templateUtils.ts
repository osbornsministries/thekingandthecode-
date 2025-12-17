// app/admin/sms-templates/utils/templateUtils.ts
import { SMSTemplate } from "@/lib/types/sms-templates";

export const extractVariables = (content: string): string[] => {
  const variables: string[] = [];
  const regex = /\{\{(\w+)\}\}/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }
  return variables;
};

export const getVariablesAsArray = (template: SMSTemplate): string[] => {
  if (!template.variables) return [];
  
  if (Array.isArray(template.variables)) {
    return template.variables;
  }
  
  if (typeof template.variables === 'string') {
    try {
      const parsed = JSON.parse(template.variables);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  
  return [];
};

export const saveTemplate = async (
  template: SMSTemplate
): Promise<SMSTemplate | null> => {
  if (!template.name || !template.content) {
    throw new Error('Name and content are required');
  }

  try {
    const url = template.id 
      ? `/api/admin/sms-templates/${template.id}`
      : '/api/admin/sms-templates';
    
    const method = template.id ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...template,
        // Ensure variables is properly formatted
        variables: getVariablesAsArray(template)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save template');
    }

    const savedTemplate = await response.json();
    
    // Normalize the returned template
    return {
      ...savedTemplate,
      variables: getVariablesAsArray(savedTemplate)
    };
  } catch (error) {
    console.error('Save template error:', error);
    throw error;
  }
};

export const deleteTemplate = async (
  id: number
): Promise<boolean> => {
  try {
    const response = await fetch(`/api/admin/sms-templates/${id}`, { 
      method: 'DELETE' 
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete template');
    }

    return true;
  } catch (error) {
    console.error('Delete template error:', error);
    throw error;
  }
};

export const validateTemplateContent = (content: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!content.trim()) {
    errors.push('Template content is required');
  }
  
  if (content.length > 1000) {
    errors.push('Template content cannot exceed 1000 characters');
  }
  
  // Check for unclosed variables
  const unclosedVariables = content.match(/\{\{[^}]*$/g);
  if (unclosedVariables) {
    errors.push('Unclosed variable syntax detected');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const calculateSMSUnits = (content: string): number => {
  // SMS are typically 160 characters per segment
  return Math.ceil(content.length / 160);
};

export const formatTemplateForExport = (templates: SMSTemplate[]): string => {
  const exportData = templates.map(template => ({
    name: template.name,
    description: template.description,
    content: template.content,
    variables: getVariablesAsArray(template),
    category: template.category,
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt
  }));
  
  return JSON.stringify(exportData, null, 2);
};

export const importTemplatesFromJSON = (jsonString: string): SMSTemplate[] => {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Import data must be an array');
    }
    
    return parsed.map((template: any) => ({
      ...template,
      variables: Array.isArray(template.variables) ? template.variables : [],
      isActive: template.isActive !== undefined ? template.isActive : true,
      category: template.category || 'GENERAL'
    }));
  } catch (error) {
    console.error('Import templates error:', error);
    throw new Error('Invalid JSON format for templates');
  }
};

// Helper to create a default template
export const createDefaultTemplate = (): SMSTemplate => {
  const defaultContent = `Hello {{fullName}}!

Your ticket {{ticketCode}} is confirmed for {{eventDay}} - {{sessionName}}.

Date: {{eventDate}}
Time: {{sessionTime}}

Thank you for your purchase!`;

  return {
    name: `TEMPLATE_${Date.now()}`,
    description: 'Default welcome template',
    content: defaultContent,
    variables: extractVariables(defaultContent),
    category: 'WELCOME',
    isActive: true
  };
};

// Helper to duplicate a template
export const duplicateTemplate = (template: SMSTemplate): SMSTemplate => {
  return {
    ...template,
    id: undefined,
    name: `${template.name}_COPY_${Date.now()}`,
    description: template.description ? `${template.description} (Copy)` : 'Copy',
    createdAt: undefined,
    updatedAt: undefined
  };
};

// Helper to check if template name is unique
export const isTemplateNameUnique = (templates: SMSTemplate[], name: string, excludeId?: number): boolean => {
  return !templates.some(template => 
    template.name.toLowerCase() === name.toLowerCase() && 
    template.id !== excludeId
  );
};