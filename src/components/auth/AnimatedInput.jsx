import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function AnimatedInput({
  id,
  name,
  type = 'text',
  label,
  placeholder = '',
  icon,
  value,
  onChange,
  disabled = false,
  required = false,
  autoComplete = '',
  className = '',
  animationDelay = 0,
  error = false,
  onFocus = () => {},
  onBlur = () => {},
}) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  
  // Custom handler to combine internal state with parent callbacks
  const handleFocusWithCallback = (e) => {
    setIsFocused(true);
    onFocus(e);
  };
  
  const handleBlurWithCallback = (e) => {
    setIsFocused(false);
    onBlur(e);
  };

  return (
    <motion.div 
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: animationDelay / 1000 }}
    >
      {/* Floating label */}
      <motion.div 
        className={`absolute left-12 top-1/2 pointer-events-none
                  text-sm transition-opacity ${error ? 'text-red-500' : 'text-gray-500'}`}
        animate={{ 
          y: isFocused || value ? -20 : 0, 
          scale: isFocused || value ? 0.85 : 1,
          opacity: isFocused || value ? 1 : 0.7,
          color: error ? '#ff3b30' : isFocused ? '#0071e3' : '#8e8e93'
        }}
        style={{ transformOrigin: 'left center' }}
        transition={{ duration: 0.2 }}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </motion.div>
      
      {/* Icon container */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {icon}
      </div>
      
      {/* Input field */}
      <motion.input
        ref={inputRef}
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        onFocus={handleFocusWithCallback}
        onBlur={handleBlurWithCallback}
        className={`block w-full pl-10 py-4 border-0 rounded-xl
                  bg-white/70 dark:bg-slate-700/70 backdrop-blur-sm 
                  text-base outline-none shadow-sm transition-shadow duration-200
                  dark:text-white disabled:opacity-60
                  ${error ? 'ring-1 ring-red-500' : 'ring-1 ring-gray-200 dark:ring-slate-600'}
                  ${isFocused ? (error ? 'ring-2 ring-red-500' : 'ring-2 ring-blue-500') : ''}`}
        placeholder={isFocused ? placeholder : ''}
        animate={{ 
          boxShadow: isFocused 
            ? error 
              ? '0 0 0 3px rgba(255, 59, 48, 0.2)' 
              : '0 0 0 3px rgba(0, 113, 227, 0.2)' 
            : error 
              ? '0 0 0 1px rgba(255, 59, 48, 0.5)' 
              : '0 0 0 1px rgba(0, 0, 0, 0.1)' 
        }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Focus indicator animation */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            className={`absolute bottom-0 left-1/2 h-0.5 rounded-full
                      ${error ? 'bg-red-500' : 'bg-blue-500'}`}
            initial={{ width: 0, x: '-50%', opacity: 0 }}
            animate={{ width: '90%', x: '-50%', opacity: 1 }}
            exit={{ width: 0, x: '-50%', opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AnimatedInput; 