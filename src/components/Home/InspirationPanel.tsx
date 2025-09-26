import React, { useState } from 'react';
import { Card, Typography, Tag, Space, Button } from 'antd';
import { 
  BulbOutlined, 
  DownOutlined, 
  UpOutlined,
  FireOutlined,
  StarOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

export const InspirationPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hotTopics = [
    '#秋日穿搭',
    '#咖啡探店',
    '#护肤好物',
    '#周末去哪儿',
    '#美食日记',
    '#读书分享',
    '#健身打卡',
    '#居家好物'
  ];
  
  const startingSentences = [
    '姐妹们，今天要分享一个超棒的...',
    '最近发现了一个宝藏...',
    '作为一个资深...，我必须要说...',
    '谁懂啊家人们！这个真的太...',
    '救命！这个也太好用了吧...',
    '不是吧不是吧，还有人不知道...',
    '今天来聊聊我最近的心头好...',
    '分享一个小众但超绝的...'
  ];
  
  return (
    <Card 
      className="mb-6 animate-fadeInUp"
      bodyStyle={{ padding: isExpanded ? '16px' : '12px' }}
    >
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Space>
          <BulbOutlined className="text-yellow-500 text-xl" />
          <Text strong>AI灵感助手</Text>
        </Space>
        <Button 
          type="text" 
          icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
        >
          {isExpanded ? '收起' : '展开'}
        </Button>
      </div>
      
      <div 
        className={`collapse-expand ${isExpanded ? 'mt-4' : ''}`}
        style={{ 
          maxHeight: isExpanded ? '400px' : '0',
          opacity: isExpanded ? 1 : 0
        }}
      >
        {/* 热门话题 */}
        <div className="mb-4">
          <Space className="mb-2">
            <FireOutlined className="text-red-500" />
            <Text strong>今日热门话题</Text>
          </Space>
          <div className="flex flex-wrap gap-2">
            {hotTopics.map(topic => (
              <Tag 
                key={topic} 
                color="magenta"
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  // 可以添加点击话题的处理
                }}
              >
                {topic}
              </Tag>
            ))}
          </div>
        </div>
        
        {/* 推荐开头 */}
        <div>
          <Space className="mb-2">
            <StarOutlined className="text-yellow-500" />
            <Text strong>爆款开头句式</Text>
          </Space>
          <div className="space-y-2">
            {startingSentences.map((sentence, index) => (
              <div 
                key={index}
                className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  // 可以添加点击句式的处理
                }}
              >
                <Text className="text-sm">• {sentence}</Text>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};