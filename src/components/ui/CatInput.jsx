import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * A cat-themed input component
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (text, password, email, etc.)
 * @param {string} props.placeholder - Input placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {ReactNode} props.icon - Icon to display at start of input
 * @param {ReactNode} props.rightIcon - Icon to display at end of input
 * @param {boolean} props.error - Whether the input has an error
 * @param {string} props.errorMessage - Error message to display
 * @param {boolean} props.fullWidth - Whether the input should take full width
 * @param {React.InputHTMLAttributes<HTMLInputElement>} props.rest - Other input props
 * @returns {JSX.Element} - The rendered input
 */
function CatInput({
  type = 'text',
  placeholder = '',
  value,
  onChange,
  disabled = false,
  className = '',
  icon,
  rightIcon,
  error = false,
  errorMessage = '',
  fullWidth = false,
  ...rest
}) {
  const [isFocused, setIsFocused] = useState(false);

  // Determine paw print position based on value length
  const pawPosition = value ? Math.min(Math.max((value.length * 10), 0), 90) : 0;

  // Conditional container classes
  const containerClasses = cn(
    'relative group',
    fullWidth ? 'w-full' : '',
    className
  );

  // Conditional input classes
  const inputClasses = cn(
    'input-zcanic transition-all duration-300 w-full',
    icon ? 'pl-10' : 'pl-4',
    rightIcon ? 'pr-10' : 'pr-4',
    error ? 'border-red-400 dark:border-red-500 focus:ring-red-300 dark:focus:ring-red-500/50' : '',
    disabled ? 'opacity-60 cursor-not-allowed' : '',
  );

  // Paw decoration that moves as you type
  const PawDecoration = () => (
    <motion.div
      className="absolute bottom-0 left-0 w-full h-0.5 pointer-events-none"
      style={{ x: `${pawPosition}%` }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {isFocused && !error && (
        <motion.div
          className="absolute w-6 h-6 -top-6 -right-3 text-blush-400 dark:text-blush-500"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <svg 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M12,8.5A1.5,1.5,0,1,1,13.5,7,1.5,1.5,0,0,1,12,8.5Zm-3.5-1A1.5,1.5,0,1,0,7,6,1.5,1.5,0,0,0,8.5,7.5Zm7,0A1.5,1.5,0,1,0,17,6,1.5,1.5,0,0,0,15.5,7.5ZM12,15a4,4,0,0,0-4-4,1.5,1.5,0,1,0,0,3,1,1,0,0,1,1,1,1.5,1.5,0,0,0,3,0Zm5-4a1.5,1.5,0,1,0,0,3,1,1,0,0,1,1,1,1.5,1.5,0,0,0,3,0A4,4,0,0,0,17,11Z" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className={containerClasses}>
      {/* Input with icons */}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mocha-400 dark:text-cream-100/60">
            {icon}
          </div>
        )}
        
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mocha-400 dark:text-cream-100/60">
            {rightIcon}
          </div>
        )}
        
        <PawDecoration />
      </div>
      
      {/* Error message */}
      {error && errorMessage && (
        <motion.p
          className="text-xs text-red-500 mt-1 pl-1"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {errorMessage}
        </motion.p>
      )}
    </div>
  );
}

export default CatInput; 