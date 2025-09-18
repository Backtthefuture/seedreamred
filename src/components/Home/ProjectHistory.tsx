import React from 'react';
import { Card, Typography, Row, Col, Button, Tag, Space, Empty, Image } from 'antd';
import { 
  ClockCircleOutlined, 
  DeleteOutlined,
  PlusOutlined,
  FileTextOutlined,
  CoffeeOutlined,
  SkinOutlined,
  ShoppingOutlined,
  BookOutlined,
  HeartOutlined
} from '@ant-design/icons';
import type { RecentProject } from '../../stores/useAppStore';

const { Text, Title } = Typography;

interface ProjectHistoryProps {
  projects: RecentProject[];
  onProjectClick: (projectId: string) => void;
  onClearHistory: () => void;
}

export const ProjectHistory: React.FC<ProjectHistoryProps> = ({ 
  projects, 
  onProjectClick, 
  onClearHistory 
}) => {
  // 根据项目名称返回对应的图标
  const getProjectIcon = (name: string) => {
    if (name.includes('美食') || name.includes('咖啡') || name.includes('餐')) {
      return <CoffeeOutlined className="text-2xl text-orange-500" />;
    }
    if (name.includes('护肤') || name.includes('化妆') || name.includes('美妆')) {
      return <SkinOutlined className="text-2xl text-pink-500" />;
    }
    if (name.includes('穿搭') || name.includes('购物') || name.includes('买')) {
      return <ShoppingOutlined className="text-2xl text-purple-500" />;
    }
    if (name.includes('读书') || name.includes('学习') || name.includes('工作')) {
      return <BookOutlined className="text-2xl text-blue-500" />;
    }
    if (name.includes('运动') || name.includes('健身') || name.includes('健康')) {
      return <HeartOutlined className="text-2xl text-red-500" />;
    }
    return <FileTextOutlined className="text-2xl text-gray-500" />;
  };
  
  // 格式化日期显示
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    return date.toLocaleDateString();
  };
  
  if (projects.length === 0) {
    return (
      <Card className="mb-6 animate-fadeInUp">
        <Empty 
          description="暂无历史记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }
  
  return (
    <div className="animate-fadeInUp">
      <div className="flex justify-between items-center mb-4">
        <Space>
          <ClockCircleOutlined className="text-lg" />
          <Title level={5} className="!mb-0">最近项目</Title>
        </Space>
        <Button 
          size="small" 
          type="text" 
          danger
          icon={<DeleteOutlined />}
          onClick={onClearHistory}
        >
          清空历史
        </Button>
      </div>
      
      <Row gutter={[16, 16]}>
        {projects.slice(0, 5).map(project => (
          <Col key={project.id} xs={24} sm={12} md={8} lg={8} xl={6}>
            <Card
              hoverable
              className="project-card h-full"
              onClick={() => onProjectClick(project.id)}
              cover={
                project.thumbnail ? (
                  <div className="h-32 overflow-hidden bg-gray-100">
                    <Image
                      src={project.thumbnail}
                      alt={project.name}
                      preview={false}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-32 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    {getProjectIcon(project.name)}
                  </div>
                )
              }
            >
              <Card.Meta
                title={
                  <div className="flex items-center justify-between">
                    <Text strong ellipsis className="flex-1">
                      {project.name}
                    </Text>
                  </div>
                }
                description={
                  <div className="space-y-1">
                    <Text type="secondary" className="text-xs">
                      {project.wordCount} 字
                    </Text>
                    <Tag color="blue" className="text-xs">
                      {formatDate(project.date)}
                    </Tag>
                  </div>
                }
              />
            </Card>
          </Col>
        ))}
        
        {/* 查看更多卡片 */}
        {projects.length > 5 && (
          <Col xs={24} sm={12} md={8} lg={8} xl={6}>
            <Card
              hoverable
              className="project-card h-full border-dashed"
              style={{ minHeight: 200 }}
            >
              <div className="h-full flex flex-col items-center justify-center">
                <PlusOutlined className="text-3xl text-gray-400 mb-2" />
                <Text type="secondary">查看全部</Text>
                <Text type="secondary" className="text-xs">
                  共 {projects.length} 个项目
                </Text>
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};