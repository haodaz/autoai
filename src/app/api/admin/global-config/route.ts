import { NextResponse } from 'next/server';
import { GLOBAL_RULES, GLOBAL_SKILLS } from '@/lib/ai/globalRules';

/** GET /api/admin/global-config
 *  返回编译进代码中的全局规则，供管理端查看
 */
export async function GET() {
  return NextResponse.json({
    rules: GLOBAL_RULES,
    skills: GLOBAL_SKILLS
  });
}

/** POST /api/admin/global-config
 *  拦截修改请求，因为这部分已按照架构要求重构为只读的强类型常量。
 */
export async function POST() {
  return NextResponse.json(
    { error: '为了保证系统健壮性，核心规则库已编译为底层代码常量，不可在后台修改。如需调整，请联系研发在代码中修改 globalRules.ts' },
    { status: 403 }
  );
}
