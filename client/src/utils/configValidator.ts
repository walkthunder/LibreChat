/**
 * 配置验证工具
 * 用于验证librechat.yaml和环境变量配置
 */

export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AppConfig {
  appTitle?: string;
  customWelcome?: string;
  appDescription?: string;
  logoPath?: string;
}

/**
 * 验证应用配置
 * @param config 应用配置对象
 * @returns 验证结果
 */
export function validateConfig(config: AppConfig): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 验证应用标题
  if (!config.appTitle || config.appTitle.trim() === '') {
    warnings.push('应用标题未配置，将使用默认值');
  } else if (config.appTitle.length > 100) {
    errors.push('应用标题过长（最多100个字符）');
  }

  // 验证欢迎语
  if (!config.customWelcome || config.customWelcome.trim() === '') {
    warnings.push('自定义欢迎语未配置，将使用默认值');
  } else if (config.customWelcome.length > 200) {
    warnings.push('欢迎语较长，可能影响显示效果');
  }

  // 验证系统描述
  if (!config.appDescription || config.appDescription.trim() === '') {
    warnings.push('系统描述未配置');
  } else if (config.appDescription.length > 500) {
    warnings.push('系统描述过长，可能影响显示效果');
  }

  // 验证Logo路径
  if (config.logoPath && !isValidLogoPath(config.logoPath)) {
    errors.push('Logo路径格式无效');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 验证Logo路径是否有效
 * @param path Logo文件路径
 * @returns 是否有效
 */
function isValidLogoPath(path: string): boolean {
  // 检查是否为有效的文件路径
  const validExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];
  return validExtensions.some(ext => path.toLowerCase().endsWith(ext));
}

/**
 * 获取默认配置
 * @returns 默认配置对象
 */
export function getDefaultConfig(): AppConfig {
  return {
    appTitle: '无线随申查（开放版）',
    customWelcome: '欢迎使用无线随申查（开放版）',
    appDescription: '本系统为无线电监测站工作人员提供智能问答服务，协助处理无线电监测、干扰查找、设备检测、频谱分析等相关工作',
    logoPath: 'assets/radio-monitoring-logo.svg',
  };
}

/**
 * 合并配置（用户配置 + 默认配置）
 * @param userConfig 用户配置
 * @returns 合并后的配置
 */
export function mergeConfig(userConfig: Partial<AppConfig>): AppConfig {
  const defaultConfig = getDefaultConfig();
  return {
    ...defaultConfig,
    ...userConfig,
  };
}

/**
 * 记录配置验证结果到控制台
 * @param result 验证结果
 */
export function logValidationResult(result: ConfigValidationResult): void {
  if (result.errors.length > 0) {
    console.error('❌ 配置验证失败：');
    result.errors.forEach(error => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️ 配置警告：');
    result.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log('✅ 配置验证通过');
  }
}

/**
 * 验证并应用配置
 * @param config 配置对象
 * @returns 验证并合并后的配置
 */
export function validateAndApplyConfig(config: Partial<AppConfig>): AppConfig {
  const mergedConfig = mergeConfig(config);
  const validationResult = validateConfig(mergedConfig);
  
  logValidationResult(validationResult);
  
  if (!validationResult.isValid) {
    console.error('使用默认配置替代无效配置');
    return getDefaultConfig();
  }
  
  return mergedConfig;
}
