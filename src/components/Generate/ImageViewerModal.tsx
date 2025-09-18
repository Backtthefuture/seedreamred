import React from 'react';
import { Modal, Button, Spin } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import type { GeneratedImage } from '../../types';
import { DownloadService } from '../../services/downloadService';
import { convertToProxyUrl } from '../../utils/urlConverter';

interface ImageViewerModalProps {
  visible: boolean;
  image: GeneratedImage | null;
  onClose: () => void;
  onRegenerate: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  image,
  onClose,
  onRegenerate,
}) => {
  const [downloading, setDownloading] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);

  const handleDownload = async () => {
    if (!image?.url) return;
    
    setDownloading(true);
    try {
      const filename = image.type === 'cover' 
        ? `封面.png` 
        : `内容${image.index}.png`;
      await DownloadService.downloadImage(image.url, filename);
    } catch (error) {
      console.error('下载失败:', error);
    } finally {
      setDownloading(false);
    }
  };

  const getTitle = () => {
    if (!image) return '';
    return image.type === 'cover' ? '封面图片' : `内容图片 ${image.index}`;
  };

  return (
    <Modal
      title={getTitle()}
      open={visible}
      onCancel={onClose}
      width="90%"
      style={{ 
        maxWidth: '1400px',
        top: '5%'
      }}
      bodyStyle={{
        height: '85vh',
        maxHeight: '900px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      footer={[
        <Button
          key="download"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          loading={downloading}
          disabled={!image?.url}
        >
          下载图片
        </Button>,
        <Button
          key="regenerate"
          icon={<ReloadOutlined />}
          onClick={() => {
            onRegenerate();
            onClose();
          }}
        >
          重新生成
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          关闭
        </Button>,
      ]}
    >
      <div className="flex items-center justify-center w-full h-full relative">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <Spin size="large" tip="加载图片中..." />
          </div>
        )}
        {image?.url && (
          <img
            src={convertToProxyUrl(image.url)}
            alt={getTitle()}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain'
            }}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        )}
      </div>
    </Modal>
  );
};