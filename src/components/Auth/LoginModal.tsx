import React, { useState } from 'react';
import { Modal, Form, Input, Button, Tabs, Space, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/useAuthStore';
import type { SignUpData, SignInData } from '../../services/supabaseClient';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  
  const { signIn, signUp, isLoading } = useAuthStore();

  // 处理登录
  const handleLogin = async () => {
    try {
      const values = await loginForm.validateFields();
      const success = await signIn(values as SignInData);
      if (success) {
        onClose();
        loginForm.resetFields();
      }
    } catch (error) {
      console.error('Login form validation failed:', error);
    }
  };

  // 处理注册
  const handleRegister = async () => {
    try {
      const values = await registerForm.validateFields();
      const success = await signUp(values as SignUpData);
      if (success) {
        onClose();
        registerForm.resetFields();
      }
    } catch (error) {
      console.error('Register form validation failed:', error);
    }
  };

  // 关闭模态框时重置表单
  const handleClose = () => {
    loginForm.resetFields();
    registerForm.resetFields();
    onClose();
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={400}
      centered
      destroyOnClose
    >
      <div className="text-center mb-6">
        <Title level={3} className="mb-2">
          {activeTab === 'login' ? '欢迎回来' : '创建账户'}
        </Title>
        <Text type="secondary">
          {activeTab === 'login' 
            ? '登录您的账户以继续使用' 
            : '注册新账户，立即获得100积分'
          }
        </Text>
      </div>

      <Tabs 
        activeKey={activeTab} 
        onChange={(key) => setActiveTab(key as 'login' | 'register')}
        centered
        size="large"
      >
        <TabPane tab="登录" key="login">
          <Form
            form={loginForm}
            layout="vertical"
            onFinish={handleLogin}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, message: '用户名至少2位字符' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="注册" key="register">
          <Form
            form={registerForm}
            layout="vertical"
            onFinish={handleRegister}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 2, message: '用户名至少2位字符' },
                { max: 20, message: '用户名最多20位字符' },
                { 
                  pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, 
                  message: '用户名只能包含字母、数字、下划线和中文' 
                }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位字符' },
                { max: 50, message: '密码最多50位字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<SafetyOutlined />}
                placeholder="确认密码"
                autoComplete="new-password"
              />
            </Form.Item>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <Space direction="vertical" size="small" className="w-full">
                <Text type="secondary" className="text-sm">
                  🎁 注册福利
                </Text>
                <Text className="text-sm">
                  • 首次注册即可获得 <Text strong className="text-blue-600">100积分</Text>
                </Text>
                <Text className="text-sm">
                  • 积分可用于AI图片生成等功能
                </Text>
              </Space>
            </div>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                size="large"
              >
                注册账户
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>

      <Divider />
      
      <div className="text-center">
        <Text type="secondary" className="text-xs">
          注册即表示您同意我们的服务条款和隐私政策
        </Text>
      </div>
    </Modal>
  );
};