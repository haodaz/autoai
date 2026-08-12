import { NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';
import { mcpClient } from '@/lib/mcp/client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const token = await getToken(req) || process.env.FLORA_AUTH_BEARER;
    if (!token) return NextResponse.json({ error: 'No token' });

    const res: any = await mcpClient.callTool('dash_generic_search', {
      bearerToken: token, model: 'ZhiJiCompanion', fields: ['id', 'name', 'data'], limit: 500,
    });
    
    const items = res?.items || res?.remoteResponse?.data?.dash?.generic?.search?.items || [];
    
    let fixed = 0;
    for (const item of items) {
      if (item.name && item.name.includes('施一公')) {
        let data: any = {};
        if (item.data) {
          try { data = typeof item.data === 'string' ? JSON.parse(item.data) : item.data; } catch(e){}
        }
        
        if (data.id !== 'principal_shi_yigong') {
          data.id = 'principal_shi_yigong';
          await mcpClient.callTool('dash_generic_save', {
            bearerToken: token,
            model: 'ZhiJiCompanion',
            values: JSON.stringify({
              id: parseInt(item.id),
              data: JSON.stringify(data)
            })
          });
          fixed++;
        }
      }
    }

    return NextResponse.json({ ok: true, fixed, message: `Successfully recovered ${fixed} '施一公' character(s)` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
