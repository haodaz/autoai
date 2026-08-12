'use client';

import React, { useState, Suspense } from 'react';
import { Typography, Tabs, Spin } from 'antd';
import { 
  SettingOutlined, 
  UserOutlined, 
  RobotOutlined, 
  AppstoreOutlined, 
  LayoutOutlined, 
  GlobalOutlined 
} from '@ant-design/icons';
import { useIsMobile } from '@/hooks/useIsMobile';
import PersonalSettings from '@/components/settings/PersonalSettings';
import AgentAdmin from '@/components/settings/AgentAdmin';
import ThemeAdmin from '@/components/settings/ThemeAdmin';
import HomeConfigAdmin from '@/components/settings/HomeConfigAdmin';
import GlobalConfigAdmin from '@/components/settings/GlobalConfigAdmin';

const { Title, Text } = Typography;

const SettingsPageContent = () => {
  const [activeKey, setActiveKey] = useState('personal');
  const isMobile = useIsMobile();

  const items = [
    {
      key: 'personal',
      label: (
        <span className="flex items-center gap-2 px-2">
          <UserOutlined />
          个人设置
        </span>
      ),
      children: (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
          <PersonalSettings />
        </div>
      ),
    },
    {
      key: 'agent',
      label: (
        <span className="flex items-center gap-2 px-2">
          <RobotOutlined />
          智能体管理
        </span>
      ),
      children: (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
          <AgentAdmin />
        </div>
      ),
    },
    {
      key: 'theme',
      label: (
        <span className="flex items-center gap-2 px-2">
          <AppstoreOutlined />
          专题管理
        </span>
      ),
      children: (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
          <ThemeAdmin />
        </div>
      ),
    },
    {
      key: 'home-config',
      label: (
        <span className="flex items-center gap-2 px-2">
          <LayoutOutlined />
          首页配置
        </span>
      ),
      children: (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
          <HomeConfigAdmin />
        </div>
      ),
    },
    {
      key: 'global-config',
      label: (
        <span className="flex items-center gap-2 px-2">
          <GlobalOutlined />
          全局配置
        </span>
      ),
      children: (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
          <GlobalConfigAdmin />
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <main className="p-8 max-w-6xl mx-auto w-full flex-1 overflow-y-auto"
        style={{ paddingBottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom, 0px))' : undefined }}>
          <div className="mb-8">
            <Title level={2} className="!mb-2 flex items-center gap-2">
              <SettingOutlined className="text-[#427759]" />
              系统设置
            </Title>
            <Text type="secondary">管理您的偏好设置与系统后台配置</Text>
          </div>

          <Tabs
            tabPosition="left"
            activeKey={activeKey}
            onChange={setActiveKey}
            items={items}
            className="settings-tabs"
            tabBarStyle={{ width: 200, paddingRight: 24 }}
          />
        </main>
      <style jsx global>{`
          padding: 12px 16px !important;
          margin-bottom: 8px !important;
          border-radius: 8px;
        }
        .settings-tabs .ant-tabs-tab-active {
          background-color: #eef2ff !important;
        }
        .settings-tabs .ant-tabs-ink-bar {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Spin size="large" /></div>}>
      <SettingsPageContent />
    </Suspense>
  );
}
