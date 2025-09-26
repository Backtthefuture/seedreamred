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
    console.log('🎯 生成按钮被点击');
    console.log('🔍 当前状态:', {
      isAuthenticated,
      user: user ? `用户ID: ${user.id}` : '无用户',
      selectedTemplateId,
      templatesLength: templates.length,
      splitResultsLength: splitResults.length,
      userCredits: user?.credits || 0,
      requiredCredits: splitResults.length * 20
    });
    
    // 检查用户是否已登录
    if (!isAuthenticated || !user) {
      console.log('❌ 用户未登录');
      message.error({
        content: '请先登录后再使用图片生成功能',
        duration: 5
      });
      return;
    }
    
    console.log('🎨 检查模板:', selectedTemplateId);
    const template = getTemplateById(selectedTemplateId);
    console.log('🎨 获取的模板:', template);
    if (!template) {
      console.log('❌ 模板未找到');
      message.error('请选择一个模板');
      return;
    }
    
    console.log('📝 检查拆分结果:', splitResults.length);
    if (splitResults.length === 0) {
      console.log('❌ 没有拆分结果');
      message.error('没有可生成的内容');
      return;
    }
    
    // 计算需要消耗的积分（每张图片20积分）
    const requiredCredits = splitResults.length * 20;
    console.log('💰 积分检查:', { userCredits: user.credits, requiredCredits });
    
    // 检查积分是否充足
    if (user.credits < requiredCredits) {
      console.log('❌ 积分不足');
      message.error({
        content: `积分不足！生成${splitResults.length}张图片需要${requiredCredits}积分，您当前有${user.credits}积分。请购买积分后继续。`,
        duration: 8
      });
      return;
    }
    
    console.log('💬 尝试显示确认对话框');
    
    // 临时跳过确认对话框，直接开始生成
    const useDirectGeneration = true;
    
    let confirmed = false;
    
    if (useDirectGeneration) {
      // 使用简单的window.confirm作为临时解决方案
      confirmed = window.confirm(`确认生成图片？\n将生成 ${splitResults.length} 张图片\n消耗积分: ${requiredCredits}\n剩余积分: ${user.credits - requiredCredits}`);
      console.log('💬 window.confirm 结果:', confirmed);
    } else {
      // 原来的Modal.confirm方式
      confirmed = await new Promise((resolve) => {
        Modal.confirm({
          title: '确认生成图片',
          content: (
            <div>
              <p>将生成 <strong>{splitResults.length}</strong> 张图片</p>
              <p>消耗积分: <strong>{requiredCredits}</strong></p>
              <p>剩余积分: <strong>{user.credits - requiredCredits}</strong></p>
            </div>
          ),
          onOk: () => {
            console.log('✅ 用户确认生成');
            resolve(true);
          },
          onCancel: () => {
            console.log('❌ 用户取消生成');
            resolve(false);
          },
        });
      });
    }
    
    console.log('💬 最终确认结果:', confirmed);
    if (!confirmed) {
      console.log('🚫 用户取消生成');
      return;
    }
    
    console.log('🎬 开始生成流程');
    
    try {
      console.log('🔧 设置生成状态');
      setIsGenerating(true);
      setGenerationProgress(0);
      console.log('✅ 状态设置完成');
    
      console.log('💰 尝试扣除积分:', requiredCredits);
      // 先扣除积分
      const deductResult = await deductCredits(requiredCredits);
      console.log('💰 积分扣除结果:', deductResult);
      if (!deductResult) {
        console.log('❌ 积分扣除失败');
        message.error('积分扣除失败，请重试');
        return;
      }
      
      console.log('✅ 积分扣除成功，开始准备生成');
      message.success(`已扣除${requiredCredits}积分，开始生成图片...`);
      
      console.log('📝 准备提示词...');
      // 准备提示词
      const prompts = PromptBuilder.buildPrompts(template, splitResults);
      console.log('📝 生成的提示词:', prompts);
      
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
      console.log('🖼️ 初始化图片状态:', initialImages);
      
      // 生成图片
      let completed = 0;
      const finalResults = new Map(); // 记录每张图片的最终状态
      
      console.log('🚀 开始调用 doubaoAPI.generateImages');
      await doubaoAPI.generateImages(
        prompts.map(p => ({ id: p.id, prompt: p.prompt })),
        (id, status, url, error) => {
          console.log('📊 图片生成回调:', { id, status, url: url ? 'URL已生成' : '无URL', error });
          if (status === 'success' && url) {
            updateImageUrl(id, url);
            finalResults.set(id, 'success');
            // 重新计算完成数量
            completed = Array.from(finalResults.values()).filter(s => s === 'success').length;
            const progress = Math.round((completed / prompts.length) * 100);
            console.log('✅ 图片生成成功:', { id, completed, total: prompts.length, progress });
            setGenerationProgress(progress);
          } else {
            updateImageStatus(id, status, error);
            finalResults.set(id, 'failed');
            console.log('❌ 图片生成失败:', { id, status, error });
          }
        }
      );
      
      console.log('🏁 doubaoAPI.generateImages 完成');
      
      // 计算最终的失败数量
      const finalFailed = Array.from(finalResults.values()).filter(s => s === 'failed').length;
      const finalCompleted = Array.from(finalResults.values()).filter(s => s === 'success').length;
      
      console.log('📊 最终结果统计:', { finalCompleted, finalFailed, totalImages: prompts.length });
      
      // 如果有失败的图片，返还对应的积分
      if (finalFailed > 0) {
        const refundCredits = finalFailed * 20;
        await deductCredits(-refundCredits); // 负数表示增加积分
        message.warning(`${finalFailed}张图片生成失败，已返还${refundCredits}积分`);
      }
      
      if (finalCompleted > 0) {
        message.success(`成功生成${finalCompleted}张图片！`);
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
                onClick={(e) => {
                  console.log('🖱️ 按钮点击事件触发', e);
                  handleGenerateImages();
                }}
                disabled={!selectedTemplateId || templates.length === 0 || !isAuthenticated || !user || (user && user.credits < splitResults.length * 20)}
                className="btn-hover-effect"
              >
                开始生成图片
              </Button>
              
              {/* 调试信息 */}
              <div className="mt-2 text-xs text-gray-500">
                <div>调试: 模板={selectedTemplateId ? '✓' : '✗'} | 
                模板数={templates.length} | 
                认证={isAuthenticated ? '✓' : '✗'} | 
                用户={user ? '✓' : '✗'} | 
                积分={user?.credits || 0} | 
                需要={splitResults.length * 20}</div>
                <div>按钮禁用状态: {(!selectedTemplateId || templates.length === 0 || !isAuthenticated || !user || (user && user.credits < splitResults.length * 20)) ? '是' : '否'}</div>
              </div>
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