import React, { useState } from 'react';
import { Button, message } from 'antd';
import { CreditCardOutlined, LoadingOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/useAuthStore';
import { RealPaymentService } from '../../services/realPaymentService';
import { PaymentErrorHandler } from '../../utils/paymentErrorHandler';

interface PaymentButtonProps {
  productName: string;
  amount: number;
  credits: number;
  paymentType?: 'wxpay' | 'alipay'; // 支付方式：微信支付或支付宝
  subscriptionType?: 'monthly' | 'quarterly' | 'yearly';
  className?: string;
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'dashed' | 'link' | 'text';
  disabled?: boolean;
  onPaymentStart?: () => void;
  onPaymentSuccess?: (orderInfo: any) => void;
  onPaymentError?: (error: string) => void;
}

// 创建POST表单并自动提交
const createPostForm = (formData: Record<string, string>, action: string) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  form.style.display = 'none';

  // 添加所有参数作为隐藏字段
  Object.keys(formData).forEach(key => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = formData[key];
    form.appendChild(input);
  });

  // 添加到页面并提交
  document.body.appendChild(form);
  form.submit();
};

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  productName,
  amount,
  credits,
  paymentType = 'wxpay', // 默认微信支付
  className,
  size = 'large',
  type = 'primary',
  disabled = false,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError,
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    try {
      // 检查用户登录状态
      if (!isAuthenticated || !user) {
        message.error('请先登录后再进行支付');
        return;
      }

      setLoading(true);
      onPaymentStart?.();

      // 🔥 强制使用真实支付服务
      const result = await RealPaymentService.generatePaymentUrl({
        product_name: productName,
        amount: amount,
        credits: credits,
        payment_type: paymentType
      });

      if (!result.success || !result.payment_url) {
        throw new Error('支付链接生成失败');
      }

      console.log('支付链接生成成功:', result);

      // 触发成功回调
      onPaymentSuccess?.(result);

      // 🚀 真实支付模式：使用POST表单方式跳转
      console.log('✅ 即将跳转到真实Z-Pay支付页面');
      
      if (result.form_data) {
        // 如果返回了表单数据，使用POST提交
        createPostForm(result.form_data, 'https://z-pay.cn/submit.php');
      } else {
        // 否则使用GET跳转
        window.location.href = result.payment_url;
      }

    } catch (error) {
      console.error('支付处理错误:', error);
      
      // 使用专门的错误处理器
      const userFriendlyMessage = PaymentErrorHandler.handleZPayError(error);
      const solution = PaymentErrorHandler.getSolutionSuggestion(error);
      
      // 显示用户友好的错误消息
      message.error({
        content: userFriendlyMessage,
        duration: 8,
      });
      
      // 如果有解决建议，显示额外信息
      if (solution) {
        setTimeout(() => {
          message.info({
            content: solution,
            duration: 10,
          });
        }, 1000);
      }
      
      onPaymentError?.(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  // 如果用户未登录，显示登录提示
  if (!isAuthenticated) {
    return (
      <Button
        size={size}
        type="default"
        className={className}
        onClick={() => message.warning('请先登录后再进行支付')}
      >
        请先登录
      </Button>
    );
  }

  return (
    <Button
      type={type}
      size={size}
      icon={loading ? <LoadingOutlined /> : <CreditCardOutlined />}
      loading={loading}
      disabled={disabled || loading}
      className={className}
      onClick={handlePayment}
    >
      {loading ? '处理中...' : '立即支付'}
    </Button>
  );
};
