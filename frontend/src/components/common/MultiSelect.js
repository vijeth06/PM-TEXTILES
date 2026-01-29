import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const MultiSelect = ({ 
  label, 
  options = [], 
  value = [], 
  onChange, 
  placeholder = 'Select options...',
  className = '',
  error,
  help
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (optionValue) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleRemove = (optionValue, e) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== optionValue));
  };

  const getOptionLabel = (optionValue) => {
    const option = options.find(opt => opt.value === optionValue);
    return option ? option.label : optionValue;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      {/* Selected Values Display */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          min-h-[42px] px-3 py-2 border rounded-md shadow-sm cursor-pointer
          ${error ? 'border-red-300' : 'border-gray-300'}
          focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500
          bg-white
        `}
      >
        {value.length === 0 ? (
          <span className="text-gray-400">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {value.map((val) => (
              <span
                key={val}
                className="inline-flex items-center px-2 py-1 rounded text-sm bg-blue-100 text-blue-800"
              >
                {getOptionLabel(val)}
                <button
                  onClick={(e) => handleRemove(val, e)}
                  className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No options available</div>
          ) : (
            options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleToggle(option.value)}
                className={`
                  px-3 py-2 cursor-pointer hover:bg-gray-100
                  ${value.includes(option.value) ? 'bg-blue-50' : ''}
                `}
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value.includes(option.value)}
                    onChange={() => {}}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{option.label}</span>
                </label>
              </div>
            ))
          )}
        </div>
      )}

      {help && !error && <p className="mt-1 text-sm text-gray-500">{help}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default MultiSelect;
