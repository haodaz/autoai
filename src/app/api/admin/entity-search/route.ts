import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { ENTITY_FIELD_MAP, resolveMcpService } from '@/lib/mcp/entityContext';

export const dynamic = 'force-dynamic';

/** GET /api/admin/entity-search?action=models — 返回已知实体白名单 */
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  if (action === 'models') {
    const models = Object.entries(ENTITY_FIELD_MAP).map(([name, cfg]) => ({
      name,
      display_name: cfg.label,
      service: cfg.service,
    }));
    return NextResponse.json(models);
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}

/** POST /api/admin/entity-search
 *  body: { model: 'CRMInstitute', query: '清华' }
 *  返回匹配的实体列表 */
export async function POST(req: NextRequest) {
  try {
    const { model, query } = await req.json();
    if (!model) return NextResponse.json({ error: '缺少 model' }, { status: 400 });

    const token = await getToken(req);
    if (!token) {
      return NextResponse.json({ error: '未配置 token，请登录' }, { status: 401 });
    }

    // 从 ENTITY_FIELD_MAP 提取可搜索字段：name / name_* / title
    const entityCfg = ENTITY_FIELD_MAP[model];
    const searchableFields = (entityCfg?.fields?.filter(
      f => f === 'name' || f.startsWith('name_') || f === 'title'
    ) ?? ['name']).sort((a, b) => {
      if (a === 'name') return -1;
      if (b === 'name') return 1;
      if (a === 'title') return 1;
      if (b === 'title') return -1;
      return a.localeCompare(b);
    });
    const requestFields = ['id', ...searchableFields];

    // Flora condition DSL：用可搜索字段构建 OR 条件
    let condition;
    if (query?.trim()) {
      const q = query.trim();
      condition = JSON.stringify({
        logic_operator: '|',
        children: searchableFields.map(f => ({ leaf: { field: f, comparator: 'ilike', value: `%${q}%` } })),
      });
    }

    console.log('[entity-search] model:', model, '| query:', query || '(empty)');
    const searchService = resolveMcpService(model);
    const res = await searchService.dashGenericSearch({
      model,
      fields: requestFields,
      limit: 50,
      offset: 0,
      ...(condition ? { condition } : {}),
    }, token);
    console.log('[entity-search] raw:', JSON.stringify(res).slice(0, 600));

    const items = res?.items ?? [];
    const total: number = res?.total ?? items.length;

    // 用第一个有值的可搜索字段作为展示名
    const pickDisplayName = (item: any) => {
      for (const f of searchableFields) {
        if (item[f]) return item[f];
      }
      return `#${item.id}`;
    };

    return NextResponse.json({
      items: items.map((item: any) => ({
        entity_id:   item.id,
        entity_name: pickDisplayName(item),
      })),
      total,
    });
  } catch (e: any) {
    console.error('[entity-search] error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
