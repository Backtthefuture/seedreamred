import React from 'react';
import { Typography } from 'antd';

const { Title, Text } = Typography;

export const HeroSection: React.FC = () => {
  return (
    <div className="gradient-hero rounded-lg p-8 mb-6 animate-fadeInUp">
      <div className="text-center text-white">
        <Title level={2} className="!text-white !mb-2">
          ✨ 文字转小红书
        </Title>
        <Text className="text-white/90 text-lg">
          让您的内容在小红书闪闪发光
        </Text>
      </div>
    </div>
  );
};