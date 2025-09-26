// 支付配置文件
// 在这里配置您的Z-Pay商户信息

export interface PaymentConfig {
  // Z-Pay商户配置
  zpayPid: string;           // Z-Pay商户ID
  zpayKey: string;           // Z-Pay商户密钥
  
  // 应用配置
  appUrl: string;            // 应用域名
  siteName: string;          // 网站名称
  
  // 模式配置
  isDemoMode: boolean;       // 是否为演示模式
  enableDebugLog: boolean;   // 是否启用调试日志
}

// 默认配置（真实支付模式）
export const defaultPaymentConfig: PaymentConfig = {
  // ✅ 真实Z-Pay商户信息
  zpayPid: '2025062920440492',       // 您的真实商户ID
  zpayKey: 'tNeFjVxC3b8IlgNJvqFA9oRNxy9ShaA1',       // 您的真实商户密钥
  
  // 应用配置
  appUrl: 'https://SeeDream.superhuang.me',
  siteName: '文字转小红书',
  
  // 模式配置
  isDemoMode: false,         // ✅ 启用真实支付
  enableDebugLog: true       // 开发时建议启用
};

// 从环境变量获取配置（优先级更高）
// 在浏览器环境中使用 import.meta.env
export const paymentConfig: PaymentConfig = {
  zpayPid: import.meta.env.ZPAY_PID || defaultPaymentConfig.zpayPid,
  zpayKey: import.meta.env.ZPAY_KEY || defaultPaymentConfig.zpayKey,
  appUrl: import.meta.env.VITE_APP_URL || defaultPaymentConfig.appUrl,
  siteName: import.meta.env.VITE_SITE_NAME || defaultPaymentConfig.siteName,
  // 优先使用默认配置，环境变量可以覆盖
  isDemoMode: import.meta.env.ZPAY_DEMO_MODE === 'true' ? true : defaultPaymentConfig.isDemoMode,
  enableDebugLog: import.meta.env.DEV === true
};

// 配置验证
export function validatePaymentConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!paymentConfig.isDemoMode) {
    // 真实支付模式下的验证
    if (!paymentConfig.zpayPid || paymentConfig.zpayPid === 'demo_pid') {
      errors.push('请配置真实的Z-Pay商户ID (ZPAY_PID)');
    }
    
    if (!paymentConfig.zpayKey || paymentConfig.zpayKey === 'demo_key') {
      errors.push('请配置真实的Z-Pay商户密钥 (ZPAY_KEY)');
    }
    
    if (!paymentConfig.appUrl.startsWith('https://') && !paymentConfig.appUrl.includes('localhost')) {
      errors.push('生产环境请使用HTTPS域名');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// 获取支付配置信息（用于调试）
export function getPaymentConfigInfo(): string {
  const validation = validatePaymentConfig();
  
  return `
💳 支付配置信息:
=================
模式: ${paymentConfig.isDemoMode ? '🚨 演示模式' : '✅ 真实支付模式'}
商户ID: ${paymentConfig.zpayPid}
应用域名: ${paymentConfig.appUrl}
网站名称: ${paymentConfig.siteName}

${paymentConfig.isDemoMode ? `
⚠️  当前为演示模式，不会进行真实支付
💡 要启用真实支付，请：
1. 获取Z-Pay商户ID和密钥
2. 在 src/config/paymentConfig.ts 中更新配置
3. 或设置环境变量 ZPAY_PID 和 ZPAY_KEY
4. 设置 isDemoMode = false 或环境变量 ZPAY_DEMO_MODE=false
` : `
✅ 真实支付模式已启用
${validation.valid ? '✅ 配置验证通过' : '❌ 配置验证失败:\n' + validation.errors.join('\n')}
`}
=================
  `.trim();
}
