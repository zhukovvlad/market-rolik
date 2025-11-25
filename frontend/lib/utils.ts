import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const getApiUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (process.env.NODE_ENV === 'production' && !apiUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not defined in production environment');
  }

  return apiUrl || 'http://localhost:4000';
};

export const API_URL = getApiUrl();

