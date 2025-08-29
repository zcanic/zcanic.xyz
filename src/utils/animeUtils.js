/**
 * animeUtils.js - CSS and Web Animation API utilities
 * 
 * A lightweight replacement for previous anime.js utilities
 * Provides a compatible API surface for existing components
 */

import { createTimeline as createWebAnimationTimeline } from './animationUtils';

/**
 * CSS and animation presets for common effects
 */
export const animations = {
  // Fade animations
  fadeIn: {
    keyframes: [
      { opacity: 0 },
      { opacity: 1 }
    ],
    duration: 500,
    easing: 'ease-out'
  },
  
  fadeOut: {
    keyframes: [
      { opacity: 1 },
      { opacity: 0 }
    ],
    duration: 500,
    easing: 'ease-in'
  },
  
  // Scale animations
  scaleIn: {
    keyframes: [
      { opacity: 0, transform: 'scale(0.8)' },
      { opacity: 1, transform: 'scale(1)' }
    ],
    duration: 600,
    easing: 'ease-out'
  },
  
  scaleOut: {
    keyframes: [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.8)' }
    ],
    duration: 600,
    easing: 'ease-in'
  },
  
  // Slide animations
  slideUp: {
    keyframes: [
      { opacity: 0, transform: 'translateY(30px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    duration: 600,
    easing: 'ease-out'
  },
  
  slideDown: {
    keyframes: [
      { opacity: 0, transform: 'translateY(-30px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    duration: 600,
    easing: 'ease-out'
  },
  
  slideLeft: {
    keyframes: [
      { opacity: 0, transform: 'translateX(30px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ],
    duration: 600,
    easing: 'ease-out'
  },
  
  slideRight: {
    keyframes: [
      { opacity: 0, transform: 'translateX(-30px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ],
    duration: 600,
    easing: 'ease-out'
  },
  
  // Special effects
  pop: {
    keyframes: [
      { transform: 'scale(0.8)', opacity: 0.5 },
      { transform: 'scale(1.1)', opacity: 1 },
      { transform: 'scale(1)', opacity: 1 }
    ],
    duration: 700,
    easing: 'ease-out'
  },
  
  shake: {
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(0)' }
    ],
    duration: 500,
    easing: 'ease-in-out'
  },
  
  pulse: {
    keyframes: [
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ],
    duration: 1000,
    easing: 'ease-in-out'
  }
};

/**
 * Creates a new animation timeline
 * Compatible wrapper around Web Animation API timeline
 */
export function createTimeline(options = {}) {
  return createWebAnimationTimeline(options);
}

/**
 * Apply a preset animation to an element
 * @param {HTMLElement} element - Target element
 * @param {string} animationName - Name of the animation from presets
 * @param {Object} options - Override options
 * @returns {Animation} - Web Animation instance
 */
export function applyAnimation(element, animationName, options = {}) {
  const preset = animations[animationName];
  if (!preset) {
    console.warn(`Animation preset "${animationName}" not found`);
    return null;
  }
  
  const animOptions = {
    ...preset,
    ...options
  };
  
  return element.animate(animOptions.keyframes, {
    duration: animOptions.duration,
    easing: animOptions.easing,
    fill: 'forwards',
    ...options
  });
}

export default {
  createTimeline,
  applyAnimation,
  animations
}; 