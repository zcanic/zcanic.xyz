import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * 现代化的卡片组件 - 采用磨砂玻璃风格
 *
 * @component
 * @param {Object} props - 组件属性
 * @param {ReactNode} props.children - 卡片内容
 * @param {string} props.className - 额外的CSS类名
 * @param {string} props.variant - 卡片变体 ('default', 'frosted', 'solid', 'outline')
 * @param {boolean} props.withHover - 是否有悬停效果
 * @param {boolean} props.withShadow - 是否有阴影效果
 */
const Card = React.forwardRef(({
  children,
  className,
  variant = 'default',
  withHover = false,
  withShadow = true,
  ...props
}, ref) => {
  // 变体样式
  const variantStyles = {
    default: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    frosted: 'backdrop-blur-md bg-white/70 dark:bg-slate-800/70 border border-white/20 dark:border-slate-700/30',
    solid: 'bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800',
    outline: 'bg-transparent border-2 border-slate-200 dark:border-slate-700',
  };

  // 悬停效果
  const hoverStyles = withHover ? 'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg' : '';
  
  // 阴影效果
  const shadowStyles = withShadow ? 'shadow-md' : '';

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl overflow-hidden',
        variantStyles[variant] || variantStyles.default,
        hoverStyles,
        shadowStyles,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'frosted', 'solid', 'outline']),
  withHover: PropTypes.bool,
  withShadow: PropTypes.bool,
};

export default Card;

/**
 * 卡片标题组件
 */
export const CardHeader = React.forwardRef(({ 
  className, 
  children,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn('px-6 pt-6 pb-3', className)}
    {...props}
  >
    {children}
  </div>
));

CardHeader.displayName = 'CardHeader';

/**
 * 卡片内容组件
 */
export const CardContent = React.forwardRef(({ 
  className, 
  children,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn('px-6 py-4', className)}
    {...props}
  >
    {children}
  </div>
));

CardContent.displayName = 'CardContent';

/**
 * 卡片底部组件
 */
export const CardFooter = React.forwardRef(({ 
  className, 
  children,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn('px-6 pt-3 pb-6 flex items-center', className)}
    {...props}
  >
    {children}
  </div>
));

CardFooter.displayName = 'CardFooter';

/**
 * 卡片标题组件
 */
export const CardTitle = React.forwardRef(({ 
  className, 
  children,
  ...props 
}, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-bold text-slate-900 dark:text-white', className)}
    {...props}
  >
    {children}
  </h3>
));

CardTitle.displayName = 'CardTitle';

/**
 * 卡片描述组件
 */
export const CardDescription = React.forwardRef(({ 
  className, 
  children,
  ...props 
}, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
    {...props}
  >
    {children}
  </p>
));

CardDescription.displayName = 'CardDescription'; 