'use client';

interface RecommendCardProps {
  type: 'page' | 'app';
  name: string;
  description?: string;
  url: string;
  icon?: string;
  reason?: string; // AI 给出的推荐理由
}

export default function RecommendCard({ type, name, description, url, icon, reason }: RecommendCardProps) {
  const label = type === 'page' ? '推荐页面' : '推荐应用';
  const defaultIcon = type === 'page' ? '🔗' : '🛠️';

  const iconEl = (() => {
    if (!icon) return <span style={{ fontSize: 24 }}>{defaultIcon}</span>;
    if (icon.startsWith('http') || icon.startsWith('/')) {
      return <img src={icon} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />;
    }
    return <span style={{ fontSize: 24 }}>{icon}</span>;
  })();

  return (
    <a
      href={url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px', marginTop: 8,
        background: 'linear-gradient(135deg, #f8f7ff 0%, #f1f0ff 100%)',
        border: '1.5px solid rgba(96, 85, 245, 0.18)',
        borderRadius: 12, textDecoration: 'none', color: 'inherit',
        transition: 'all 0.18s ease',
        cursor: 'pointer', maxWidth: 380,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(96,85,245,0.15)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(96,85,245,0.4)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(96, 85, 245, 0.18)';
        (e.currentTarget as HTMLElement).style.transform = '';
      }}
    >
      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: type === 'page' ? 'rgba(96,85,245,0.1)' : 'rgba(16,163,127,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {iconEl}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: type === 'page' ? '#427759' : '#10a37f', marginBottom: 2, letterSpacing: '0.5px' }}>
          {label}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name}
        </div>
        {(reason || description) && (
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, lineHeight: 1.5,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}>
            {reason || description}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div style={{ color: '#427759', flexShrink: 0, fontSize: 14 }}>→</div>
    </a>
  );
}
