import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

// 创建一个上下文来共享Popover状态
const PopoverContext = createContext({
  open: false,
  onOpenChange: () => {},
});

// Popover组件 - 弹出层容器
const Popover = ({ 
  children, 
  open, 
  onOpenChange 
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // 使用外部控制(受控组件)或内部状态(非受控组件)
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  
  // 处理打开/关闭状态变化
  const handleOpenChange = (value) => {
    if (!isControlled) {
      setInternalOpen(value);
    }
    
    if (onOpenChange) {
      onOpenChange(value);
    }
  };
  
  // 提供上下文值
  const popoverValue = {
    open: isOpen,
    onOpenChange: handleOpenChange,
  };
  
  return (
    <PopoverContext.Provider value={popoverValue}>
      <div className="relative inline-block popover-container">
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

// 使用Popover上下文
const usePopover = () => useContext(PopoverContext);

// PopoverTrigger组件 - 触发弹出层的元素
const PopoverTrigger = ({ 
  children, 
  asChild = false
}) => {
  const { open, onOpenChange } = usePopover();
  
  // 处理点击事件
  const handleClick = (e) => {
    onOpenChange(!open);
    
    // 如果子元素有自己的onClick，确保它也被调用
    if (asChild && children.props.onClick) {
      children.props.onClick(e);
    }
  };
  
  const child = asChild ? 
    React.Children.only(children) : 
    <button type="button">{children}</button>;
  
  return React.cloneElement(child, {
    ...child.props,
    'data-state': open ? 'open' : 'closed',
    'data-trigger': true,
    onClick: handleClick,
  });
};

// PopoverContent组件 - 弹出层内容
const PopoverContent = ({ 
  children, 
  className = '', 
  align = 'center',
  side = 'bottom',
}) => {
  const { open, onOpenChange } = usePopover();
  const contentRef = useRef(null);
  
  // 关闭窗口点击外部处理
  useEffect(() => {
    // Only add event listener if the popover is open
    if (!open) {
      return; 
    }

    function handleClickOutside(event) {
      if (contentRef.current && !contentRef.current.contains(event.target) && 
          !event.target.closest('[data-trigger="true"]')) {
        onOpenChange(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onOpenChange]); // Added 'open' to dependencies
  
  // 如果不是打开状态，不渲染内容 (Hooks are now called before this)
  if (!open) return null;
  
  // 确定弹出层方向的类名
  const alignClasses = {
    'start': 'left-0',
    'center': 'left-1/2 -translate-x-1/2',
    'end': 'right-0'
  };
  
  const sideClasses = {
    'top': 'bottom-full mb-2',
    'bottom': 'top-full mt-2',
    'left': 'right-full mr-2',
    'right': 'left-full ml-2'
  };
  
  const alignClass = alignClasses[align] || alignClasses.center;
  const sideClass = sideClasses[side] || sideClasses.bottom;
  
  return (
    <div 
      ref={contentRef}
      className={`absolute z-50 min-w-[8rem] rounded-md border border-slate-200 bg-white p-2 shadow-md animate-in fade-in-50 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-700 dark:bg-slate-800 ${sideClass} ${alignClass} ${className}`}
      data-side={side}
    >
      {children}
    </div>
  );
};

export { Popover, PopoverTrigger, PopoverContent };
