import { NextRequest, NextResponse } from 'next/server';
import { getCloudConfig, saveCloudConfig } from '@/lib/config/cloud-config';
import { getToken } from '@/lib/auth';
import type { HandoffDirectory, HandoffCharProfile } from '@/lib/config/types';

export async function GET(req: Request) {
  try {
    const token = await getToken(req);
    const { config } = await getCloudConfig(token);
    const directory = config.handoffDirectory ?? { characters: [], teams: [], globalRules: [], version: 1, updatedAt: '' };
    const chars = directory.characters || [];
    const FIXED_CATS: HandoffCharProfile[] = [
      { charId: 'cat_butler', name: '猫管家·生涯报考猫', tagline: '高考志愿/生涯规划/报考建议/长期陪伴', capabilities: ['生涯规划', '志愿填报', '报考数据查询'], handoffIn: ['用户需要高考或长期生涯规划建议时'], handoffOut: {}, tags: ['猫管家', '高考'], teamIds: [], enabled: true },
      { charId: 'cat_career', name: '猫管家·校招实习猫', tagline: '校招/实习/就业需求/长期陪伴', capabilities: ['校招辅导', '实习推荐', '就业政策解析'], handoffIn: ['用户有求职、实习或职业发展问题时'], handoffOut: {}, tags: ['猫管家', '实习就业'], teamIds: [], enabled: true },
      { charId: 'cat_research', name: '猫管家·产研转化', tagline: '产研转化/企业科研对接/团队匹配/方略咨询', capabilities: ['产业需求分析', '科研团队推荐', '匹配度分析', '方略研究院对接'], handoffIn: ['用户有产业需求想对接科研团队', '用户需要产研转化分析或战略咨询'], handoffOut: {}, tags: ['猫管家', '产研转化'], teamIds: [], enabled: true },
      { charId: 'cat_intl', name: '猫管家·国际教育猫', tagline: '国际化教育路径/港澳台/长期陪伴', capabilities: ['出国留学', '港澳台升学', '国际学校选择'], handoffIn: ['用户考虑走国际化教育路线或港澳台求学时'], handoffOut: {}, tags: ['猫管家', '出国留学'], teamIds: [], enabled: true },
    ];
    FIXED_CATS.forEach(cat => {
      if (!chars.find(c => c.charId === cat.charId)) {
        chars.unshift(cat);
      }
    });
    directory.characters = chars;

    return NextResponse.json({
      ok: true,
      directory,
    });
  } catch {
    return NextResponse.json({ ok: true, directory: null });
  }
}

/** POST /api/admin/handoff-directory
 *  全量覆盖 { directory: HandoffDirectory }
 *  或单条操作:
 *    { action: 'saveChar', char: HandoffCharProfile }
 *    { action: 'deleteChar', charId: string }
 *    { action: 'saveTeam', team: HandoffTeam }
 *    { action: 'deleteTeam', teamId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const token = await getToken(req);
    const body = await req.json();

    const { config } = await getCloudConfig(token);
    const current = config.handoffDirectory ?? ({} as HandoffDirectory);

    // 全量覆盖
    if (body.directory) {
      await saveCloudConfig({ ...config, handoffDirectory: body.directory }, token);
      return NextResponse.json({ ok: true });
    }

    // 单条操作
    const { action, char, charId, team, teamId } = body;
    const chars = current.characters ?? [];

    if (action === 'saveChar' && char) {
      const idx = chars.findIndex((c: HandoffCharProfile) => c.charId === char.charId);
      if (idx >= 0) chars[idx] = char; else chars.push(char);
    } else if (action === 'deleteChar' && charId) {
      const idx = chars.findIndex((c: HandoffCharProfile) => c.charId === charId);
      if (idx >= 0) chars.splice(idx, 1);
    } else if (action === 'saveTeam' && team) {
      const teams = current.teams ?? [];
      const idx = teams.findIndex((t: any) => t.teamId === team.teamId);
      if (idx >= 0) teams[idx] = team; else teams.push(team);
      current.teams = teams;
    } else if (action === 'deleteTeam' && teamId) {
      current.teams = (current.teams ?? []).filter((t: any) => t.teamId !== teamId);
    } else {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    await saveCloudConfig({ ...config, handoffDirectory: current }, token);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
