import React from 'react';
import { motion } from 'framer-motion';

/**
 * A cat-themed loading spinner component
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the loader ('sm', 'md', 'lg', or 'xl')
 * @param {string} props.message - Optional loading message to display
 * @param {string} props.className - Additional CSS classes to apply
 * @returns {JSX.Element} - The rendered component
 */
function CatLoader({ size = 'md', message = '', className = '' }) {
  // Size mappings
  const sizeClasses = {
    sm: 'w-16 h-16',  // Small
    md: 'w-24 h-24',  // Medium (default)
    lg: 'w-32 h-32',  // Large 
    xl: 'w-40 h-40',  // Extra large
  };
  
  const containerSize = sizeClasses[size] || sizeClasses.md;
  
  // Paw prints that will move in a circular pattern
  const pawPositions = [
    { rotate: 0, originX: 0.5, originY: 2.5, scale: 0.8 },
    { rotate: 45, originX: 1.5, originY: 2, scale: 0.85 },
    { rotate: 90, originX: 2, originY: 1, scale: 0.9 },
    { rotate: 135, originX: 2, originY: 0, scale: 0.95 },
    { rotate: 180, originX: 1, originY: -0.5, scale: 1 },
    { rotate: 225, originX: 0, originY: 0, scale: 0.95 },
    { rotate: 270, originX: -0.5, originY: 1, scale: 0.9 },
    { rotate: 315, originX: 0, originY: 2, scale: 0.85 },
  ];
  
  // Cat paw SVG path
  const PawPrint = ({ delay, custom }) => (
    <motion.div
      className="absolute"
      style={{ 
        left: '50%', 
        top: '50%',
      }}
      custom={custom}
      animate={{
        x: [0, 0],
        y: [0, 0],
        scale: [
          pawPositions[0].scale,
          pawPositions[1].scale,
          pawPositions[2].scale,
          pawPositions[3].scale,
          pawPositions[4].scale,
          pawPositions[5].scale,
          pawPositions[6].scale,
          pawPositions[7].scale,
          pawPositions[0].scale,
        ],
        rotate: [
          pawPositions[0].rotate,
          pawPositions[1].rotate,
          pawPositions[2].rotate,
          pawPositions[3].rotate,
          pawPositions[4].rotate,
          pawPositions[5].rotate,
          pawPositions[6].rotate,
          pawPositions[7].rotate,
          pawPositions[0].rotate + 360,
        ],
        originX: [
          pawPositions[0].originX,
          pawPositions[1].originX,
          pawPositions[2].originX,
          pawPositions[3].originX,
          pawPositions[4].originX,
          pawPositions[5].originX,
          pawPositions[6].originX,
          pawPositions[7].originX,
          pawPositions[0].originX,
        ],
        originY: [
          pawPositions[0].originY,
          pawPositions[1].originY,
          pawPositions[2].originY,
          pawPositions[3].originY,
          pawPositions[4].originY,
          pawPositions[5].originY,
          pawPositions[6].originY,
          pawPositions[7].originY,
          pawPositions[0].originY,
        ],
        opacity: [0.7, 0.8, 0.9, 1, 0.9, 0.8, 0.7, 0.6, 0.7],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear",
        delay: delay,
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="text-blush-400 dark:text-blush-500"
      >
        <path d="M12,8.5A1.5,1.5,0,1,1,13.5,7,1.5,1.5,0,0,1,12,8.5Zm-3.5-1A1.5,1.5,0,1,0,7,6,1.5,1.5,0,0,0,8.5,7.5Zm7,0A1.5,1.5,0,1,0,17,6,1.5,1.5,0,0,0,15.5,7.5ZM12,15a4,4,0,0,0-4-4,1.5,1.5,0,1,0,0,3,1,1,0,0,1,1,1,1.5,1.5,0,0,0,3,0Zm5-4a1.5,1.5,0,1,0,0,3,1,1,0,0,1,1,1,1.5,1.5,0,0,0,3,0A4,4,0,0,0,17,11Z" />
      </svg>
    </motion.div>
  );

  // Cat face in the center
  const CatFace = () => (
    <motion.div
      className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-gradient-to-r from-blush-400 to-night-400 rounded-full flex items-center justify-center"
      animate={{ 
        scale: [1, 1.05, 1],
        rotate: [0, 5, -5, 0],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Cat ears */}
      <div className="absolute -top-[25%] -left-[5%] w-[40%] h-[40%] bg-blush-400 rounded-tl-[100%]" />
      <div className="absolute -top-[25%] -right-[5%] w-[40%] h-[40%] bg-blush-400 rounded-tr-[100%]" />
      
      {/* Cat eyes */}
      <div className="absolute w-[20%] h-[20%] bg-white rounded-full left-[30%] top-[35%]" />
      <div className="absolute w-[20%] h-[20%] bg-white rounded-full right-[30%] top-[35%]" />
      <div className="absolute w-[10%] h-[10%] bg-night-600 rounded-full left-[35%] top-[40%]" />
      <div className="absolute w-[10%] h-[10%] bg-night-600 rounded-full right-[35%] top-[40%]" />
      
      {/* Cat nose and mouth */}
      <div className="absolute w-[15%] h-[8%] bg-night-500 rounded-full left-[42.5%] top-[60%]" />
      <div className="absolute w-[10%] h-[5%] border-b-2 border-night-500 rounded-full left-[45%] top-[70%]" />
    </motion.div>
  );

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${containerSize}`}>
        {/* Circular track */}
        <div className="absolute inset-0 rounded-full border-4 border-cream-100 dark:border-dark-border opacity-30" />
        
        {/* Animated paw prints */}
        <PawPrint delay={0} custom={0} />
        <PawPrint delay={0.5} custom={1} />
        <PawPrint delay={1} custom={2} />
        <PawPrint delay={1.5} custom={3} />
        <PawPrint delay={2} custom={4} />
        
        {/* Cat face in the center */}
        <CatFace />
      </div>
      
      {message && (
        <motion.p 
          className="mt-4 text-mocha-500 dark:text-cream-100/80 text-center font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {message}
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            喵...
          </motion.span>
        </motion.p>
      )}
    </div>
  );
}

export default CatLoader; 