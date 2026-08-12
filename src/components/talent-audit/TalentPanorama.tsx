'use client';
import React, { useState } from 'react';
import {
  Database, Globe, ExternalLink, Fingerprint,
  BarChart3, ChevronDown, ChevronUp, FileText, BookOpen,
} from 'lucide-react';
import { TalentAuditReportData } from './types';
import './TalentPanorama.css';

const FIELD_MAP: Record<string, string> = {
  name: '姓名',
  name_zh: '中文名',
  name_en: '英文姓名',
  id: '平方数据ID',
  avatar: '照片',
  org: '所属机构',
  position: '职位',
  title: '头衔',
  h_index: 'H指数',
  pubs: '论文数',
  citations: '引用数',
  desc: '简介',
  tags: '标签',
  gender: '性别',
  contact: '联系方式',
  email: '邮箱',
  phone: '电话',
  homepage: '个人主页',
  education: '教育经历',
  work_experience: '工作经历',
  awards: '获奖情况',
  // 平方学者库特定字段
  avatar_url: '照片',
  education_backgrounds: '教育经历',
  work_experiences: '工作经历',
  award_experiences: '获奖经历',
  pro_fun_experiences: '项目/基金经历',
  school_current: '当前工作学校',
  workplace_current: '当前所在单位',
  position_current: '当前职务',
  country_current: '当前所在国家',
  admin_position: '当前行政任职',
  birth_date: '出生日期',
  introduction: '简介',
  is_chinese: '是否华裔',
  nationality: '国籍',
  notes: '备注',
  profile_link: '人才主页链接',
  province: '籍贯',
  research_field: '研究领域 / 突出贡献',
  // 教育经历子字段
  degree: '学历',
  if_highest_degree: '是否最高学历',
  if_in_progress_vone: '是否正在进行中',
  major_name_cn: '具体专业名称',
  school_name_cn: '学校名称',
  start_date: '开始时间',
  end_date: '结束时间',
  // 工作经历子字段
  country: '所在国家',
  department: '二级工作单位',
  employer: '工作单位',
  is_current_work: '是否当前工作',
  job_type: '工作类型',
  position: '职位',
  work_contents: '工作内容',
  name: '职位名称',
  // 获奖经历子字段
  level: '奖项等级',
  program_name: '项目名称',
  session: '届数',
  year: '获奖年份',
  description: '获奖介绍',
};

/** 不显示的字段 */
const HIDDEN_FIELDS = new Set([
  'photo_id.download_url',
  'photo_id',
  'talent_type',
  'talent_source_category',
  // 教育经历内部隐藏字段
  'highschool_id',
  'talent_person_id',
  'school_id',
  'company_id',
  // 获奖经历内部隐藏字段
  'award_id',
  'pe_work_experiences_id',
]);

/** 性别值转换 */
const GENDER_MAP: Record<string, string> = {
  male: '男',
  female: '女',
};

/** 学历值转换 */
const DEGREE_MAP: Record<string, string> = {
  phd: '博士研究生',
  master: '硕士研究生',
  undergrad: '本科生',
  college: '大专生',
  high_school: '高中生',
  middle_school: '初中生',
  primary: '小学生',
};

/** 工作类型值转换 */
const JOB_TYPE_MAP: Record<string, string> = {
  full_time: '全职',
  part_time: '兼职',
  intern: '实习',
  other: '其他',
};

/** 奖项等级值转换 */
const AWARD_LEVEL_MAP: Record<string, string> = {
  grand_prize: '特等奖',
  first_prize: '一等奖',
  second_prize: '二等奖',
  third_prize: '三等奖',
  gold: '金',
  silver: '银',
  bronze: '铜',
  other: '其他',
};

/** 布尔值字段 */
const BOOLEAN_FIELDS = new Set([
  'is_chinese',
  'if_highest_degree',
  'if_in_progress_vone',
  'is_current_work',
]);

/** 字段排序优先级（数字越小越靠前，未列出的字段排在最后） */
const FIELD_ORDER: Record<string, number> = {
  // 教育经历
  school_name_cn: 1,
  major_name_cn: 2,
  degree: 3,
  start_date: 4,
  end_date: 5,
  if_highest_degree: 6,
  if_in_progress_vone: 7,
  // 工作经历
  employer: 1,
  department: 2,
  position: 3,
  name: 4,
  job_type: 5,
  country: 6,
  start_date: 4,  // 与教育经历共用，不影响（同一个 map 里只保留一个值，但排序是按 key 查的）
  end_date: 5,
  is_current_work: 8,
  work_contents: 9,
  // 获奖经历
  program_name: 1,
  level: 2,
  year: 3,
  session: 4,
  description: 5,
};

/** 获取字段排序权重 */
function getFieldOrder(key: string): number {
  return FIELD_ORDER[key] ?? 999;
}

