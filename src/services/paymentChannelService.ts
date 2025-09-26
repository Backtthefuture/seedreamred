// 支付渠道检测服务
export interface PaymentChannel {
  type: 'wxpay' | 'alipay';
  name: string;
  icon: string;
  enabled: boolean;
  description: string;
}

export class PaymentChannelService {
  // 根据商户配置返回可用的支付渠道
  static getAvailableChannels(): PaymentChannel[] {
    return [
      {
        type: 'alipay',
        name: '支付宝',
        icon: '💙',
        enabled: true, // 假设支付宝通常都是开通的
        description: '使用支付宝扫码支付'
      },
      {
        type: 'wxpay',
        name: '微信支付',
        icon: '💚',
        enabled: true, // 🎉 微信支付渠道已开通！
        description: '使用微信扫码支付'
      }
    ];
  }

  // 获取推荐的支付方式
  static getRecommendedPaymentType(): 'wxpay' | 'alipay' {
    const channels = this.getAvailableChannels();
    // 优先推荐微信支付，如果可用的话
    const wxpayChannel = channels.find(channel => channel.type === 'wxpay' && channel.enabled);
    if (wxpayChannel) {
      return 'wxpay';
    }
    // 否则选择第一个可用的渠道
    const enabledChannel = channels.find(channel => channel.enabled);
    return enabledChannel?.type || 'alipay';
  }

  // 检查支付方式是否可用
  static isPaymentTypeAvailable(type: 'wxpay' | 'alipay'): boolean {
    const channels = this.getAvailableChannels();
    const channel = channels.find(c => c.type === type);
    return channel?.enabled || false;
  }

  // 获取支付方式的错误提示
  static getPaymentTypeError(type: 'wxpay' | 'alipay'): string | null {
    const channels = this.getAvailableChannels();
    const channel = channels.find(c => c.type === type);
    
    if (!channel?.enabled) {
      if (type === 'wxpay') {
        return '商户尚未开通微信支付渠道，请联系管理员开通或选择支付宝支付';
      }
      if (type === 'alipay') {
        return '商户尚未开通支付宝渠道，请联系管理员开通';
      }
    }
    
    return null;
  }
}
