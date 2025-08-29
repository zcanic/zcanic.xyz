import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

/**
 * Geometric background shapes component for consistent background
 * across different parts of the application
 */
export const GeometricBackground = (
  <div className="absolute inset-0 -z-10 overflow-hidden backdrop-blur-xl">
    {/* Yellow shape */}
    <div 
      className="absolute top-0 left-0 w-2/3 h-1/2 bg-gradient-to-br from-amber-300/30 to-amber-300/10 dark:from-amber-700/20 dark:to-amber-700/5 rounded-br-[100px]"
    />
    
    {/* Pink triangle */}
    <div 
      className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-pink-400/30 to-pink-400/10 dark:from-pink-800/20 dark:to-pink-800/5"
      style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
    />
    
    {/* Blue shape */}
    <div 
      className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-blue-400/30 to-blue-400/10 dark:from-blue-800/20 dark:to-blue-800/5"
    />
    
    {/* Light blue triangle */}
    <div 
      className="absolute right-0 bottom-0 w-2/3 h-1/2 bg-gradient-to-tl from-sky-300/30 to-sky-300/10 dark:from-sky-800/20 dark:to-sky-800/5"
      style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
    />
  </div>
);

/**
 * Shared backdrop blur class for consistent effect across components
 */
export const backdropBlurClass = "backdrop-blur-xl";

/**
 * LoadingContent component that maintains consistent background styling
 * while displaying a loading indicator
 */
function LoadingContent({ children, message, showBackground = false }) {
  return (
    <div className="flex justify-center items-center h-screen w-full max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6 relative">
      {showBackground && GeometricBackground}
      <div className="relative">
        <motion.div
          className="backdrop-blur-md bg-white/60 dark:bg-slate-800/50 p-6 rounded-xl shadow-lg flex flex-col items-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children || (
            <>
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-600 dark:text-slate-300">{message || '加载中...'}</p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

LoadingContent.propTypes = {
  children: PropTypes.node,
  message: PropTypes.string,
  showBackground: PropTypes.bool
};

export default LoadingContent; 