'use client';

import React, { useState, useEffect } from 'react';
import { Spin, Empty, message, Modal, Tag } from 'antd';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  FileTextOutlined,
  CalendarOutlined,
  DeleteOutlined,
  UserOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { marked } from 'marked';

// ─── Types ──────────────────────────────────────────────────
interface Report {
  id: string;
  title: string;
  summary: string;
  charName: string;
  format: string;
  content: string;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────
const PRIMARY = '#427759';

// 清除 AI 自定义的非标准 XML 标签（保留标准 HTML 标签不动）
const SAFE_HTML_TAGS = new Set([
  'p','h1','h2','h3','h4','h5','h6','ul','ol','li',
  'em','strong','b','i','u','code','pre','blockquote',
  'table','thead','tbody','tr','td','th','hr','br','img','a','span','div',
]);

function stripCustomXml(content: string): string {
  if (!content) return '';

  // 1. 提取 zj_talent_list, zj_talent_card, zj_institute_card 的 query 属性转成纯文本显示
  let processedContent = content.replace(
    /<zj_talent_list[^>]*query=["']([^"']+)["'][^>]*>/gi,
    '\n\n**推荐专家**：$1\n\n'
  );
  processedContent = processedContent.replace(
    /<zj_talent_card[^>]*query=["']([^"']+)["'][^>]*>/gi,
    '\n\n**推荐专家**：$1\n\n'
  );
  processedContent = processedContent.replace(
    /<zj_institute_card[^>]*query=["']([^"']+)["'][^>]*>/gi,
    '\n\n**推荐机构**：$1\n\n'
  );

  // 2. 清理其余未知的 XML 标签
  const cleaned = processedContent.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9_-]*)(?:\s[^>]*)?\/?>|<!\[CDATA\[.*?\]\]>/g,
    (match, tagName) => {
      if (!tagName) return match;
      if (SAFE_HTML_TAGS.has(tagName.toLowerCase())) return match;
      return '\n';
    }
  );
  
  return cleaned.replace(/\n{3,}/g, '\n\n').trim();
}

