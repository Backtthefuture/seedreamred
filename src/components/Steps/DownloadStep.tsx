import React, { useState } from 'react';
import { 
  Button, 
  Space, 
  Typography, 
  Row,
  Col,
  Checkbox,
  message,
  Empty,
  Card
} from 'antd';
import { 
  DownloadOutlined,
  HomeOutlined,
  FileAddOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAppStore } from '../../stores/useAppStore';
import { useStepStore } from '../../stores/useStepStore';
import { StepContainer } from '../Navigation/StepContainer';
import { DownloadService } from '../../services/downloadService';
import { QuickEditableCard } from '../Generate/QuickEditableCard';
import { TextEditModal } from '../Generate/TextEditModal';
import type { GeneratedImage, SplitResult } from '../../types';

const { Text } = Typography;

export const DownloadStep: React.FC = () => {
  const {
    generatedImages,
    splitResults,
    setInputText,
    setSplitResults,
    setGeneratedImages,
    regenerateSingleImage,
    updateSplitResultAndRegenerate,
  } = useAppStore();
  
  const { resetSteps } = useStepStore();
  const [selectedImages, setSelectedImages] = useState<string[]>(
    generatedImages.map(img => img.id)
  );
  const [downloading, setDownloading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSplitResult, setEditingSplitResult] = useState<SplitResult | null>(null);
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedImages(generatedImages.map(img => img.id));
    } else {
      setSelectedImages([]);
    }
  };
  
  const handleSelectImage = (imageId: string, checked: boolean) => {
    if (checked) {
      setSelectedImages([...selectedImages, imageId]);
    } else {
      setSelectedImages(selectedImages.filter(id => id !== imageId));
    }
  };
  
  const handleDownloadSelected = async () => {
    const imagesToDownload = generatedImages.filter(
      img => selectedImages.includes(img.id) && img.status === 'success'
    );
    
    if (imagesToDownload.length === 0) {
      message.warning('请选择要下载的图片');
      return;
    }
    
    setDownloading(true);
    try {
      await DownloadService.downloadImagesAsZip(
        imagesToDownload,
        `xiaohongshu_${Date.now()}.zip`
      );
      message.success('下载成功');
    } catch (error: any) {
      message.error('下载失败：' + error.message);
    } finally {
      setDownloading(false);
    }
  };
  
  const handleDownloadSingle = async (image: GeneratedImage) => {
    if (image.status !== 'success' || !image.url) {
      message.error('图片未生成成功');
      return;
    }
    
    try {
      await DownloadService.downloadImage(
        image.url,
        `${image.type}_${image.index}.png`
      );
      message.success('下载成功');
    } catch (error: any) {
      message.error('下载失败：' + error.message);
    }
  };
  
  const handleRegenerateSingle = async (imageId: string) => {
    try {
      await regenerateSingleImage(imageId);
      message.success('正在重新生成图片...');
    } catch (error: any) {
      message.error('重新生成失败：' + error.message);
    }
  };
  
  const handleEditText = (splitResult: SplitResult, imageId: string) => {
    setEditingSplitResult(splitResult);
    setEditingImageId(imageId);
    setEditModalVisible(true);
  };
  
  const handleSaveAndRegenerate = (newText: string) => {
    if (!editingSplitResult) return;
    
    // 直接触发异步操作，不等待
    updateSplitResultAndRegenerate(
      editingSplitResult.type,
      editingSplitResult.index,
      newText
    ).catch((error: any) => {
      message.error('更新失败：' + error.message);
    });
    
    message.success('文本已更新，正在重新生成图片...');
    
    // 立即关闭弹窗，让图片在后台生成
    setEditModalVisible(false);
    setEditingSplitResult(null);
    setEditingImageId(null);
  };
  
  const handleStartNew = () => {
    // 重置所有状态
    setInputText('');
    setSplitResults([]);
    setGeneratedImages([]);
    resetSteps();
    message.info('已重置，开始新的转换');
  };
  
  const handleBackToHome = () => {
    // 清理所有数据
    setInputText('');
    setSplitResults([]);
    setGeneratedImages([]);
    // 重置导航
    resetSteps();
  };
  
  // 统计信息
  const successCount = generatedImages.filter(img => img.status === 'success').length;
  const totalCount = generatedImages.length;
  
  if (generatedImages.length === 0) {
    return (
      <StepContainer
        title="📥 批量下载"
        showNavigation={false}
      >
        <Empty
          description="暂无可下载的图片"
          className="py-12"
        >
          <Button
            type="primary"
            icon={<HomeOutlined />}
            onClick={handleBackToHome}
          >
            返回首页
          </Button>
        </Empty>
      </StepContainer>
    );
  }
  
  return (
    <StepContainer
      title={`✨ 生成完成！共${totalCount}张图片`}
      showNavigation={false}
    >
      <div className="space-y-6">
        {/* 统计信息 */}
        <Card size="small">
          <Space>
            <CheckCircleOutlined className="text-green-500 text-xl" />
            <Text>
              成功生成 {successCount}/{totalCount} 张图片
            </Text>
            {successCount < totalCount && (
              <Text type="warning">
                ({totalCount - successCount} 张失败)
              </Text>
            )}
          </Space>
        </Card>
        
        {/* 图片展示 */}
        <div>
          <div className="mb-4 flex justify-between items-center">
            <Space>
              <Checkbox
                checked={selectedImages.length === successCount}
                indeterminate={selectedImages.length > 0 && selectedImages.length < successCount}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                全选 ({selectedImages.length}/{successCount})
              </Checkbox>
            </Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadSelected}
              loading={downloading}
              disabled={selectedImages.length === 0}
            >
              打包下载选中项
            </Button>
          </div>
          
          <Row gutter={[16, 16]}>
            {generatedImages.map((image) => {
              const splitResult = splitResults.find(
                r => r.type === image.type && r.index === image.index
              );
              
              return (
                <Col key={image.id} xs={24} sm={12} md={8} lg={6}>
                  <QuickEditableCard
                    image={image}
                    splitResult={splitResult}
                    selected={selectedImages.includes(image.id)}
                    onSelectChange={(checked) => handleSelectImage(image.id, checked)}
                    onEdit={() => splitResult && handleEditText(splitResult, image.id)}
                    onRegenerate={() => handleRegenerateSingle(image.id)}
                    onDownload={() => handleDownloadSingle(image)}
                  />
                </Col>
              );
            })}
          </Row>
        </div>
        
        {/* 操作按钮 */}
        <div className="text-center pt-6 border-t">
          <Space size="large">
            <Button
              size="large"
              icon={<HomeOutlined />}
              onClick={handleBackToHome}
            >
              返回首页
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<FileAddOutlined />}
              onClick={handleStartNew}
            >
              开始新的转换
            </Button>
          </Space>
        </div>
        
        {/* 文本编辑弹窗 */}
        <TextEditModal
          visible={editModalVisible}
          splitResult={editingSplitResult}
          currentImage={editingImageId ? generatedImages.find(img => img.id === editingImageId) : undefined}
          onSave={handleSaveAndRegenerate}
          onCancel={() => {
            setEditModalVisible(false);
            setEditingSplitResult(null);
            setEditingImageId(null);
          }}
        />
      </div>
    </StepContainer>
  );
};