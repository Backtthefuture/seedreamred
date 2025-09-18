import React, { useState, useEffect } from 'react';
import { Button, Spin } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined, EyeOutlined } from '@ant-design/icons';
import type { GeneratedImage } from '../../types';
import { convertToProxyUrl } from '../../utils/urlConverter';

interface ImageCardProps {
  image: GeneratedImage;
  onRegenerate: () => void;
  onPreview: () => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  onRegenerate,
  onPreview,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // 监听URL变化，重置加载状态
  useEffect(() => {
    if (image.url && image.status === 'success') {
      console.log('[ImageCard] URL changed:', image.url);
      console.log('[ImageCard] Proxy URL:', convertToProxyUrl(image.url));
      
      // 重置状态
      setImageLoading(true);
      setImageError(false);
      
      // 设置超时处理（10秒）
      const timer = setTimeout(() => {
        console.log('[ImageCard] Loading timeout, forcing display');
        setImageLoading(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [image.url, image.status]);

  const getStatusIcon = () => {
    switch (image.status) {
      case 'success':
        return <CheckCircleOutlined className="text-green-500" />;
      case 'error':
        return <CloseCircleOutlined className="text-red-500" />;
      case 'generating':
        return <LoadingOutlined className="text-blue-500" spin />;
      default:
        return <LoadingOutlined className="text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (image.status) {
      case 'success':
        return '✅ 完成';
      case 'error':
        return '❌ 失败';
      case 'generating':
        return '⏳ 生成中...';
      case 'pending':
        return '⏸ 等待中';
      default:
        return '';
    }
  };

  const renderContent = () => {
    if (image.status === 'success' && image.url && !imageError) {
      return (
        <div className="mt-3 relative group">
          <div className="relative overflow-hidden rounded-lg bg-gray-100" style={{ maxHeight: '300px' }}>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Spin size="small" />
              </div>
            )}
            <img
              src={convertToProxyUrl(image.url)}
              alt={image.type === 'cover' ? '封面' : `图片${image.index}`}
              className="w-full h-auto object-contain cursor-pointer"
              style={{ 
                maxHeight: '300px',
                opacity: imageLoading ? 0 : 1,
                transition: 'opacity 0.3s ease-in-out'
              }}
              onClick={onPreview}
              onLoad={() => {
                console.log('[ImageCard] Image loaded successfully');
                setImageLoading(false);
              }}
              onError={(e) => {
                console.error('[ImageCard] Image load error:', e);
                setImageLoading(false);
                setImageError(true);
              }}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity pointer-events-none flex items-center justify-center">
              <EyeOutlined className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="text-xs text-gray-500 text-center mt-1">点击查看大图</div>
        </div>
      );
    }

    if (image.status === 'generating') {
      return (
        <div className="mt-3 h-32 bg-gray-50 rounded-lg flex items-center justify-center">
          <Spin tip="正在生成图片..." />
        </div>
      );
    }

    if (image.status === 'error' || imageError) {
      return (
        <div className="mt-3 h-32 bg-red-50 rounded-lg flex items-center justify-center">
          <div className="text-red-500 text-sm">
            {image.error || '图片加载失败'}
          </div>
        </div>
      );
    }

    if (image.status === 'pending') {
      return (
        <div className="mt-3 h-32 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-gray-400 text-sm">等待生成...</div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-3 border border-gray-200 rounded-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <span className="font-medium">
            {image.type === 'cover' ? '🖼 封面' : `🖼 图片${image.index}`}
          </span>
          <span className="text-sm text-gray-500">{getStatusText()}</span>
        </div>
        
        {(image.status === 'success' || image.status === 'error') && (
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={onRegenerate}
          >
            重新生成
          </Button>
        )}
      </div>
      
      {renderContent()}
    </div>
  );
};