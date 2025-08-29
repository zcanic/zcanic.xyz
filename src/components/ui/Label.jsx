import React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * 现代标签组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.htmlFor - 关联的表单元素ID
 * @param {string} props.className - 额外CSS类
 */
const Label = React.forwardRef(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none text-slate-700 dark:text-slate-300",
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));

Label.displayName = "Label";

Label.propTypes = {
  htmlFor: PropTypes.string,
  className: PropTypes.string
};

export default Label;
