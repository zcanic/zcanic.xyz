/**
 * Zcanic.xyz 猫咪动画系统组件导出文件
 * 
 * 此文件导出所有动画相关组件，便于统一导入使用
 */

// 动画展示组件
export { default as AnimationShowcase } from './AnimationShowcase';
export { default as AnimationExample } from './AnimationExample';

// 猫咪主题动画组件
export { default as FloatingCat } from './FloatingCat';
export { default as CatProfileCard } from './CatProfileCard';
export { default as ScrollReveal } from './ScrollReveal';

// 从钩子中导出对外使用的内容
export { default as useAnimation, useStaggerAnimation, useTransition } from '../../hooks/useAnimation';

// 动画控制器导出
export { default as animationController } from '../../utils/AnimationController'; 