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
  Tag,
  Modal
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
import { useAuthStore } from '../../stores/useAuthStore';
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
  
  // 积分和认证状态
  const { isAuthenticated, user, deductCredits } = useAuthStore();
  
  // 验证是否可以进入下一步
  useEffect(() => {
    setCanProceed(generatedImages.length > 0 && !isGenerating);
  }, [generatedImages, isGenerating, setCanProceed]);
  
  const handleGenerateImages = async () => {
    // 检查用户是否已登录
    if (!isAuthenticated || !user) {
      message.error({
        content: '请先登录后再使用图片生成功能',
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
    
    // 计算需要消耗的积分（每张图片20积分）
    const requiredCredits = splitResults.length * 20;
    
    // 检查积分是否充足
    if (user.credits < requiredCredits) {
      message.error({
        content: `积分不足！生成${splitResults.length}张图片需要${requiredCredits}积分，您当前有${user.credits}积分。请购买积分后继续。`,
        duration: 8
      });
      return;
    }
    
    // 确认消费积分
    const confirmed = await new Promise((resolve) => {
      Modal.confirm({
        title: '确认生成图片',
        content: (
          <div>
            <p>将生成 <strong>{splitResults.length}</strong> 张图片</p>
            <p>消耗积分: <strong>{requiredCredits}</strong></p>
            <p>剩余积分: <strong>{user.credits - requiredCredits}</strong></p>
          </div>
        ),
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
    
    if (!confirmed) {
      return;
    }
    
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // 先扣除积分
      const deductResult = await deductCredits(requiredCredits);
      if (!deductResult) {
        message.error('积分扣除失败，请重试');
        return;
      }
      
      message.success(`已扣除${requiredCredits}积分，开始生成图片...`);
      
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
      let completed = 0;
      let failed = 0;
      
      await doubaoAPI.generateImages(
        prompts.map(p => ({ id: p.id, prompt: p.prompt })),
        (id, status, url, error) => {
          if (status === 'success' && url) {
            updateImageUrl(id, url);
            completed++;
            setGenerationProgress(Math.round((completed / prompts.length) * 100));
          } else {
            updateImageStatus(id, status, error);
            failed++;
          }
        }
      );
      
      // 如果有失败的图片，返还对应的积分
      if (failed > 0) {
        const refundCredits = failed * 20;
        await deductCredits(-refundCredits); // 负数表示增加积分
        message.warning(`${failed}张图片生成失败，已返还${refundCredits}积分`);
      }
      
      if (completed > 0) {
        message.success(`成功生成${completed}张图片！`);
        // 自动进入下一步
        setTimeout(() => nextStep(), 1000);
      } else {
        message.error('所有图片生成失败，积分已全部返还');
      }
      
    } catch (error: any) {
      console.error('Generation error:', error);
      message.error(`生成失败: ${error.message || '未知错误'}`);
      
      // 发生错误时返还积分
      await deductCredits(-requiredCredits);
      message.info('已返还所有积分');
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
          {isAuthenticated && user && (
            <Tag color="green" icon={<DollarOutlined />}>
              {user.credits} 积分
            </Tag>
          )}
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
            
            {/* 图片设置和积分状态 */}
            <Card 
              size="small" 
              title={
                <div className="flex items-center gap-2">
                  <span>图片设置</span>
                  {isAuthenticated && user ? (
                    <Tag color="green" icon={<KeyOutlined />}>
                      {user.credits} 积分
                    </Tag>
                  ) : (
                    <Tag color="red" icon={<KeyOutlined />}>
                      未登录
                    </Tag>
                  )}
                </div>
              }
            >
              <Space direction="vertical" className="w-full">
                {!isAuthenticated && (
                  <Alert
                    message="需要登录"
                    description="图片生成功能需要您先登录账号。"
                    type="warning"
                    showIcon
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
                  {isAuthenticated && (
                    <Text type="secondary" className="block mt-1">
                      💰 每张图片消耗 20 积分（约 ¥0.2）
                    </Text>
                  )}
                  {isAuthenticated && user && (
                    <Text type="secondary" className="block mt-1">
                      🔥 需要积分: {splitResults.length * 20}，剩余积分: {user.credits}
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
                disabled={!selectedTemplateId || templates.length === 0 || !isAuthenticated || !user || (user && user.credits < splitResults.length * 20)}
                className="btn-hover-effect"
              >
                开始生成图片
              </Button>
              
              {/* 调试信息 */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500">
                  调试: 模板={selectedTemplateId ? '✓' : '✗'} | 
                  模板数={templates.length} | 
                  认证={isAuthenticated ? '✓' : '✗'} | 
                  用户={user ? '✓' : '✗'} | 
                  积分={user?.credits || 0} | 
                  需要={splitResults.length * 20}
                </div>
              )}
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