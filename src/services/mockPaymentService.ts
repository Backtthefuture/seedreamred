// 模拟支付服务（用于开发测试）
import crypto from 'crypto-js';
import { paymentConfig, getPaymentConfigInfo } from '../config/paymentConfig';

// Z-Pay 签名算法
function getVerifyParams(params: Record<string, any>) {
  const sPara: [string, any][] = [];
  
  for (const key in params) {
    if ((!params[key]) || key === "sign" || key === "sign_type") {
      continue;
    }
    sPara.push([key, params[key]]);
  }
  
  // 参数进行排序
  sPara.sort();
  
  let prestr = '';
  for (let i = 0; i < sPara.length; i++) {
    const obj = sPara[i];
    if (i === sPara.length - 1) {
      prestr = prestr + obj[0] + '=' + obj[1] + '';
    } else {
      prestr = prestr + obj[0] + '=' + obj[1] + '&';
    }
  }
  return prestr;
}

// 生成MD5签名
function generateSign(paramString: string, key: string) {
  const signString = paramString + key;
  return crypto.MD5(signString).toString();
}

// 生成唯一订单号
function generateOrderNo() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORDER${timestamp}${random}`;
}

export interface PaymentRequest {
  product_name: string;
  amount: number;
  credits: number;
  payment_type?: 'wxpay' | 'alipay';
  subscription_type?: string;
}

export interface PaymentResponse {
  success: boolean;
  payment_url: string;
  form_data: Record<string, string>;
  form_action: string;
  out_trade_no: string;
  method: string;
  debug_info?: {
    param_string: string;
    sign: string;
  };
}

export class MockPaymentService {
  // 使用配置文件中的设置
  private static get zpayPid() { return paymentConfig.zpayPid; }
  private static get zpayKey() { return paymentConfig.zpayKey; }
  private static get appUrl() { return paymentConfig.appUrl; }
  private static get siteName() { return paymentConfig.siteName; }
  private static get isDemoMode() { return paymentConfig.isDemoMode; }

  static async generatePaymentUrl(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('模拟支付服务 - 收到请求:', request);
      
      const { product_name, amount, credits, payment_type = 'wxpay' } = request;
      
      if (!product_name || !amount || !credits) {
        throw new Error('缺少必需参数');
      }
      
      // 验证支付方式（根据Z-Pay官方要求）
      if (payment_type !== 'alipay' && payment_type !== 'wxpay') {
        throw new Error('支付方式只支持 alipay 或 wxpay');
      }
      
      // 如果是演示模式，显示配置信息并返回演示数据
      if (this.isDemoMode) {
        console.log(getPaymentConfigInfo());
        return this.createDemoResponse(request);
      }
      
      const outTradeNo = generateOrderNo();
      
      // 构建Z-Pay支付参数
      const zpayParams = {
        pid: this.zpayPid,
        money: parseFloat(amount.toString()).toFixed(2),
        name: product_name,
        notify_url: `${this.appUrl}/api/payment/zpay-webhook`,
        out_trade_no: outTradeNo,
        return_url: `${this.appUrl}/payment/success`,
        sitename: this.siteName,
        type: payment_type,
        param: `积分充值-${credits}积分`
      };
      
      // 生成签名
      const paramString = getVerifyParams(zpayParams);
      const sign = generateSign(paramString, this.zpayKey);
      
      const formData = {
        ...zpayParams,
        sign: sign,
        sign_type: 'MD5'
      };
      
      // 构建支付URL
      const urlParams = new URLSearchParams(formData);
      const paymentUrl = `https://z-pay.cn/submit.php?${urlParams.toString()}`;
      
      console.log('模拟支付服务 - 生成成功:', {
        outTradeNo,
        paramString,
        sign
      });
      
      return {
        success: true,
        payment_url: paymentUrl,
        form_data: formData,
        form_action: 'https://z-pay.cn/submit.php',
        out_trade_no: outTradeNo,
        method: 'POST',
        debug_info: {
          param_string: paramString,
          sign: sign
        }
      };
      
    } catch (error) {
      console.error('模拟支付服务错误:', error);
      throw error;
    }
  }
  
  // 创建演示响应（不跳转到真实支付页面）
  private static createDemoResponse(request: PaymentRequest): PaymentResponse {
    const outTradeNo = generateOrderNo();
    const { product_name, amount, credits, payment_type = 'wxpay' } = request;
    
    // 构建演示参数
    const zpayParams = {
      pid: this.zpayPid,
      money: parseFloat(amount.toString()).toFixed(2),
      name: product_name,
      notify_url: `${this.appUrl}/api/payment/zpay-webhook`,
      out_trade_no: outTradeNo,
      return_url: `${this.appUrl}/payment/success`,
      sitename: this.siteName,
      type: payment_type,
      param: `积分充值-${credits}积分`
    };
    
    const paramString = getVerifyParams(zpayParams);
    const sign = generateSign(paramString, this.zpayKey);
    
    // 返回演示数据，但不实际跳转
    return {
      success: true,
      payment_url: '#demo-payment', // 演示URL，不会跳转
      form_data: { ...zpayParams, sign, sign_type: 'MD5' },
      form_action: 'https://z-pay.cn/submit.php',
      out_trade_no: outTradeNo,
      method: 'DEMO',
      debug_info: {
        param_string: paramString,
        sign: sign
      }
    };
  }
}
