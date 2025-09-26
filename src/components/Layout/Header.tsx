import React from 'react';
import { Button, Space } from 'antd';
import { SettingOutlined, FileTextOutlined, QuestionCircleOutlined } from '@ant-design/icons';

interface HeaderProps {
  onSettingsClick: () => void;
  onTemplateClick: () => void;
  onHelpClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSettingsClick,
  onTemplateClick,
  onHelpClick,
}) => {
  return (
    <div className="h-16 bg-white shadow-sm border-b border-gray-200 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">✨</span>
        <h1 className="text-xl font-bold text-gray-800">文字转小红书 Pro</h1>
      </div>
      
      <Space>
        <Button
          icon={<SettingOutlined />}
          onClick={onSettingsClick}
        >
          API设置
        </Button>
        <Button
          icon={<FileTextOutlined />}
          onClick={onTemplateClick}
        >
          模板管理
        </Button>
        <Button
          icon={<QuestionCircleOutlined />}
          onClick={onHelpClick}
        >
          帮助
        </Button>
      </Space>
    </div>
  );
};