import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function AnimatedButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  variant = 'primary',
  size = 'medium',
  animationDelay = 0,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  withTrail = true // Not implemented in this simplified version
}) {
  const buttonRef = useRef(null);
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    success: 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white',
    danger: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white',
    ghost: 'bg-transparent text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
  };
  
  // Size classes
  const sizeClasses = {
    small: 'py-1.5 px-3 text-sm',
    medium: 'py-2.5 px-4',
    large: 'py-3.5 px-6 text-lg'
  };
  
  // Loading spinner with animation
  const LoadingSpinner = () => (
    <div className="mr-2">
      <motion.div 
        className="w-4 h-4 border-2 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
  
  return (
    <div className={`relative inline-block ${fullWidth ? 'w-full' : ''}`}>
      {/* Button element */}
      <motion.button
        ref={buttonRef}
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        className={`relative z-10 font-medium rounded-xl shadow-sm outline-none
                  focus:outline-none focus:ring-2 focus:ring-offset-1 
                  focus:ring-blue-300 dark:focus:ring-blue-700
                  disabled:opacity-60 disabled:pointer-events-none
                  transition-shadow flex items-center justify-center
                  ${variantClasses[variant]}
                  ${sizeClasses[size]}
                  ${fullWidth ? 'w-full' : ''}
                  ${className}`}
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.3, 
          delay: animationDelay / 1000 
        }}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      >
        {/* Loading spinner */}
        {loading && <LoadingSpinner />}
        
        {/* Icon (left) */}
        {icon && iconPosition === 'left' && !loading && (
          <span className="mr-2">{icon}</span>
        )}
        
        {/* Button text */}
        <span>{children}</span>
        
        {/* Icon (right) */}
        {icon && iconPosition === 'right' && !loading && (
          <span className="ml-2">{icon}</span>
        )}
        
        {/* Highlight overlay for press effect */}
        <motion.div 
          className="absolute inset-0 rounded-xl bg-white pointer-events-none"
          initial={{ opacity: 0 }}
          whileTap={{ opacity: 0.15 }}
        />
      </motion.button>
    </div>
  );
}

export default AnimatedButton; 