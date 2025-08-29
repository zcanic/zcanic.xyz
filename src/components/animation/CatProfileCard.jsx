import React, { useState, useRef } from 'react';
import useAnimation from '../../hooks/useAnimation';
import { createTimeline } from '../../utils/animeUtils';
import anime from '../../utils/anime-proxy';

/**
 * 猫咪个人资料卡片组件
 * 
 * 一个可爱的、动画丰富的猫咪个人资料卡片，展示各种交互动画效果
 */
const CatProfileCard = ({
  name = 'Zcanic',
  description = '一只可爱、聪明的AI猫娘，喜欢探索新奇事物和陪伴人类。',
  mood = 'happy', // happy, sleepy, curious, playful
  image = 'https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?auto=format&q=80&w=300',
  bgColor = 'bg-gradient-to-br from-purple-100 to-indigo-50 dark:from-purple-900/40 dark:to-indigo-900/40',
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isBooped, setIsBooped] = useState(false);
  const cardRef = useRef(null);
  const imageRef = useRef(null);
  const particlesRef = useRef(null);
  
  // 主卡片动画 - 使用脉冲效果
  const pulseAnim = useAnimation('pulse', {
    autoPlay: false,
    scale: 1.02,
    duration: 1200,
  });
  
  // 图像形变动画
  const morphAnim = useAnimation('morphing', {
    minRadius: 30,
    maxRadius: 70,
    duration: 8000,
    isEssential: false,
  });
  
  // 处理Boop动画（点击猫咪鼻子）
  const handleBoop = () => {
    if (isBooped) return;
    setIsBooped(true);
    
    // 创建时间轴动画
    const timeline = createTimeline({
      easing: 'ease-out',
      duration: 1200,
    });
    
    timeline
      .add({
        targets: imageRef.current,
        keyframes: [
          { transform: 'scale(1) rotate(0deg)' },
          { transform: 'scale(0.9) rotate(-5deg)' },
          { transform: 'scale(1.1) rotate(5deg)' },
          { transform: 'scale(1) rotate(0deg)' }
        ],
        duration: 600,
      })
      .add({
        targets: particlesRef.current,
        keyframes: [
          { opacity: 0, transform: 'scale(0)' },
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(1.2)' }
        ],
        duration: 1000,
        complete: () => {
          setIsBooped(false);
        },
      }, '-=400');
    
    // 创建心形粒子
    createParticles();
  };
  
  // 创建Boop粒子效果
  const createParticles = () => {
    if (!particlesRef.current) return;
    
    const container = particlesRef.current;
    container.innerHTML = '';
    container.style.opacity = 1;
    
    // 创建多个心形、星星和圆形
    const shapes = ['♥', '✨', '●'];
    const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'];
    
    const count = 12;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('span');
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // 设置基本样式
      particle.textContent = shape;
      particle.style.position = 'absolute';
      particle.style.top = '50%';
      particle.style.left = '50%';
      particle.style.fontSize = `${Math.random() * 10 + 10}px`;
      particle.style.color = color;
      particle.style.opacity = '0';
      
      // 添加到容器
      container.appendChild(particle);
      
      // 使用Web Animation API替代anime.js
      const randomX = Math.random() * 160 - 80; // -80 to 80
      const randomY = Math.random() * 160 - 80; // -80 to 80
      const randomRotation = Math.random() * 120 - 60; // -60 to 60
      
      particle.animate([
        { 
          transform: 'translate(0, 0) scale(0.2) rotate(0deg)', 
          opacity: 0 
        },
        { 
          transform: `translate(${randomX}px, ${randomY}px) scale(1) rotate(${randomRotation}deg)`, 
          opacity: 1 
        },
        { 
          transform: `translate(${randomX}px, ${randomY}px) scale(0.2) rotate(${randomRotation}deg)`, 
          opacity: 0 
        }
      ], {
        duration: 1000,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)', // easeOutExpo
        delay: i * 30,
        fill: 'forwards'
      });
    }
  };
  
  // 处理鼠标悬停
  const handleMouseEnter = () => {
    setIsHovered(true);
    pulseAnim.play();
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    pulseAnim.pause();
  };
  
  // 根据心情设置猫咪的眼睛表情
  const getEyeStyles = () => {
    switch (mood) {
      case 'sleepy':
        return 'h-1 rounded-full';
      case 'curious':
        return 'rounded-full h-5 w-4';
      case 'playful':
        return 'rounded-full h-4 w-4 transform rotate-45';
      case 'happy':
      default:
        return 'rounded-full h-4 w-3';
    }
  };
  
  return (
    <div 
      ref={(node) => {
        cardRef.current = node;
        pulseAnim.ref(node);
      }}
      className={`relative overflow-hidden rounded-xl shadow-lg max-w-xs ${bgColor} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 12px 25px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      {/* 卡片装饰元素 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200 rounded-full dark:bg-pink-500/20 -mr-16 -mt-16 opacity-40"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200 rounded-full dark:bg-indigo-500/20 -ml-12 -mb-12 opacity-30"></div>
      
      <div className="relative p-6">
        {/* 猫咪图像容器 */}
        <div className="flex justify-center mb-5 relative">
          <div 
            ref={(node) => {
              imageRef.current = node;
              morphAnim.ref(node);
            }}
            className="relative w-32 h-32 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            style={{
              borderRadius: isHovered ? '40% 60% 60% 40% / 50% 30% 70% 50%' : '50%',
              transition: 'border-radius 1s ease-in-out',
            }}
            onClick={handleBoop}
          >
            {/* 猫咪图像 */}
            <img 
              src={image} 
              alt={name} 
              className="w-full h-full object-cover"
            />
            
            {/* 互动提示 - 仅在悬停时显示 */}
            {isHovered && (
              <div 
                className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300"
              >
                <span className="text-white text-xs font-medium px-2 py-1 rounded-full bg-black bg-opacity-50">
                  戳一戳
                </span>
              </div>
            )}
          </div>
          
          {/* 粒子效果容器 */}
          <div 
            ref={particlesRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0"
          ></div>
        </div>
        
        {/* 信息区域 */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1 relative inline-block">
            {name}
            {/* 猫耳朵装饰 - 仅在悬停时显示 */}
            {isHovered && (
              <>
                <span className="absolute -top-3 -left-2 w-3 h-5 bg-gray-800 dark:bg-white rounded-full transform -rotate-15"></span>
                <span className="absolute -top-3 -right-2 w-3 h-5 bg-gray-800 dark:bg-white rounded-full transform rotate-15"></span>
              </>
            )}
          </h3>
          
          <div className="inline-flex space-x-1 mb-2">
            {/* 心情表情 - 眼睛 */}
            <div className="inline-flex space-x-3 items-center">
              <div className={`w-3 h-4 bg-gray-800 dark:bg-white ${getEyeStyles()}`}></div>
              <div className={`w-3 h-4 bg-gray-800 dark:bg-white ${getEyeStyles()}`}></div>
            </div>
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {description}
          </p>
          
          {/* 互动按钮 */}
          <div className="mt-4 flex justify-center space-x-2">
            <button 
              className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700 text-indigo-700 dark:text-indigo-200 text-sm rounded-full transition-colors"
            >
              打招呼
            </button>
            <button 
              className="px-3 py-1 bg-pink-100 hover:bg-pink-200 dark:bg-pink-800 dark:hover:bg-pink-700 text-pink-700 dark:text-pink-200 text-sm rounded-full transition-colors"
              onClick={handleBoop}
            >
              摸头
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatProfileCard; 