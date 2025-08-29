/**
 * anime-proxy.js
 * 
 * A lightweight replacement for anime.js that uses the Web Animations API
 * This provides a compatible API surface for components still using anime.js
 */

const anime = function(params) {
  const { targets, ...options } = params;
  const elements = Array.isArray(targets) ? targets : [targets];
  const animations = [];

  elements.forEach((element) => {
    if (!element) return null;

    // Process keyframes from options
    let keyframes = [];
    
    // Handle transform properties separately
    const transformProps = ['translateX', 'translateY', 'translateZ', 'rotate', 'rotateX', 'rotateY', 
      'rotateZ', 'scale', 'scaleX', 'scaleY', 'scaleZ', 'skew', 'skewX', 'skewY'];
    
    // If we have individual transform properties, we need to combine them
    const hasTransforms = Object.keys(options).some(key => transformProps.includes(key));
    
    if (hasTransforms) {
      // Create from and to states for the transform
      const fromTransform = {};
      const toTransform = {};
      
      transformProps.forEach(prop => {
        if (prop in options) {
          const value = typeof options[prop] === 'function' 
            ? options[prop](element, elements.indexOf(element)) 
            : options[prop];
          
          // For arrays, use first and last values
          if (Array.isArray(value)) {
            fromTransform[prop] = value[0];
            toTransform[prop] = value[value.length - 1];
          } else {
            // For single values, assume 0 as starting point
            fromTransform[prop] = 0;
            toTransform[prop] = value;
          }
        }
      });
      
      // Create keyframes with combined transforms
      keyframes = [
        { transform: createTransformString(fromTransform) },
        { transform: createTransformString(toTransform) }
      ];
    } else if (options.keyframes) {
      // If keyframes are directly provided
      keyframes = options.keyframes;
    } else {
      // For simple animations with direct properties
      const fromFrame = {};
      const toFrame = {};
      
      Object.keys(options).forEach(key => {
        if (['duration', 'delay', 'endDelay', 'easing', 'complete'].includes(key)) return;
        
        const value = typeof options[key] === 'function' 
          ? options[key](element, elements.indexOf(element)) 
          : options[key];
        
        if (Array.isArray(value)) {
          fromFrame[key] = value[0];
          toFrame[key] = value[value.length - 1];
        } else {
          toFrame[key] = value;
        }
      });
      
      keyframes = [fromFrame, toFrame];
    }
    
    // Animation timing
    const timing = {
      duration: options.duration || 1000,
      delay: typeof options.delay === 'function' 
        ? options.delay(element, elements.indexOf(element)) 
        : (options.delay || 0),
      endDelay: options.endDelay || 0,
      fill: 'forwards',
      easing: options.easing || 'linear'
    };
    
    // Create Web Animation
    const animation = element.animate(keyframes, timing);
    
    // Add complete callback if provided
    if (options.complete) {
      animation.onfinish = () => options.complete(element);
    }
    
    animations.push(animation);
  });
  
  // Return a controller object with basic anime.js API
  return {
    play: () => animations.forEach(a => a.play()),
    pause: () => animations.forEach(a => a.pause()),
    restart: () => animations.forEach(a => { a.cancel(); a.play(); }),
    seek: (time) => animations.forEach(a => a.currentTime = time),
  };
};

// Helper for converting transform properties into a CSS transform string
function createTransformString(transformProps) {
  const transforms = [];
  
  if ('translateX' in transformProps) {
    const value = transformProps.translateX;
    transforms.push(`translateX(${typeof value === 'number' ? value + 'px' : value})`);
  }
  
  if ('translateY' in transformProps) {
    const value = transformProps.translateY;
    transforms.push(`translateY(${typeof value === 'number' ? value + 'px' : value})`);
  }
  
  if ('rotate' in transformProps) {
    const value = transformProps.rotate;
    transforms.push(`rotate(${typeof value === 'number' ? value + 'deg' : value})`);
  }
  
  if ('scale' in transformProps) {
    transforms.push(`scale(${transformProps.scale})`);
  }
  
  return transforms.join(' ');
}

// Add utility functions that match anime.js
anime.random = function(min, max) {
  return Math.random() * (max - min) + min;
};

anime.stagger = function(value, options = {}) {
  return function(el, i) {
    return i * (options.from === 'last' ? -value : value);
  };
};

export default anime; 