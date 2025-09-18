import React, { useState, useEffect } from 'react';
import { 
  Select, 
  Switch, 
  Input, 
  Button, 
  Space, 
  Typography,
  Collapse,
  message,
  Tooltip
} from 'antd';
import { 
  SettingOutlined, 
  ReloadOutlined,
  SaveOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import { useAppStore } from '../../stores/useAppStore';
import { AI_MODELS, DEFAULT_SPLIT_PROMPT } from '../../utils/constants';

const { TextArea } = Input;
const { Text } = Typography;
const { Panel } = Collapse;

interface AISplitSettingsProps {
  onSplitRequest?: () => void;
}

export const AISplitSettings: React.FC<AISplitSettingsProps> = ({ onSplitRequest }) => {
  const {
    selectedAIModel,
    customPrompt,
    useCustomPrompt,
    setSelectedAIModel,
    setCustomPrompt,
    setUseCustomPrompt,
  } = useAppStore();

  const [localPrompt, setLocalPrompt] = useState(customPrompt);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setLocalPrompt(customPrompt);
  }, [customPrompt]);

  useEffect(() => {
    setHasUnsavedChanges(localPrompt !== customPrompt);
  }, [localPrompt, customPrompt]);

  const handleModelChange = (modelId: string) => {
    setSelectedAIModel(modelId);
    message.success('模型已切换');
    
    // 切换模型后自动触发重新拆分
    if (onSplitRequest) {
      onSplitRequest();
    }
  };

  const handlePromptSave = () => {
    setCustomPrompt(localPrompt);
    setHasUnsavedChanges(false);
    message.success('提示词已保存');
  };

  const handleResetPrompt = () => {
    setLocalPrompt(DEFAULT_SPLIT_PROMPT);
    setCustomPrompt(DEFAULT_SPLIT_PROMPT);
    setUseCustomPrompt(false);
    setHasUnsavedChanges(false);
    message.success('已恢复默认提示词');
  };

  const handleUseCustomPromptChange = (checked: boolean) => {
    setUseCustomPrompt(checked);
    if (checked) {
      message.info('已启用自定义提示词');
    } else {
      message.info('已切换到默认提示词');
    }
    
    // 切换提示词模式后自动触发重新拆分
    if (onSplitRequest) {
      onSplitRequest();
    }
  };

  const selectedModel = AI_MODELS.find(m => m.id === selectedAIModel);

  return (
    <Collapse 
      ghost 
      defaultActiveKey={[]}
      expandIconPosition="end"
      className="mb-4 bg-gray-50 rounded-lg"
    >
      <Panel 
        header={
          <div className="flex items-center justify-between">
            <Space>
              <SettingOutlined />
              <Text strong>AI拆分设置</Text>
              <Text type="secondary" className="text-sm">
                当前模型: {selectedModel?.name || '默认'}
              </Text>
            </Space>
          </div>
        }
        key="settings"
      >
        <div className="space-y-4 p-2">
          {/* 模型选择 */}
          <div>
            <div className="flex items-center mb-2">
              <Text strong className="mr-2">选择AI模型</Text>
              <Tooltip title="不同模型有不同的特点，选择适合您文本类型的模型">
                <InfoCircleOutlined className="text-gray-400" />
              </Tooltip>
            </div>
            <Select
              value={selectedAIModel}
              onChange={handleModelChange}
              style={{ width: '100%' }}
              size="large"
            >
              {AI_MODELS.map(model => (
                <Select.Option key={model.id} value={model.id}>
                  <div>
                    <div className="font-medium">{model.name}</div>
                    <div className="text-xs text-gray-500">{model.description}</div>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* 提示词设置 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Space>
                <Text strong>自定义提示词</Text>
                <Switch
                  checked={useCustomPrompt}
                  onChange={handleUseCustomPromptChange}
                  checkedChildren="开启"
                  unCheckedChildren="关闭"
                />
              </Space>
              {hasUnsavedChanges && (
                <Text type="warning" className="text-sm">
                  有未保存的更改
                </Text>
              )}
            </div>
            
            {useCustomPrompt && (
              <>
                <TextArea
                  value={localPrompt}
                  onChange={(e) => setLocalPrompt(e.target.value)}
                  placeholder="输入自定义提示词..."
                  rows={6}
                  className="mb-2"
                  disabled={!useCustomPrompt}
                />
                <div className="flex justify-between">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleResetPrompt}
                  >
                    恢复默认
                  </Button>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handlePromptSave}
                    disabled={!hasUnsavedChanges}
                  >
                    保存提示词
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* 提示信息 */}
          <div className="bg-blue-50 p-3 rounded">
            <Text type="secondary" className="text-xs">
              💡 提示：切换模型或修改提示词后，点击"重新拆分"按钮应用新设置
            </Text>
          </div>
        </div>
      </Panel>
    </Collapse>
  );
};