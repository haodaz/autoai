import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Character, HomeConfig } from '@/lib/characters/types';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/useIsMobile';
import { MessageOutlined, ArrowRightOutlined, MenuOutlined } from '@ant-design/icons';
import { Search, ShieldCheck, Library, ChevronRight } from 'lucide-react';
import { useThemeNames } from '@/hooks/useThemeNames';

const fmtDate = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

interface NewHomeTabProps {
  characters: Character[];
  onSelect: (c: Character) => void;
  homeConfig: HomeConfig | null;
}

export function NewHomeTab({ characters, onSelect, homeConfig }: NewHomeTabProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const themeNames = useThemeNames();
  
  // 推荐专家 (从配置取或最新4个)
  const recommendedById = (homeConfig?.recommendedIds?.length ?? 0) > 0
    ? (homeConfig!.recommendedIds!.map(id => characters.find(c => c.id === id || c.slug === id)).filter(Boolean) as Character[])
    : [];
  const recommended = recommendedById.length > 0 ? recommendedById : characters.slice(-4).reverse();

  const [auditHistory, setAuditHistory] = useState<any[]>([]);
  const [localUsername, setLocalUsername] = useState('');
  const [thinkTankArticles, setThinkTankArticles] = useState<any[]>([]);
  
  React.useEffect(() => {
    // 读取本地昵称
    const cachedProfile = localStorage.getItem('zhiji_profile_data');
    if (cachedProfile) {
      try {
        const profileData = JSON.parse(cachedProfile);
        if (profileData.username) {
          setLocalUsername(profileData.username);
        }
      } catch (e) {}
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/reports?_t=' + Date.now(), { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data)) {
          const auditReports = data
            .filter((r: any) => r.type === 'talent_audit' || (r.title && r.title.includes('验真报告')))
            .sort((a: any, b: any) => new Date(b.createdAt || b.updatedAt || 0).getTime() - new Date(a.createdAt || a.updatedAt || 0).getTime());
          setAuditHistory(auditReports.slice(0, 3));
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchThinkTank = async () => {
      try {
        const res = await fetch('/api/higher-education/search?query=&size=20');
        const data = await res.json();
        
        const seenTitles = new Set<string>();
        const uniqueItems = [];
        const shuffledItems = (data.items || []).sort(() => Math.random() - 0.5);
        for (const raw of shuffledItems) {
          const title = raw.title || raw.name || raw.description || '无标题';
          if (!seenTitles.has(title)) {
            seenTitles.add(title);
            const sceneKeys = (raw.scene_key as string[] | undefined) || [];
            const sceneMap: Record<string, string> = { higher_education: '高教一答', personal: '个人发展', organizational: '人才培养' };
            const category = sceneMap[sceneKeys[0]] || sceneKeys[0] || '热门文章';
            uniqueItems.push({
              id: raw.id,
              title,
              category,
              summary: ((raw.description || raw.es_highlight || '') as string).substring(0, 100),
              date: ((raw.latest_modified as string) || '').substring(0, 10).replace(/-/g, '.')
            });
            if (uniqueItems.length === 1) break;
          }
        }
        setThinkTankArticles(uniqueItems);
      } catch (err) {
        console.error(err);
      }
    };

    fetchHistory();
    fetchThinkTank();
  }, []);

  return (
    <div className="relative min-h-[100dvh] bg-gradient-to-b from-[#f8f9fc] to-[#fdfcff] pb-[10vh] overflow-x-hidden">
      {/* 极光背景层 */}
      <div className="fixed top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[120vw] h-[120vw] md:w-[70vw] md:h-[70vw] rounded-full bg-gradient-to-br from-[#e0e7ff] to-[#ddd6fe] mix-blend-multiply opacity-80 md:opacity-50 blur-[90px] md:blur-[80px] animate-blob" />
        <div className="absolute top-[10%] -right-[20%] md:-right-[10%] w-[110vw] h-[110vw] md:w-[60vw] md:h-[60vw] rounded-full bg-gradient-to-bl from-[#fce7f3] to-[#f3e8ff] mix-blend-multiply opacity-80 md:opacity-40 blur-[90px] md:blur-[80px] animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-[10px] pt-8">
        


        {/* 巨型问候语 */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[#64748b] mb-1">
            你好，{localUsername || user?.displayName || user?.username || '探索者'} <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>
          <p className="text-[32px] font-extrabold text-[#1e293b] tracking-tight leading-[1.2] mt-2">
            需要我做些什么？
          </p>
        </div>

        {/* 核心动作矩阵 (1大3小) - 鲜艳的紫红色系 */}
        <div className="flex gap-3 mb-10 h-[220px]">
          {/* 左侧：大卡片 (一答交流) */}
          <div 
            onClick={() => router.push('/chat?charId=yida_main')}
            className="flex-1 rounded-[24px] bg-gradient-to-br from-[#ddd6fe] via-[#8b5cf6] to-[#4f46e5] shadow-[0_8px_24px_rgba(124,58,237,0.4)] p-5 flex flex-col justify-between cursor-pointer transition-transform hover:-translate-y-1 active:scale-95 relative overflow-hidden"
          >
            {/* 卡片内部的微光效，让渐变更生动 */}
            <div className="absolute top-0 left-0 w-[80%] h-[80%] bg-white/20 blur-3xl rounded-full pointer-events-none mix-blend-overlay opacity-60"></div>
            
            {/* 白色圆形底托 + CSS放大裁剪 */}
            <div className="relative z-10 w-16 h-16 mb-2 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden">
               <img src="/assets/cute_ai_orb_home.png" alt="yida" className="w-[180%] h-[180%] max-w-none object-center" />
            </div>
            <div className="relative z-10">
              <h3 className="text-[20px] font-bold text-white mb-1">与一答交流</h3>
              <p className="text-[13px] text-white/90 leading-relaxed font-medium">您的专属AI智能体<br/>解答一切疑问</p>
            </div>
          </div>

          {/* 右侧：3个小卡片纵向排列 - 渐变进阶 */}
          <div className="w-[140px] flex flex-col gap-3">
            {/* 右1：找AI智囊团 */}
            <div 
              onClick={() => router.push('/square?view=all')}
              className="flex-1 rounded-[16px] bg-gradient-to-r from-[#427759] to-[#8b5cf6] shadow-[0_4px_12px_rgba(96,85,245,0.3)] px-4 flex items-center gap-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(96,85,245,0.4)] active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full -translate-y-8 translate-x-4 blur-md pointer-events-none"></div>
              <div className="w-7 h-7 rounded-[10px] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                <Search size={14} className="text-white group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[14px] font-bold text-white relative z-10">找AI智囊团</span>
            </div>

            {/* 右2：人才检验 */}
            <div 
              onClick={() => router.push('/talent-audit')}
              className="flex-1 rounded-[16px] bg-gradient-to-r from-[#8b5cf6] to-[#a855f7] shadow-[0_4px_12px_rgba(139,92,246,0.3)] px-4 flex items-center gap-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(139,92,246,0.4)] active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full -translate-y-8 translate-x-4 blur-md pointer-events-none"></div>
              <div className="w-7 h-7 rounded-[10px] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                <ShieldCheck size={14} className="text-white group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[14px] font-bold text-white relative z-10">人才检验</span>
            </div>

            {/* 右3：查看智库 */}
            <div 
              onClick={() => router.push('/square?view=thinktank')}
              className="flex-1 rounded-[16px] bg-gradient-to-r from-[#a855f7] to-[#c084fc] shadow-[0_4px_12px_rgba(168,85,247,0.3)] px-4 flex items-center gap-2 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(168,85,247,0.4)] active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/20 rounded-full -translate-y-8 translate-x-4 blur-md pointer-events-none"></div>
              <div className="w-7 h-7 rounded-[10px] bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                <Library size={14} className="text-white group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-[14px] font-bold text-white relative z-10">查看智库</span>
            </div>
          </div>
        </div>

        {/* 推荐专家 (横向滑动) */}
        {recommended.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[18px] font-bold text-[#1e293b] mb-4">
              推荐专家
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x -mx-[10px] px-[10px] scroll-pl-[10px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {recommended.map((char, index) => {
                const tags = char.topic_tags && char.topic_tags.length > 0 
                  ? char.topic_tags.slice(0, 2) 
                  : [(char.theme_id && themeNames[char.theme_id]) || char.theme_id || '专业顾问', '精选推荐'];

                return (
                  <div key={char.id} className={`snap-start shrink-0 w-[85vw] max-w-[320px] ${index === recommended.length - 1 ? 'mr-[10px]' : ''}`}>
                    <div className="flex flex-col p-[14px_4px_16px] cursor-pointer rounded-[24px] relative bg-gradient-to-br from-[#f5f3ff] via-[#ede9fe] to-[#ddd6fe]" onClick={() => onSelect(char)}>
                      
                      {/* 顶部标题 */}
                      <div className="flex items-center gap-1.5 mb-3 pl-3">
                        <MessageOutlined className="text-[#427759] text-[14px]" />
                        <span className="text-[13px] font-bold text-[#666666]">
                          和 <span className="text-[#427759]">{char.name}</span> 聊一聊
                        </span>
                      </div>

                      {/* 内部白色主体卡片 */}
                      <div className="bg-white rounded-[16px] p-[14px] flex gap-[14px] relative shadow-[0_8px_24px_rgba(96,85,245,0.06)] overflow-hidden">
                        {/* 左侧头像 */}
                        <img src={char.assets?.avatar || char.assets?.idle || char.assets?.hero || char?.avatar ||  '/assets/default_avatar.png'} alt={char.name}
                          className="w-[72px] h-[72px] rounded-[14px] object-cover shrink-0 bg-[#f8fafc] border border-black/5" />
                        
                        {/* 右侧信息 */}
                        <div className="flex-1 flex flex-col min-w-0 pr-4">
                          <div className="text-[15px] font-extrabold text-[#1e1b4b] leading-[1.4] line-clamp-2 mb-2">
                            {(char.quick_prompts && (char.quick_prompts as string[]).length > 0)
                              ? (char.quick_prompts as string[])[0]
                              : (char.greeting || char.description || '一位懂得倦听的专家顾问。')}
                          </div>

                          <div className="flex gap-1.5 flex-wrap overflow-hidden mt-auto">
                            {tags.map((t, i) => (
                              <span key={i} className="text-[11px] text-[#427759] whitespace-nowrap font-semibold opacity-90">
                                {t}{i < tags.length - 1 && <span className="ml-1.5 text-[#cbd5e1] font-normal">|</span>}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 悬浮圆形按钮 */}
                        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-tl-2xl rounded-br-[16px] bg-gradient-to-br from-[#427759] to-[#8b5cf6] flex items-center justify-center text-white shadow-sm">
                          <ArrowRightOutlined className="text-[13px] font-bold" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 值得一读 (单卡片紧凑推荐) */}
        {thinkTankArticles.length > 0 && (
          <div className="mb-6">
            <div 
              onClick={() => router.push(`/square?view=thinktank&id=${thinkTankArticles[0].id}`)}
              className="bg-white rounded-2xl p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] cursor-pointer group hover:shadow-[0_6px_20px_rgba(96,85,245,0.1)] transition-shadow border border-gray-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-gradient-to-r from-[#8b5cf6] to-[#427759] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-sm">
                值得一读
              </div>
              <div className="flex items-center gap-2 mb-2 pt-1">
                <span className="px-1.5 py-0.5 rounded text-[#427759] bg-[#f0f3ff] text-[10px] font-bold">{thinkTankArticles[0].category}</span>
                {thinkTankArticles[0].date && <span className="text-[11px] text-[#9ca3af]">{thinkTankArticles[0].date}</span>}
              </div>
              <h4 className="text-[15px] font-bold text-[#1e293b] line-clamp-2 leading-relaxed group-hover:text-[#427759] transition-colors">{thinkTankArticles[0].title}</h4>
              {thinkTankArticles[0].summary && (
                <p className="mt-2 text-[13px] text-[#64748b] line-clamp-2 leading-relaxed">{thinkTankArticles[0].summary.replace(/<[^>]+>/g, '')}</p>
              )}
            </div>
          </div>
        )}

        {/* 检测历史 (纵向平铺) */}
        {auditHistory.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-bold text-[#1e293b]">
                检测历史
              </h2>
              <span 
                className="text-[13px] text-[#427759] font-medium cursor-pointer"
                onClick={() => router.push('/talent-audit')}
              >
                全部记录
              </span>
            </div>
            
            <div className="flex flex-col gap-4">
              {auditHistory.map(item => {
                let overallLevel = '中等可信度';
                let matchPct = 0;
                let hasValue = false;
                let valueScore = 85;
                try {
                  const c = JSON.parse(item.content || '{}');
                  overallLevel = c.overallEvaluation?.level || '中等可信度';
                  const total = (c.stats?.match || 0) + (c.stats?.mismatch || 0) + (c.stats?.manual_review || 0);
                  if (total > 0) matchPct = Math.round((c.stats?.match || 0) / total * 100);
                  hasValue = !!c.valueEvaluation;
                  if (c.valueEvaluation?.radarScores) {
                     const scores = Object.values(c.valueEvaluation.radarScores) as number[];
                     if (scores.length > 0) valueScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                  }
                } catch (e) {}

                const getRiskLabel = (level: string) => {
                  if (level === 'LOW RISK' || level === '高可信度') return '低风险';
                  if (level === 'MEDIUM RISK' || level === '中等可信度') return '中风险';
                  if (level === 'HIGH RISK' || level === '需人工复核') return '高风险';
                  if (level === 'PENDING') return '评估中';
                  if (level === 'RUNNING') return '评估中';
                  return level;
                };

                const mappedLevel = getRiskLabel(overallLevel);
                const levelColor = mappedLevel === '低风险' ? '#10b981' : mappedLevel === '高风险' ? '#ef4444' : mappedLevel === '评估中' ? '#94a3b8' : '#f59e0b';
                const levelBg = mappedLevel === '低风险' ? 'rgba(16,185,129,0.1)' : mappedLevel === '高风险' ? 'rgba(239,68,68,0.1)' : mappedLevel === '评估中' ? '#f1f5f9' : 'rgba(245,158,11,0.1)';

                return (
                  <div 
                    key={item.id}
                    onClick={() => router.push(`/talent-audit/resume/${item.id}`)}
                    className="relative overflow-hidden cursor-pointer rounded-[16px] bg-gradient-to-b from-white to-[#fcfbff] border border-[#ede9fe] p-4 shadow-sm transition-all hover:shadow-md hover:border-[#8b5cf6]/40 group active:scale-[0.98]"
                  >
                    {/* 科技感右上角光晕 */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#8b5cf6]/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex items-start justify-between mb-4 relative z-10">
                      <div className="flex-1 pr-2">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-1.5 h-3.5 rounded-full bg-gradient-to-b from-[#427759] to-[#a855f7]"></div>
                          <h4 className="text-[15px] font-extrabold text-[#1e293b] line-clamp-1">{item.title?.replace('人才验真报告: ', '') || '未知候选人'}</h4>
                        </div>
                        <div className="text-[11px] text-[#94a3b8] flex items-center gap-1.5 font-mono">
                          <span>{fmtDate(item.createdAt || item.updatedAt || new Date().toISOString())}</span>
                          <span className="text-[#cbd5e1]">•</span>
                          <span>ID:{item.id.substring(0,8).toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border tracking-wide" style={{ color: levelColor, borderColor: levelColor, backgroundColor: levelBg }}>
                          {mappedLevel}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#cbd5e1] group-hover:text-[#427759] transition-all">
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f8fafc]/80 border border-[#f1f5f9] relative z-10">
                      {/* 左侧指标：验真吻合度 */}
                      <div className="flex flex-col">
                        <div className="text-[10px] font-bold text-[#94a3b8] tracking-widest mb-0.5">匹配度</div>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-[20px] font-black font-mono leading-none" style={{ color: levelColor }}>{matchPct}</span>
                          <span className="text-[11px] font-bold" style={{ color: levelColor }}>%</span>
                        </div>
                      </div>
                      
                      <div className="w-px h-8 bg-[#e2e8f0]"></div>

                      {/* 右侧指标：测真评估 */}
                      <div className="flex flex-col">
                        <div className="text-[10px] font-bold text-[#94a3b8] tracking-widest mb-0.5">评估得分</div>
                        {hasValue ? (
                          <div className="flex items-baseline gap-0.5 text-[#8b5cf6]">
                            <span className="text-[20px] font-black font-mono leading-none">{valueScore}</span>
                            <span className="text-[11px] font-bold text-[#8b5cf6]">分</span>
                          </div>
                        ) : (
                          <div className="text-[11px] font-medium text-[#cbd5e1] mt-1">暂无数据</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
