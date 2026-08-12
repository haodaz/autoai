'use client';

import React, { useState } from 'react';
import { Table, Button, Space, Typography, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const ThemeAdmin = () => {
  const [themes] = useState([
    { id: 'theme-1', name: '升学规划', desc: '高考志愿与学业规划', active: true },
    { id: 'theme-2', name: '职业发展', desc: '求职指导与职场技能', active: true },
    { id: 'theme-3', name: '通识教育', desc: '基础学科与兴趣培养', active: false },
  ]);

  const columns = [
    {
      title: '专题 ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '描述',
      dataIndex: 'desc',
      key: 'desc',
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_: any, record: any) => (
        <span className={record.active ? "text-green-600" : "text-slate-400"}>
          {record.active ? '● 启用' : '○ 停用'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any) => (
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
          <Title level={4} className="!mb-1">专题管理</Title>
          <Text type="secondary">管理知己广场的分类专题</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} className="bg-[#427759]" onClick={() => message.info('新建功能开发中')}>
          新建专题
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={themes} 
        rowKey="id" 
        pagination={false}
        size="middle"
      />
    </div>
  );
};

export default ThemeAdmin;
