'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Tag, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { Character } from '@/lib/ai/types';

const { Title, Text } = Typography;

const AgentAdmin = () => {
  const [agents, setAgents] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/characters');
        const data = await res.json();
        setAgents(data);
      } catch (err) {
        console.error(err);
        message.error('加载智能体列表失败');
      } finally {
        setLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const columns = [
    {
      title: '头像',
      key: 'avatar',
      width: 60,
      render: (_: any, record: Character) => (
        <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded text-lg">
          {record.avatar_emoji || '🤖'}
        </div>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Character) => (
        <div>
          <div className="font-semibold text-slate-800">{text || record.id}</div>
          <div className="text-xs text-slate-400">{record.id}</div>
        </div>
      ),
    },
    {
      title: '类型',
      key: 'type',
      width: 100,
      render: (_: any, record: Character) => {
        const isOfficial = !record.id.startsWith('custom_');
        return isOfficial ? (
          <Tag color="purple">官方</Tag>
        ) : (
          <Tag color="red">自定义</Tag>
        );
      },
    },
    {
      title: 'Slogan',
      dataIndex: 'tagline',
      key: 'tagline',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Character) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} size="small" onClick={() => message.info('编辑功能开发中')} />
          <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => message.info('删除功能开发中')} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={4} className="!mb-1">智能体管理</Title>
          <Text type="secondary">管理系统中所有官方与自定义 AI 智能体</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} className="bg-[#427759]" onClick={() => message.info('新建功能开发中')}>
          新建智能体
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={agents} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
        size="middle"
      />
    </div>
  );
};

export default AgentAdmin;
