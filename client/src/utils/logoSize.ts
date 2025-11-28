/**
 * Logo尺寸工具函数
 * 根据屏幕宽度返回合适的Logo尺寸
 * 确保Logo在24px到120px之间
 */

export interface LogoSizeConfig {
  width: number;
  height: number;
  className: string;
}

/**
 * 根据屏幕宽度获取Logo尺寸
 * @param screenWidth 屏幕宽度（像素）
 * @returns Logo尺寸（像素）
 */
export function getLogoSize(screenWidth: number): number {
  // 移动设备（< 640px）
  if (screenWidth < 640) {
    return 32;
  }
  // 小平板（640px - 768px）
  else if (screenWidth < 768) {
    return 40;
  }
  // 平板（768px - 1024px）
  else if (screenWidth < 1024) {
    return 48;
  }
  // 桌面（1024px - 1280px）
  else if (screenWidth < 1280) {
    return 56;
  }
  // 大桌面（>= 1280px）
  else {
    return 64;
  }
}

/**
 * 获取Logo配置（包含尺寸和样式类）
 * @param screenWidth 屏幕宽度（像素）
 * @returns Logo配置对象
 */
export function getLogoConfig(screenWidth: number): LogoSizeConfig {
  const size = getLogoSize(screenWidth);
  
  return {
    width: size,
    height: size,
    className: getLogoClassName(screenWidth),
  };
}

/**
 * 根据屏幕宽度获取Logo的CSS类名
 * @param screenWidth 屏幕宽度（像素）
 * @returns CSS类名字符串
 */
export function getLogoClassName(screenWidth: number): string {
  if (screenWidth < 640) {
    return 'w-8 h-8'; // 32px
  } else if (screenWidth < 768) {
    return 'w-10 h-10'; // 40px
  } else if (screenWidth < 1024) {
    return 'w-12 h-12'; // 48px
  } else if (screenWidth < 1280) {
    return 'w-14 h-14'; // 56px
  } else {
    return 'w-16 h-16'; // 64px
  }
}

/**
 * 获取响应式Logo类名（使用Tailwind响应式前缀）
 * @returns 响应式CSS类名字符串
 */
export function getResponsiveLogoClassName(): string {
  return 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16';
}

/**
 * 验证Logo尺寸是否在合理范围内
 * @param size Logo尺寸（像素）
 * @returns 是否在合理范围内（24px - 120px）
 */
export function isValidLogoSize(size: number): boolean {
  return size >= 24 && size <= 120;
}

/**
 * Hook: 获取当前屏幕宽度的Logo尺寸
 * 需要在React组件中使用
 */
export function useLogoSize(): LogoSizeConfig {
  if (typeof window === 'undefined') {
    // 服务端渲染时返回默认值
    return {
      width: 48,
      height: 48,
      className: 'w-12 h-12',
    };
  }

  return getLogoConfig(window.innerWidth);
}

/**
 * 获取登录页面Logo尺寸
 * 登录页面使用较大的Logo
 */
export function getAuthPageLogoSize(): LogoSizeConfig {
  if (typeof window === 'undefined') {
    return {
      width: 80,
      height: 80,
      className: 'w-20 h-20',
    };
  }

  const screenWidth = window.innerWidth;
  
  // 移动设备
  if (screenWidth < 640) {
    return {
      width: 64,
      height: 64,
      className: 'w-16 h-16',
    };
  }
  // 平板
  else if (screenWidth < 1024) {
    return {
      width: 80,
      height: 80,
      className: 'w-20 h-20',
    };
  }
  // 桌面
  else {
    return {
      width: 96,
      height: 96,
      className: 'w-24 h-24',
    };
  }
}

/**
 * 获取导航栏Logo尺寸
 * 导航栏使用较小的Logo
 */
export function getNavLogoSize(): LogoSizeConfig {
  if (typeof window === 'undefined') {
    return {
      width: 40,
      height: 40,
      className: 'w-10 h-10',
    };
  }

  const screenWidth = window.innerWidth;
  
  // 移动设备
  if (screenWidth < 640) {
    return {
      width: 32,
      height: 32,
      className: 'w-8 h-8',
    };
  }
  // 平板和桌面
  else {
    return {
      width: 40,
      height: 40,
      className: 'w-10 h-10',
    };
  }
}

/**
 * 获取欢迎页面Logo尺寸
 * 欢迎页面使用中等大小的Logo
 */
export function getLandingLogoSize(): LogoSizeConfig {
  if (typeof window === 'undefined') {
    return {
      width: 64,
      height: 64,
      className: 'w-16 h-16',
    };
  }

  const screenWidth = window.innerWidth;
  
  // 移动设备
  if (screenWidth < 640) {
    return {
      width: 48,
      height: 48,
      className: 'w-12 h-12',
    };
  }
  // 平板
  else if (screenWidth < 1024) {
    return {
      width: 64,
      height: 64,
      className: 'w-16 h-16',
    };
  }
  // 桌面
  else {
    return {
      width: 80,
      height: 80,
      className: 'w-20 h-20',
    };
  }
}
