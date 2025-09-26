import React, { useState, useEffect } from 'react';
import { Modal, Card, Typography, message, Radio, Space, Alert } from 'antd';
import { CrownOutlined, WalletOutlined, AlipayOutlined, WechatOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/useAuthStore';
import { PaymentButton } from '../Payment';
import { PaymentChannelService } from '../../services/paymentChannelService';

const { Title, Text, Paragraph } = Typography;

interface CreditsModalProps {
  visible: boolean;
  onClose: () => void;
}

// 购买选项配置
const PURCHASE_OPTIONS = [
  {
    id: 'package_1',
    price: 1,
    credits: 100,
    label: '体验包',
    popular: false,
    description: '适合新用户体验',
  },
  {
    id: 'package_2', 
    price: 2,
    credits: 200,
    label: '基础包',
    popular: false,
    description: '日常使用推荐',
  },
  {
    id: 'package_5',
    price: 5,
    credits: 500,
    label: '标准包',
    popular: true,
    description: '性价比最高',
    bonus: 50, // 额外赠送
  },
  {
    id: 'package_10',
    price: 10,
    credits: 1000,
    label: '进阶包',
    popular: false,
    description: '高频用户选择',
    bonus: 200, // 额外赠送
  },
  {
    id: 'package_100',
    price: 100,
    credits: 10000,
    label: '专业包',
    popular: false,
    description: '企业用户专享',
    bonus: 3000, // 额外赠送
  },
];

export const CreditsModal: React.FC<CreditsModalProps> = ({
  visible,
  onClose,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<'wxpay' | 'alipay'>('wxpay');

  // 初始化时设置推荐的支付方式
  useEffect(() => {
    const recommendedType = PaymentChannelService.getRecommendedPaymentType();
    setPaymentType(recommendedType);
  }, []);

  // 支付相关处理
  const handlePaymentStart = () => {
    setLoading('payment');
    message.info('正在跳转到支付页面...');
  };

  const handlePaymentSuccess = (orderInfo: any) => {
    console.log('支付成功:', orderInfo);
    message.success('支付链接生成成功，即将跳转到支付页面');
    setLoading(null);
  };

  const handlePaymentError = (error: string) => {
    console.error('支付错误:', error);
    message.error(`支付失败: ${error}`);
    setLoading(null);
  };

  const renderPurchaseCard = (option: typeof PURCHASE_OPTIONS[0]) => {
    const totalCredits = option.credits + (option.bonus || 0);
    
    return (
      <Card
        key={option.id}
        className={`relative transition-all duration-200 hover:shadow-lg cursor-pointer ${
          option.popular ? 'border-2 border-blue-500 shadow-md' : ''
        }`}
        bodyStyle={{ padding: '20px' }}
      >
        {/* 热门标签 */}
        {option.popular && (
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
              <CrownOutlined className="mr-1" />
              推荐
            </div>
          </div>
        )}

        <div className="text-center">
          {/* 价格 */}
          <div className="mb-3">
            <Text className="text-2xl font-bold text-gray-800">
              ¥{option.price}
            </Text>
            <div className="text-xs text-gray-500 mt-1">
              {option.label}
            </div>
          </div>

          {/* 积分数量 */}
          <div className="mb-4">
            <div className="text-lg font-semibold text-blue-600">
              💎 {option.credits.toLocaleString()} 积分
            </div>
            {option.bonus && (
              <div className="text-sm text-green-600 mt-1">
                + 额外赠送 {option.bonus} 积分
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              实际获得: {totalCredits.toLocaleString()} 积分
            </div>
          </div>

          {/* 描述 */}
          <div className="mb-4">
            <Text className="text-sm text-gray-600">
              {option.description}
            </Text>
          </div>

          {/* 支付按钮 */}
          <PaymentButton
            productName={option.label}
            amount={option.price}
            credits={totalCredits}
            paymentType={paymentType}
            type={option.popular ? 'primary' : 'default'}
            size="large"
            className="w-full"
            disabled={!!loading}
            onPaymentStart={handlePaymentStart}
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
          />
        </div>
      </Card>
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center">
          <WalletOutlined className="mr-2 text-blue-500" />
          <span>积分充值</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={900}
      className="credits-modal"
    >
      <div className="space-y-6">
        {/* 当前积分状态 */}
        {isAuthenticated && user ? (
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <Title level={4} className="mb-2">
                  当前账户状态
                </Title>
                <div className="flex items-center space-x-4">
                  <div>
                    <Text className="text-gray-600">用户名：</Text>
                    <Text className="font-medium">{user.username}</Text>
                  </div>
                  <div>
                    <Text className="text-gray-600">当前积分：</Text>
                    <Text className="text-lg font-bold text-blue-600">
                      💎 {user.credits?.toLocaleString()} 积分
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-yellow-50 border-yellow-200">
            <Paragraph className="mb-0 text-center">
              <Text className="text-yellow-800">
                请先登录后再进行积分购买
              </Text>
            </Paragraph>
          </Card>
        )}

        {/* 充值说明 */}
        <Card>
          <Title level={4} className="mb-3">
            💰 充值规则
          </Title>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">1 元 = 100 积分</div>
              <div className="text-sm text-gray-600">基础兑换比例</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">充值越多 赠送越多</div>
              <div className="text-sm text-gray-600">更划算的选择</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">永久有效</div>
              <div className="text-sm text-gray-600">积分不过期</div>
            </div>
          </div>
        </Card>

        {/* 支付方式选择 */}
        <Card>
          <Title level={4} className="mb-3">
            💳 选择支付方式
          </Title>
          
          {/* 支付渠道状态提示 */}
          {!PaymentChannelService.isPaymentTypeAvailable('wxpay') && (
            <Alert
              message="微信支付暂不可用"
              description="商户尚未开通微信支付渠道，建议使用支付宝支付"
              type="warning"
              showIcon
              className="mb-3"
            />
          )}
          
          <Radio.Group 
            value={paymentType} 
            onChange={(e) => setPaymentType(e.target.value)}
            className="w-full"
          >
            <Space direction="horizontal" size="large" className="w-full justify-center">
              <Radio.Button 
                value="wxpay" 
                className="flex-1 text-center"
                disabled={!PaymentChannelService.isPaymentTypeAvailable('wxpay')}
              >
                <WechatOutlined className="mr-2 text-green-500" />
                微信支付
                {!PaymentChannelService.isPaymentTypeAvailable('wxpay') && (
                  <span className="text-xs text-gray-400 block">(未开通)</span>
                )}
              </Radio.Button>
              <Radio.Button 
                value="alipay" 
                className="flex-1 text-center"
                disabled={!PaymentChannelService.isPaymentTypeAvailable('alipay')}
              >
                <AlipayOutlined className="mr-2 text-blue-500" />
                支付宝
                {!PaymentChannelService.isPaymentTypeAvailable('alipay') && (
                  <span className="text-xs text-gray-400 block">(未开通)</span>
                )}
              </Radio.Button>
            </Space>
          </Radio.Group>
        </Card>

        {/* 购买选项 */}
        <div>
          <Title level={4} className="mb-4">
            🎁 选择充值套餐
          </Title>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PURCHASE_OPTIONS.map(option => renderPurchaseCard(option))}
          </div>
        </div>

        {/* 使用说明 */}
        <Card className="bg-blue-50 border-blue-200">
          <Title level={5} className="mb-3">
            📝 积分使用说明
          </Title>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• 生成1张小红书图片消耗 10 积分</li>
            <li>• AI智能文本拆分免费使用</li>
            <li>• 积分永久有效，不会过期</li>
            <li>• 支持随时查看消费记录</li>
          </ul>
        </Card>

        {/* 支付提示 */}
        <div className="text-center text-gray-500 text-xs">
          <div>
            * 支付系统已集成Z-Pay，支持微信支付
          </div>
          <div>
            * 支付成功后积分将自动到账
          </div>
          <div>
            * 如有问题请联系客服获取帮助
          </div>
        </div>
      </div>
    </Modal>
  );
};
