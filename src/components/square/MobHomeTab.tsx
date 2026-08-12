'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin, Empty } from 'antd';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  MessageOutlined,
  ArrowRightOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
  FileTextOutlined,
  TeamOutlined,
  RightOutlined
} from '@ant-design/icons';
import { Character, Theme } from '@/lib/characters/types';

interface Report {
  id: string;
  title: string;
  summary: string;
  charName: string;
  createdAt: string;
}

export function MobHomeTab({ characters, onSelect, themes }: {
  characters: Character[];
  onSelect: (c: Character) => void;
  themes: Theme[];
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setReports(data.slice(0, 3)); // 只取前3条
        }
      })
      .catch(() => {})
      .finally(() => setLoadingReports(false));
  }, []);

  const themeNames = themes.reduce((acc, t) => {
    acc[t.id] = t.name;
    return acc;
  }, {} as Record<string, string>);

  const CORE_FEATURES = [
    {
      id: 'search_talent',
      label: '查人才',
      icon: <SearchOutlined />,
      bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
      color: '#4f46e5',
      onClick: () => router.push('/chat?charId=yida_main&prompt=帮我查一下人才')
    },
    {
      id: 'talent_audit',
      label: '人才检测',
      icon: <SafetyCertificateOutlined />,
      bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
      color: '#16a34a',
      onClick: () => router.push('/talent-audit')
    },
    {
      id: 'kb',
      label: '找数据',
      icon: <BookOutlined />,
      bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      color: '#d97706',
      onClick: () => router.push('/kb')
    },
    {
      id: 'reports',
      label: '报告历史',
      icon: <FileTextOutlined />,
      bg: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
      color: '#9333ea',
      onClick: () => router.push('/reports')
    }
  ];

  return (
    <div style={{ paddingBottom: isMobile ? 'calc(16px + 72px + env(safe-area-inset-bottom, 0px))' : '80px', background: '#f8fafc', minHeight: '100%' }}>
      {/* 顶部 AI 提问卡片（类似 Banner） */}
      <div style={{
        padding: '24px 20px 32px',
        background: 'linear-gradient(135deg, #427759 0%, #a78bfa 50%, #38bdf8 100%)',
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 8px 24px rgba(96,85,245,0.15)',
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #fff, #f0f4ff)',
            color: '#427759', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 18, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>一</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>一答智能体</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>您的政务与产业参谋</div>
          </div>
        </div>

        <div
          onClick={() => router.push('/chat?charId=yida_main')}
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            cursor: 'pointer'
          }}
        >
          <SearchOutlined style={{ color: '#427759', fontSize: 18 }} />
          <div style={{ flex: 1, color: '#9ca3af', fontSize: 15 }}>输入您想了解的产业、政策或人才...</div>
          <div style={{
            background: '#427759', color: '#fff', borderRadius: '50%', width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ArrowRightOutlined style={{ fontSize: 14 }} />
          </div>
        </div>
      </div>

      {/* 核心功能区（金刚区） */}
      <div style={{ padding: '0 20px', marginBottom: 28 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {CORE_FEATURES.map(f => (
            <div key={f.id} onClick={f.onClick} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 16, background: f.bg, color: f.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}>
                {f.icon}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 专家推荐（横向轮播） */}
      {characters && characters.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 12 }}>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <TeamOutlined style={{ color: '#427759' }} /> 专家推荐
            </span>
            <button onClick={() => router.push('/square?view=all')}
              style={{ background: 'none', border: 'none', color: '#427759', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              更多 <RightOutlined style={{ fontSize: 10 }} />
            </button>
          </div>
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 20, paddingRight: 20, paddingBottom: 8,
            scrollSnapType: 'x mandatory', scrollbarWidth: 'none'
          }}>
            {characters.slice(0, 5).map((char) => {
              const tags = char.topic_tags && char.topic_tags.length > 0
                ? char.topic_tags.slice(0, 2)
                : [(char.theme_id && themeNames[char.theme_id]) || char.theme_id || '专业顾问', '精选推荐'];

              return (
                <div key={char.id} style={{ width: 'calc(80vw)', flexShrink: 0, scrollSnapAlign: 'start' }}>
                  <div style={{
                    display: 'flex', flexDirection: 'column', padding: '14px 4px 16px', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #f0f4ff 0%, #dbeafe 45%, #ede9fe 100%)',
                    borderRadius: 20, position: 'relative'
                  }} onClick={() => onSelect(char)}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, paddingLeft: 12 }}>
                      <MessageOutlined style={{ color: '#4f46e5', fontSize: 13 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#666666' }}>
                        和 <span style={{ color: '#4f46e5' }}>{char.name}</span> 聊一聊
                      </span>
                    </div>

                    <div style={{
                      background: '#fff', borderRadius: 16, padding: '12px',
                      display: 'flex', gap: 12, position: 'relative',
                      boxShadow: '0 8px 24px rgba(96,85,245,0.06)', overflow: 'hidden'
                    }}>
                      <img src={char.assets?.avatar || char.assets?.idle || char.assets?.hero || char?.avatar || '/assets/default_avatar.png'} alt={char.name}
                        style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0, background: '#f8fafc', border: '1px solid rgba(0,0,0,0.04)' }} />

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, paddingRight: 16 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 800, color: '#1e1b4b', lineHeight: 1.4,
                          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                          marginBottom: 8
                        }}>
                          {(char.quick_prompts && (char.quick_prompts as string[]).length > 0)
                            ? (char.quick_prompts as string[])[0]
                            : (char.greeting || char.description || '一位懂得倾听的专家顾问。')}
                        </div>

                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', overflow: 'hidden', marginTop: 'auto' }}>
                          {tags.map((t, i) => (
                            <span key={i} style={{ fontSize: 10, color: '#4f46e5', whiteSpace: 'nowrap', fontWeight: 600 }}>
                              {t}{i < tags.length - 1 && <span style={{ marginLeft: 6, color: '#cbd5e1', fontWeight: 400 }}>|</span>}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 28, height: 28, borderRadius: '20px 0 16px 0',
                        background: 'linear-gradient(135deg, #427759 0%, #818cf8 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                      }}>
                        <ArrowRightOutlined style={{ fontSize: 12, fontWeight: 'bold' }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 检测历史（报告列表） */}
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileTextOutlined style={{ color: '#427759' }} /> 检测历史
          </span>
          <button onClick={() => router.push('/reports')}
            style={{ background: 'none', border: 'none', color: '#427759', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            全部 <RightOutlined style={{ fontSize: 10 }} />
          </button>
        </div>

        {loadingReports ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}><Spin /></div>
        ) : reports.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 0', border: '1px solid #f1f5f9' }}>
            <Empty description="暂无历史检测报告" />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reports.map(report => (
              <div key={report.id}
                onClick={() => router.push('/reports')}
                style={{
                  background: '#fff', padding: '16px', borderRadius: 16, border: '1px solid #f1f5f9',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)', cursor: 'pointer'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', lineHeight: 1.4, flex: 1, paddingRight: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {report.title}
                  </div>
                  <div style={{ color: '#94a3b8' }}><RightOutlined style={{ fontSize: 12 }} /></div>
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {report.summary?.replace(/<[^>]+>/g, '')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
                  <span>{report.charName}</span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
