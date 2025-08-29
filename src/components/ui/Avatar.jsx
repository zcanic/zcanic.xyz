import React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * 现代头像组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.className - 额外CSS类
 */
const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
));

Avatar.displayName = 'Avatar';

/**
 * 头像图片组件
 */
const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));

AvatarImage.displayName = 'AvatarImage';

/**
 * 头像占位组件
 */
const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full',
      'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300',
      className
    )}
    {...props}
  />
));

AvatarFallback.displayName = 'AvatarFallback';

Avatar.propTypes = {
  className: PropTypes.string
};

AvatarImage.propTypes = {
  className: PropTypes.string
};

AvatarFallback.propTypes = {
  className: PropTypes.string
};

export { Avatar, AvatarImage, AvatarFallback };
