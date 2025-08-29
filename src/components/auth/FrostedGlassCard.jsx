import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

function FrostedGlassCard({ 
  children, 
  className = '', 
  animationDelay = 0,
  withShimmer = true,
  withHoverEffect = true
}) {
  const { isDarkMode } = useTheme();
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Handle mouse movement for 3D effect
  const handleMouseMove = (e) => {
    if (!withHoverEffect) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation based on mouse position
    const rotX = ((y / rect.height) - 0.5) * -6; // -3 to 3 degrees
    const rotY = ((x / rect.width) - 0.5) * 6;   // -3 to 3 degrees
    
    setRotateX(rotX);
    setRotateY(rotY);
    
    if (withShimmer) {
      setMousePosition({ x, y });
    }
  };
  
  // Reset rotation when mouse leaves
  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  // Background style based on theme
  const backgroundStyle = isDarkMode 
    ? 'rgba(15, 23, 42, 0.75)' // Dark slate background with transparency
    : 'rgba(255, 255, 255, 0.7)'; // Light white background with transparency

  // Border style based on theme
  const borderStyle = isDarkMode
    ? '1px solid rgba(51, 65, 85, 0.5)' // Dark slate border with transparency
    : '1px solid rgba(255, 255, 255, 0.2)'; // Light white border with transparency
    
  // Shadow style based on theme
  const shadowStyle = isDarkMode
    ? '0 10px 30px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(51, 65, 85, 0.3) inset'
    : '0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.15) inset';

  // Shimmer style based on theme
  const shimmerStyle = isDarkMode
    ? 'radial-gradient(circle, rgba(100, 116, 139, 0.3) 0%, rgba(100, 116, 139, 0) 70%)'
    : 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 70%)';

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, delay: animationDelay / 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', // For Safari
        background: backgroundStyle,
        boxShadow: shadowStyle,
        border: borderStyle,
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease',
      }}
    >
      {/* Shimmer effect */}
      {withShimmer && (
        <motion.div 
          className="absolute w-[200px] h-[200px] pointer-events-none opacity-0"
          animate={{ 
            opacity: withHoverEffect && (rotateX !== 0 || rotateY !== 0) ? 0.2 : 0,
            x: mousePosition.x - 100,
            y: mousePosition.y - 100
          }}
          transition={{ duration: 0.3 }}
          style={{
            background: shimmerStyle,
            mixBlendMode: 'overlay',
            transition: 'background 0.3s ease',
          }}
        />
      )}
      
      {/* Card content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Bottom edge light reflection */}
      <div 
        className={`absolute bottom-0 left-0 right-0 h-[1px] opacity-50 
          ${isDarkMode 
            ? 'bg-gradient-to-r from-transparent via-slate-500/30 to-transparent' 
            : 'bg-gradient-to-r from-transparent via-white to-transparent'}`}
        style={{ transition: 'background 0.3s ease' }}
      />
    </motion.div>
  );
}

export default FrostedGlassCard; 