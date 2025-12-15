// lib/utils/sorting.ts
export type SortField = 'day' | 'session' | 'ticketType' | 'createdAt' | 'totalAmount' | 'purchaserName';
export type SortOrder = 'asc' | 'desc';

export interface SortParams {
  field?: SortField;
  order?: SortOrder;
}

export function parseSortParams(sortParam?: string): SortParams {
  if (!sortParam) return {};
  
  const [field, order] = sortParam.split(':') as [SortField, SortOrder];
  return { 
    field: ['day', 'session', 'ticketType', 'createdAt', 'totalAmount', 'purchaserName'].includes(field) ? field : undefined,
    order: order === 'asc' || order === 'desc' ? order : 'desc'
  };
}