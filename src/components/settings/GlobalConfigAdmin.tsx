'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Card, Button, Form, Input, message, Spin, Alert } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface GlobalConfig {
  globalPrompt?: string;
  variables?: string;
}

const GlobalConfigAdmin = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<GlobalConfig | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    try {
      // 从云端获取配置
      const response = await fetch('/api/home-config');
      if (response.ok) {
        const data = await response.json();
        
        // 如果云端配置包含全局配置信息
        if (data.global_config) {
          setConfig(data.global_config);
          
          // 设置表单初始值
          form.setFieldsValue({
            globalPrompt: data.global_config.globalPrompt || '你是一个有用的 AI 助手。',
            variables: data.global_config.variables || '{\n  "version": "v2.0.0"\n}'
          });
        } else {
          // 使用默认值
          form.setFieldsValue({
            globalPrompt: '你是一个有用的 AI 助手。',
            variables: '{\n  "version": "v2.0.0"\n}'
          });
        }
      } else {
        message.error('加载全局配置失败');
      }
    } catch (error) {
      console.error('Failed to load global config:', error);
      message.error('加载全局配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async () => {
    message.info('全局配置保存功能需通过云端MCP系统进行，请联系管理员在云端更新配置');
  };

  return (
    <div>
      <div className="mb-6">
        <Title level={4} className="!mb-1">全局配置</Title>
        <Text type="secondary">管理系统级别的全局 AI 规则与系统变量</Text>
      </div>

      <Card 
        className="shadow-sm border-slate-200"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>全局配置</span>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={loadConfig}
              loading={loading}
            >
              刷新配置
            </Button>
          </div>
        }
      >
        <Spin spinning={loading}>
          <Alert 
            message="配置说明" 
            description="全局配置已迁移至云端，请通过云端MCP系统进行配置管理" 
            type="info" 
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form layout="vertical" form={form} onFinish={handleSave}>
            <Form.Item label="系统全局 Prompt" name="globalPrompt">
              <TextArea rows={6} placeholder="请输入系统全局 Prompt" />
            </Form.Item>

            <Form.Item label="系统变量 JSON" name="variables">
              <TextArea rows={6} className="font-mono text-sm" placeholder="请输入系统变量 JSON" />
            </Form.Item>
            
            <div className="flex justify-end">
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} className="bg-[#427759]">
                保存配置
              </Button>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default GlobalConfigAdmin;
