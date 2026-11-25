import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}
