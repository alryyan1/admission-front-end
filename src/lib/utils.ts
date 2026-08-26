import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import dayjs from 'dayjs'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(value: number | string): string {
  return Number(value).toLocaleString('en-US')
}

export function formatDate(value: string | Date): string {
  return dayjs(value).format('DD/MM/YYYY')
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString('en-US')
}
