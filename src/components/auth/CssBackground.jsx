/**
 * CssBackground.jsx
 * 
 * A lightweight CSS-based animated background that replaces the Three.js implementation
 */

import React, { useEffect, useRef, useState } from 'react';

const CssBackground = ({ isDark = false }) => {
  const containerRef = useRef(null);
  const [particles, setParticles] = useState([]);
  
  // Generate particles on mount
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Generate random particles
    const count = 100; // Fewer particles for better performance
    const newParticles = [];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        size: Math.random() * 3 + 1, // 1-4px
        x: Math.random() * 100, // 0-100%
        y: Math.random() * 100, // 0-100%
        opacity: Math.random() * 0.5 + 0.1, // 0.1-0.6
        speed: Math.random() * 100 + 20, // 20-120s for full animation
      });
    }
    
    setParticles(newParticles);
  }, []);
  
  // Extract color values based on theme
  const bgColor1 = isDark ? '#0f172a' : '#f8fafc';
  const bgColor2 = isDark ? '#1e293b' : '#e2e8f0'; 
  const particleColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.2)';
  
  return (
    <div
      className="absolute top-0 left-0 w-full h-full z-[-1] overflow-hidden"
      style={{
        background: `linear-gradient(to bottom, ${bgColor1}, ${bgColor2})`,
      }}
      ref={containerRef}
    >
      {/* Subtle radial gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent 0%, ${isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'} 100%)`,
        }}
      ></div>
      
      {/* Animated particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particleColor,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
            animation: `floatParticle ${particle.speed}s infinite linear`,
          }}
        ></div>
      ))}
      
      {/* Light effects */}
      <div 
        className="absolute"
        style={{
          top: '10%',
          left: '15%',
          width: '30%',
          height: '30%',
          borderRadius: '50%',
          background: isDark 
            ? 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)' 
            : 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      ></div>
      
      <div 
        className="absolute"
        style={{
          bottom: '20%',
          right: '15%',
          width: '25%',
          height: '25%',
          borderRadius: '50%',
          background: isDark 
            ? 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)' 
            : 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          filter: 'blur(30px)',
        }}
      ></div>
      
      {/* Add global animation keyframes with <style> tag */}
      <style jsx>{`
        @keyframes floatParticle {
          0% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(10px) translateX(-5px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CssBackground; 