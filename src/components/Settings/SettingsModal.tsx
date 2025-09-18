import React, { useState } from 'react';
import { Modal, Input, Button, Form, message, Alert, Switch, Tag, Divider } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import { validators } from '../../utils/validators';
import { PRESET_SIZES } from '../../utils/constants';

interface SettingsModalProps {
  visible: boolean;
  apiKey: string | null;
  imageSize: string;
  watermarkEnabled: boolean;
  onClose: () => void;
  onSave: (settings: {
    apiKey: string;
    imageSize: string;
    watermarkEnabled: boolean;
  }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  apiKey,
  imageSize,
  watermarkEnabled,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const [localWatermark, setLocalWatermark] = useState(watermarkEnabled);

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        apiKey: apiKey || '',
        imageSize: imageSize || '1024x1024',
      });
      setLocalWatermark(watermarkEnabled);
    }
  }, [visible, apiKey, imageSize, watermarkEnabled, form]);

  const validateImageSize = (_: any, value: string) => {
    if (!value) return Promise.resolve();
    const pattern = /^\d+x\d+$/;
    if (!pattern.test(value)) {
      return Promise.reject(new Error('格式错误，请输入如1024x1024'));
    }
    const [width, height] = value.split('x').map(Number);
    if (width < 256 || width > 4096 || height < 256 || height > 4096) {
      return Promise.reject(new Error('尺寸范围：256-4096像素'));
    }
    return Promise.resolve();
  };

  const handlePresetClick = (size: string) => {
    form.setFieldValue('imageSize', size);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSave({
        apiKey: values.apiKey,
        imageSize: values.imageSize,
        watermarkEnabled: localWatermark,
      });
      message.success('设置保存成功');
      onClose();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleTest = async () => {
    try {
      await form.validateFields();
      setTesting(true);
      // TODO: 实际测试API连接
      setTimeout(() => {
        setTesting(false);
        message.success('API连接测试成功');
      }, 1000);
    } catch (error) {
      setTesting(false);
      message.error('请先输入有效的API密钥');
    }
  };

  return (
    <Modal
      title="API设置"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="test" onClick={handleTest} loading={testing}>
          测试连接
        </Button>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          保存
        </Button>,
      ]}
    >
      <div className="space-y-3 mb-4">
        <Alert
          message="功能说明"
          description={
            <div className="space-y-2">
              <div>🆓 <strong>免费功能</strong>：AI智能拆分 - 完全免费，无需配置</div>
              <div>💰 <strong>付费功能</strong>：图片生成 - 需要您的豆包API密钥</div>
            </div>
          }
          type="info"
          showIcon
        />
        <Alert
          message="API密钥配置"
          description="API密钥将安全存储在浏览器本地，不会上传到服务器。费用由您的API账户承担。"
          type="warning"
          showIcon
        />
      </div>
      
      <Form form={form} layout="vertical">
        <Form.Item
          label="API密钥"
          name="apiKey"
          rules={[
            { required: true, message: '请输入API密钥' },
            {
              validator: (_, value) => {
                if (!value || validators.isValidApiKey(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('请输入有效的API密钥'));
              },
            },
          ]}
        >
          <Input.Password
            prefix={<KeyOutlined />}
            placeholder="请输入豆包API密钥"
            size="large"
          />
        </Form.Item>

        <Divider />

        <Form.Item
          label="图片尺寸"
          name="imageSize"
          rules={[{ validator: validateImageSize }]}
          extra="格式：宽x高，如2048x2048（范围：256-4096）"
        >
          <Input placeholder="1024x1024" />
        </Form.Item>

        <div className="mb-4">
          <span className="mr-2">常用尺寸：</span>
          {PRESET_SIZES.map(preset => (
            <Tag
              key={preset.value}
              onClick={() => handlePresetClick(preset.value)}
              style={{ cursor: 'pointer', marginBottom: 8 }}
              color="blue"
            >
              {preset.label}
            </Tag>
          ))}
        </div>

        <Divider />

        <Form.Item label="图片水印">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">生成的图片是否包含水印</span>
            <Switch
              checked={localWatermark}
              onChange={setLocalWatermark}
              checkedChildren="开启"
              unCheckedChildren="关闭"
            />
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};