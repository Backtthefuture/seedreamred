import React, { useState } from 'react';
import { Modal, Form, Input, Button, List, Card, Space, message, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { Template } from '../../types';
import { validators } from '../../utils/validators';

const { TextArea } = Input;

interface TemplateModalProps {
  visible: boolean;
  templates: Template[];
  onClose: () => void;
  onAdd: (template: Omit<Template, 'id' | 'isPreset'>) => void;
  onUpdate: (id: string, template: Template) => void;
  onDelete: (id: string) => void;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  visible,
  templates,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingId) {
        const template = templates.find(t => t.id === editingId);
        if (template) {
          onUpdate(editingId, {
            ...template,
            ...values,
          });
          message.success('模板更新成功');
        }
      } else {
        onAdd({
          ...values,
          id: `custom_${Date.now()}`,
        });
        message.success('模板添加成功');
      }
      
      form.resetFields();
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleEdit = (template: Template) => {
    if (template.isPreset) {
      message.warning('预设模板不可编辑');
      return;
    }
    
    setEditingId(template.id);
    form.setFieldsValue({
      name: template.name,
      coverPrompt: template.coverPrompt,
      contentPrompt: template.contentPrompt,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template?.isPreset) {
      message.warning('预设模板不可删除');
      return;
    }
    
    onDelete(id);
    message.success('模板删除成功');
  };

  const handleCancel = () => {
    form.resetFields();
    setShowForm(false);
    setEditingId(null);
  };

  const customTemplates = templates.filter(t => !t.isPreset);

  return (
    <Modal
      title="模板管理"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
    >
      {!showForm ? (
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowForm(true)}
            className="mb-4"
          >
            创建新模板
          </Button>
          
          <List
            dataSource={customTemplates}
            locale={{ emptyText: '暂无自定义模板' }}
            renderItem={(template) => (
              <Card
                size="small"
                className="mb-2"
                actions={[
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(template)}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    title="确定删除这个模板吗？"
                    onConfirm={() => handleDelete(template.id)}
                  >
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <Card.Meta
                  title={template.name}
                  description={
                    <div className="text-xs text-gray-500">
                      <div>封面提示词: {template.coverPrompt.slice(0, 50)}...</div>
                      <div>内容提示词: {template.contentPrompt.slice(0, 50)}...</div>
                    </div>
                  }
                />
              </Card>
            )}
          />
        </div>
      ) : (
        <Form form={form} layout="vertical">
          <Form.Item
            label="模板名称"
            name="name"
            rules={[
              { required: true, message: '请输入模板名称' },
              {
                validator: (_, value) => {
                  if (!value || validators.isValidTemplateName(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('模板名称长度应在1-20字符之间'));
                },
              },
            ]}
          >
            <Input placeholder="例如：科技风、文艺风等" />
          </Form.Item>
          
          <Form.Item
            label="封面提示词"
            name="coverPrompt"
            rules={[
              { required: true, message: '请输入封面提示词' },
              {
                validator: (_, value) => {
                  if (!value || validators.isValidPrompt(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('提示词必须包含{content}变量'));
                },
              },
            ]}
            extra="使用 {content} 作为文本内容的占位符"
          >
            <TextArea
              rows={3}
              placeholder="生成一张XX风格的小红书封面图，主题是：{content}，..."
            />
          </Form.Item>
          
          <Form.Item
            label="内容提示词"
            name="contentPrompt"
            rules={[
              { required: true, message: '请输入内容提示词' },
              {
                validator: (_, value) => {
                  if (!value || validators.isValidPrompt(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('提示词必须包含{content}变量'));
                },
              },
            ]}
            extra="使用 {content} 作为文本内容的占位符"
          >
            <TextArea
              rows={3}
              placeholder="生成一张XX风格的小红书内容配图，内容是：{content}，..."
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSubmit}>
                {editingId ? '更新' : '创建'}
              </Button>
              <Button onClick={handleCancel}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};