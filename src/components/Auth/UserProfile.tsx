import React, { useState } from 'react';
import { Button, Dropdown, Space, Badge, Avatar, Modal } from 'antd';
import { 
  UserOutlined, 
  LogoutOutlined, 
  CrownOutlined,
  SettingOutlined,
  WalletOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../../stores/useAuthStore';


interface UserProfileProps {
  onOpenSettings?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onOpenSettings }) => {
  const { user, signOut, isAuthenticated } = useAuthStore();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    await signOut();
    setLogoutModalVisible(false);
  };

  const menuItems = [
    {
      key: 'credits',
      icon: <WalletOutlined />,
      label: (
        <Space>
          <span>我的积分</span>
          <Badge 
            count={user.credits} 
            style={{ backgroundColor: '#52c41a' }}
            overflowCount={9999}
          />
        </Space>
      ),
      disabled: true
    },
    {
      type: 'divider' as const
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'API设置',
      onClick: onOpenSettings
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        placement="bottomRight"
        trigger={['click']}
      >
        <Button type="text" className="h-auto p-2">
          <Space align="center">
            <Avatar 
              size="small" 
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff' }}
            />
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">
                {user.username}
              </div>
              <div className="text-xs text-gray-500 flex items-center">
                <CrownOutlined className="mr-1" />
                {user.credits} 积分
              </div>
            </div>
          </Space>
        </Button>
      </Dropdown>

      <Modal
        title="确认退出"
        open={logoutModalVisible}
        onOk={confirmLogout}
        onCancel={() => setLogoutModalVisible(false)}
        okText="确认退出"
        cancelText="取消"
        centered
      >
        <p>确定要退出登录吗？</p>
      </Modal>
    </>
  );
};