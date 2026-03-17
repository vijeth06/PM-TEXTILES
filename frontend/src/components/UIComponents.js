import React from 'react';

/**
 * Professional Card Component
 */
export const Card = ({ children, className = '', variant = 'default', hover = true }) => {
  const variants = {
    default: 'panel-elevated rounded-2xl',
    elevated: 'panel-elevated rounded-2xl',
    glass: 'panel-elevated rounded-2xl backdrop-blur-sm',
    gradient: 'rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-cyan-50 shadow-sm',
  };

  return (
    <div className={`${variants[variant]} ${hover ? 'hover:shadow-lg transition-all duration-200' : ''} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Professional Button Component
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  isLoading = false,
  icon: Icon,
  ...props
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white disabled:opacity-50',
    accent: 'bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-50',
    ghost: 'text-gray-700 hover:bg-gray-100 disabled:opacity-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`
        font-semibold rounded-lg transition-colors duration-200 
        flex items-center justify-center space-x-2 whitespace-nowrap
        ${variants[variant]} ${sizes[size]} ${className}
        ${!disabled && 'hover:shadow-sm'}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="h-5 w-5" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

/**
 * Badge Component
 */
export const Badge = ({ children, variant = 'primary', size = 'md' }) => {
  const variants = {
    primary: 'bg-blue-100 text-blue-800 border border-blue-200',
    secondary: 'bg-amber-100 text-amber-800 border border-amber-200',
    accent: 'bg-teal-100 text-teal-800 border border-teal-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    danger: 'bg-red-100 text-red-800 border border-red-200',
    gray: 'bg-gray-100 text-gray-800 border border-gray-200',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

/**
 * Input Component
 */
export const Input = ({
  label,
  error,
  icon: Icon,
  variant = 'default',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          className={`
            w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200
            ${Icon ? 'pl-12' : ''}
            ${error
              ? 'border-2 border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500'
              : 'border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
            }
            focus:outline-none
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
};

/**
 * Stat Card Component
 */
export const StatCard = ({
  title,
  value,
  unit = '',
  change,
  icon: Icon,
  trend = 'up',
  color = 'blue',
  className = ''
}) => {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-200', icon: 'text-blue-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200', icon: 'text-amber-600' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-900', border: 'border-teal-200', icon: 'text-teal-600' },
    green: { bg: 'bg-green-50', text: 'text-green-900', border: 'border-green-200', icon: 'text-green-600' },
    red: { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-200', icon: 'text-red-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-900', border: 'border-purple-200', icon: 'text-purple-600' },
  };
  const tone = colorMap[color] || colorMap.blue;

  return (
    <Card className={`${tone.bg} border ${tone.border} p-5 sm:p-6 relative overflow-hidden ${className}`}>
      <div className="pr-10">
        <p className={`text-xs font-semibold uppercase tracking-wide ${tone.text} opacity-75`}>{title}</p>
        <div className="mt-2 flex items-baseline space-x-2">
          <span className={`text-3xl font-extrabold tracking-tight ${tone.text}`}>{value}</span>
          {unit && <span className={`text-sm font-medium ${tone.text} opacity-70`}>{unit}</span>}
        </div>
        
        {change !== undefined && (
          <div className="mt-3 flex items-center space-x-1">
            <svg
              className={`w-4 h-4 ${trend === 'up' ? 'text-green-300' : 'text-red-300'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d={trend === 'up' ? 'M3 10a7 7 0 1114 0 7 7 0 01-14 0z' : 'M10 3a7 7 0 100 14 7 7 0 000-14z'} />
            </svg>
            <span className="text-gray-700 text-sm font-medium">{change}% {trend === 'up' ? 'increase' : 'decrease'}</span>
          </div>
        )}
      </div>
      {Icon && (
        <div className="absolute right-4 top-4 rounded-lg bg-white/80 border border-white p-1.5">
          <Icon className={`h-5 w-5 ${tone.icon}`} />
        </div>
      )}
    </Card>
  );
};

/**
 * Section Header Component
 */
export const SectionHeader = ({ title, subtitle, action, icon: Icon }) => {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="p-2 bg-sky-100 rounded-xl border border-sky-200">
              <Icon className="h-5 w-5 text-sky-700" />
            </div>
          )}
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">{title}</h2>
            {subtitle && <p className="text-gray-600 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

/**
 * Alert Component
 */
export const Alert = ({ type = 'info', title, message, icon: Icon, onClose }) => {
  const typeClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const iconColors = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  return (
    <div className={`border rounded-lg p-4 ${typeClasses[type]} flex items-start space-x-3`}>
      {Icon && <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${iconColors[type]}`} />}
      <div className="flex-1">
        {title && <h3 className="font-semibold">{title}</h3>}
        {message && <p className="text-sm mt-1">{message}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * Progress Bar Component
 */
export const ProgressBar = ({ value, max = 100, color = 'blue', showLabel = true, animated = true }) => {
  const colorClasses = {
    blue: 'bg-blue-600',
    amber: 'bg-amber-600',
    teal: 'bg-teal-600',
    green: 'bg-green-600',
  };

  const percentage = (value / max) * 100;

  return (
    <div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${colorClasses[color]} ${animated ? 'transition-all duration-500' : ''}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      {showLabel && (
        <p className="text-xs text-gray-600 mt-1.5">{value} / {max} ({percentage.toFixed(0)}%)</p>
      )}
    </div>
  );
};

const UIComponents = {
  Card,
  Button,
  Badge,
  Input,
  StatCard,
  SectionHeader,
  Alert,
  ProgressBar,
};

export default UIComponents;
