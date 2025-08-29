# 动画系统重构

## 重构概述

我们进行了一次重要的动画系统重构，移除了对 anime.js 和 Three.js 的依赖，以减少包体积并提高性能。此次重构通过以下方式实现：

1. 使用 Web Animation API 和 CSS 动画替代 anime.js
2. 使用纯 CSS 实现的背景效果替代 Three.js 3D 渲染

## 变更内容

### 已删除的依赖

- anime.js
- Three.js
- @react-three/fiber
- @react-three/drei

### 已删除的文件

- src/components/auth/ThreeJsBackground.jsx
- src/utils/threeSceneUtils.js
- src/utils/AnimationController.js
- src/components/animation/AnimationExample.jsx
- src/components/animation/AnimationShowcase.jsx
- src/AnimationDemo.jsx
- src/AnimationDemoMain.jsx
- animation-demo.html
- build-animation-demo.js
- animation-demo-vite.config.js

### 新增/替代文件

- **src/utils/animationUtils.js**: 轻量级动画工具库，使用 CSS 和 Web Animation API
- **src/utils/anime-proxy.js**: 提供与 anime.js 兼容的 API 接口
- **src/utils/animeUtils.js**: 提供与原有动画系统兼容的 API 接口
- **src/components/auth/CssBackground.jsx**: 使用纯 CSS 实现的动态背景效果

## 主要优势

1. **减少包体积**: 移除了大型外部依赖，减少了约 800KB 的包体积
2. **提高性能**: CSS 动画通常比 JavaScript 驱动的动画性能更好，特别是在移动设备上
3. **更好的兼容性**: 不再依赖于 WebGL，提高了在各种设备上的兼容性
4. **更容易维护**: 简化的动画系统更易于理解和维护

## 影响的组件

- **CatProfileCard**: 更新为使用 CSS 动画
- **背景效果**: 从 Three.js 3D 背景更改为 CSS 渐变和动画

## 性能优化

新的动画系统包含自动性能调节功能：

- 在低性能设备上自动降低动画复杂度
- 使用 CSS 硬件加速提高动画性能
- 动画元素不活跃时自动暂停以节省资源

## 使用方法

### 基本动画

```jsx
import { fadeAnimation, slideAnimation } from "../utils/animationUtils";

// 在组件中使用
useEffect(() => {
  const element = myRef.current;
  const animation = fadeAnimation(element, { duration: 500 });

  return () => animation.cancel(); // 清理
}, []);
```

### 动画时间线

```jsx
import { createTimeline } from "../utils/animationUtils";

// 创建动画序列
const timeline = createTimeline({ easing: "ease-out" });

timeline
  .add({
    targets: element1,
    keyframes: [
      { opacity: 0, transform: "translateY(20px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    duration: 600,
  })
  .add(
    {
      targets: element2,
      keyframes: [{ opacity: 0 }, { opacity: 1 }],
      duration: 400,
    },
    "-=200"
  ); // 重叠200ms
```
