// Z-Pay支付错误处理工具
export class PaymentErrorHandler {
  // Z-Pay常见错误码和对应的用户友好提示
  private static readonly ERROR_MESSAGES: Record<string, string> = {
    'ZPAY账户余额不足': '商户账户余额不足，请联系客服处理',
    'pid错误': '商户配置错误，请联系技术支持',
    'sign签名错误': '支付参数错误，请重试',
    'type参数仅支持传入alipay或者wxpay': '支付方式不支持，请选择支付宝或微信支付',
    '商户尚未开通或开启微信支付渠道': '微信支付暂不可用，建议使用支付宝支付',
    '商户尚未开通或开启支付宝渠道': '支付宝支付暂不可用，建议使用微信支付',
  };

  // 处理Z-Pay错误响应
  static handleZPayError(errorResponse: any): string {
    if (typeof errorResponse === 'string') {
      try {
        const parsed = JSON.parse(errorResponse);
        return this.getErrorMessage(parsed);
      } catch {
        return this.getErrorMessage(errorResponse);
      }
    }
    
    return this.getErrorMessage(errorResponse);
  }

  // 获取用户友好的错误消息
  private static getErrorMessage(error: any): string {
    if (!error) return '支付处理失败，请重试';

    // 检查是否是Z-Pay的标准错误格式
    if (error.code === 'error' && error.msg) {
      const msg = error.msg;
      
      // 查找匹配的错误消息
      for (const [key, userMessage] of Object.entries(this.ERROR_MESSAGES)) {
        if (msg.includes(key)) {
          return userMessage;
        }
      }
      
      // 特殊处理账户余额不足的情况
      if (msg.includes('余额不足') || msg.includes('账户余额')) {
        return '商户账户余额不足，暂时无法处理支付。请联系客服或稍后重试。';
      }
      
      // 返回原始错误消息（如果没有匹配的友好提示）
      return `支付失败：${msg}`;
    }

    // 处理其他类型的错误
    if (typeof error === 'string') {
      return `支付处理失败：${error}`;
    }

    return '支付处理失败，请重试或联系客服';
  }

  // 检查是否是可重试的错误
  static isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const msg = error.msg || error.message || '';
    
    // 这些错误不建议重试
    const nonRetryableErrors = [
      '余额不足',
      'pid错误',
      '商户尚未开通',
      'sign签名错误'
    ];
    
    return !nonRetryableErrors.some(err => msg.includes(err));
  }

  // 获取解决建议
  static getSolutionSuggestion(error: any): string {
    if (!error) return '';
    
    const msg = error.msg || error.message || '';
    
    if (msg.includes('余额不足')) {
      return '建议：\n1. 联系客服充值商户账户\n2. 或选择其他支付方式\n3. 如有疑问请联系技术支持';
    }
    
    if (msg.includes('商户尚未开通')) {
      return '建议：\n1. 联系Z-Pay客服开通对应支付渠道\n2. 或选择其他可用的支付方式';
    }
    
    if (msg.includes('pid错误') || msg.includes('sign签名错误')) {
      return '建议：\n1. 检查商户配置是否正确\n2. 联系技术支持检查系统设置';
    }
    
    return '建议：\n1. 稍后重试\n2. 如问题持续存在，请联系客服';
  }
}
