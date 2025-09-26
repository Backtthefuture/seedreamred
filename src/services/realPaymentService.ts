// 强制使用真实支付服务
import crypto from 'crypto-js';

// 强制使用真实配置
const REAL_PAYMENT_CONFIG = {
  zpayPid: '2025062920440492',
  zpayKey: 'tNeFjVxC3b8IlgNJvqFA9oRNxy9ShaA1',
  appUrl: 'http://localhost:5173',
  siteName: '文字转小红书',
  isDemoMode: false // 强制设置为 false
};

// Z-Pay 签名算法
function getVerifyParams(params: Record<string, any>) {
  const sPara: [string, any][] = [];
  
  for (const key in params) {
    if ((!params[key]) || key === "sign" || key === "sign_type") {
      continue;
    }
    sPara.push([key, params[key]]);
  }
  
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

function generateSign(paramString: string, key: string) {
  const signString = paramString + key;
  return crypto.MD5(signString).toString();
}

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

export class RealPaymentService {
  static async generatePaymentUrl(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('🚀 真实支付服务 - 收到请求:', request);
      console.log('🔥 使用真实商户信息:', {
        pid: REAL_PAYMENT_CONFIG.zpayPid,
        isDemoMode: REAL_PAYMENT_CONFIG.isDemoMode
      });
      
      const { product_name, amount, credits, payment_type = 'wxpay' } = request;
      
      if (!product_name || !amount || !credits) {
        throw new Error('缺少必需参数');
      }
      
      // 验证支付方式
      if (payment_type !== 'alipay' && payment_type !== 'wxpay') {
        throw new Error('支付方式只支持 alipay 或 wxpay');
      }
      
      const outTradeNo = generateOrderNo();
      
      // 构建Z-Pay支付参数
      const zpayParams = {
        pid: REAL_PAYMENT_CONFIG.zpayPid,
        money: parseFloat(amount.toString()).toFixed(2),
        name: product_name,
        notify_url: `${REAL_PAYMENT_CONFIG.appUrl}/api/payment/zpay-webhook`,
        out_trade_no: outTradeNo,
        return_url: `${REAL_PAYMENT_CONFIG.appUrl}/payment/success`,
        sitename: REAL_PAYMENT_CONFIG.siteName,
        type: payment_type,
        param: `积分充值-${credits}积分`
      };
      
      // 生成签名
      const paramString = getVerifyParams(zpayParams);
      const sign = generateSign(paramString, REAL_PAYMENT_CONFIG.zpayKey);
      
      const formData = {
        ...zpayParams,
        sign: sign,
        sign_type: 'MD5'
      };
      
      // 构建支付URL
      const urlParams = new URLSearchParams(formData);
      const paymentUrl = `https://z-pay.cn/submit.php?${urlParams.toString()}`;
      
      console.log('✅ 真实支付链接生成成功:', {
        outTradeNo,
        paramString,
        sign,
        paymentUrl
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
      console.error('真实支付服务错误:', error);
      throw error;
    }
  }
}
