'use client';

import React from 'react';
import { Typography, Form, Switch, Select, Button, Divider, message } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PersonalSettings = () => {
  const [form] = Form.useForm();

  const handleSave = (_values: any) => {
    message.success('设置已保存');
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSave}
      initialValues={{
        theme: 'light',
        notifications: true,
        sound: false,
        defaultModel: 'claude-3-5-sonnet',
        language: 'zh-CN'
      }}
    >
      <Title level={4} className="!mb-6">外观与偏好</Title>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <Form.Item name="theme" label="界面主题">
          <Select
            options={[
              { value: 'light', label: '浅色模式' },
              { value: 'dark', label: '深色模式' },
              { value: 'system', label: '跟随系统' }
            ]}
          />
        </Form.Item>

        <Form.Item name="language" label="语言">
          <Select
            options={[
              { value: 'zh-CN', label: '简体中文' },
              { value: 'en-US', label: 'English' }
            ]}
          />
        </Form.Item>
      </div>

      <div className="flex items-center justify-between py-4 border-b border-slate-100">
        <div>
          <Text strong className="block mb-1">桌面通知</Text>
          <Text type="secondary" className="text-xs">接收新消息、任务完成等重要通知</Text>
        </div>
        <Form.Item name="notifications" valuePropName="checked" className="mb-0">
          <Switch />
        </Form.Item>
      </div>

      <div className="flex items-center justify-between py-4 border-b border-slate-100 mb-8">
        <div>
          <Text strong className="block mb-1">提示音效</Text>
          <Text type="secondary" className="text-xs">在收到消息时播放提示音</Text>
        </div>
        <Form.Item name="sound" valuePropName="checked" className="mb-0">
          <Switch />
        </Form.Item>
      </div>

      <Title level={4} className="!mb-6">AI 模型设置</Title>
      
      <Form.Item name="defaultModel" label="默认对话模型" extra="选择在新建对话时默认使用的 AI 模型。">
        <Select
          options={[
            { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (推荐)' },
            { value: 'gpt-4o', label: 'GPT-4o' },
            { value: 'deepseek-chat', label: 'DeepSeek Chat' }
          ]}
        />
      </Form.Item>

      <Divider className="my-8" />

      <div className="flex justify-end gap-4">
        <Button onClick={() => form.resetFields()}>重置</Button>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} className="bg-[#427759]">
          保存设置
        </Button>
      </div>
    </Form>
  );
};

export default PersonalSettings;
