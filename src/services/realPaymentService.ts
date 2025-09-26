// 真实支付服务 - 调用后端API
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
      console.log('🚀 调用后端API创建支付订单:', request);
      
      const { product_name, amount, credits, payment_type = 'wxpay' } = request;
      
      if (!product_name || !amount || !credits) {
        throw new Error('缺少必需参数');
      }
      
      // 验证支付方式
      if (payment_type !== 'alipay' && payment_type !== 'wxpay') {
        throw new Error('支付方式只支持 alipay 或 wxpay');
      }
      
      // 获取用户token
      const token = localStorage.getItem('sb-miosumqzcgbscxrwdbuc-auth-token');
      if (!token) {
        throw new Error('用户未登录');
      }
      
      const authData = JSON.parse(token);
      const accessToken = authData?.access_token;
      
      if (!accessToken) {
        throw new Error('无效的认证信息');
      }
      
      // 调用后端API创建支付订单
      const response = await fetch('/api/payment/zpay-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          product_name,
          amount,
          credits,
          payment_type
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || '支付链接生成失败');
      }
      
      console.log('✅ 后端API响应:', result);
      
      return {
        success: true,
        payment_url: result.payment_url,
        form_data: result.form_data,
        form_action: result.form_action,
        out_trade_no: result.out_trade_no,
        method: 'API_CALL',
        debug_info: result.debug_info
      };
      
    } catch (error) {
      console.error('支付API调用错误:', error);
      throw error;
    }
  }
}