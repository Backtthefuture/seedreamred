import React, { useState } from 'react';
import { Button, Popover } from 'antd';
import { LoginOutlined, WarningOutlined } from '@ant-design/icons';
import { useAuthStore } from '../../stores/useAuthStore';
import { LoginModal } from './LoginModal';
import { UserProfile } from './UserProfile';
import { ConfigStatus } from './ConfigStatus';

interface AuthButtonProps {
  onOpenSettings?: () => void;
}

export const AuthButton: React.FC<AuthButtonProps> = ({ onOpenSettings }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // 检查 Supabase 配置状态
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isConfigured = supabaseUrl && supabaseAnonKey && 
    !supabaseUrl.includes('your-project-id') && 
    !supabaseAnonKey.includes('your-anon-key');

  // 如果已认证，显示用户信息
   if (isAuthenticated && user) {
     return <UserProfile onOpenSettings={onOpenSettings} />;
   }

  // 如果未配置 Supabase，显示配置提示
  if (!isConfigured) {
    return (
      <Popover
        content={<ConfigStatus onOpenSettings={onOpenSettings} />}
        title="需要配置 Supabase"
        trigger="click"
        placement="bottomRight"
        overlayStyle={{ maxWidth: 400 }}
      >
        <Button
          type="default"
          icon={<WarningOutlined />}
          style={{ color: '#faad14', borderColor: '#faad14' }}
        >
          配置认证
        </Button>
      </Popover>
    );
  }

  // 正常显示登录按钮
  return (
    <>
      <Button
        type="primary"
        icon={<LoginOutlined />}
        onClick={() => setShowLoginModal(true)}
      >
        登录
      </Button>
      
      <LoginModal
         visible={showLoginModal}
         onClose={() => setShowLoginModal(false)}
       />
    </>
  );
};