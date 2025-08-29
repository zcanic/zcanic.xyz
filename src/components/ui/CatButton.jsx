import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

/**
 * Cat-themed button component with hover animations
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Button content
 * @param {string} props.variant - Button style variant ('primary', 'secondary', 'outline', 'ghost', 'danger')
 * @param {string} props.size - Button size ('sm', 'md', 'lg')
 * @param {boolean} props.hasTail - Whether to show decorative cat tail on hover
 * @param {boolean} props.hasEars - Whether to show decorative cat ears on hover
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {boolean} props.isLoading - Whether to show loading state
 * @param {boolean} props.fullWidth - Whether button should take full width
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} props.rest - Other button props
 * @returns {JSX.Element} - The rendered button
 */
function CatButton({
  children,
  variant = 'primary',
  size = 'md',
  hasTail = false,
  hasEars = false,
  className = '',
  disabled = false,
  isLoading = false,
  fullWidth = false,
  ...rest
}) {
  // Base classes based on variant
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blush-400 to-blush-500 hover:from-blush-500 hover:to-blush-600 text-white shadow-sm',
    secondary: 'bg-gradient-to-r from-night-400 to-night-500 hover:from-night-500 hover:to-night-600 text-white shadow-sm',
    outline: 'border-2 border-blush-300 dark:border-blush-500/50 text-blush-500 dark:text-blush-300 hover:bg-blush-50 dark:hover:bg-blush-500/10 bg-transparent',
    ghost: 'text-mocha-600 dark:text-cream-100/80 hover:bg-cream-50 dark:hover:bg-dark-border/30 bg-transparent',
    danger: 'bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white shadow-sm',
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-4 py-1.5',
    md: 'text-sm px-6 py-2',
    lg: 'text-base px-8 py-3',
  };

  // Determine if button has decorative elements
  const showDecorations = !disabled && !isLoading && (hasTail || hasEars);

  // Generate class names based on props
  const buttonClasses = cn(
    'relative font-medium rounded-full transition-all duration-300 flex items-center justify-center',
    variantClasses[variant] || variantClasses.primary,
    sizeClasses[size] || sizeClasses.md,
    fullWidth ? 'w-full' : '',
    disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95',
    className
  );

  // Loading spinner component
  const LoadingSpinner = () => (
    <motion.div 
      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
  );

  // Decorative cat ear animation
  const CatEars = () => (
    <>
      <motion.div
        className={`absolute -top-2 -left-0.5 w-3 h-3 origin-bottom-right ${variant === 'outline' ? 'bg-blush-300 dark:bg-blush-400' : 'bg-white/80'} rounded-tl-full opacity-0`}
        initial={{ opacity: 0, scale: 0, rotate: -30 }}
        whileHover={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className={`absolute -top-2 -right-0.5 w-3 h-3 origin-bottom-left ${variant === 'outline' ? 'bg-blush-300 dark:bg-blush-400' : 'bg-white/80'} rounded-tr-full opacity-0`}
        initial={{ opacity: 0, scale: 0, rotate: 30 }}
        whileHover={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.2 }}
      />
    </>
  );

  // Decorative cat tail animation
  const CatTail = () => (
    <motion.div 
      className={`absolute -bottom-2 -right-2 w-2 h-8 origin-top ${variant === 'outline' ? 'bg-blush-300 dark:bg-blush-400' : 'bg-white/80'} rounded-b-full opacity-0`}
      initial={{ opacity: 0, scaleY: 0 }}
      whileHover={{ 
        opacity: 1, 
        scaleY: 1,
        rotate: [-5, 5, -5],
        transition: { 
          opacity: { duration: 0.2 },
          scaleY: { duration: 0.2 },
          rotate: { 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 0.2
          }
        }
      }}
    />
  );

  return (
    <motion.button
      className={buttonClasses}
      disabled={disabled || isLoading}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.03 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      {...rest}
    >
      {/* Cat ears decoration (optional) */}
      {hasEars && showDecorations && <CatEars />}
      
      {/* Button content */}
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>加载中...</span>
        </>
      ) : (
        children
      )}
      
      {/* Cat tail decoration (optional) */}
      {hasTail && showDecorations && <CatTail />}
    </motion.button>
  );
}

export default CatButton; 