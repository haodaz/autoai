import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { characterManager } from '@/lib/ai/characters';
import { Character } from '@/lib/ai/types';
import { normalizeThemeId } from '@/lib/config/cloud-config';
import { cacheDel } from '@/lib/redis';

export const dynamic = 'force-dynamic';

async function getToken() {
  const store = await cookies();
  return store.get('zhiji_token')?.value ?? '';
}

function toAdminFormat(c: Character) {
  return {
    ...c,
    _mcpId: c.id,
    access_level: c.public ? 'public' : 'private',
  };
}

/** GET /api/admin/characters/[id] */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
    const { id: charId } = await params;

    const char = await characterManager.getCharacter(charId);
    if (!char) return NextResponse.json({ error: 'not found' }, { status: 404 });

    return NextResponse.json(toAdminFormat(char));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** PUT /api/admin/characters/[id] — 更新角色 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
    const { id: charId } = await params;
    const body = await req.json();

    const existing = await characterManager.getCharacter(charId);
    if (!existing) return NextResponse.json({ error: '角色不存在' }, { status: 404 });

    const { _mcpId, name, description, public: pub, access_level, ...rest } = body;

    // 归一化 theme_id：如果传入的是专题名称而不是 ID，自动转换为 ID
    if (rest.theme_id !== undefined) {
      rest.theme_id = await normalizeThemeId(rest.theme_id);
    }

    const merged = {
      ...existing,
      ...rest,
      name: name || rest.name || existing.name,
      description: description || rest.description || existing.description || '',
    } as Character;

    // 保留原有公开状态除非明确传入
    if (pub !== undefined || access_level !== undefined) {
      (merged as any).public = pub ?? (access_level === 'public');
    }

    const savedId = await characterManager.saveCharacter(merged);
    // 保存后清除公开列表缓存，确保 A2A 广场立即可见
    await cacheDel('characters:public').catch(() => {});
    return NextResponse.json({ ok: true, id: savedId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/** DELETE /api/admin/characters/[id] */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken();
    if (!token) return NextResponse.json({ error: '未登录' }, { status: 401 });
    const { id: charId } = await params;

    const ok = await characterManager.deleteCharacter(charId);
    if (!ok) return NextResponse.json({ error: '角色不存在或删除失败' }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