/** 字段值转换器 */
function transformFieldValue(key: string, value: any): any {
  if (key === 'gender' && typeof value === 'string') {
    return GENDER_MAP[value.toLowerCase()] || value;
  }
  if (key === 'degree' && typeof value === 'string') {
    return DEGREE_MAP[value.toLowerCase()] || value;
  }
  if (key === 'job_type' && typeof value === 'string') {
    return JOB_TYPE_MAP[value.toLowerCase()] || value;
  }
  if (key === 'level' && typeof value === 'string') {
    return AWARD_LEVEL_MAP[value.toLowerCase()] || value;
  }
  if (BOOLEAN_FIELDS.has(key) && typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  return value;
}

interface Props {
  reportData: TalentAuditReportData;
}

/**
 * 全景信息 — 验真过程中各渠道搜到的全部原始数据
 * 设计原则：不做任何 AI 过滤/挑拣/字段映射，各渠道原始文本直出
 */
export default function TalentPanorama({ reportData }: Props) {
  const src = reportData.sourceData || {};
  const texts: string[] = src.texts || [];
  const hasTexts = texts.length > 0;

  // 解析 texts 数组，按渠道分组展示
  const sections = hasTexts ? parseTextSections(texts) : [];

  // 兜底：如果有结构化数据但没 texts（旧数据），用结构化展示
  const hasStructured = src.pingfang || src.orcid || src.scholar || src.wikipedia;

  return (
    <div className="pano-container">
      {/* ── 按渠道分区展示原始文本 ── */}
      {sections.map((section, i) => (
        <SourceSection key={i} section={section} />
      ))}

      {/* ── 兜底：旧数据的结构化展示 ── */}
      {!hasTexts && hasStructured && (
        <>
          {src.pingfang && (
            <RawJsonSection
              title="平方学者库"
              icon={<Database size={16} />}
              iconCls="pano-section-icon-purple"
              sourceLabel="🏛 平方学者库"
              sourceCls="pano-source-pingfang"
              data={src.pingfang}
            />
          )}
          {src.orcid && (
            <RawJsonSection
              title="ORCID 学者档案"
              icon={<Fingerprint size={16} />}
              iconCls="pano-section-icon-green"
              sourceLabel="🆔 ORCID"
              sourceCls="pano-source-orcid"
              data={src.orcid}
              link={src.orcid_url}
            />
          )}
          {src.scholar && (
            <RawJsonSection
              title="OpenAlex 学术数据"
              icon={<BarChart3 size={16} />}
              iconCls="pano-section-icon-blue"
              sourceLabel="📊 OpenAlex"
              sourceCls="pano-source-scholar"
              data={src.scholar}
              link={src.scholar_url}
            />
          )}
          {src.wikipedia?.biography && (
            <div className="pano-section">
              <div className="pano-section-head">
                <div className="pano-section-icon pano-section-icon-amber"><Globe size={16} /></div>
                <span className="pano-section-title">
                  {src.wikipedia.source_type === 'baike' ? '百度百科' : 'Wikipedia'}
                </span>
                <span className="pano-source-badge pano-source-wiki" style={{ marginLeft: 'auto' }}>
                  📖 {src.wikipedia.source_type === 'baike' ? '百度百科' : 'Wikipedia'}
                </span>
                {src.wikipedia.url && (
                  <a href={src.wikipedia.url} target="_blank" rel="noopener noreferrer" className="pano-evidence-link">
                    查看原文 <ExternalLink size={10} />
                  </a>
                )}
              </div>
              <div className="pano-bio" style={{ maxHeight: 400, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                {src.wikipedia.biography}
              </div>
            </div>
          )}
        </>
      )}

      {!hasTexts && !hasStructured && (
        <div className="pano-empty">
          暂无外部数据源信息。请先完成人才验真，系统将自动从平方学者库、ORCID、Scholar、Wikipedia 等渠道采集数据。
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// 解析 texts 数组 → 按渠道分区
// ══════════════════════════════════════════════════════════════════

interface TextSection {
  title: string;
  icon: React.ReactNode;
  iconCls: string;
  sourceLabel: string;
  sourceCls: string;
  content: string;
  link?: string;
}

function parseTextSections(texts: string[]): TextSection[] {
  return texts
    .filter(t => t && t.trim())
    .map(text => {
      // 从文本头部识别渠道
      if (text.startsWith('【平方学者库】')) {
        return {
          title: '平方学者库',
          icon: <Database size={16} />,
          iconCls: 'pano-section-icon-purple',
          sourceLabel: '🏛 平方学者库',
          sourceCls: 'pano-source-pingfang',
          content: text.replace(/^【平方学者库】\n?/, ''),
        };
      }
      if (text.startsWith('【ORCID')) {
        // 提取 URL
        const urlMatch = text.match(/URL:\s*(https?:\/\/\S+)/);
        return {
          title: 'ORCID 学者档案',
          icon: <Fingerprint size={16} />,
          iconCls: 'pano-section-icon-green',
          sourceLabel: '🆔 ORCID',
          sourceCls: 'pano-source-orcid',
          content: text.replace(/^【ORCID[^】]*】\s*/, ''),
          link: urlMatch?.[1],
        };
      }
      if (text.startsWith('【OpenAlex')) {
        const urlMatch = text.match(/URL:\s*(https?:\/\/\S+)/);
        return {
          title: 'OpenAlex 学术数据',
          icon: <BarChart3 size={16} />,
          iconCls: 'pano-section-icon-blue',
          sourceLabel: '📊 OpenAlex',
          sourceCls: 'pano-source-scholar',
          content: text.replace(/^【OpenAlex[^】]*】\s*/, ''),
          link: urlMatch?.[1],
        };
      }
      if (text.startsWith('【Wikipedia') || text.startsWith('【百度百科')) {
        const urlMatch = text.match(/URL:\s*(https?:\/\/\S+)/);
        const isBaike = text.startsWith('【百度百科');
        return {
          title: isBaike ? '百度百科' : 'Wikipedia',
          icon: <Globe size={16} />,
          iconCls: 'pano-section-icon-amber',
          sourceLabel: isBaike ? '📖 百度百科' : '📖 Wikipedia',
          sourceCls: 'pano-source-wiki',
          content: text.replace(/^【[^】]+】\s*/, ''),
          link: urlMatch?.[1],
        };
      }
      // 未识别的渠道
      return {
        title: '其他数据源',
        icon: <FileText size={16} />,
        iconCls: 'pano-section-icon-purple',
        sourceLabel: '📄 原始数据',
        sourceCls: '',
        content: text,
      };
    });
}

// ══════════════════════════════════════════════════════════════════
// 渲染组件
// ══════════════════════════════════════════════════════════════════

/** 渠道文本区块 — 直接展示原始文本，不做字段映射 */
function SourceSection({ section }: { section: TextSection }) {
  const [expanded, setExpanded] = useState(true);
  const isJson = section.content.trim().startsWith('{') || section.content.trim().startsWith('[');
  
  // 对 JSON 内容，尝试美化展示
  let displayContent = section.content;
  let jsonObj: any = null;
  if (isJson) {
    try {
      jsonObj = JSON.parse(section.content.split('\n').filter(l => l.trim().startsWith('{') || l.trim().startsWith('[') || l.trim().startsWith('"') || l.trim().startsWith('}') || l.trim().startsWith(']') || l.trim().match(/^\d/) || l.trim() === '').join('\n') || section.content);
    } catch {
      // 不是纯 JSON，可能是混合文本，直接用原始文本
    }
  }

  return (
    <div className="pano-section">
      <div className="pano-section-head" style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div className={`pano-section-icon ${section.iconCls}`}>{section.icon}</div>
        <span className="pano-section-title">{section.title}</span>
        <span className={`pano-source-badge ${section.sourceCls}`} style={{ marginLeft: 'auto' }}>
          {section.sourceLabel}
        </span>
        {section.link && (
          <a
            href={section.link}
            target="_blank"
            rel="noopener noreferrer"
            className="pano-evidence-link"
            onClick={e => e.stopPropagation()}
            style={{ marginLeft: 8 }}
          >
            查看原始页面 <ExternalLink size={10} />
          </a>
        )}
        {expanded ? <ChevronUp size={14} style={{ color: '#94a3b8', marginLeft: 4 }} /> : <ChevronDown size={14} style={{ color: '#94a3b8', marginLeft: 4 }} />}
      </div>

      {expanded && (
        <div style={{ padding: '12px 20px' }}>
          {jsonObj ? (
            <JsonDisplay data={jsonObj} />
          ) : (
            <pre className="pano-raw-text">{displayContent}</pre>
          )}
        </div>
      )}
    </div>
  );
}

/** JSON 对象美化展示 — 把 key/value 渲染成可读的卡片 */
function JsonDisplay({ data }: { data: any }) {
  if (Array.isArray(data)) {
    return (
      <div className="pano-json-list">
        {data.map((item, i) => (
          <div key={i} className="pano-json-item">
            <div className="pano-json-index">{i + 1}</div>
            <div className="pano-json-body">
              {typeof item === 'object' && item !== null ? (
                <KeyValuePairs obj={item} />
              ) : (
                <span>{String(item)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (typeof data === 'object' && data !== null) {
    // 分离简单字段和数组字段（过滤隐藏字段）
    const simpleEntries = Object.entries(data).filter(([k, v]) => !Array.isArray(v) && typeof v !== 'object' && !HIDDEN_FIELDS.has(k));
    const arrayEntries = Object.entries(data).filter(([k, v]) => Array.isArray(v) && !HIDDEN_FIELDS.has(k));
    const objectEntries = Object.entries(data).filter(([k, v]) => typeof v === 'object' && v !== null && !Array.isArray(v) && !HIDDEN_FIELDS.has(k));

    return (
      <div>
        {/* 简单字段 → key-value 表格 */}
        {simpleEntries.length > 0 && (
          <div className="pano-info-grid" style={{ marginBottom: 16 }}>
            {simpleEntries.map(([k, v]) => {
              const displayValue = transformFieldValue(k, v);
              return (
              <div key={k} className="pano-info-row">
                <span className="pano-info-label">{FIELD_MAP[k] || k}</span>
                <span className="pano-info-value">
                  {(k === 'avatar' || k === 'avatar_url') && typeof v === 'string' && v.startsWith('http') ? (
                    <img src={v} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    displayValue == null ? '—' : String(displayValue)
                  )}
                </span>
              </div>
              );
            })}
          </div>
        )}

        {/* 数组字段 → 列表展示 */}
        {arrayEntries.map(([k, v]) => (
          <CollapsibleArray key={k} label={FIELD_MAP[k] || k} items={v as any[]} />
        ))}

        {/* 嵌套对象 → 递归 */}
        {objectEntries.map(([k, v]) => (
          <div key={k} style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{FIELD_MAP[k] || k}:</div>
            <div style={{ paddingLeft: 12, borderLeft: '2px solid #e2e8f0' }}>
              <KeyValuePairs obj={v as Record<string, any>} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="pano-raw-text">{JSON.stringify(data, null, 2)}</pre>;
}

/** key-value 对展示 */
function KeyValuePairs({ obj }: { obj: Record<string, any> }) {
  const sortedEntries = Object.entries(obj)
    .filter(([k]) => !HIDDEN_FIELDS.has(k))
    .sort(([a], [b]) => getFieldOrder(a) - getFieldOrder(b));

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', alignItems: 'center' }}>
      {sortedEntries.map(([k, v]) => {
        if (v == null || v === '') return null;
        const displayValue = transformFieldValue(k, v);
        if (typeof displayValue === 'object') return (
          <div key={k} style={{ width: '100%', fontSize: 12, color: '#64748b' }}>
            <span style={{ fontWeight: 600 }}>{FIELD_MAP[k] || k}: </span>
            <span>{JSON.stringify(displayValue)}</span>
          </div>
        );
        return (
          <div key={k} style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 600 }}>{FIELD_MAP[k] || k}: </span>
            <span style={{ color: '#1e293b' }}>
              {(k === 'avatar' || k === 'avatar_url') && typeof v === 'string' && v.startsWith('http') ? (
                <img src={v} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                String(displayValue)
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** 可折叠数组 */
function CollapsibleArray({ label, items }: { label: string; items: any[] }) {
  const [open, setOpen] = useState(items.length <= 5);
  if (!items.length) return null;

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 12, fontWeight: 600, color: '#475569', padding: 0,
          fontFamily: 'inherit',
        }}
      >
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {label} ({items.length})
      </button>
      {open && (
        <div style={{ paddingLeft: 12, marginTop: 6 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 12, color: '#334155' }}>
              <span style={{ color: '#94a3b8', fontWeight: 600, minWidth: 20 }}>{i + 1}.</span>
              <div style={{ flex: 1 }}>
                {typeof item === 'object' && item !== null ? (
                  <KeyValuePairs obj={item} />
                ) : (
                  <span>{String(item)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** 旧数据兜底：直接展示 JSON */
function RawJsonSection({ title, icon, iconCls, sourceLabel, sourceCls, data, link }: {
  title: string; icon: React.ReactNode; iconCls: string;
  sourceLabel: string; sourceCls: string; data: any; link?: string;
}) {
  const [expanded, setExpanded] = useState(true);
  return (
    <div className="pano-section">
      <div className="pano-section-head" style={{ cursor: 'pointer' }} onClick={() => setExpanded(!expanded)}>
        <div className={`pano-section-icon ${iconCls}`}>{icon}</div>
        <span className="pano-section-title">{title}</span>
        <span className={`pano-source-badge ${sourceCls}`} style={{ marginLeft: 'auto' }}>{sourceLabel}</span>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="pano-evidence-link"
            onClick={e => e.stopPropagation()} style={{ marginLeft: 8 }}>
            打开 <ExternalLink size={10} />
          </a>
        )}
        {expanded ? <ChevronUp size={14} style={{ color: '#94a3b8' }} /> : <ChevronDown size={14} style={{ color: '#94a3b8' }} />}
      </div>
      {expanded && (
        <div style={{ padding: '12px 20px' }}>
          <JsonDisplay data={data} />
        </div>
      )}
    </div>
  );
}
