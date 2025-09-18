import React, { useState } from 'react';
import { Button, Progress } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { GeneratedImage } from '../../types';
import { ImageCard } from './ImageCard';
import { ImageViewerModal } from './ImageViewerModal';

interface ResultDisplayProps {
  images: GeneratedImage[];
  onRegenerate: (id: string) => void;
  onDownloadAll: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  images,
  onRegenerate,
  onDownloadAll,
}) => {
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  const handlePreview = (image: GeneratedImage) => {
    setPreviewImage(image);
    setPreviewVisible(true);
  };

  const handleClosePreview = () => {
    setPreviewVisible(false);
    setTimeout(() => setPreviewImage(null), 300);
  };

  const handleRegenerateFromModal = () => {
    if (previewImage) {
      onRegenerate(previewImage.id);
    }
  };

  if (images.length === 0) {
    return null;
  }

  const completedCount = images.filter(img => img.status === 'success').length;
  const totalCount = images.length;
  const progress = Math.round((completedCount / totalCount) * 100);

  return (
    <>
      <div className="p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h3 className="font-medium text-gray-700">
              生成进度 ({completedCount}/{totalCount})
            </h3>
            {completedCount < totalCount && (
              <Progress percent={progress} size="small" style={{ width: 120 }} />
            )}
          </div>
          {completedCount > 0 && (
            <Button
              icon={<DownloadOutlined />}
              onClick={onDownloadAll}
            >
              批量下载
            </Button>
          )}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onRegenerate={() => onRegenerate(image.id)}
              onPreview={() => handlePreview(image)}
            />
          ))}
        </div>
      </div>

      <ImageViewerModal
        visible={previewVisible}
        image={previewImage}
        onClose={handleClosePreview}
        onRegenerate={handleRegenerateFromModal}
      />
    </>
  );
};