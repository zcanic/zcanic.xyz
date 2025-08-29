import React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * 现代滑块组件
 * 
 * @param {Object} props - 组件属性
 * @param {number[]} props.defaultValue - 默认值数组
 * @param {number} props.max - 最大值
 * @param {number} props.step - 步长
 * @param {function} props.onValueChange - 值变化回调
 * @param {string} props.className - 额外CSS类
 */
const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn('relative flex w-full touch-none select-none items-center', className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
      <SliderPrimitive.Range className="absolute h-full bg-indigo-500 dark:bg-indigo-400" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-indigo-500 bg-white dark:bg-slate-900 ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
));

Slider.displayName = 'Slider';

Slider.propTypes = {
  defaultValue: PropTypes.arrayOf(PropTypes.number),
  max: PropTypes.number,
  step: PropTypes.number,
  onValueChange: PropTypes.func,
  className: PropTypes.string
};

export default Slider;
