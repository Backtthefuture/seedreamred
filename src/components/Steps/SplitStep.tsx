import React, { useEffect, useState } from 'react';
import { Button, Card, Space, Typography, Spin, message, Tag } from 'antd';
import { 
  ReloadOutlined,
  DeleteOutlined,
  PlusOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { useAppStore } from '../../stores/useAppStore';
import { useStepStore } from '../../stores/useStepStore';
import { StepContainer } from '../Navigation/StepContainer';
import { EditablePreviewCard } from '../Preview/EditablePreviewCard';
import { AISplitSettings } from './AISplitSettings';
import { splitText } from '../../services/textSplitter';
import type { SplitResult } from '../../types';

const { Text } = Typography;

export const SplitStep: React.FC = () => {
  const { 
    inputText, 
    splitResults, 
    setSplitResults,
    isSplitting,
    setIsSplitting,
    updateSplitResult,
    addToRecentProjects,
    selectedAIModel,
    customPrompt,
    useCustomPrompt
  } = useAppStore();
  
  const { setCanProceed, nextStep } = useStepStore();
  const [isAutoSplitting, setIsAutoSplitting] = useState(false);
  const [lastSplitText, setLastSplitText] = useState('');
  
  // 组件加载时自动执行拆分，并检测文本变化
  useEffect(() => {
    // 检测文本是否发生变化
    if (inputText && inputText !== lastSplitText) {
      // 文本已变化，需要重新拆分
      setLastSplitText(inputText);
      setSplitResults([]); // 清空旧的拆分结果
      setIsAutoSplitting(true);
      handleSplit();
    } else if (inputText && splitResults.length === 0 && !isAutoSplitting) {
      // 首次加载且有文本
      setLastSplitText(inputText);
      setIsAutoSplitting(true);
      handleSplit();
    }
  }, [inputText]);
  
  // 验证是否可以进入下一步
  useEffect(() => {
    setCanProceed(splitResults.length > 0);
  }, [splitResults, setCanProceed]);
  
  const handleSplit = async () => {
    if (!inputText) return;
    
    setIsSplitting(true);
    try {
      // 使用AI智能拆分（带自动降级）
      const promptToUse = useCustomPrompt ? customPrompt : undefined;
      const results = await splitText(inputText, true, selectedAIModel, promptToUse);
      setSplitResults(results);
      
      // 判断是否使用了AI
      const isAI = results.length > 0 && results[0].text.length > 0;
      if (isAI) {
        message.success(`🤖 AI智能拆分成功！共${results.length}个部分`);
      } else {
        message.success(`✅ 成功拆分为${results.length}个部分`);
      }
      
      // 保存到历史记录
      if (results.length > 0) {
        // 生成项目名称（使用前20个字符）
        const projectName = inputText.substring(0, 20) + (inputText.length > 20 ? '...' : '');
        addToRecentProjects({
          name: projectName,
          wordCount: inputText.length,
          inputText: inputText,
          splitResults: results,
        });
      }
    } catch (error: any) {
      message.error('文本拆分失败：' + error.message);
    } finally {
      setIsSplitting(false);
    }
  };
  
  const handleEdit = (index: number, newText: string) => {
    updateSplitResult(index, newText);
    message.success('内容已更新');
  };
  
  const handleDelete = (index: number) => {
    const newResults = splitResults.filter((_, i) => i !== index);
    setSplitResults(newResults);
    message.success('已删除');
  };
  
  const handleAdd = () => {
    const newResult: SplitResult = {
      type: 'content',
      index: splitResults.length,
      text: '',
      charCount: 0,
    };
    setSplitResults([...splitResults, newResult]);
  };
  
  const handleNext = () => {
    if (splitResults.length > 0) {
      nextStep();
    }
  };
  
  if (isSplitting) {
    return (
      <StepContainer 
        title={
          <div className="flex items-center gap-2">
            <span>🤖 AI智能拆分</span>
            <Tag color="green" icon={<GiftOutlined />}>免费功能</Tag>
          </div>
        }
        showNavigation={false}
      >
        <div className="flex flex-col items-center justify-center h-96">
          <Spin size="large" />
          <Text className="mt-4">正在使用AI智能拆分文本...</Text>
          <Text type="secondary" className="mt-2">✨ 免费AI服务，无需配置API密钥</Text>
        </div>
      </StepContainer>
    );
  }
  
  return (
    <StepContainer
      title={
        <div className="flex items-center gap-2">
          <span>🤖 AI智能拆分结果（共{splitResults.length}个部分）</span>
          <Tag color="green" icon={<GiftOutlined />}>免费功能</Tag>
        </div>
      }
      nextDisabled={splitResults.length === 0}
      onNext={handleNext}
    >
      <div className="space-y-4">
        {/* AI设置面板 */}
        <AISplitSettings onSplitRequest={handleSplit} />
        
        {/* 操作栏 */}
        <div className="flex justify-between items-center mb-4">
          <Space>
            <Tag color="blue">共 {splitResults.length} 个部分</Tag>
            <Tag color="green">
              总字数: {splitResults.reduce((sum, r) => sum + r.charCount, 0)}
            </Tag>
          </Space>
          <Space>
            <Button
              icon={<PlusOutlined />}
              onClick={handleAdd}
              className="btn-hover-effect"
            >
              添加段落
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleSplit}
              loading={isSplitting}
              className="btn-hover-effect"
            >
              重新拆分
            </Button>
          </Space>
        </div>
        
        {/* 拆分结果展示 */}
        <div className="space-y-3">
          {splitResults.map((result, index) => (
            <Card
              key={`${result.type}-${result.index}`}
              size="small"
              title={
                <div className="flex justify-between items-center">
                  <span>
                    {result.type === 'cover' ? '📌 封面' : `📄 内容${result.index}`}
                  </span>
                  <Space>
                    <Text type="secondary" className="text-sm">
                      {result.charCount} 字
                    </Text>
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(index)}
                      danger
                    />
                  </Space>
                </div>
              }
            >
              <EditablePreviewCard
                result={result}
                index={index}
                onUpdate={handleEdit}
              />
            </Card>
          ))}
        </div>
        
        {/* 提示信息 */}
        {splitResults.length === 0 && (
          <div className="text-center py-8">
            <Text type="secondary">暂无拆分结果，请点击"重新拆分"按钮</Text>
          </div>
        )}
      </div>
    </StepContainer>
  );
};