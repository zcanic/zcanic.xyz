import React, { useRef, useState, useEffect } from 'react';
import useAnimation from '../../hooks/useAnimation';
import { createTimeline } from '../../utils/animationUtils';
import { debounce } from '../../utils/helpers';

/**
 * 浮动猫咪组件 - 可爱的猫咪悬浮动画
 * 
 * 这个组件展示了一个可交互的猫咪图标，它会随着鼠标移动轻微倾斜，
 * 并在悬停时展示可爱的动画效果
 */
const FloatingCat = ({ size = 'md', color = 'primary', className = '', onClick }) => {
  const containerRef = useRef(null);
  const catRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPoking, setIsPoking] = useState(false);
  
  // 使用基础的浮动动画
  const floatAnim = useAnimation('float', {
    distance: 12,
    duration: 4000,
    isEssential: false // 非必要动画
  });
  
  // 使用动态形变动画
  const morphAnim = useAnimation('morphing', {
    minRadius: 40,
    maxRadius: 60,
    duration: 8000,
    isEssential: false // 非必要动画
  });
  
  // 眨眼动画
  const blinkAnimation = () => {
    const eyes = catRef.current.querySelectorAll('.cat-eye');
    if (!eyes.length) return;
    
    const timeline = createTimeline({
      easing: 'ease-in-out',
      autoplay: true
    });
    
    timeline.add({
      targets: eyes,
      scaleY: [1, 0.1, 1],
      duration: 300,
      delay: (el, i) => i * 50
    });
    
    return timeline;
  };
  
  // 处理猫咪被戳的动画
  const pokeAnimation = () => {
    if (!catRef.current) return;
    
    const timeline = createTimeline({
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Elastic-like easing
      autoplay: true
    });
    
    timeline
      .add({
        targets: catRef.current,
        scale: [1, 0.9],
        duration: 100
      })
      .add({
        targets: catRef.current,
        scale: 1,
        duration: 600
      });
    
    // 延迟重置状态
    setTimeout(() => {
      setIsPoking(false);
    }, 700);
    
    // 猫咪表情变化
    const face = catRef.current.querySelector('.cat-face');
    if (face) {
      face.dataset.expression = 'surprised';
      setTimeout(() => {
        face.dataset.expression = 'normal';
      }, 1000);
    }
    
    return timeline;
  };
  
  // 倾斜跟随鼠标
  const handleMouseMove = (e) => {
    if (!containerRef.current || !catRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;
    
    // 计算鼠标位置相对于中心的偏移比例
    const ratioX = (e.clientX - centerX) / (containerRect.width / 2);
    const ratioY = (e.clientY - centerY) / (containerRect.height / 2);
    
    // 应用倾斜效果，最大倾斜角度为10度
    const tiltX = -ratioY * 10;
    const tiltY = ratioX * 10;
    
    catRef.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  };
  
  // 防抖处理鼠标移动
  const debouncedMouseMove = debounce(handleMouseMove, 10);
  
  // 处理猫咪点击
  const handleCatClick = (e) => {
    setIsPoking(true);
    pokeAnimation();
    
    if (onClick) onClick(e);
  };
  
  // 处理鼠标事件
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    
    // 重置倾斜
    if (catRef.current) {
      catRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    }
  };
  
  // 定期眨眼
  useEffect(() => {
    let blinkInterval;
    
    const startBlinking = () => {
      blinkAnimation();
      
      // 随机间隔眨眼，更自然
      const nextBlink = Math.random() * 3000 + 2000;
      blinkInterval = setTimeout(startBlinking, nextBlink);
    };
    
    startBlinking();
    
    return () => {
      if (blinkInterval) clearTimeout(blinkInterval);
    };
  }, []);
  
  // 猫咪尺寸类
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };
  
  // 颜色类
  const colorClasses = {
    primary: 'text-indigo-500',
    secondary: 'text-purple-500',
    accent: 'text-pink-400',
    black: 'text-gray-800',
    white: 'text-white',
  };
  
  return (
    <div 
      ref={(node) => {
        containerRef.current = node;
        floatAnim.ref(node);
      }}
      className={`inline-block transition-all duration-300 cursor-pointer ${className}`}
      onMouseMove={debouncedMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCatClick}
    >
      <div 
        ref={(node) => {
          catRef.current = node;
          morphAnim.ref(node);
        }}
        className={`relative transition-transform duration-300 bg-white dark:bg-gray-800 p-2 rounded-full 
          shadow-md ${sizeClasses[size] || sizeClasses.md} ${isHovered ? 'shadow-lg' : ''}`}
        style={{ 
          transition: 'transform 0.1s ease-out',
          borderRadius: isHovered ? '40% 60% 70% 30% / 40% 50% 60% 50%' : '50%'
        }}
      >
        {/* 猫咪脸 */}
        <div 
          className={`cat-face w-full h-full flex items-center justify-center ${colorClasses[color] || colorClasses.primary}`}
          data-expression="normal"
        >
          {/* 猫耳朵 */}
          <div className="absolute left-1/4 -top-3 w-3 h-6 bg-current rounded-full transform -rotate-12"></div>
          <div className="absolute right-1/4 -top-3 w-3 h-6 bg-current rounded-full transform rotate-12"></div>
          
          {/* 猫眼睛 */}
          <div className="cat-eye absolute left-1/3 top-1/3 w-3 h-4 bg-current rounded-full"></div>
          <div className="cat-eye absolute right-1/3 top-1/3 w-3 h-4 bg-current rounded-full"></div>
          
          {/* 猫嘴巴 */}
          <div 
            className={`absolute left-1/2 bottom-1/4 w-3 h-2 transform -translate-x-1/2 transition-all duration-300
              ${isPoking ? 'h-3 rounded-full' : 'rounded-t-full'}`}
            style={{
              backgroundColor: 'currentColor',
              transformOrigin: 'center bottom'
            }}
          ></div>
          
          {/* 胡须 */}
          <div className="absolute left-0 bottom-1/3 w-4 h-0.5 bg-current transform rotate-12"></div>
          <div className="absolute left-0 bottom-1/3 mt-2 w-3 h-0.5 bg-current transform -rotate-12"></div>
          <div className="absolute right-0 bottom-1/3 w-4 h-0.5 bg-current transform -rotate-12"></div>
          <div className="absolute right-0 bottom-1/3 mt-2 w-3 h-0.5 bg-current transform rotate-12"></div>
        </div>
      </div>
    </div>
  );
};

export default FloatingCat; 