// ─── ReportsPanel ────────────────────────────────────────────
export default function ReportsPanel({ autoSelectFirst = true }: { autoSelectFirst?: boolean }) {
  const [reports, setReports]             = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading]             = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (Array.isArray(data)) {
        const filtered = data.filter((r: Report) => !(r.title || '').startsWith('人才验真报告'));
        setReports(filtered);
        if (autoSelectFirst && filtered.length > 0) fetchReportDetail(filtered[0].id);
      }
    } catch {
      message.error('加载报告列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`);
      const data = await res.json();
      if (data && !data.error) setSelectedReport(data.data || data);
    } catch {
      message.error('加载报告详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteReport = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确定要删除这份报告吗？',
      content: '删除后将无法恢复。',
      okText: '确定', okType: 'danger', cancelText: '取消',
      onOk: async () => {
        try {
          const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
          if (res.ok) {
            message.success('报告已删除');
            if (selectedReport?.id === id) setSelectedReport(null);
            fetchReports();
          }
        } catch { message.error('删除失败'); }
      },
    });
  };

  // 将 Markdown 渲染成带样式的 HTML 字符串（复用已有的 marked 库）
  const buildHtml = (report: Report): string => {
    const { marked: markedFn } = require('marked');
    let cleaned = stripCustomXml(report.content || '');
    if (report.title) {
      const esc = report.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(`^#+\\s*${esc}\\s*\n?`, 'm'), '').trimStart();
    }
    const body = markedFn.parse(cleaned);
    return `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><title>${report.title}</title>
<style>
  body{font-family:'PingFang SC','Microsoft YaHei',sans-serif;line-height:1.8;color:#1e293b;max-width:800px;margin:40px auto;padding:0 24px}
  h1{font-size:2rem;font-weight:700;margin-bottom:8px}
  h2{font-size:1.35rem;font-weight:600;margin-top:2em;color:#3b3b8f}
  h3{font-size:1.1rem;font-weight:600;margin-top:1.5em;color:#427759}
  p{margin:.8em 0}ul,ol{padding-left:1.5em}li{margin:.3em 0}
  table{border-collapse:collapse;width:100%}td,th{border:1px solid #dde;padding:6px 12px}
  th{background:#f3f4ff}code{background:#f8f8f8;padding:2px 4px;border-radius:3px}
  .meta{font-size:13px;color:#94a3b8;margin-bottom:32px;padding-bottom:16px;border-bottom:1px solid #e2e8f0}
  .footer{margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#cbd5e1}
</style></head><body>
<h1>${report.title}</h1>
<div class="meta">${report.charName} 创作 · 生成于 ${new Date(report.createdAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
${body}
<div class="footer">© ${new Date().getFullYear()} 知己 AI · 由 ${report.charName} 提供智慧支持</div>
</body></html>`;
  };

  // 下载为 Word（.doc 格式，Word/WPS 均可打开）
  const handleDownloadWord = (report: Report) => {
    const html = buildHtml(report);
    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title || '报告'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('Word 文件已下载，用 Word 或 WPS 打开即可');
  };

  // 下载为 PDF（调起浏览器打印对话框，选"另存为 PDF"）
  const handleDownloadPdf = (report: Report) => {
    const html = buildHtml(report);
    const win = window.open('', '_blank');
    if (!win) { message.error('请允许弹出窗口后重试'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  const renderContent = (content: string, reportTitle?: string) => {
    let cleaned = stripCustomXml(content);
    // 去掉旧报告里开头重复标题的 H1/H2
    if (reportTitle) {
      const escapedTitle = reportTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      cleaned = cleaned.replace(new RegExp(`^#+\\s*${escapedTitle}\\s*\n?`, 'm'), '').trimStart();
    }
    const html = marked.parse(cleaned);
    return <div className="prose prose-slate max-w-none prose-sm sm:prose-base" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  // 左侧列表预览摘要
  const previewSummary = (text: string) => stripCustomXml(text || '').slice(0, 80);

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* 左侧列表 */}
      <div className={`w-full md:w-80 flex-shrink-0 border-r border-slate-200/60 flex flex-col ${selectedReport ? 'hidden md:flex' : 'flex'}`}
        style={{ background: 'linear-gradient(160deg, #eef2ff 0%, #e4eaf8 100%)' }}>
        <div className="px-4 py-3 border-b border-white/60 flex-shrink-0 flex items-center justify-between">
          <span className="text-[12px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-2">
            <FileTextOutlined style={{ color: PRIMARY }} /> 成长报告
          </span>
          <Tag color={PRIMARY}>{reports.length}</Tag>
        </div>
        <div className="flex-1 overflow-y-auto py-2"
          style={{ paddingBottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom, 0px))' : undefined }}>
          {loading ? (
            <div className="p-8 text-center"><Spin description="正在加载..." /></div>
          ) : reports.length > 0 ? (
            <div className="flex flex-col">
              {reports.map(item => {
                const isActive = selectedReport?.id === item.id;
                return (
                  <div key={item.id} onClick={() => fetchReportDetail(item.id)}
                    style={{
                      borderLeft: `3px solid ${isActive ? PRIMARY : 'transparent'}`,
                      boxShadow: isActive
                        ? '0 2px 8px rgba(96,85,245,0.14), 0 1px 2px rgba(0,0,0,0.04)'
                        : '0 1px 3px rgba(0,0,0,0.06)',
                    }}
                    className="mx-2 mb-1.5 px-3 py-3 rounded-xl cursor-pointer bg-white transition-all hover:shadow-md group">
                    <div className="flex justify-between items-start mb-1.5">
                      <span className={`font-bold text-[15px] leading-snug flex-1 line-clamp-1 ${isActive ? 'text-[#427759]' : 'text-slate-800'}`}>
                        {item.title}
                      </span>
                      <button onClick={e => handleDeleteReport(e, item.id)}
                        className="ml-1 p-2 md:p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400 flex-shrink-0">
                        <DeleteOutlined style={{ fontSize: 14 }} className="md:text-[11px]" />
                      </button>
                    </div>
                    <p className="text-[12px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                      {previewSummary(item.summary)}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1"><UserOutlined />{item.charName}</span>
                      <span className="flex items-center gap-1"><CalendarOutlined />{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4"><Empty description="暂无报告" /></div>
          )}
        </div>
      </div>

      {/* 右侧详情 */}
      <div className={`flex-1 overflow-y-auto ${!selectedReport ? 'hidden md:flex items-center justify-center' : 'flex flex-col'}`}
        style={{
          background: 'linear-gradient(160deg, #eef2ff 0%, #e4eaf8 100%)',
          paddingBottom: isMobile ? 'calc(72px + env(safe-area-inset-bottom, 0px))' : undefined
        }}>
        {detailLoading ? (
          <div className="flex-1 flex items-center justify-center"><Spin size="large" /></div>
        ) : selectedReport ? (
          <div className="p-6 md:p-8">
            <button
              className="md:hidden flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-[#427759]"
              onClick={() => setSelectedReport(null)}
            >
              <ArrowLeftOutlined style={{ fontSize: 13 }} /> 返回列表
            </button>
            <div className="bg-white rounded-2xl shadow-sm border border-white/80 p-6 sm:p-10 max-w-[750px]">
              <div className="mb-8 border-b border-slate-100 pb-8">
                <div className="flex items-center gap-2 mb-4 text-sm justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#427759] flex items-center gap-1">
                      <UserOutlined /> {selectedReport.charName} 创作
                    </span>
                    <span className="text-slate-400">· 生成于 {new Date(selectedReport.createdAt).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadWord(selectedReport)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 hover:text-[#427759] hover:bg-[#427759]/5 transition-colors border border-slate-200 text-sm"
                      title="下载为 Word 文件"
                    >
                      <DownloadOutlined /> Word
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(selectedReport)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#427759]/8 text-[#427759] hover:bg-[#427759]/15 transition-colors border border-[#427759]/20 text-sm"
                      title="打印 / 另存为 PDF"
                    >
                      <DownloadOutlined /> PDF
                    </button>
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[#141b38] mb-4">{selectedReport.title}</h1>
                {(() => {
                  const cleanSummary = stripCustomXml(selectedReport.summary || '');
                  return cleanSummary && cleanSummary.length <= 120 ? (
                    <p className="text-lg text-slate-500 italic border-l-4 border-slate-200 pl-4">
                      {cleanSummary}
                    </p>
                  ) : null;
                })()}
              </div>
              <div className="report-content">{renderContent(selectedReport.content, selectedReport.title)}</div>
              <div className="mt-16 pt-8 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-300">© {new Date().getFullYear()} 知己 AI · 由 {selectedReport.charName} 提供智慧支持</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-white/60 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeOutlined className="text-slate-300 text-3xl" />
            </div>
            <span className="text-slate-400 text-sm">选择一份报告查看详情</span>
          </div>
        )}
      </div>
    </div>
  );
}
