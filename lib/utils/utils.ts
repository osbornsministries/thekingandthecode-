export function formatCurrency(amount: number | string | null, currency: string = 'TZS'): string {
  const value = Number(amount || 0);
  return new Intl.NumberFormat('en-TZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-TZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function getPercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return Number((((newValue - oldValue) / oldValue) * 100).toFixed(1));
}

export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  const start = new Date(now.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getLastWeekRange(): { start: Date; end: Date } {
  const { start, end } = getCurrentWeekRange();
  start.setDate(start.getDate() - 7);
  end.setDate(end.getDate() - 7);
  return { start, end };
}

export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}