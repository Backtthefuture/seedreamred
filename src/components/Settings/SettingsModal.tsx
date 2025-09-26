import React, { useState } from 'react';
import { Modal, Form, Input, Button, Switch, Tag, Divider, message, Alert } from 'antd';
import { PRESET_SIZES } from '../../utils/constants';

interface SettingsModalProps {
  visible: boolean;
  imageSize: string;
  watermarkEnabled: boolean;
  onClose: () => void;
  onSave: (settings: {
    imageSize: string;
    watermarkEnabled: boolean;
  }) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  imageSize,
  watermarkEnabled,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [localWatermark, setLocalWatermark] = useState(watermarkEnabled);

  React.useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        imageSize: imageSize || '1024x1024',
      });
      setLocalWatermark(watermarkEnabled);
    }
  }, [visible, imageSize, watermarkEnabled, form]);

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
        imageSize: values.imageSize,
        watermarkEnabled: localWatermark,
      });
      message.success('设置保存成功');
      onClose();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title="⚙️ 生成设置"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          保存设置
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <Alert
          message="积分制图片生成"
          description="系统已配置图片生成服务，每生成一张图片消耗20积分（约0.2元）。您可以通过购买积分来使用图片生成功能。"
          type="info"
          showIcon
        />
      </div>
      
      <Form form={form} layout="vertical" className="mt-4">
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

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-blue-800 font-medium mb-2">💡 使用说明</h4>
          <ul className="text-blue-700 text-sm space-y-1">
            <li>• 每生成一张图片消耗 20 积分</li>
            <li>• 新用户注册即获得 100 积分</li>
            <li>• 可通过购买积分继续使用服务</li>
            <li>• 生成失败不会扣除积分</li>
          </ul>
        </div>
      </Form>
    </Modal>
  );
};