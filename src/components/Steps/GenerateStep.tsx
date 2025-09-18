import React, { useEffect, useState } from 'react';
import { 
  Button, 
  Card, 
  Space, 
  Typography, 
  Radio, 
  Checkbox,
  Progress,
  Row,
  Col,
  message,
  Empty,
  Alert,
  Tag
} from 'antd';
import { 
  PictureOutlined, 
  PlusOutlined,
  LoadingOutlined,
  KeyOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { useAppStore } from '../../stores/useAppStore';
import { useTemplateStore } from '../../stores/useTemplateStore';
import { useStepStore } from '../../stores/useStepStore';
import { StepContainer } from '../Navigation/StepContainer';
import { doubaoAPI } from '../../services/apiClient';
import { PromptBuilder } from '../../services/promptBuilder';
import { storage } from '../../utils/storage';
import type { GeneratedImage } from '../../types';

const { Title, Text } = Typography;

export const GenerateStep: React.FC = () => {
  const {
    splitResults,
    selectedTemplateId,
    setSelectedTemplateId,
    generatedImages,
    setGeneratedImages,
    isGenerating,
    setIsGenerating,
    updateImageStatus,
    updateImageUrl,
    apiKey,
    imageSize,
    watermarkEnabled,
  } = useAppStore();
  
  const {
    templates,
    getTemplateById,
    setTemplateModalOpen,
  } = useTemplateStore();
  
  const { setCanProceed, nextStep } = useStepStore();
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // 验证是否可以进入下一步
  useEffect(() => {
    setCanProceed(generatedImages.length > 0 && !isGenerating);
  }, [generatedImages, isGenerating, setCanProceed]);
  
  const handleGenerateImages = async () => {
    if (!apiKey) {
      message.error({
        content: '图片生成需要API密钥，请在设置中配置您的豆包API密钥，或查看API密钥申请教程',
        duration: 5
      });
      return;
    }
    
    const template = getTemplateById(selectedTemplateId);
    if (!template) {
      message.error('请选择一个模板');
      return;
    }
    
    if (splitResults.length === 0) {
      message.error('没有可生成的内容');
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // 准备提示词
    const prompts = PromptBuilder.buildPrompts(template, splitResults);
    
    // 初始化图片状态（包含prompt和templateId）
    const initialImages: GeneratedImage[] = prompts.map(p => ({
      id: p.id,
      url: '',
      type: p.type,
      index: p.index,
      status: 'pending',
      prompt: p.prompt, // 保存prompt用于后续重新生成
      templateId: selectedTemplateId, // 保存模板ID用于编辑后重新生成
    }));
    setGeneratedImages(initialImages);
    
    // 生成图片
    try {
      let completed = 0;
      await doubaoAPI.generateImages(
        prompts.map(p => ({ id: p.id, prompt: p.prompt })),
        (id, status, url, error) => {
          if (status === 'success' && url) {
            updateImageUrl(id, url);
            completed++;
            setGenerationProgress(Math.round((completed / prompts.length) * 100));
          } else {
            updateImageStatus(id, status, error);
          }
        }
      );
      
      message.success('图片生成完成！');
      // 自动进入下一步
      setTimeout(() => nextStep(), 1000);
    } catch (error: any) {
      message.error('图片生成失败：' + error.message);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(100);
    }
  };
  
  const handleNext = () => {
    if (generatedImages.length > 0 && !isGenerating) {
      nextStep();
    }
  };
  
  return (
    <StepContainer
      title={
        <div className="flex items-center gap-2">
          <span>🎨 选择图片风格模板</span>
          <Tag color="orange" icon={<DollarOutlined />}>需要API Key</Tag>
        </div>
      }
      nextDisabled={generatedImages.length === 0 || isGenerating}
      onNext={handleNext}
      showNavigation={!isGenerating}
    >
      <div className="space-y-6">
        {/* 模板选择 */}
        {!isGenerating && (
          <>
            <div>
              <Title level={5}>选择模板</Title>
              {templates.length === 0 ? (
                <Empty
                  description="暂无模板，请创建自定义模板"
                  className="py-8"
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setTemplateModalOpen(true)}
                  >
                    创建模板
                  </Button>
                </Empty>
              ) : (
                <Radio.Group 
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedTemplateId(newId);
                    storage.setSelectedTemplateId(newId); // 保存到localStorage
                  }}
                  className="w-full"
                >
                  <Row gutter={[16, 16]}>
                    {templates.map((template) => (
                      <Col key={template.id} xs={24} sm={12} md={8}>
                        <Card
                          hoverable
                          className={`card-hover-effect ${selectedTemplateId === template.id ? 'border-blue-500 border-2' : ''}`}
                        >
                          <Radio value={template.id}>
                            <Space direction="vertical" className="w-full">
                              <Text strong>{template.name}</Text>
                              {!template.isPreset && (
                                <Text type="secondary" className="text-xs">自定义</Text>
                              )}
                            </Space>
                          </Radio>
                        </Card>
                      </Col>
                    ))}
                    <Col xs={24} sm={12} md={8}>
                      <Card
                        hoverable
                        onClick={() => setTemplateModalOpen(true)}
                        className="border-dashed cursor-pointer card-hover-effect"
                      >
                        <div className="text-center">
                          <PlusOutlined className="text-2xl mb-2" />
                          <div>添加自定义模板</div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </Radio.Group>
              )}
            </div>
            
            {/* 图片设置和API状态 */}
            <Card 
              size="small" 
              title={
                <div className="flex items-center gap-2">
                  <span>图片设置</span>
                  <Tag color={apiKey ? "green" : "red"} icon={<KeyOutlined />}>
                    {apiKey ? "API已配置" : "需要配置API"}
                  </Tag>
                </div>
              }
            >
              <Space direction="vertical" className="w-full">
                {!apiKey && (
                  <Alert
                    message="需要API密钥"
                    description="图片生成功能需要您提供豆包API密钥。费用由您的API账户承担。"
                    type="warning"
                    showIcon
                    action={
                      <Button size="small" type="link">
                        去设置
                      </Button>
                    }
                  />
                )}
                <div>
                  <Text>图片尺寸: </Text>
                  <Text type="secondary">{imageSize}</Text>
                </div>
                <Checkbox checked={watermarkEnabled} disabled>
                  添加水印
                </Checkbox>
                <div>
                  <Text type="secondary">
                    预计生成 {splitResults.length} 张图片
                  </Text>
                  {apiKey && (
                    <Text type="secondary" className="block mt-1">
                      💡 使用您的API密钥，费用由您承担
                    </Text>
                  )}
                </div>
              </Space>
            </Card>
            
            {/* 生成按钮 */}
            <div className="text-center">
              <Button
                type="primary"
                size="large"
                icon={<PictureOutlined />}
                onClick={handleGenerateImages}
                disabled={!selectedTemplateId || templates.length === 0}
                className="btn-hover-effect"
              >
                开始生成图片
              </Button>
            </div>
          </>
        )}
        
        {/* 生成进度 */}
        {isGenerating && (
          <div className="py-12">
            <div className="text-center mb-8">
              <LoadingOutlined className="text-4xl text-blue-500" />
              <Title level={4} className="mt-4">
                正在生成图片...
              </Title>
            </div>
            
            <Progress
              percent={generationProgress}
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            
            <div className="mt-8 space-y-2">
              {generatedImages.map((image) => (
                <div key={image.id} className="flex items-center justify-between">
                  <Text>
                    {image.type === 'cover' ? '封面' : `内容${image.index}`}
                  </Text>
                  <Text type={
                    image.status === 'success' ? 'success' :
                    image.status === 'error' ? 'danger' :
                    image.status === 'generating' ? 'warning' :
                    'secondary'
                  }>
                    {image.status === 'success' ? '✅ 完成' :
                     image.status === 'error' ? '❌ 失败' :
                     image.status === 'generating' ? '⏳ 生成中...' :
                     '⏸ 等待中'}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </StepContainer>
  );
};