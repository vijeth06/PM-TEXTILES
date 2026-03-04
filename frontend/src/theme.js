// Textile Management System - Professional Design System
export const theme = {
  colors: {
    // Primary - Professional Deep Blue (Trust, Stability)
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    
    // Secondary - Golden/Amber (Textile, Luxury, Quality)
    secondary: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    
    // Accent - Teal (Innovation, Quality, Growth)
    accent: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
    
    // Semantic Colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Neutrals
    white: '#ffffff',
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Dark mode backgrounds
    dark: {
      bg: '#0f172a',
      surface: '#1e293b',
      border: '#334155',
    }
  },
  
  // Formal palette tokens (solid surfaces)
  gradients: {
    primaryGradient: 'bg-blue-700',
    secondaryGradient: 'bg-amber-600',
    accentGradient: 'bg-teal-700',
    luxuryGradient: 'bg-slate-800',
    warmGradient: 'bg-amber-600',
    coolGradient: 'bg-blue-600',
  },
  
  // Typography
  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    heading: "'Poppins', sans-serif",
    mono: "'Fira Code', monospace",
  },
  
  // Shadows for depth
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    gloss: '0 20px 25px -5px rgba(59, 130, 246, 0.15)',
  },
  
  // Spacing
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    '2xl': '4rem',
  },
  
  // Border radius
  radius: {
    none: '0',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  }
};

// Tailwind CSS color utility helpers
export const colorClasses = {
  primary: 'text-blue-600 bg-blue-50 border-blue-200',
  secondary: 'text-amber-600 bg-amber-50 border-amber-200',
  accent: 'text-teal-600 bg-teal-50 border-teal-200',
  success: 'text-green-600 bg-green-50 border-green-200',
  warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  error: 'text-red-600 bg-red-50 border-red-200',
};

// Card styles
export const cardStyles = {
  default: 'bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200',
  premium: 'bg-white rounded-lg shadow-md border border-gray-200',
  glass: 'bg-white rounded-lg shadow-sm border border-gray-200',
};

// Button styles
export const buttonStyles = {
  primary: 'bg-blue-700 hover:bg-blue-800 text-white',
  secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
  accent: 'bg-teal-700 hover:bg-teal-800 text-white',
  outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
};

export default theme;
