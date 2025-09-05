import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Password strength validation (client-side)
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score += 1
  else feedback.push('At least 8 characters')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('One uppercase letter')

  if (/[a-z]/.test(password)) score += 1
  else feedback.push('One lowercase letter')

  if (/\d/.test(password)) score += 1
  else feedback.push('One number')

  if (/[!@#$%^&*(),.?\":{}|<>]/.test(password)) score += 1
  else feedback.push('One special character')

  return {
    isValid: score === 5,
    score,
    feedback
  }
}

// Format phone number for Australian format
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('61')) {
    return `+${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)} ${cleaned.substring(8)}`
  }
  
  if (cleaned.startsWith('04')) {
    return `+61 ${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`
  }
  
  return phone
}

// Debounce utility for form validation
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}