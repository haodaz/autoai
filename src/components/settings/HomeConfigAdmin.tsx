'use client';

import React, { useEffect, useState } from 'react';
import { Typography, Card, Button, Form, Input, message, Spin } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import type { HomeConfig } from '@/lib/config/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const HomeConfigAdmin = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<HomeConfig | null>(null);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/home-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        
        // 将配置转换为JSON字符串并设置到表单中
        const configString = JSON.stringify(data, null, 2);
        form.setFieldsValue({ banners: configString });
      } else {
        message.error('加载配置失败');
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSave = async (values: any) => {
    message.info('首页配置保存功能需通过云端MCP系统进行，请联系管理员在云端更新配置');
  };

  return (
    <div>
      <div className="mb-6">
        <Title level={4} className="!mb-1">首页配置</Title>
        <Text type="secondary">配置应用中心与首页 Banner 及推荐内容</Text>
      </div>

      <Card 
        className="shadow-sm border-slate-200"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Banner JSON 配置</span>
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
          <Form layout="vertical" form={form} onFinish={handleSave}>
            <Form.Item 
              label="" 
              name="banners"
              rules={[{ 
                validator: (_, value) => {
                  if (!value) {
                    return Promise.resolve();
                  }
                  try {
                    JSON.parse(value);
                    return Promise.resolve();
                  } catch (e) {
                    return Promise.reject(new Error('JSON 格式不正确'));
                  }
                }
              }]}
            >
              <TextArea 
                rows={15} 
                className="font-mono text-sm" 
                placeholder="请输入首页配置 JSON"
              />
            </Form.Item>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="default" 
                onClick={loadConfig}
                disabled={loading}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />} 
                className="bg-[#427759]"
                disabled={loading}
              >
                保存配置
              </Button>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default HomeConfigAdmin;
