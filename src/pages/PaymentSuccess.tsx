import React, { useEffect, useState } from 'react';
import { Result, Button, Card, Typography, Spin } from 'antd';
import { CheckCircleOutlined, HomeOutlined } from '@ant-design/icons';
import { useAuthStore } from '../stores/useAuthStore';

const { Title, Paragraph } = Typography;

export const PaymentSuccess: React.FC = () => {
  const { user, initializeAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 刷新用户信息以获取最新积分
    const refreshUserData = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error('刷新用户信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    // 延迟一下再刷新，确保支付回调已处理
    const timer = setTimeout(refreshUserData, 2000);
    
    return () => clearTimeout(timer);
  }, [initializeAuth]);

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Title level={4}>正在确认支付结果...</Title>
            <Paragraph className="text-gray-600">
              请稍候，我们正在验证您的支付状态
            </Paragraph>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <Result
          icon={<CheckCircleOutlined className="text-green-500" />}
          status="success"
          title="支付成功！"
          subTitle="恭喜您，积分购买成功！积分已自动充值到您的账户。"
          extra={[
            <div key="user-info" className="mb-6">
              {user && (
                <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                  <div className="text-center">
                    <Title level={4} className="mb-2">
                      账户信息
                    </Title>
                    <div className="flex justify-center items-center space-x-6">
                      <div>
                        <div className="text-gray-600">用户名</div>
                        <div className="font-semibold">{user.username}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">当前积分</div>
                        <div className="text-2xl font-bold text-blue-600">
                          💎 {user.credits?.toLocaleString()} 积分
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>,
            <div key="actions" className="space-x-4">
              <Button type="primary" size="large" icon={<HomeOutlined />} onClick={handleBackToHome}>
                返回首页
              </Button>
            </div>
          ]}
        >
          <div className="text-center space-y-4">
            <Card className="bg-green-50 border-green-200">
              <Title level={5} className="text-green-800 mb-3">
                🎉 支付完成提示
              </Title>
              <div className="text-left space-y-2 text-green-700">
                <div>✅ 支付已成功处理</div>
                <div>✅ 积分已自动充值到账</div>
                <div>✅ 您可以开始使用积分生成小红书图片</div>
                <div>✅ 积分永久有效，无过期时间</div>
              </div>
            </Card>
            
            <Card>
              <Title level={5} className="mb-3">
                💡 使用说明
              </Title>
              <div className="text-left space-y-1 text-gray-600">
                <div>• 生成1张小红书图片消耗 10 积分</div>
                <div>• AI智能文本拆分功能免费使用</div>
                <div>• 支持随时查看积分余额和消费记录</div>
                <div>• 如需更多积分，可随时返回充值页面</div>
              </div>
            </Card>
          </div>
        </Result>
      </Card>
    </div>
  );
};
