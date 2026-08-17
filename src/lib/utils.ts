import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number | string): string {
  return Number(value).toLocaleString('en-US')
}

export function formatDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('en-US')
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('en-US')
}
