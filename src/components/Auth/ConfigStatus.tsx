import React from 'react';
import { Alert, Button, Card, Typography, Space } from 'antd';
import { WarningOutlined, CheckCircleOutlined, SettingOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface ConfigStatusProps {
  onOpenSettings?: () => void;
}

export const ConfigStatus: React.FC<ConfigStatusProps> = ({ onOpenSettings }) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  const isConfigured = supabaseUrl && supabaseAnonKey && 
    !supabaseUrl.includes('your-project-id') && 
    !supabaseAnonKey.includes('your-anon-key');

  if (isConfigured) {
    return (
      <Alert
        message="Supabase 已配置"
        description="认证功能已就绪，可以进行登录注册操作。"
        type="success"
        icon={<CheckCircleOutlined />}
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <Card style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          message="需要配置 Supabase"
          description="请按照以下步骤配置 Supabase 以启用认证功能。"
          type="warning"
          icon={<WarningOutlined />}
          showIcon
        />
        
        <Title level={4}>🚀 快速设置步骤：</Title>
        
        <Paragraph>
          <Text strong>1. 创建 Supabase 项目</Text>
          <br />
          访问 <Text code>https://supabase.com</Text> 创建新项目
        </Paragraph>
        
        <Paragraph>
          <Text strong>2. 配置环境变量</Text>
          <br />
          在项目根目录的 <Text code>.env</Text> 文件中添加：
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '8px', 
            borderRadius: '4px',
            fontSize: '12px',
            marginTop: '8px'
          }}>
{`VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}
          </pre>
        </Paragraph>
        
        <Paragraph>
          <Text strong>3. 设置数据库</Text>
          <br />
          在 Supabase SQL Editor 中执行 <Text code>supabase-setup.sql</Text> 文件中的 SQL 代码
        </Paragraph>
        
        <Paragraph>
          <Text type="secondary">
            详细设置说明请查看 <Text code>SUPABASE_SETUP.md</Text> 文件
          </Text>
        </Paragraph>
        
        {onOpenSettings && (
          <Button 
            type="primary" 
            icon={<SettingOutlined />}
            onClick={onOpenSettings}
          >
            打开设置
          </Button>
        )}
      </Space>
    </Card>
  );
};